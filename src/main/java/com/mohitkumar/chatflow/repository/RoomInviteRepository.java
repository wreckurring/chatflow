package com.mohitkumar.chatflow.repository;

import com.mohitkumar.chatflow.model.RoomInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomInviteRepository extends JpaRepository<RoomInvite, Long> {
    Optional<RoomInvite> findByToken(String token);
    void deleteByRoomId(Long roomId);
}
