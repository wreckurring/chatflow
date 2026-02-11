package com.mohitkumar.chatflow.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ONLINE_USERS_KEY = "chat:online:users";
    private static final String USER_ROOM_KEY = "chat:user:room:";

    // mark user as online
    public void userConnected(String username) {
        redisTemplate.opsForSet().add(ONLINE_USERS_KEY, username);
        // auto-expire after 5 minutes of inactivity
        redisTemplate.expire(ONLINE_USERS_KEY, 5, TimeUnit.MINUTES);
    }

    // remove user from online set
    public void userDisconnected(String username) {
        redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, username);
        // also remove from room tracking
        redisTemplate.delete(USER_ROOM_KEY + username);
    }

    // track which room a user is currently viewing
    public void userJoinedRoom(String username, Long roomId) {
        redisTemplate.opsForValue().set(
                USER_ROOM_KEY + username,
                roomId.toString(),
                30,
                TimeUnit.MINUTES
        );
    }

    public void userLeftRoom(String username) {
        redisTemplate.delete(USER_ROOM_KEY + username);
    }

    // get all online users
    public Set<String> getOnlineUsers() {
        Set<Object> members = redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
        return members != null
                ? members.stream().map(Object::toString).collect(Collectors.toSet())
                : Set.of();
    }

    // check if specific user is online
    public boolean isUserOnline(String username) {
        Boolean isMember = redisTemplate.opsForSet().isMember(ONLINE_USERS_KEY, username);
        return Boolean.TRUE.equals(isMember);
    }

    // get count of online users
    public Long getOnlineCount() {
        Long size = redisTemplate.opsForSet().size(ONLINE_USERS_KEY);
        return size != null ? size : 0L;
    }

    // refresh user activity (keep them online)
    public void refreshUserActivity(String username) {
        if (isUserOnline(username)) {
            redisTemplate.opsForSet().add(ONLINE_USERS_KEY, username);
            redisTemplate.expire(ONLINE_USERS_KEY, 5, TimeUnit.MINUTES);
        }
    }
}
