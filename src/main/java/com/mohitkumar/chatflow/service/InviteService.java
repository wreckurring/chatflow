package com.mohitkumar.chatflow.service;

import com.mohitkumar.chatflow.dto.InviteResponse;
import com.mohitkumar.chatflow.dto.RoomResponse;
import com.mohitkumar.chatflow.exception.ResourceNotFoundException;
import com.mohitkumar.chatflow.model.Room;
import com.mohitkumar.chatflow.model.RoomInvite;
import com.mohitkumar.chatflow.repository.RoomInviteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InviteService {

    private final RoomInviteRepository inviteRepository;
    private final RoomService roomService;

    @Transactional
    public InviteResponse createInvite(Long roomId, String username) {
        Room room = roomService.getRoom(roomId);
        RoomInvite invite = inviteRepository.save(RoomInvite.builder()
                .token(UUID.randomUUID().toString().replace("-", ""))
                .room(room)
                .createdBy(username)
                .createdAt(LocalDateTime.now())
                .build());
        return toResponse(invite);
    }

    public InviteResponse getInvite(String token) {
        RoomInvite invite = findValid(token);
        return toResponse(invite);
    }

    @Transactional
    public RoomResponse acceptInvite(String token, String username) {
        RoomInvite invite = findValid(token);
        invite.setUses(invite.getUses() + 1);
        inviteRepository.save(invite);
        return roomService.joinRoom(invite.getRoom().getId(), username);
    }

    private RoomInvite findValid(String token) {
        RoomInvite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found"));
        if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResourceNotFoundException("Invite has expired");
        }
        return invite;
    }

    private InviteResponse toResponse(RoomInvite invite) {
        Room room = invite.getRoom();
        boolean expired = invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(LocalDateTime.now());
        return InviteResponse.builder()
                .token(invite.getToken())
                .roomId(room.getId())
                .roomName(room.getName())
                .roomDescription(room.getDescription())
                .memberCount(room.getMembers().size())
                .createdBy(invite.getCreatedBy())
                .expiresAt(invite.getExpiresAt())
                .expired(expired)
                .build();
    }
}
