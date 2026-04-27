package com.mohitkumar.chatflow.service;

import com.mohitkumar.chatflow.dto.CreateRoomRequest;
import com.mohitkumar.chatflow.dto.MessageResponse;
import com.mohitkumar.chatflow.dto.RoomResponse;
import com.mohitkumar.chatflow.dto.UserProfileResponse;
import com.mohitkumar.chatflow.model.Message;
import com.mohitkumar.chatflow.model.PinnedMessage;
import com.mohitkumar.chatflow.model.Room;
import com.mohitkumar.chatflow.model.User;
import com.mohitkumar.chatflow.repository.MessageRepository;
import com.mohitkumar.chatflow.repository.PinnedMessageRepository;
import com.mohitkumar.chatflow.repository.ReactionRepository;
import com.mohitkumar.chatflow.repository.RoomRepository;
import com.mohitkumar.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ReactionRepository reactionRepository;
    private final PinnedMessageRepository pinnedMessageRepository;
    private final com.mohitkumar.chatflow.repository.RoomInviteRepository roomInviteRepository;

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, String username) {
        if (roomRepository.existsByName(request.getName())) {
            throw new RuntimeException("Room name already taken");
        }

        User creator = getUser(username);

        Room room = Room.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .createdBy(creator)
                .build();

        // creator automatically joins the room
        room.getMembers().add(creator);

        Room saved = roomRepository.save(room);
        return mapToResponse(saved, null);
    }

    @Transactional
    public RoomResponse joinRoom(Long roomId, String username) {
        Room room = getRoom(roomId);
        User user = getUser(username);

        if (room.getMembers().contains(user)) {
            throw new RuntimeException("Already a member of this room");
        }

        // private rooms will need invite logic later
        if (room.getType() == Room.RoomType.PRIVATE) {
            throw new RuntimeException("Cannot join a private room without an invite");
        }

        room.getMembers().add(user);
        roomRepository.save(room);
        return mapToResponse(room, null);
    }

    @Transactional
    public void leaveRoom(Long roomId, String username) {
        Room room = getRoom(roomId);
        User user = getUser(username);

        if (!room.getMembers().contains(user)) {
            throw new RuntimeException("You are not a member of this room");
        }

        room.getMembers().remove(user);
        roomRepository.save(room);
    }

    public List<RoomResponse> getPublicRooms() {
        return roomRepository.findByType(Room.RoomType.PUBLIC)
                .stream()
                .map(r -> mapToResponse(r, null))
                .toList();
    }

    public List<RoomResponse> getUserRooms(String username) {
        User user = getUser(username);
        return roomRepository.findRoomsByUserId(user.getId())
                .stream()
                .map(r -> mapToResponse(r, username))
                .toList();
    }

    public List<RoomResponse> searchRooms(String query) {
        return roomRepository.findByNameContainingIgnoreCaseAndType(query, Room.RoomType.PUBLIC)
                .stream()
                .map(r -> mapToResponse(r, null))
                .toList();
    }

    @Transactional
    public RoomResponse getOrCreateDm(String currentUsername, String targetUsername) {
        if (currentUsername.equals(targetUsername)) {
            throw new RuntimeException("Cannot open a DM with yourself");
        }
        User current = getUser(currentUsername);
        User target  = getUser(targetUsername);

        String[] sorted = { currentUsername, targetUsername };
        Arrays.sort(sorted);
        String dmName = "dm:" + sorted[0] + ":" + sorted[1];

        return roomRepository.findByName(dmName)
                .map(r -> mapToResponse(r, currentUsername))
                .orElseGet(() -> {
                    Room dm = Room.builder()
                            .name(dmName)
                            .type(Room.RoomType.DIRECT)
                            .createdBy(current)
                            .build();
                    dm.getMembers().add(current);
                    dm.getMembers().add(target);
                    return mapToResponse(roomRepository.save(dm), currentUsername);
                });
    }

    public RoomResponse getRoomById(Long roomId) {
        return mapToResponse(getRoom(roomId), null);
    }

    @Transactional
    public RoomResponse updateRoom(Long roomId, String newName, String newDescription, String username) {
        Room room = getRoom(roomId);
        if (!room.getCreatedBy().getUsername().equals(username)) {
            throw new RuntimeException("Only the room owner can edit this room");
        }
        if (newName != null && !newName.isBlank()) {
            String trimmed = newName.trim();
            if (!trimmed.equals(room.getName()) && roomRepository.existsByName(trimmed)) {
                throw new RuntimeException("Room name already taken");
            }
            room.setName(trimmed);
        }
        if (newDescription != null) {
            room.setDescription(newDescription.trim().isEmpty() ? null : newDescription.trim());
        }
        roomRepository.save(room);
        return mapToResponse(room, null);
    }

    @Transactional
    public void deleteRoom(Long roomId, String username) {
        Room room = getRoom(roomId);
        if (!room.getCreatedBy().getUsername().equals(username)) {
            throw new RuntimeException("Only the room owner can delete this room");
        }
        roomInviteRepository.deleteByRoomId(roomId);
        pinnedMessageRepository.deleteByRoomId(roomId);
        reactionRepository.deleteByRoomId(roomId);
        messageRepository.deleteByRoomId(roomId);
        roomRepository.delete(room);
    }

    @Transactional
    public MessageResponse togglePin(Long roomId, Long messageId, String username) {
        Room room = getRoom(roomId);
        if (!room.getMembers().stream().anyMatch(m -> m.getUsername().equals(username))) {
            throw new RuntimeException("Must be a room member to pin messages");
        }
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        Optional<PinnedMessage> existing = pinnedMessageRepository.findByRoomIdAndMessageId(roomId, messageId);
        if (existing.isPresent()) {
            pinnedMessageRepository.delete(existing.get());
            return MessageResponse.builder()
                    .id(messageId).roomId(roomId)
                    .eventType(MessageResponse.EventType.PIN_UPDATE)
                    .pinned(false).build();
        } else {
            pinnedMessageRepository.save(PinnedMessage.builder()
                    .room(room).message(message).pinnedBy(username).build());
            return MessageResponse.builder()
                    .id(messageId).roomId(roomId)
                    .eventType(MessageResponse.EventType.PIN_UPDATE)
                    .pinned(true).build();
        }
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getPinnedMessages(Long roomId) {
        return pinnedMessageRepository.findByRoomIdOrderByPinnedAtDesc(roomId)
                .stream()
                .map(pm -> {
                    Message m = pm.getMessage();
                    return MessageResponse.builder()
                            .id(m.getId())
                            .content(m.isDeleted() ? null : m.getContent())
                            .senderUsername(m.getSender().getUsername())
                            .senderDisplayName(m.getSender().getDisplayName())
                            .roomId(roomId)
                            .type(m.getType())
                            .sentAt(m.getSentAt())
                            .pinned(true)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getRoomMembers(Long roomId) {
        Room room = getRoom(roomId);
        return room.getMembers().stream()
                .sorted(Comparator.comparing(u -> u.getUsername()))
                .map(u -> UserProfileResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .displayName(u.getDisplayName())
                        .createdAt(u.getCreatedAt())
                        .build())
                .toList();
    }

    // private helpers below

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    Room getRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private RoomResponse mapToResponse(Room room, String currentUsername) {
        RoomResponse.RoomResponseBuilder b = RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .type(room.getType())
                .createdBy(room.getCreatedBy().getUsername())
                .memberCount(room.getMembers().size())
                .createdAt(room.getCreatedAt());

        if (room.getType() == Room.RoomType.DIRECT && currentUsername != null) {
            Optional<User> other = room.getMembers().stream()
                    .filter(m -> !m.getUsername().equals(currentUsername))
                    .findFirst();
            other.ifPresent(u -> b.otherUsername(u.getUsername()).otherDisplayName(u.getDisplayName()));
        }

        messageRepository.findFirstByRoomIdAndDeletedFalseOrderBySentAtDesc(room.getId())
                .ifPresent(msg -> {
                    String preview = msg.getContent() != null ? msg.getContent() : "(attachment)";
                    if (preview.length() > 80) preview = preview.substring(0, 80) + "…";
                    b.lastMessagePreview(preview).lastMessageAt(msg.getSentAt());
                });

        return b.build();
    }
}
