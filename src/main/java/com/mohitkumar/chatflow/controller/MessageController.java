package com.mohitkumar.chatflow.controller;

import com.mohitkumar.chatflow.dto.MessageResponse;
import com.mohitkumar.chatflow.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    // load chat history when user opens a room
    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<MessageResponse>> getRoomHistory(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(messageService.getRoomHistory(roomId, page, size));
    }
}
