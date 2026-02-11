package com.mohitkumar.chatflow.repository;

import com.mohitkumar.chatflow.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // paginated so we don't load entire history at once
    Page<Message> findByRoomIdOrderBySentAtDesc(Long roomId, Pageable pageable);
}
