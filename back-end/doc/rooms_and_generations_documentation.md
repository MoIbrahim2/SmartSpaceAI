# Rooms and Generations API Documentation

This document explains the implementation, endpoints, database schemas, and request workflows for the newly introduced **Rooms** and **Generations** modules in the SmartSpaceAI REST API.

---

## 1. Directory Structure of Implementation

We adhered to the existing clean architecture pattern by organizing the implementation across the standard directories:
- **Models** (`src/models/room.model.js`, `src/models/generation.model.js`): Mongoose schemas and models.
- **Validators** (`src/validators/room.validator.js`, `src/validators/generation.validator.js`): Payload schema validations utilizing Joi.
- **Services** (`src/services/room.service.js`, `src/services/generation.service.js`): Database queries, permissions/ownership checks, and local file cleanups.
- **Controllers** (`src/controllers/room.controller.js`, `src/controllers/generation.controller.js`): Request/response binding.
- **Routes** (`src/routes/room.routes.js`, `src/routes/generation.routes.js`): Mounting routes with authentication (`protect`), file uploading (`multer`), body parsing, and payload validation middlewares.
- **Middlewares** (`src/middlewares/upload.middleware.js`): Extended to support dynamic filename prefixes (`room-*`, `generation-*`) and array file uploads.
- **Locales** (`src/locales/en.json`, `src/locales/ar.json`): Localization translations in both English and Arabic.
- **Postman Collection** (`doc/postman_collection.json`): Extended with dedicated "Rooms" and "Generations" folders with pre-configured requests and dynamic variable captures.

---

## 2. Database Models & Schema Design

### A. Rooms Schema
Represented by the Mongoose model `Room`. It maps each room to an apartment:
*   **`apartmentId`** (ObjectId, required): Reference to the parent `Apartment` document.
*   **`name`** (String, required): Friendly name of the room (e.g. *"Main Guest Room"*).
*   **`roomType`** (String, required): Category of the room (e.g. *"LIVING_ROOM"*, *"BEDROOM"*).
*   **`description`** (String): Optional text description of the room.
*   **`dimensions`** (Object, required):
    *   `width` (Number, required)
    *   `length` (Number, required)
    *   `height` (Number, required)
    *   `unit` (String, required)
*   **`sourceImages`** (Array of Objects): List of raw/original photos uploaded:
    *   `_id` (ObjectId, auto-generated)
    *   `url` (String)
    *   `storageProvider` (String, default: `'local'`)
    *   `fileName` (String)
    *   `uploadedAt` (Date, default: `Date.now`)
*   **`coverImageId`** (ObjectId): Reference to one of the `sourceImages._id` to set as the cover.
*   **`selectedGenerationId`** (ObjectId): Reference to the `generations._id` that was selected as the final design.
*   **`status`** (String, enum: `['ACTIVE', 'ARCHIVED']`): Active status of the room (default: `'ACTIVE'`).

### B. Generations Schema
Represented by the Mongoose model `Generation`. It details an AI-powered design generation task for a specific room:
*   **`roomId`** (ObjectId, required): Reference to the target `Room`.
*   **`ownerId`** (ObjectId, required): Reference to the `User` who triggered the generation.
*   **`styleId`** (ObjectId): Reference to the design style selected.
*   **`generationType`** (String, enum: `['CREATE_FROM_SCRATCH', 'ENHANCE_EXISTING']`, required): The methodology of design generation.
*   **`status`** (String, enum: `['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']`, required): The workflow status.
*   **`prompt`** (String): Text prompt detailing style instructions.
*   **`negativePrompt`** (String): Excluded styling attributes.
*   **`creditsUsed`** (Number): Cost in credits.
*   **`settings`** (Object): AI options:
    *   `creativity` (Number, 0-100)
    *   `preserveLayout` (Boolean)
    *   `colorPalette` (String)
    *   `lighting` (String)
    *   `quality` (String)
    *   `aspectRatio` (String)
    *   `seed` (String)
*   **`images`** (Array of Objects): List of generated design outputs:
    *   `_id` (ObjectId, auto-generated)
    *   `url` (String)
    *   `thumbnail` (String)
    *   `width` (Number)
    *   `height` (Number)
    *   `selected` (Boolean, default: `false`)
