package com.mohitkumar.chatflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableRetry
public class ChatFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(ChatFlowApplication.class, args);
    }
}