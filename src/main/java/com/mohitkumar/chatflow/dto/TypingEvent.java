package com.mohitkumar.chatflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingEvent {
    private Long roomId;
    private String username;
    private String displayName;
    private boolean typing;
}
