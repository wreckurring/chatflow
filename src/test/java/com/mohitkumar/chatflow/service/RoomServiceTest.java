package com.mohitkumar.chatflow.service;

import com.mohitkumar.chatflow.dto.CreateRoomRequest;
import com.mohitkumar.chatflow.dto.RoomResponse;
import com.mohitkumar.chatflow.model.Room;
import com.mohitkumar.chatflow.model.User;
import com.mohitkumar.chatflow.repository.RoomRepository;
import com.mohitkumar.chatflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock private RoomRepository roomRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private RoomService roomService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("mohit");
    }

    @Test
    void createRoom_Success() {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("General");
        request.setType(Room.RoomType.PUBLIC);

        when(roomRepository.existsByName("General")).thenReturn(false);
        when(userRepository.findByUsername("mohit")).thenReturn(Optional.of(mockUser));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room r = invocation.getArgument(0);
            r.setId(100L);
            return r;
        });

        RoomResponse response = roomService.createRoom(request, "mohit");

        assertNotNull(response);
        assertEquals("General", response.getName());
        assertEquals("mohit", response.getCreatedBy());
        assertEquals(1, response.getMemberCount());
    }

    @Test
    void joinRoom_ThrowsException_WhenAlreadyMember() {
        Room mockRoom = new Room();
        mockRoom.setId(10L);
        mockRoom.setMembers(new HashSet<>());
        mockRoom.getMembers().add(mockUser);

        when(roomRepository.findById(10L)).thenReturn(Optional.of(mockRoom));
        when(userRepository.findByUsername("mohit")).thenReturn(Optional.of(mockUser));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> roomService.joinRoom(10L, "mohit"));
        assertEquals("Already a member of this room", exception.getMessage());
    }
}