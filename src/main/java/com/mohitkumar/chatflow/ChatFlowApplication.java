package com.mohitkumar.chatflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ChatFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatFlowApplication.class, args);
    }
}
