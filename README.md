# Trade Logger – Personal Trading Journal

A Java-based trading journal application built with Spring Boot and PostgreSQL to record trades, track trading performance, and analyze trading strategies.

## Overview

Trade Logger is designed to help traders maintain a structured record of their trades and evaluate their performance across different instruments and trading setups.

## Technology Stack

- **Language:** Java 21
- **Backend:** Spring Boot
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven
- **API Format:** REST / JSON
- **Frontend:** Thymeleaf, HTML, CSS and JavaScript (planned)

## Current Features

- Create and save trades.
- Retrieve all recorded trades.
- Retrieve an individual trade by ID.
- Delete trades.
- Persist trade data in PostgreSQL.

## Planned Features

- Trading dashboard with performance overview.
- Daily and monthly profit/loss analytics.
- Win rate and profit factor calculations.
- Equity curve visualization.
- Setup performance analysis across instruments.
- Long vs. short performance analysis.
- Trade history with filtering.
- Trading session analytics.
- Prop firm account and payout tracking.
- Trade screenshots, notes and emotional tracking.

## Project Structure

```text
src/main/java/com/tradelogger/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── exception/
├── config/
└── TradeLoggerApplication.java

src/main/resources/
└── application.properties
```

## Getting Started

### Prerequisites

- Java 21 or later
- PostgreSQL
- IntelliJ IDEA (recommended)
- Git

### Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE trade_logger;
```

Configure your local database connection in `application.properties` using your PostgreSQL credentials.

### Run the Application

On macOS or Linux:

```bash
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw.cmd spring-boot:run
```

The application runs at:

```text
http://localhost:8080
```

## REST API

Base URL: `/api/trades`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/trades` | Create a trade |
| GET | `/api/trades` | Retrieve all trades |
| GET | `/api/trades/{id}` | Retrieve a trade by ID |
| DELETE | `/api/trades/{id}` | Delete a trade |

## Development Status

<text>Backend foundation implemented. Dashboard and advanced analytics are planned for upcoming development.</text>

## Author

**Mayank Sachan**

GitHub: [MayankSachan18](https://github.com/MayankSachan18)

---

This project is actively being developed.