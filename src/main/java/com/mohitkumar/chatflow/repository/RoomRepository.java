package com.mohitkumar.chatflow.repository;

import com.mohitkumar.chatflow.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByName(String name);

    boolean existsByName(String name);

    List<Room> findByType(Room.RoomType type);

    // get all rooms a user has joined
    @Query("SELECT r FROM Room r JOIN r.members m WHERE m.id = :userId")
    List<Room> findRoomsByUserId(@Param("userId") Long userId);

    // search rooms by name
    List<Room> findByNameContainingIgnoreCaseAndType(String name, Room.RoomType type);
}
