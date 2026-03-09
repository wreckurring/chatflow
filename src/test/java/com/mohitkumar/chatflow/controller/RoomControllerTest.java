package com.mohitkumar.chatflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mohitkumar.chatflow.dto.CreateRoomRequest;
import com.mohitkumar.chatflow.dto.RoomResponse;
import com.mohitkumar.chatflow.model.Room;
import com.mohitkumar.chatflow.security.JwtAuthFilter;
import com.mohitkumar.chatflow.security.JwtUtil;
import com.mohitkumar.chatflow.security.UserDetailsServiceImpl;
import com.mohitkumar.chatflow.service.RoomService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RoomController.class)
@AutoConfigureMockMvc(addFilters = false)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private RoomService roomService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private UserDetailsServiceImpl userDetailsService;
    @MockBean private JwtAuthFilter jwtAuthFilter;

    @Test
    @WithMockUser(username = "mohit")
    void createRoom_Returns200_WhenValid() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("Engineering");
        
        RoomResponse mockResponse = RoomResponse.builder()
                .id(1L)
                .name("Engineering")
                .type(Room.RoomType.PUBLIC)
                .createdBy("mohit")
                .build();

        when(roomService.createRoom(any(CreateRoomRequest.class), eq("mohit"))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/rooms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Engineering"))
                .andExpect(jsonPath("$.createdBy").value("mohit"));
    }

    @Test
    @WithMockUser(username = "mohit")
    void createRoom_Returns400_WhenNameIsBlank() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("");

        mockMvc.perform(post("/api/rooms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name").exists());
    }
}