package com.mohitkumar.chatflow.service;

import com.mohitkumar.chatflow.dto.MessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisMessageSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            Object obj = redisTemplate.getValueSerializer().deserialize(message.getBody());
            if (obj instanceof MessageResponse response) {
                messagingTemplate.convertAndSend("/topic/room/" + response.getRoomId(), response);
            }
        } catch (Exception e) {
            log.error("Failed to process Redis Pub/Sub message", e);
        }
    }
}