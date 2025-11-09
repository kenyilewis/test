# Image Processing API

A REST API built with NestJS and TypeScript for processing images and managing tasks. The API generates image variants at specific resolutions (1024px and 800px width) and manages task status with associated pricing.

## Architecture

This project follows **Hexagonal Architecture** (also known as Ports and Adapters), which separates the business logic from infrastructure concerns:

- **Domain**: Core business entities, value objects, and repository interfaces
- **Application**: Use cases (business logic) and DTOs
- **Infrastructure**: MongoDB repositories, REST controllers, and external services (Sharp)

### Project Structure

```
src/
├── config/              # Application configuration
├── modules/
│   ├── app/            # Main application module
│   └── task/           # Task module
│       ├── domain/     # Entities, value objects, repository interfaces
│       ├── application/# Use cases and DTOs
│       └── infrastructure/ # Controllers, repositories, services, schemas
├── shared/             # Shared utilities and filters
└── main.ts            # Application entry point
```

## Technologies

- **Node.js** with **TypeScript**
- **NestJS** - Progressive Node.js framework
- **MongoDB** with **Mongoose** - Database and ODM
- **Sharp** - High-performance image processing
- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing framework

## Prerequisites

- Node.js (v20 or higher) - Only if running without Docker
- MongoDB (v7 or higher) - Only if running without Docker
- Docker and Docker Compose - For containerized deployment
- npm or yarn - Only if running without Docker

## Installation

### Option 1: Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd challenge
```

2. Build and start the application:
```bash
# Production mode
docker compose up -d

# Development mode (with hot reload)
docker compose -f docker-compose.dev.yml up
```

> **Note:** If you have an older version of Docker, use `docker-compose` (with hyphen) instead of `docker compose` (with space).

3. The application will be available at:
   - API: `http://localhost:8000`
   - Swagger: `http://localhost:8000/api/docs`
   - MongoDB: `localhost:27017`

4. To stop the containers:
```bash
# Production
docker compose down

# Development
docker compose -f docker-compose.dev.yml down
```

5. To view logs:
```bash
# Production
docker compose logs -f app

# Development
docker compose -f docker-compose.dev.yml logs -f app
```

### Option 2: Local Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd challenge
```

2. Install dependencies:
```bash
npm install
```

3. Ensure MongoDB is running:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your local MongoDB instance
```

## Configuration

The application uses the following environment variables (optional):

- `PORT`: Server port (default: 8000)
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/kratos`)
- `OUTPUT_DIR`: Directory for processed images (default: `./output`)

You can create a `.env` file in the root directory:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/kratos
OUTPUT_DIR=./output
```

## Running the Application

### Using Docker

**Production:**
```bash
docker compose up -d
```

**Development (with hot reload):**
```bash
docker compose -f docker-compose.dev.yml up
```

### Local Development

**Development Mode:**
```bash
npm run start:dev
```

The server will start on `http://localhost:8000` (or the port specified in your configuration).

**Production Mode:**
```bash
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:8000/api/docs
```

## API Endpoints

### POST /tasks

Creates a new image processing task.

**Request Body:**
```json
{
  "imagePath": "/path/to/image.jpg"
}
```

**Response (201 Created):**
```json
{
  "taskId": "65d4a54b89c5e342b2c2c5f6",
  "status": "pending",
  "price": 25.5
}
```

**Response (400 Bad Request) - Invalid image path:**
```json
{
  "statusCode": 400,
  "message": "Invalid image path: file does not exist",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Note:** The API validates that the image file exists before creating the task.

### GET /tasks/:taskId

Retrieves the status and details of a task.

**Response (200 OK) - Pending:**
```json
{
  "taskId": "65d4a54b89c5e342b2c2c5f6",
  "status": "pending",
  "price": 25.5
}
```

**Response (200 OK) - Completed:**
```json
{
  "taskId": "65d4a54b89c5e342b2c2c5f6",
  "status": "completed",
  "price": 25.5,
  "images": [
    {
      "resolution": "1024",
      "path": "/output/image1/1024/f322b730b287da77e1c519c7ffef4fc2.jpg"
    },
    {
      "resolution": "800",
      "path": "/output/image1/800/202fd8b3174a774bac24428e8cb230a1.jpg"
    }
  ]
}
```

**Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Task with ID <taskId> not found",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing

The project has comprehensive test coverage with both unit and E2E tests.

### Unit Tests

Run all unit tests (19 tests):

```bash
npm test
```

### E2E Tests

Make sure MongoDB is running before executing E2E tests:

```bash
# Start MongoDB with Docker
docker compose up -d mongodb

# Run E2E tests (6 tests)
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

### All Tests

```bash
npm test && npm run test:e2e
```

**Total Tests:** 25 tests (19 unit + 6 E2E)

## Image Processing

The API processes images asynchronously:

1. **Validation**: The API first validates that the image file exists
2. **Task Creation**: When valid, a task is created and immediately returned with `status: "pending"`
3. **Background Processing**: Image processing starts in the background (non-blocking)
4. **Variants Generation**: Two variants are generated:
   - 1024px width (maintaining aspect ratio)
   - 800px width (maintaining aspect ratio)
5. **Storage**: Images are saved in the format: `/output/{original_name}/{resolution}/{md5}.{ext}`
6. **Status Update**: The task status is updated to `completed` or `failed`

**Supported formats:** JPEG, PNG, WebP, GIF, and other formats supported by Sharp.

## Database

### Collections

**tasks:**
- `_id`: ObjectId
- `status`: "pending" | "completed" | "failed"
- `price`: number (random between 5 and 50)
- `originalPath`: string
- `images`: array of { resolution, path }
- `error`: string (optional, only if failed)
- `createdAt`: Date
- `updatedAt`: Date

**images:**
- `_id`: ObjectId
- `taskId`: ObjectId (reference to task)
- `resolution`: string
- `path`: string
- `md5`: string
- `createdAt`: Date

### Indexes

- `tasks`: `_id`, `status`
- `images`: `taskId`, `md5`

Indexes are created automatically when the schemas are registered.

### Database Initialization

A script is provided to initialize the database with indexes and sample data:

```bash
# Using mongosh
mongosh mongodb://localhost:27017/kratos < scripts/init-db.js

# Or using Docker
docker compose exec mongodb mongosh kratos --file /scripts/init-db.js
```

The script creates:
- Required indexes for optimal query performance
- Sample task and image documents for testing

## Technical Decisions

1. **Hexagonal Architecture**: Separates business logic from infrastructure, making the codebase testable and maintainable.

2. **MongoDB**: Chosen for flexibility in storing nested image arrays and task metadata.

3. **Sharp**: High-performance image processing library that handles various formats efficiently.

4. **Asynchronous Processing**: Image processing runs in the background to provide fast API responses.

5. **MD5 Hashing**: Used to identify duplicate images and organize file storage.

6. **Random Pricing**: Price is generated randomly between 5 and 50 units when a task is created.

7. **Input Validation**: Image file existence is validated before creating tasks to prevent processing errors.

8. **Error Handling**: Centralized exception filters handle domain exceptions and HTTP errors consistently.

## Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
npm run lint
npm run format
```

### Building

```bash
npm run build
```

The compiled JavaScript will be in the `dist/` directory.

## License

UNLICENSED
