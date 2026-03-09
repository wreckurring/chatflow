package com.mohitkumar.chatflow.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String LUA_SCRIPT = 
            "local key = KEYS[1] " +
            "local capacity = tonumber(ARGV[1]) " +
            "local refillRate = tonumber(ARGV[2]) " +
            "local now = tonumber(ARGV[3]) " +
            "local bucket = redis.call('HMGET', key, 'tokens', 'last_refill') " +
            "local tokens = tonumber(bucket[1]) or capacity " +
            "local last_refill = tonumber(bucket[2]) or now " +
            "local time_passed = math.max(0, now - last_refill) " +
            "tokens = math.min(capacity, tokens + (time_passed * refillRate)) " +
            "if tokens >= 1 then " +
            "  redis.call('HMSET', key, 'tokens', tokens - 1, 'last_refill', now) " +
            "  redis.call('EXPIRE', key, 60) " +
            "  return 1 " +
            "else " +
            "  return 0 " +
            "end";

    public boolean isAllowed(String username) {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(LUA_SCRIPT);
        script.setResultType(Long.class);

        String key = "rate_limit:chat:" + username;
        Long result = redisTemplate.execute(script, Collections.singletonList(key), 
                "20", "1", String.valueOf(System.currentTimeMillis() / 1000));
        
        return result != null && result == 1L;
    }
}