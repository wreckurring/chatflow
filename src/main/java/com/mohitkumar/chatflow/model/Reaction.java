package com.mohitkumar.chatflow.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reactions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "username", "emoji"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 10)
    private String emoji;
}
