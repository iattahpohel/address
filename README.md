# Address Service

A professional NestJS microservice for managing address data (cities, districts, wards, states, countries, and zones) with support for both gRPC and HTTP protocols.

## Features

- 🏙️ **Address Management**: Complete CRUD operations for cities, districts, wards, states, and countries
- 📍 **Zone Management**: Advanced zone lookup by zipcode with interval tree data structure
- 🔄 **Dual Protocol Support**: Both gRPC and HTTP endpoints
- 💾 **In-Memory Database**: Fast in-memory data access for frequently queried data
- 🗄️ **MySQL Integration**: Persistent storage with TypeORM
- 🔴 **Redis Support**: Caching and pub/sub capabilities
- 📊 **Queue Processing**: Background job processing with Bull
- ⏰ **Scheduled Tasks**: Automated cron jobs for data synchronization
- 🛡️ **Type Safety**: Full TypeScript support with strict typing
- ✅ **Validation**: Comprehensive input validation with class-validator
- 📝 **Logging**: Professional logging with NestJS Logger

## Prerequisites

- Node.js (v18 or higher)
- Yarn or npm
- Docker and Docker Compose (for local development)
- MySQL database
- Redis server

## Installation

1. **Clone the repository and install dependencies:**

```bash
yarn install
```

2. **Set up environment variables:**

Create a `.env` file in the root directory with the following variables:

```env
# Application
APP_ENV=dev
GRPC_URL=0.0.0.0:5000

# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=address_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Zone Configuration
ZONE_CHART_URL=https://your-zone-chart-url.com
```

3. **Start Docker services (MySQL, Redis):**

```bash
bash scripts/run_docker.sh
```

4. **Generate Protocol Buffer types:**

```bash
bash scripts/generate_proto.sh
# or
yarn gen-proto
```

## Running the Application

### Development Mode

```bash
yarn start:dev
```

### Production Mode

```bash
yarn build
yarn start:prod
```

### Debug Mode

```bash
yarn start:debug
```

## Project Structure

```
src/
├── city/              # City module
├── district/          # District module
├── ward/              # Ward module
├── state/             # State module
├── country/           # Country module
├── zone/              # Zone module with interval tree
├── common/            # Common utilities and base classes
├── config/            # Configuration service
├── exception.filter.ts # Global exception handling
└── main.ts            # Application entry point

libs/
├── utils/             # Shared utilities
└── core/              # Core components (Redis, etc.)

data/                  # JSON data files for initialization
proto/                 # Protocol Buffer definitions
```

## API Documentation

### gRPC Endpoints

The service exposes gRPC endpoints defined in `proto/api.proto`. Use a gRPC client to interact with these endpoints.

### HTTP Endpoints (if enabled)

HTTP endpoints follow RESTful conventions:
- `GET /city/list` - Get list of cities
- `GET /city/detail` - Get city detail
- Similar patterns for district, ward, state, country, and zone

## Development

### Code Quality

```bash
# Lint code
yarn lint

# Format code
yarn format
```

### Testing

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov
```

## Architecture

- **Controllers**: Handle HTTP/gRPC requests and responses
- **Services**: Business logic layer
- **Repositories**: Data access layer (In-Memory and TypeORM)
- **DTOs**: Data Transfer Objects with validation
- **Entities**: Domain models
- **Exception Filters**: Global error handling

## Key Improvements

This project has been optimized with:

- ✅ Professional error handling with proper exception filters
- ✅ Comprehensive logging using NestJS Logger
- ✅ Type-safe configuration service
- ✅ Base controller to reduce code duplication
- ✅ Enhanced DTO validation
- ✅ Improved type safety (removed `any` types)
- ✅ Better error messages and debugging
- ✅ Environment variable validation
- ✅ Code documentation and comments

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
