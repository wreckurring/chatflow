package com.mohitkumar.chatflow.controller;

import com.mohitkumar.chatflow.config.RedisPubSubConfig;
import com.mohitkumar.chatflow.dto.ChatMessage;
import com.mohitkumar.chatflow.dto.MessageResponse;
import com.mohitkumar.chatflow.service.MessageService;
import com.mohitkumar.chatflow.service.PresenceService;
import com.mohitkumar.chatflow.service.RateLimiterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;
    private final PresenceService presenceService;
    private final RateLimiterService rateLimiterService;
    private final RedisTemplate<String, Object> redisTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage, Principal principal) {
        if (!rateLimiterService.isAllowed(principal.getName())) {
            throw new RuntimeException("Rate limit exceeded. Please slow down.");
        }

        presenceService.refreshUserActivity(principal.getName());

        MessageResponse response = messageService.processAndCacheMessage(chatMessage, principal.getName());

        redisTemplate.convertAndSend(RedisPubSubConfig.CHAT_TOPIC, response);
    }

    @MessageMapping("/chat.join")
    public void joinNotification(@Payload ChatMessage chatMessage, Principal principal) {
        presenceService.userJoinedRoom(principal.getName(), chatMessage.getRoomId());

        MessageResponse notification = MessageResponse.builder()
                .content(principal.getName() + " joined the room")
                .senderUsername("system")
                .roomId(chatMessage.getRoomId())
                .type(com.mohitkumar.chatflow.model.Message.MessageType.SYSTEM)
                .build();

        redisTemplate.convertAndSend(RedisPubSubConfig.CHAT_TOPIC, notification);
    }

    @MessageMapping("/chat.leave")
    public void leaveNotification(@Payload ChatMessage chatMessage, Principal principal) {
        presenceService.userLeftRoom(principal.getName());

        MessageResponse notification = MessageResponse.builder()
                .content(principal.getName() + " left the room")
                .senderUsername("system")
                .roomId(chatMessage.getRoomId())
                .type(com.mohitkumar.chatflow.model.Message.MessageType.SYSTEM)
                .build();

        redisTemplate.convertAndSend(RedisPubSubConfig.CHAT_TOPIC, notification);
    }
}