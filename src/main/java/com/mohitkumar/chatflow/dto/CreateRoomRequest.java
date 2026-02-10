package com.mohitkumar.chatflow.dto;

import com.mohitkumar.chatflow.model.Room;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateRoomRequest {

    @NotBlank(message = "Room name is required")
    @Size(min = 3, max = 50, message = "Room name must be between 3 and 50 characters")
    private String name;

    @Size(max = 255, message = "Description too long")
    private String description;

    // defaults to PUBLIC if not provided
    private Room.RoomType type = Room.RoomType.PUBLIC;
}
