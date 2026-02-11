package com.mohitkumar.chatflow.controller;

import com.mohitkumar.chatflow.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    @GetMapping("/online")
    public ResponseEntity<Map<String, Object>> getOnlineUsers() {
        Set<String> onlineUsers = presenceService.getOnlineUsers();
        Long count = presenceService.getOnlineCount();

        Map<String, Object> response = new HashMap<>();
        response.put("users", onlineUsers);
        response.put("count", count);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/check/{username}")
    public ResponseEntity<Map<String, Boolean>> checkUserOnline(@PathVariable String username) {
        boolean online = presenceService.isUserOnline(username);
        return ResponseEntity.ok(Map.of("online", online));
    }
}
