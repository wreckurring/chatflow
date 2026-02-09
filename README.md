# ChatFlow

Real-time chat application built with Spring Boot, WebSockets, Redis, and PostgreSQL.

## Tech Stack

- **Backend:** Spring Boot 3.2.2, Java 17
- **WebSocket:** STOMP protocol
- **Database:** PostgreSQL
- **Cache:** Redis
- **Security:** JWT Authentication
- **Build Tool:** Maven

## Features (Planned)

- [ ] User authentication with JWT
- [ ] Real-time messaging with WebSockets
- [ ] Multiple chat rooms
- [ ] Direct messaging
- [ ] Online presence tracking
- [ ] Message history
- [ ] Typing indicators
- [ ] File sharing
- [ ] Docker deployment

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
# Clone the repository
git clone https://github.com/wreckurring/chatflow.git
cd chatflow

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## Project Structure

```
chatflow/
├── src/
│   ├── main/
│   │   ├── java/com/mohitkumar/chatflow/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── model/           # JPA entities
│   │   │   ├── repository/      # Data access layer
│   │   │   ├── service/         # Business logic
│   │   │   ├── security/        # JWT & Security
│   │   │   └── dto/             # Data transfer objects
│   │   └── resources/
│   │       └── application.yml  # Configuration
│   └── test/                    # Unit tests
└── pom.xml                      # Maven dependencies
```

## Development Roadmap

- [x] Project setup
- [ ] User authentication
- [ ] Room management
- [ ] WebSocket messaging
- [ ] Redis integration
- [ ] Advanced features
- [ ] Docker deployment

## License

MIT License - feel free to use this project for learning!

---

⭐ Star this repository if you find it helpful!
