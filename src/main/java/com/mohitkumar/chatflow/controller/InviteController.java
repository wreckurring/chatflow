package com.mohitkumar.chatflow.controller;

import com.mohitkumar.chatflow.dto.InviteResponse;
import com.mohitkumar.chatflow.dto.RoomResponse;
import com.mohitkumar.chatflow.service.InviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
public class InviteController {

    private final InviteService inviteService;

    @PostMapping("/api/rooms/{roomId}/invites")
    public ResponseEntity<InviteResponse> createInvite(
            @PathVariable Long roomId,
            Principal principal) {
        return ResponseEntity.ok(inviteService.createInvite(roomId, principal.getName()));
    }

    @GetMapping("/api/invites/{token}")
    public ResponseEntity<InviteResponse> getInvite(@PathVariable String token) {
        return ResponseEntity.ok(inviteService.getInvite(token));
    }

    @PostMapping("/api/invites/{token}/accept")
    public ResponseEntity<RoomResponse> acceptInvite(
            @PathVariable String token,
            Principal principal) {
        return ResponseEntity.ok(inviteService.acceptInvite(token, principal.getName()));
    }
}
