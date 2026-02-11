# ChatFlow

Real-time chat application built with Spring Boot, WebSockets, Redis, and PostgreSQL.

## Tech Stack

- **Backend:** Spring Boot 3.2.2, Java 17
- **WebSocket:** STOMP over SockJS
- **Database:** PostgreSQL
- **Cache:** Redis
- **Security:** JWT Authentication
- **Build Tool:** Maven

## Features

- [x] User authentication with JWT
- [x] Room management (create, join, leave, search)
- [x] Real-time messaging with WebSockets (STOMP)
- [x] Message history with pagination
- [x] Online presence tracking with Redis
- [ ] Typing indicators
- [ ] Docker deployment

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and get JWT |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rooms | Create a room |
| GET | /api/rooms | Get public rooms |
| GET | /api/rooms/{id} | Get room by ID |
| GET | /api/rooms/search?q= | Search rooms |
| GET | /api/rooms/my-rooms | My joined rooms |
| POST | /api/rooms/{id}/join | Join a room |
| DELETE | /api/rooms/{id}/leave | Leave a room |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/messages/room/{id} | Get message history |

### Presence
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/presence/online | Get all online users |
| GET | /api/presence/check/{username} | Check if user is online |

### WebSocket
| Destination | Description |
|-------------|-------------|
| CONNECT /ws | Connect with JWT in Authorization header |
| SEND /app/chat.send | Send a message to a room |
| SEND /app/chat.join | Notify room you joined |
| SEND /app/chat.leave | Notify room you left |
| SUBSCRIBE /topic/room/{id} | Receive messages in a room |

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.6+
- PostgreSQL 14+
- Redis 6+

### Setup

```bash
# Start Redis (if using Docker)
docker run -d -p 6379:6379 redis:latest

# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE chatflow;"

# Clone and run
git clone https://github.com/wreckurring/chatflow.git
cd chatflow
mvn clean install
mvn spring-boot:run
```

### WebSocket Example

```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({ Authorization: 'Bearer ' + token }, () => {

    // Subscribe to a room
    stompClient.subscribe('/topic/room/1', (message) => {
        const msg = JSON.parse(message.body);
        console.log(msg);
    });

    // Join room
    stompClient.send('/app/chat.join', {}, JSON.stringify({ roomId: 1 }));

    // Send message
    stompClient.send('/app/chat.send', {}, JSON.stringify({
        roomId: 1,
        content: 'Hello!'
    }));
});
```

## Architecture

```
Frontend (React/JS)
    ↓
Spring Boot Backend
    ├── REST API (Auth, Rooms, Messages)
    ├── WebSocket (Real-time chat)
    ├── PostgreSQL (Persistent data)
    └── Redis (Online presence, caching)
```

## Development Roadmap

- [x] Project setup
- [x] User authentication (JWT)
- [x] Room management
- [x] WebSocket real-time messaging
- [x] Redis online presence
- [ ] Typing indicators
- [ ] Docker deployment

## License

MIT License
