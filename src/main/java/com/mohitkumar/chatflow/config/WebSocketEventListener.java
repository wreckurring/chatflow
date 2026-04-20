package com.mohitkumar.chatflow.config;

import com.mohitkumar.chatflow.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        String username = getUsername(event.getMessage());
        if (username == null) return;
        presenceService.userConnected(username);
        messagingTemplate.convertAndSend("/topic/presence",
                Map.of("username", username, "online", true));
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String username = getUsername(event.getMessage());
        if (username == null) return;
        presenceService.userDisconnected(username);
        messagingTemplate.convertAndSend("/topic/presence",
                Map.of("username", username, "online", false));
    }

    private String getUsername(org.springframework.messaging.Message<?> message) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        return accessor.getUser() != null ? accessor.getUser().getName() : null;
    }
}
