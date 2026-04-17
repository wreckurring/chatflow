package com.mohitkumar.chatflow.service;

import com.mohitkumar.chatflow.dto.ChatMessage;
import com.mohitkumar.chatflow.dto.MessageResponse;
import com.mohitkumar.chatflow.model.Message;
import com.mohitkumar.chatflow.model.Reaction;
import com.mohitkumar.chatflow.model.Room;
import com.mohitkumar.chatflow.model.User;
import com.mohitkumar.chatflow.repository.MessageRepository;
import com.mohitkumar.chatflow.repository.ReactionRepository;
import com.mohitkumar.chatflow.repository.RoomRepository;
import com.mohitkumar.chatflow.repository.UserRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final ReactionRepository reactionRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_KEY_PREFIX = "room:messages:cache:";

    @Transactional(readOnly = true)
    public MessageResponse processAndCacheMessage(ChatMessage chatMessage, String senderUsername) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Room room = roomRepository.findById(chatMessage.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getMembers().contains(sender)) {
            throw new RuntimeException("You are not a member of this room");
        }

        MessageResponse.MessageResponseBuilder builder = MessageResponse.builder()
                .content(chatMessage.getContent())
                .senderUsername(sender.getUsername())
                .senderDisplayName(sender.getDisplayName())
                .roomId(room.getId())
                .type(chatMessage.getType())
                .sentAt(LocalDateTime.now());

        // Attach reply preview if present
        if (chatMessage.getReplyToId() != null) {
            messageRepository.findById(chatMessage.getReplyToId()).ifPresent(replyMsg -> {
                builder.replyToId(replyMsg.getId())
                       .replyToContent(replyMsg.isDeleted() ? null : replyMsg.getContent())
                       .replyToSenderUsername(replyMsg.getSender().getUsername())
                       .replyToSenderDisplayName(replyMsg.getSender().getDisplayName());
            });
        }

        MessageResponse response = builder.build();

        String cacheKey = CACHE_KEY_PREFIX + room.getId();
        redisTemplate.opsForList().leftPush(cacheKey, response);
        redisTemplate.opsForList().trim(cacheKey, 0, 99);

        saveToDatabaseAsync(chatMessage.getContent(), chatMessage.getType(), sender.getId(), room.getId(), chatMessage.getReplyToId());

        return response;
    }

    @Async
    @Transactional
    @Retryable(
        retryFor = {Exception.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public void saveToDatabaseAsync(String content, Message.MessageType type, Long senderId, Long roomId, Long replyToId) {
        Message.MessageBuilder msgBuilder = Message.builder()
                .content(content)
                .type(type)
                .sender(userRepository.getReferenceById(senderId))
                .room(roomRepository.getReferenceById(roomId));
        if (replyToId != null) {
            msgBuilder.replyTo(messageRepository.getReferenceById(replyToId));
        }
        Message message = msgBuilder.build();
        messageRepository.save(message);
        log.debug("Async save successful for message in room {}", roomId);
    }

    @Recover
    public void recoverFailedMessageSave(Exception e, String content, Message.MessageType type, Long senderId, Long roomId, Long replyToId) {
        log.error("CRITICAL: Message completely failed to save to Postgres after 3 retries. Content lost. Room: {}, Error: {}", roomId, e.getMessage());
    }

    @CircuitBreaker(name = "databaseCircuitBreaker", fallbackMethod = "getRoomHistoryFallback")
    public List<MessageResponse> getRoomHistory(Long roomId, int page, int size) {
        String cacheKey = CACHE_KEY_PREFIX + roomId;

        if (page == 0) {
            List<Object> cachedData = redisTemplate.opsForList().range(cacheKey, 0, size - 1);
            if (cachedData != null && !cachedData.isEmpty()) {
                List<MessageResponse> responses = cachedData.stream()
                        .map(obj -> (MessageResponse) obj)
                        .collect(Collectors.toList());
                Collections.reverse(responses);
                return responses;
            }
        }

        Page<Message> messages = messageRepository.findByRoomIdAndDeletedFalseOrderBySentAtDesc(roomId, PageRequest.of(page, size));
        List<MessageResponse> responseList = messages.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        Collections.reverse(responseList);
        return responseList;
    }

    public List<MessageResponse> getRoomHistoryFallback(Long roomId, int page, int size, Throwable t) {
        log.warn("Database unavailable. Returning limited cached history from Redis via Circuit Breaker.");
        List<Object> cachedData = redisTemplate.opsForList().range(CACHE_KEY_PREFIX + roomId, 0, 50);
        if (cachedData == null) return Collections.emptyList();
        
        List<MessageResponse> responses = cachedData.stream()
                .map(obj -> (MessageResponse) obj)
                .collect(Collectors.toList());
        Collections.reverse(responses);
        return responses;
    }

    @Transactional
    public MessageResponse editMessage(Long messageId, String newContent, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getSender().getUsername().equals(username)) {
            throw new RuntimeException("Not authorized to edit this message");
        }
        if (message.isDeleted()) {
            throw new RuntimeException("Cannot edit a deleted message");
        }
        message.setContent(newContent.trim());
        message.setEditedAt(LocalDateTime.now());
        messageRepository.save(message);
        evictRoomCache(message.getRoom().getId());
        MessageResponse response = mapToResponse(message);
        response.setEventType(MessageResponse.EventType.EDITED);
        return response;
    }

    @Transactional
    public MessageResponse deleteMessage(Long messageId, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getSender().getUsername().equals(username)) {
            throw new RuntimeException("Not authorized to delete this message");
        }
        message.setDeleted(true);
        messageRepository.save(message);
        evictRoomCache(message.getRoom().getId());
        MessageResponse response = mapToResponse(message);
        response.setEventType(MessageResponse.EventType.DELETED);
        return response;
    }

    @Transactional
    public MessageResponse toggleReaction(Long messageId, String emoji, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (message.isDeleted()) throw new RuntimeException("Cannot react to a deleted message");

        Optional<Reaction> existing = reactionRepository.findByMessageIdAndUsernameAndEmoji(messageId, username, emoji);
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
        } else {
            reactionRepository.save(Reaction.builder().message(message).username(username).emoji(emoji).build());
        }

        MessageResponse response = mapToResponse(message);
        response.setEventType(MessageResponse.EventType.REACTION_UPDATE);
        return response;
    }

    private void evictRoomCache(Long roomId) {
        redisTemplate.delete(CACHE_KEY_PREFIX + roomId);
    }

    private MessageResponse mapToResponse(Message message) {
        List<Reaction> reactions = reactionRepository.findByMessageId(message.getId());
        Map<String, List<String>> reactionMap = reactions.stream()
                .collect(Collectors.groupingBy(
                        Reaction::getEmoji,
                        Collectors.mapping(Reaction::getUsername, Collectors.toList())
                ));

        MessageResponse.MessageResponseBuilder builder = MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderUsername(message.getSender().getUsername())
                .senderDisplayName(message.getSender().getDisplayName())
                .roomId(message.getRoom().getId())
                .type(message.getType())
                .sentAt(message.getSentAt())
                .editedAt(message.getEditedAt())
                .deleted(message.isDeleted())
                .reactions(reactionMap.isEmpty() ? null : reactionMap);

        if (message.getReplyTo() != null) {
            Message reply = message.getReplyTo();
            builder.replyToId(reply.getId())
                   .replyToContent(reply.isDeleted() ? null : reply.getContent())
                   .replyToSenderUsername(reply.getSender().getUsername())
                   .replyToSenderDisplayName(reply.getSender().getDisplayName());
        }

        return builder.build();
    }
}