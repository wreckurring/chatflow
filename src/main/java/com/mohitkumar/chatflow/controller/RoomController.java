package com.mohitkumar.chatflow.controller;

import com.mohitkumar.chatflow.dto.CreateRoomRequest;
import com.mohitkumar.chatflow.dto.RoomResponse;
import com.mohitkumar.chatflow.dto.UserProfileResponse;
import com.mohitkumar.chatflow.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(roomService.createRoom(request, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getPublicRooms() {
        return ResponseEntity.ok(roomService.getPublicRooms());
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable Long roomId) {
        return ResponseEntity.ok(roomService.getRoomById(roomId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<RoomResponse>> searchRooms(@RequestParam String q) {
        return ResponseEntity.ok(roomService.searchRooms(q));
    }

    @GetMapping("/my-rooms")
    public ResponseEntity<List<RoomResponse>> getMyRooms(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(roomService.getUserRooms(userDetails.getUsername()));
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(roomService.joinRoom(roomId, userDetails.getUsername()));
    }

    @GetMapping("/{roomId}/members")
    public ResponseEntity<List<UserProfileResponse>> getRoomMembers(@PathVariable Long roomId) {
        return ResponseEntity.ok(roomService.getRoomMembers(roomId));
    }

    @DeleteMapping("/{roomId}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserDetails userDetails) {
        roomService.leaveRoom(roomId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{roomId}")
    public ResponseEntity<RoomResponse> updateRoom(
            @PathVariable Long roomId,
            @RequestBody UpdateRoomRequest body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(roomService.updateRoom(roomId, body.getName(), body.getDescription(), userDetails.getUsername()));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserDetails userDetails) {
        roomService.deleteRoom(roomId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class UpdateRoomRequest {
        @Size(min = 1, max = 50)
        private String name;
        @Size(max = 255)
        private String description;
    }
}
