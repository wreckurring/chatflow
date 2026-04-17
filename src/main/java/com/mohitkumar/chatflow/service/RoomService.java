package com.mohitkumar.chatflow.service;

import com.mohitkumar.chatflow.dto.CreateRoomRequest;
import com.mohitkumar.chatflow.dto.RoomResponse;
import com.mohitkumar.chatflow.dto.UserProfileResponse;
import com.mohitkumar.chatflow.model.Room;
import com.mohitkumar.chatflow.model.User;
import com.mohitkumar.chatflow.repository.MessageRepository;
import com.mohitkumar.chatflow.repository.ReactionRepository;
import com.mohitkumar.chatflow.repository.RoomRepository;
import com.mohitkumar.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ReactionRepository reactionRepository;

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
        return mapToResponse(saved);
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
        return mapToResponse(room);
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
                .map(this::mapToResponse)
                .toList();
    }

    public List<RoomResponse> getUserRooms(String username) {
        User user = getUser(username);
        return roomRepository.findRoomsByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<RoomResponse> searchRooms(String query) {
        return roomRepository.findByNameContainingIgnoreCaseAndType(query, Room.RoomType.PUBLIC)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public RoomResponse getRoomById(Long roomId) {
        return mapToResponse(getRoom(roomId));
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
        return mapToResponse(room);
    }

    @Transactional
    public void deleteRoom(Long roomId, String username) {
        Room room = getRoom(roomId);
        if (!room.getCreatedBy().getUsername().equals(username)) {
            throw new RuntimeException("Only the room owner can delete this room");
        }
        reactionRepository.deleteByRoomId(roomId);
        messageRepository.deleteByRoomId(roomId);
        roomRepository.delete(room);
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

    private Room getRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private RoomResponse mapToResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .type(room.getType())
                .createdBy(room.getCreatedBy().getUsername())
                .memberCount(room.getMembers().size())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