*   **`ai`** (Object): Model configurations:
    *   `provider` (String)
    *   `model` (String)
    *   `version` (String)
    *   `generationTime` (Number)
*   **`completedAt`** (Date): Timestamp when the AI task successfully finished.

---

## 3. Endpoints Details

### A. Rooms API (`/api/rooms`)
All modification requests require a valid JWT Access Token.

| Method | Endpoint | Description | Auth Required | File Upload |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/rooms` | Retrieve rooms (supports query filters for `apartmentId`, `roomType`, `status`, `search` by name, pagination, and sorting) | No | No |
| **GET** | `/api/rooms/:id` | Fetch a single room by its ID | No | No |
| **POST** | `/api/rooms` | Create a new room. Only the apartment owner can add rooms to it | Yes | Yes (`sourceImages`) |
| **PATCH** | `/api/rooms/:id` | Update room fields (supports appending new source images, removing specific images via `deleteImageIds` array, and toggling `coverImageId`) | Yes | Yes (`sourceImages`) |
| **DELETE** | `/api/rooms/:id` | Delete a room. Cleans up associated images from the local storage disk | Yes | No |

### B. Generations API (`/api/generations`)
All modification requests require a valid JWT Access Token.

| Method | Endpoint | Description | Auth Required | File Upload |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/generations` | Retrieve generations (supports query filters for `roomId`, `ownerId`, `status`, `generationType`, pagination, and sorting) | No | No |
| **GET** | `/api/generations/:id` | Fetch a single generation by its ID | No | No |
| **POST** | `/api/generations` | Create a new generation task. Only the room owner can initiate generations | Yes | Yes (`images`) |
| **PATCH** | `/api/generations/:id` | Update generation details, mark status, or select a specific generated design image | Yes | Yes (`images`) |
| **DELETE** | `/api/generations/:id` | Delete a generation. Cleans up generated image files from the local storage disk | Yes | No |

---

## 4. Key Workflows & Features

### 1. Permissions & Ownership Checks
- When creating or updating a room, the service verifies that the target `Apartment` exists and that the authenticated user (`req.user._id`) is the true owner of that apartment.
- When creating a generation, the service verifies that the target `Room` exists and belongs to the authenticated user.
- These rules prevent malicious users from adding rooms or initiating generation tasks on apartments or rooms they do not own.

### 2. Disk Storage Cleanup
- Whenever a room or a generation is deleted, the service fetches the database record, locates all associated image file names, and safely unlinks (deletes) them from the local `/uploads` storage directory.
- During room/generation updates, clients can pass an array of image IDs under `deleteImageIds`. The service removes only those targeted files from disk and updates the Mongoose array.

### 3. Localization
All success and validation error messages are fully localizable. Depending on the `Accept-Language` header (`en` or `ar`), success responses contain localized messages like:
- **English**: *"Room created successfully"*, *"Generations retrieved successfully"*.
- **Arabic**: *"تم إنشاء الغرفة بنجاح"*, *"تم جلب بيانات عمليات التوليد بنجاح"*.
- Invalid payloads automatically output translated field errors (e.g. *"Room Type is required"* / *"حقل نوع الغرفة مطلوب"*).

### 4. Input Validation & Security Sanitization
- **Strict Payload Controls**: Misleading creation fields (`coverImageId` and `selectedGenerationId`) are disallowed during Room creation since these resources are not yet defined.
- **Cross-Reference Verification**: When updating a room's `selectedGenerationId`, the service verifies that the referenced generation exists, belongs to the exact same room, and is owned by the requesting user. This prevents cross-room or cross-owner data linking exploits.
- **Regular Expression Safe Escaping (ReDoS Prevention)**: All text searches in Apartment, Room, and Generation filters are sanitized by escaping regex metacharacters, securing the MongoDB `$regex` parser against crafted catastrophic-backtracking payloads.
- **Safe Profile Updates**: The user service initializes profile fields before updating nested object fields, ensuring that users with incomplete or legacy database documents do not trigger runtime null pointer exceptions.
- **Authentication Email Localized Keys**: Duplicate-key errors on `authentication.email` are fully translated to map clean, localized labels in English (`Email`) and Arabic (`البريد الإلكتروني`) rather than raw path strings.
