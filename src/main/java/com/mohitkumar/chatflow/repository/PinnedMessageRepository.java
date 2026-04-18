package com.mohitkumar.chatflow.repository;

import com.mohitkumar.chatflow.model.PinnedMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PinnedMessageRepository extends JpaRepository<PinnedMessage, Long> {

    List<PinnedMessage> findByRoomIdOrderByPinnedAtDesc(Long roomId);

    Optional<PinnedMessage> findByRoomIdAndMessageId(Long roomId, Long messageId);

    boolean existsByRoomIdAndMessageId(Long roomId, Long messageId);

    void deleteByRoomId(Long roomId);
}
