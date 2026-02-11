package com.mohitkumar.chatflow.dto;

import com.mohitkumar.chatflow.model.Message;
import lombok.Data;

@Data
public class ChatMessage {

    private Long roomId;
    private String content;

    // defaults to TEXT, client can override
    private Message.MessageType type = Message.MessageType.TEXT;
}
