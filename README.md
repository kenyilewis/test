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

- Node.js (v20 or higher)
- Docker and Docker Compose (for MongoDB)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/kenyilewis/test.git
cd test
```

2. Start MongoDB using Docker:
```bash
docker compose up -d
```

> **Note:** This will start only MongoDB in a Docker container. The application will run locally on your machine.

> **Note:** If you have an older version of Docker, use `docker-compose` (with hyphen) instead of `docker compose` (with space).

3. Install dependencies:
```bash
npm install
```

4. To stop MongoDB:
```bash
docker compose down
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

**Development Mode (with hot reload):**
```bash
npm run start:dev
```

**Production Mode:**
```bash
npm run build
npm run start:prod
```

The server will start on `http://localhost:8000` (or the port specified in your configuration).

**Note:** Make sure MongoDB is running via Docker (`docker compose up -d`) before starting the application.

## API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:8000/api/docs
```

### Testing with Postman

A complete Postman collection is provided in the repository: `postman-collection.json`

**Import the collection:**
1. Open Postman
2. Click "Import" button
3. Select `postman-collection.json` from the project root
4. The collection will be imported with all test cases and examples

**Features included:**
- ✅ 4 complete test scenarios with automatic validations
- ✅ Pre-configured environment variables
- ✅ Auto-save of `taskId` for testing workflow
- ✅ Example responses for each endpoint
- ✅ Test scripts to validate responses

**Test cases:**
1. **Create Task**: Creates a task with image path/URL and validates response structure
2. **Get Task Status**: Queries task status (pending/completed)
3. **Get Task - Not Found (404)**: Tests error handling for non-existent tasks
4. **Create Task - Invalid Input (400)**: Tests input validation

**Configuration:**
- `baseUrl`: http://localhost:8000 (change if needed)
- `imagePath`: https://picsum.photos/2000/1500 (default test image URL)
- `lastTaskId`: Auto-populated after creating a task

**Quick Start:**
1. Start MongoDB: `docker compose up -d`
2. Start the application: `npm run start:dev`
3. Import the collection in Postman
4. Run "Create Task" request
5. Wait 2-3 seconds
6. Run "Get Task Status" to see processing results

**Note:** The collection uses https://picsum.photos as default image source. You can change the `imagePath` variable to use local images or different URLs.

## API Endpoints

### POST /tasks

Creates a new image processing task.

The API supports **two methods** to provide the image:

#### Method 1: Image URL (Recommended)

Provide a URL to an image. The API will download it and process it.

**Request Body (JSON):**
```json
{
  "imagePath": "https://picsum.photos/2000/1500"
}
```

**cURL Example:**
```bash
curl -X 'POST' \
  'http://localhost:8000/tasks' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "imagePath": "https://picsum.photos/2000/1500"
}'
```

#### Method 2: Local File Path

Provide a local file system path to an image.

**Request Body (JSON):**
```json
{
  "imagePath": "/path/to/image.jpg"
}
```

**cURL Example:**
```bash
curl -X 'POST' \
  'http://localhost:8000/tasks' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "imagePath": "/Users/username/Pictures/image.jpg"
}'
```

---

**Response (201 Created):**
```json
{
  "taskId": "65d4a54b89c5e342b2c2c5f6",
  "status": "pending",
  "price": 25.5
}
```

**Response (400 Bad Request) - Missing imagePath:**
```json
{
  "statusCode": 400,
  "message": "imagePath must be a string",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response (400 Bad Request) - Invalid local path:**
```json
{
  "statusCode": 400,
  "message": "Invalid image path or URL",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response (400 Bad Request) - Invalid image URL:**
```json
{
  "statusCode": 400,
  "message": "Failed to download image: Not Found",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response (400 Bad Request) - Invalid image format:**
```json
{
  "statusCode": 400,
  "message": "Invalid image file: Input buffer contains unsupported image format",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

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

The project has comprehensive test coverage with unit, integration, and E2E tests.

### Unit Tests

Run all unit tests:

```bash
npm test
```

Unit tests cover:
- Use cases (CreateTaskUseCase, GetTaskUseCase, ProcessImageUseCase)
- Utility functions (price generator, MD5 hasher, path builder, image downloader, image validator)
- URL detection and validation
- Image format validation
- Temporary file cleanup

### Integration Tests

Run integration tests with real MongoDB and Sharp:

```bash
npm run test:integration
```

Integration tests cover:
- Use Cases + Real Repositories + MongoDB
- Use Cases + Real Sharp Image Processor
- End-to-end image processing flow with real services

### E2E Tests

Make sure MongoDB is running before executing E2E tests:

```bash
# Start MongoDB with Docker
docker compose up -d

# Run E2E tests
npm run test:e2e
```

E2E tests cover:
- Complete HTTP request/response flow
- Local file path processing
- URL-based image processing
- Error handling (404, 400)
- Invalid file type validation
- Missing imagePath validation

### Test Coverage

```bash
npm run test:cov
```

### All Tests

```bash
npm test && npm run test:integration && npm run test:e2e
```

## Image Processing

The API processes images asynchronously and supports **two input methods**:

### Input Methods

1. **HTTP/HTTPS URL**: 
   - Downloads image to temporary location
   - Validates content-type is an image
   - Automatically cleaned up after processing

2. **Local File Path**: 
   - Direct access to file system
   - File must be accessible from the application's file system
   - No cleanup needed (original file is not modified)

### Processing Flow

1. **Validation**: 
   - For local paths: Validates that the file exists and is accessible
   - For URLs: Downloads the image and validates content-type is an image
   - Validates that the file is a valid image format using Sharp metadata extraction
   - This prevents processing failures and provides immediate feedback

2. **Task Creation**: When valid, a task is created and immediately returned with `status: "pending"`

3. **Background Processing**: Image processing starts in the background (non-blocking)

4. **Variants Generation**: Two variants are generated:
   - 1024px width (maintaining aspect ratio)
   - 800px width (maintaining aspect ratio)

5. **Storage**: Images are saved in the format: `/output/{original_name}/{resolution}/{md5}.{ext}`

6. **Cleanup**: Temporary files (from URL downloads) are automatically cleaned up after processing

7. **Status Update**: The task status is updated to `completed` or `failed`

**Supported formats:** JPEG, PNG, WebP, GIF, TIFF, BMP, and other formats supported by Sharp.

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

7. **URL Support**: The API supports both local file paths and remote URLs:
   - URLs are detected using regex pattern matching
   - Images are downloaded to temporary storage before processing
   - Temporary files are automatically cleaned up after processing or on failure
   - Content-type validation ensures URLs point to actual images

8. **Proactive Image Validation**: Before creating tasks, the API validates:
   - File existence (for local paths)
   - Image format using Sharp metadata extraction
   - This prevents processing failures and provides immediate feedback to users

9. **Input Validation**: Multiple layers of validation ensure data integrity:
   - DTO validation for request structure
   - File existence validation
   - Image format validation
   - URL content-type validation

10. **Error Handling**: Centralized exception filters handle domain exceptions and HTTP errors consistently.

11. **Comprehensive Testing**: Three levels of testing ensure reliability:
    - Unit tests with mocked dependencies
    - Integration tests with real MongoDB and Sharp
    - E2E tests covering complete HTTP flows

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
