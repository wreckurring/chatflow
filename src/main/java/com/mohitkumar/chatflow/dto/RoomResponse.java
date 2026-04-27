package com.mohitkumar.chatflow.dto;

import com.mohitkumar.chatflow.model.Room;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {

    private Long id;
    private String name;
    private String description;
    private Room.RoomType type;
    private String createdBy;
    private int memberCount;
    private LocalDateTime createdAt;
    // Populated only for DIRECT rooms — the other participant
    private String otherUsername;
    private String otherDisplayName;
    // Last activity preview for sidebar
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
}
