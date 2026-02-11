package com.mohitkumar.chatflow.service;

import com.mohitkumar.chatflow.dto.ChatMessage;
import com.mohitkumar.chatflow.dto.MessageResponse;
import com.mohitkumar.chatflow.model.Message;
import com.mohitkumar.chatflow.model.Room;
import com.mohitkumar.chatflow.model.User;
import com.mohitkumar.chatflow.repository.MessageRepository;
import com.mohitkumar.chatflow.repository.RoomRepository;
import com.mohitkumar.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    @Transactional
    public MessageResponse saveAndBroadcast(ChatMessage chatMessage, String senderUsername) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Room room = roomRepository.findById(chatMessage.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // make sure sender is actually in this room
        if (!room.getMembers().contains(sender)) {
            throw new RuntimeException("You are not a member of this room");
        }

        Message message = Message.builder()
                .content(chatMessage.getContent())
                .sender(sender)
                .room(room)
                .type(chatMessage.getType())
                .build();

        Message saved = messageRepository.save(message);
        return mapToResponse(saved);
    }

    public List<MessageResponse> getRoomHistory(Long roomId, int page, int size) {
        Page<Message> messages = messageRepository.findByRoomIdOrderBySentAtDesc(
                roomId, PageRequest.of(page, size));

        // reverse so oldest comes first
        return messages.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList()
                .reversed();
    }

    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderUsername(message.getSender().getUsername())
                .senderDisplayName(message.getSender().getDisplayName())
                .roomId(message.getRoom().getId())
                .type(message.getType())
                .sentAt(message.getSentAt())
                .build();
    }
}
