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
- [ ] Online presence tracking (Redis)
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

### WebSocket
| Destination | Description |
|-------------|-------------|
| CONNECT /ws | Connect with JWT in Authorization header |
| SEND /app/chat.send | Send a message to a room |
| SEND /app/chat.join | Notify room you joined |
| SUBSCRIBE /topic/room/{id} | Receive messages in a room |

## WebSocket Usage Example

```javascript
// Connect
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({ Authorization: 'Bearer ' + token }, () => {

    // Subscribe to a room
    stompClient.subscribe('/topic/room/1', (message) => {
        console.log(JSON.parse(message.body));
    });

    // Send a message
    stompClient.send('/app/chat.send', {}, JSON.stringify({
        roomId: 1,
        content: 'Hello everyone!'
    }));
});
```

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.6+
- PostgreSQL 14+

### Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE chatflow;"

# Clone and run
git clone https://github.com/wreckurring/chatflow.git
cd chatflow
mvn clean install
mvn spring-boot:run
```

## Development Roadmap

- [x] Project setup
- [x] User authentication (JWT)
- [x] Room management
- [x] WebSocket real-time messaging
- [ ] Redis online presence
- [ ] Typing indicators
- [ ] Docker deployment

## License

MIT License
