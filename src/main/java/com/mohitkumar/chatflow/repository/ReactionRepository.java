package com.mohitkumar.chatflow.repository;

import com.mohitkumar.chatflow.model.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    List<Reaction> findByMessageId(Long messageId);

    Optional<Reaction> findByMessageIdAndUsernameAndEmoji(Long messageId, String username, String emoji);

    void deleteByMessageId(Long messageId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Reaction r WHERE r.message.room.id = :roomId")
    void deleteByRoomId(@org.springframework.data.repository.query.Param("roomId") Long roomId);
}
