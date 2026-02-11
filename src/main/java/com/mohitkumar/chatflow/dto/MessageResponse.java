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
}
