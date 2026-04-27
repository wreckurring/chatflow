package com.mohitkumar.chatflow.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InviteResponse {
    private String token;
    private Long roomId;
    private String roomName;
    private String roomDescription;
    private int memberCount;
    private String createdBy;
    private LocalDateTime expiresAt;
    private boolean expired;
}
