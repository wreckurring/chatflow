package com.mohitkumar.chatflow.dto;

import com.mohitkumar.chatflow.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private String content;
    private String senderUsername;
    private String senderDisplayName;
    private Long roomId;
    private Message.MessageType type;
    private LocalDateTime sentAt;
    private LocalDateTime editedAt;
    private boolean deleted;
    private EventType eventType;
    private Long replyToId;
    private String replyToContent;
    private String replyToSenderUsername;
    private String replyToSenderDisplayName;
    // emoji → list of usernames who reacted
    private java.util.Map<String, java.util.List<String>> reactions;

    public enum EventType {
        SENT, EDITED, DELETED, REACTION_UPDATE
    }
}
