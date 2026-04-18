package com.mohitkumar.chatflow.controller;

import com.mohitkumar.chatflow.dto.RoomResponse;
import com.mohitkumar.chatflow.dto.UserProfileResponse;
import com.mohitkumar.chatflow.model.User;
import com.mohitkumar.chatflow.repository.UserRepository;
import com.mohitkumar.chatflow.service.RoomService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final RoomService roomService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Principal principal) {
        User user = getUser(principal.getName());
        return ResponseEntity.ok(toResponse(user));
    }

    @PatchMapping("/me")
    @Transactional
    public ResponseEntity<UserProfileResponse> updateProfile(@RequestBody UpdateProfileRequest body, Principal principal) {
        User user = getUser(principal.getName());
        user.setDisplayName(body.getDisplayName().trim());
        userRepository.save(user);
        return ResponseEntity.ok(toResponse(user));
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileResponse> getUserByUsername(@PathVariable String username) {
        return ResponseEntity.ok(toResponse(getUser(username)));
    }

    @PostMapping("/{username}/dm")
    public ResponseEntity<RoomResponse> openDm(@PathVariable String username, Principal principal) {
        return ResponseEntity.ok(roomService.getOrCreateDm(principal.getName(), username));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Data
    public static class UpdateProfileRequest {
        @NotBlank
        @Size(max = 50)
        private String displayName;
    }
}
