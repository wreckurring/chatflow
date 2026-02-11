package com.mohitkumar.chatflow.controller;

import com.mohitkumar.chatflow.dto.ChatMessage;
import com.mohitkumar.chatflow.dto.MessageResponse;
import com.mohitkumar.chatflow.service.MessageService;
import com.mohitkumar.chatflow.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final PresenceService presenceService;

    // client sends to /app/chat.send
    // everyone in the room gets it at /topic/room/{roomId}
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage, Principal principal) {
        // refresh user activity on every message
        presenceService.refreshUserActivity(principal.getName());

        MessageResponse response = messageService.saveAndBroadcast(chatMessage, principal.getName());

        messagingTemplate.convertAndSend(
                "/topic/room/" + chatMessage.getRoomId(),
                response
        );
    }

    // client sends to /app/chat.join when entering a room
    // broadcasts a join notification to everyone in the room
    @MessageMapping("/chat.join")
    public void joinNotification(@Payload ChatMessage chatMessage, Principal principal) {
        // track which room user is in
        presenceService.userJoinedRoom(principal.getName(), chatMessage.getRoomId());

        MessageResponse notification = MessageResponse.builder()
                .content(principal.getName() + " joined the room")
                .senderUsername("system")
                .roomId(chatMessage.getRoomId())
                .type(com.mohitkumar.chatflow.model.Message.MessageType.SYSTEM)
                .build();

        messagingTemplate.convertAndSend(
                "/topic/room/" + chatMessage.getRoomId(),
                notification
        );
    }

    // client sends to /app/chat.leave when leaving a room
    @MessageMapping("/chat.leave")
    public void leaveNotification(@Payload ChatMessage chatMessage, Principal principal) {
        presenceService.userLeftRoom(principal.getName());

        MessageResponse notification = MessageResponse.builder()
                .content(principal.getName() + " left the room")
                .senderUsername("system")
                .roomId(chatMessage.getRoomId())
                .type(com.mohitkumar.chatflow.model.Message.MessageType.SYSTEM)
                .build();

        messagingTemplate.convertAndSend(
                "/topic/room/" + chatMessage.getRoomId(),
                notification
        );
    }
}
