# ChatFlow

A distributed, real-time chat system engineered to explore enterprise-grade WebSocket architecture, horizontal scaling, and secure multi-tenant messaging patterns.

![Java](https://img.shields.io/badge/Java-17-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.2-green.svg)
![Resilience4j](https://img.shields.io/badge/Resilience4j-2.2.0-blue.svg)

---

## Key Features

- **Distributed Real-Time Messaging** - WebSocket (STOMP) architecture synchronized across horizontally scaled instances using Redis Pub/Sub.
- **Asynchronous Persistence** - Redis read-through caching paired with fire-and-forget asynchronous PostgreSQL writes to prevent database bottlenecks under heavy chat load.
- **Enterprise Resilience** - Redis-backed token-bucket rate limiting (via Lua scripting) and database circuit breakers using Resilience4j to gracefully handle traffic spikes.
- **JWT Authentication** - Stateless auth with bcrypt password hashing and token validation on every inbound WebSocket message.
- **Distributed Presence** - Redis-backed online user tracking with TTL heartbeat for active session management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 3.2, Java 17 |
| **Real-time** | WebSocket (STOMP over SockJS) |
| **Database** | PostgreSQL 15 |
| **Cache & Pub/Sub** | Redis 7 |
| **Resilience** | Resilience4j, Spring AOP |
| **Security** | Spring Security + JWT |
| **Deployment** | Docker, Docker Compose |

## Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Client (React/JS/Mobile)                 │
└─────────────┬──────────────────────────┬───────────────┘
              │                          │
         REST API                  WebSocket (STOMP)
              │                          │
┌─────────────┴──────────────────────────┴───────────────┐
│                    Spring Boot Backend                 │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │ Rate Limiter │   │ Circuit      │   │ Async DB   │  │
│  │ (Redis Lua)  │   │ Breaker      │   │ Worker     │  │
│  └──────┬───────┘   └──────┬───────┘   └──────┬─────┘  │
└─────────┼──────────────────┼──────────────────┼────────┘
          │                  │                  │
    ┌─────┴─────┐      ┌─────┴─────┐      ┌─────┴─────┐
    │   Redis   │      │   Redis   │      │PostgreSQL │
    │ Pub/Sub & │      │   Cache   │      │ (Messages,│
    │  Presence │      │(Histories)│      │   Users)  │
    └───────────┘      └───────────┘      └───────────┘
```

## Key Challenges Solved

- Designed room-based WebSocket pub/sub with JWT-secured handshake.
- Implemented Redis TTL heartbeat for online presence tracking.
- Secured REST + WebSocket channels with stateless JWT authentication and role checks.
- Bi-directional real-time messaging with join/leave system events.

## Scalability Design

- Completely stateless HTTP architecture.
- Horizontal scaling enabled by Redis-backed session state, presence tracking, and Pub/Sub message distribution.
- Write-heavy optimizations using @Async AOP and fast caching (opsForList().leftPush) to protect the relational database.

## Project Structure

```
chatflow/
├── src/main/java/com/mohitkumar/chatflow/
│   ├── config/              # WebSocket, Redis Pub/Sub config
│   ├── controller/          # REST & WebSocket endpoints
│   ├── model/               # JPA entities (User, Room, Message)
│   ├── repository/          # Spring Data JPA repositories
│   ├── service/             # Business logic, Rate Limiting
│   ├── security/            # JWT utils, filters, user details
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

- **Database Partitioning & Indexing** - Implement table partitioning in PostgreSQL and composite indexing to handle message growth.
- **Message Delivery Guarantees** - At-least-once delivery with acknowledgments
- **Event-Driven Architecture** - Kafka for decoupled notification service
- **Observability** - Prometheus metrics, distributed tracing

## Testing

- Unit tests for service layer business logic
- Integration tests for WebSocket message flow
- Security tests for JWT validation

## License

MIT License

---

<p>Built as part of my backend systems learning journey. </p>