# Ibanez Guitar Database

A full-stack TypeScript application for cataloging Ibanez guitars. Data is automatically scraped from the [Ibanez Wiki](https://ibanez.fandom.com) and served through a REST API with a Nuxt.js frontend featuring Newegg-style faceted search.

## Architecture

```
ibanez-db/
├── shared/                  # Shared TypeScript types (DTOs, API contracts)
│   ├── types/
│   │   ├── guitar.ts        # Guitar domain types
│   │   └── api.ts           # API request/response types
│   └── index.ts
├── backend/                 # Fastify REST API + scraper
│   ├── src/
│   │   ├── config/          # Environment config, logger
│   │   ├── domain/entities/ # MikroORM entities (Guitar, GuitarImage)
│   │   ├── adapters/
│   │   │   ├── storage/     # MinIO/S3 adapter (interface + implementation)
│   │   │   └── scraper/     # Wiki scraper + field normalizer
│   │   ├── services/        # Business logic (GuitarService)
│   │   ├── api/routes/      # Fastify route handlers
│   │   ├── jobs/            # Cron jobs (nightly scrape)
│   │   └── migrations/      # Database migrations
│   ├── mikro-orm.config.ts
│   └── Dockerfile
├── frontend/                # Nuxt 3 (Vue 3 Options API) + Tailwind CSS
│   ├── pages/               # Search page, guitar detail page
│   ├── components/          # GuitarCard, FacetedFilter, FilterTag, SearchBar
│   ├── composables/         # useGuitarApi
│   ├── types/
│   └── Dockerfile
├── docker-compose.yml       # Full stack: Postgres, MinIO, backend, frontend
├── .env.example             # Environment variable template
└── AGENTS.md                # AI coding guidelines
```

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | Nuxt 3, Vue 3 (Options API), Tailwind CSS |
| Backend     | Node.js, Fastify, TypeScript          |
| ORM         | MikroORM 6 (PostgreSQL driver)        |
| Database    | PostgreSQL 16 (Supabase-compatible)   |
| Storage     | MinIO (S3-compatible) for images      |
| Scraper     | Cheerio + MediaWiki API fallback      |
| Deployment  | Docker + Docker Compose               |

## Quick Start

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- npm

### 1. Clone and install

```bash
git clone <repo-url> ibanez-db
cd ibanez-db
cp .env.example .env
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d postgres minio
```

### 3. Run database migrations

```bash
npm run migration:up -w backend
```

### 4. Start development servers

```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin)

### 5. Run the initial scrape

```bash
npm run scrape
```

This fetches all guitar models from ibanez.fandom.com, extracts specs, and uploads images to MinIO.

## Docker Deployment

Build and run the full stack:

```bash
docker compose up --build -d
```

This starts:
- **postgres** on port 5432
- **minio** on ports 9000 (API) / 9001 (console)
- **backend** on port 3001
- **frontend** on port 3000

## REST API

### `GET /guitars`

List guitars with faceted filtering and pagination.

**Query Parameters:**

| Parameter            | Type          | Description                            |
|----------------------|---------------|----------------------------------------|
| `search`             | string        | Full-text search on model/name/series  |
| `page`               | number        | Page number (default: 1)               |
| `limit`              | number        | Results per page (default: 24, max: 100) |
| `series`             | string/csv    | Filter by series (e.g., `RG,S,JEM`)    |
| `bodyMaterial`       | string/csv    | Filter by body material                |
| `neckMaterial`       | string/csv    | Filter by neck material                |
| `fretboardMaterial`  | string/csv    | Filter by fretboard material           |
| `pickupConfiguration`| string/csv   | Filter by pickup config (e.g., `HSH`)  |
| `bridgeType`         | string/csv    | Filter by bridge type                  |
| `hardwareColor`      | string/csv    | Filter by hardware color               |
| `countryOfOrigin`    | string/csv    | Filter by country                      |
| `numberOfFrets`      | number/csv    | Filter by fret count                   |
| `tremolo`            | boolean       | Filter by tremolo presence             |
| `productionStart`    | number        | Min production start year              |
| `productionEnd`      | number        | Max production end year                |
| `sortBy`             | string        | Sort field: model, series, productionStart, createdAt |
| `sortOrder`          | asc/desc      | Sort direction (default: asc)          |

**Example Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "model": "RG550",
      "name": "RG550",
      "series": "RG",
      "bodyMaterial": "Basswood",
      "neckMaterial": "Maple",
      "fretboardMaterial": "Rosewood",
      "numberOfFrets": 24,
      "pickupConfiguration": "HSH",
      "bridgeType": "Edge",
      "tremolo": true,
      "hardwareColor": "Cosmo Black",
      "finishes": ["Road Flare Red", "Desert Sun Yellow"],
      "countryOfOrigin": "Japan",
      "yearsProduced": "1987-1994",
      "productionStart": 1987,
      "productionEnd": 1994,
      "primaryImageUrl": "http://localhost:9000/ibanez-images/rg550/abc-123.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 1234,
    "totalPages": 52
  },
  "facets": {
    "series": [
      { "value": "RG", "count": 450 },
      { "value": "S", "count": 200 }
    ],
    "bodyMaterial": [
      { "value": "Basswood", "count": 600 },
      { "value": "Mahogany", "count": 150 }
    ]
  }
}
```

### `GET /guitars/:id`

Get full guitar detail with all images and raw wiki attributes.

**Example Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "model": "RG550",
  "name": "RG550",
  "series": "RG",
  "images": [
    {
      "id": "...",
      "storageKey": "rg550/abc-123.jpg",
      "originalName": "RG550_RFR.jpg",
      "sizeBytes": 245760,
      "mimeType": "image/jpeg",
      "isPrimary": true,
      "url": "http://localhost:9000/ibanez-images/rg550/abc-123.jpg"
    }
  ],
  "rawAttributes": {
    "Body": "Basswood",
    "Neck": "Maple",
    "Fretboard": "Rosewood"
  }
}
```

### `POST /guitars`

Create or upsert a guitar (admin/testing endpoint).

**Request Body:** Any subset of guitar fields with required `model` string.

### `GET /health`

Health check endpoint.

## Database Schema

### `guitars` table

| Column                 | Type      | Description                        |
|------------------------|-----------|------------------------------------|
| id                     | uuid (PK) | Auto-generated UUID               |
| model                  | text (UQ) | Model identifier (business key)   |
| name                   | text      | Display name                       |
| series                 | text      | Guitar series (RG, S, JEM, etc.)  |
| body_type              | text      | Body shape/style                   |
| body_material          | text      | Body wood                          |
| neck_type              | text      | Neck profile/shape                 |
| neck_material          | text      | Neck wood                          |
| fretboard_material     | text      | Fretboard wood                     |
| fretboard_radius       | text      | Fretboard radius                   |
| number_of_frets        | int       | Fret count                         |
| scale_length           | text      | Scale length                       |
| pickup_configuration   | text      | Pickup config (HSH, HH, etc.)     |
| neck_pickup            | text      | Neck pickup model                  |
| middle_pickup          | text      | Middle pickup model                |
| bridge_pickup          | text      | Bridge pickup model                |
| bridge_type            | text      | Bridge model                       |
| tremolo                | boolean   | Has tremolo system                 |
| hardware_color         | text      | Hardware finish color              |
| finishes               | jsonb     | Array of available finishes        |
| country_of_origin      | text      | Manufacturing country              |
| years_produced         | text      | Free-text production years         |
| production_start       | int       | Start year (parsed)                |
| production_end         | int       | End year (parsed, null=current)    |
| msrp                   | text      | List price                         |
| wiki_url               | text      | Source wiki page URL               |
| raw_attributes         | jsonb     | Full scraped key-value pairs       |
| created_at             | timestamptz | Record creation time             |
| updated_at             | timestamptz | Last update time                 |

### `guitar_images` table

| Column        | Type      | Description                              |
|---------------|-----------|------------------------------------------|
| id            | uuid (PK) | Auto-generated UUID                     |
| guitar_id     | uuid (FK) | References guitars.id (CASCADE delete)  |
| storage_key   | text      | Object key in MinIO/S3                   |
| original_name | text      | Original filename (for change detection) |
| size_bytes    | int       | File size (for change detection)         |
| mime_type     | text      | MIME type                                |
| is_primary    | boolean   | Primary display image flag               |
| created_at    | timestamptz | Upload time                            |

## Image Storage

Images are stored in MinIO (or AWS S3) with the key structure:

```
/<guitar-slug>/<uuid>.<ext>
```

For example: `/rg550/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`

### Switching to AWS S3

Set these environment variables:

```env
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=s3.amazonaws.com
STORAGE_ACCESS_KEY=your-aws-access-key
STORAGE_SECRET_KEY=your-aws-secret-key
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=us-east-1
```

## Nightly Scrape

The scraper runs automatically at 2:00 AM daily via cron. It can also be triggered manually:

```bash
npm run scrape
```

The scraper:
1. Fetches all guitar model URLs from the wiki category page (MediaWiki API with HTML fallback)
2. Scrapes each page with configurable concurrency and rate limiting
3. Extracts infobox/specs table data using Cheerio
4. Normalizes field values (materials, hardware, countries, etc.)
5. Upserts guitar records into PostgreSQL
6. Downloads images and uploads to MinIO
7. Detects image changes by comparing original name + file size

## Verification Commands

```bash
npm run typecheck         # Type-check all workspaces
npm run build             # Build shared, backend, and frontend
npm run test              # Run backend tests
npm run lint              # Lint all workspaces
```

## Environment Variables

See [.env.example](.env.example) for all available configuration options.
