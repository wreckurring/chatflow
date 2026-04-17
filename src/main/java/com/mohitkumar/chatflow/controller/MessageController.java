package com.mohitkumar.chatflow.controller;

import com.mohitkumar.chatflow.dto.MessageResponse;
import com.mohitkumar.chatflow.service.MessageService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<MessageResponse>> getRoomHistory(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(messageService.getRoomHistory(roomId, page, size));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MessageResponse> editMessage(
            @PathVariable Long id,
            @RequestBody EditMessageRequest body,
            Principal principal) {
        MessageResponse updated = messageService.editMessage(id, body.getContent(), principal.getName());
        messagingTemplate.convertAndSend("/topic/room/" + updated.getRoomId(), updated);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id, Principal principal) {
        MessageResponse deleted = messageService.deleteMessage(id, principal.getName());
        messagingTemplate.convertAndSend("/topic/room/" + deleted.getRoomId(), deleted);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class EditMessageRequest {
        @NotBlank
        @Size(max = 2000)
        private String content;
    }
}
