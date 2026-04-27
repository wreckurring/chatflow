package com.mohitkumar.chatflow.repository;

import com.mohitkumar.chatflow.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByRoomIdAndDeletedFalseOrderBySentAtDesc(Long roomId, Pageable pageable);

    Optional<Message> findFirstByRoomIdAndDeletedFalseOrderBySentAtDesc(Long roomId);

    void deleteByRoomId(Long roomId);

    @Query("SELECT m FROM Message m WHERE m.room.id = :roomId AND m.deleted = false " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.sentAt DESC")
    List<Message> searchByRoomIdAndContent(@Param("roomId") Long roomId,
                                           @Param("query") String query,
                                           Pageable pageable);
}
