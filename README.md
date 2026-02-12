# ChatFlow

A real-time chat system built to explore WebSocket architecture, Redis presence tracking, and secure multi-tenant messaging patterns.

![Java](https://img.shields.io/badge/Java-17-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.2-green.svg)

---

## Key Features

- **JWT Authentication** - Stateless auth with bcrypt password hashing
- **Real-time Messaging** - WebSocket (STOMP) pub/sub with room-based fan-out
- **Room Management** - Multi-tenant chat rooms with access control
- **Distributed Presence** - Redis-backed online user tracking with TTL heartbeat
- **Message Persistence** - Paginated history with indexed PostgreSQL queries

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 3.2, Java 17 |
| **Real-time** | WebSocket (STOMP over SockJS) |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 |
| **Security** | Spring Security + JWT |
| **Deployment** | Docker, Docker Compose |

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Client (React/JS)                  │
└────────────┬────────────────────┬────────────────┘
             │                    │
        REST API            WebSocket (STOMP)
             │                    │
┌────────────┴────────────────────┴────────────────┐
│           Spring Boot Backend                    │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ Controllers  │  Services    │  Repositories│ │
│  │   + JWT      │   + Redis    │   + JPA      │ │
│  └──────────────┴──────────────┴──────────────┘ │
└────────────┬────────────────────┬────────────────┘
             │                    │
      ┌──────┴──────┐      ┌──────┴──────┐
      │ PostgreSQL  │      │    Redis    │
      │  (Messages, │      │  (Presence, │
      │   Users,    │      │   Sessions) │
      │   Rooms)    │      │             │
      └─────────────┘      └─────────────┘
```

## Key Challenges Solved

- Designed room-based WebSocket pub/sub with JWT-secured handshake.
- Implemented Redis TTL heartbeat for online presence tracking.
- Secured REST + WebSocket channels with stateless JWT authentication and role checks.
- Bi-directional real-time messaging with join/leave system events.

## Scalability Design

- Stateless architecture with Redis-backed session and presence state for horizontal scaling.
- Indexed PostgreSQL queries with pagination to handle large message volumes efficiently.
- Redis caching for hot presence/session data with automatic TTL cleanup.
- Connection pooling, and Docker builds for production efficiency.

## Security

- **Authentication:** JWT tokens with configurable expiration (24h default)
- **Authorization:** Room membership verified before message send/receive
- **Password Security:** BCrypt with salt rounds
- **Input Validation:** Bean Validation (JSR-380) on all DTOs
- **WebSocket Security:** Token validation on every inbound message

## Project Structure

```
chatflow/
├── src/main/java/com/mohitkumar/chatflow/
│   ├── config/              # Security, WebSocket, Redis config
│   ├── controller/          # REST & WebSocket endpoints
│   ├── model/               # JPA entities (User, Room, Message)
│   ├── repository/          # Spring Data JPA repositories
│   ├── service/             # Business logic layer
│   ├── security/            # JWT utilities, filters, user details
│   ├── dto/                 # Request/Response objects
│   └── exception/           # Global error handling
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # PostgreSQL + Redis + App
└── pom.xml                  # Maven dependencies
```

## Quick Start

```bash
# Clone and run entire stack
git clone https://github.com/wreckurring/chatflow.git
cd chatflow
docker-compose up -d

# Access at http://localhost:8080
```

## Future System Design Improvements

- **WebSocket Clustering** - Redis pub/sub for cross-instance message routing
- **Message Delivery Guarantees** - At-least-once delivery with acknowledgments
- **Rate Limiting** - Token bucket algorithm to prevent abuse
- **Event-Driven Architecture** - Kafka for decoupled notification service
- **Monitoring & Observability** - Prometheus metrics, distributed tracing

## Testing

- Unit tests for service layer business logic
- Integration tests for WebSocket message flow
- Security tests for JWT validation

## License

MIT License

---

<p>Built as part of my backend systems learning journey. </p>