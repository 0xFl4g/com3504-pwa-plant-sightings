# Plant Sightings

A Progressive Web App for recording and sharing plant sightings. Submit observations with photos and GPS location, view them on interactive maps, discuss via real-time comments, and look up plant info from DBpedia/Wikipedia.

## Features

- Submit and view plant sightings with photos, location, and characteristics
- Real-time comments via Socket.IO
- Interactive Leaflet maps with geolocation
- Plant identification autocomplete from DBpedia (Linked Data / SPARQL)
- Offline-first with Service Worker, IndexedDB, and Background Sync
- PWA — installable on mobile and desktop

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Backend**: Express.js, Mongoose
- **Database**: MongoDB
- **Frontend**: EJS, Bootstrap 5, Leaflet
- **Real-time**: Socket.IO
- **Offline**: Service Worker, IndexedDB, Background Sync
- **Security**: Helmet, express-rate-limit
- **Logging**: Pino
- **Docs**: Swagger/OpenAPI at `/api-docs`

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [MongoDB](https://www.mongodb.com/try/download/community) (local or cloud)

## Setup

```bash
git clone https://github.com/0xFl4g/com3504-intelligent-web-plant-sightings.git
cd com3504-intelligent-web-plant-sightings
cp .env.example .env   # edit as needed
bun install
bun start              # or: bun dev (with auto-reload)
```

Open http://localhost:3000.

## Environment Variables

See [`.env.example`](.env.example) for all available options.

## API Documentation

Swagger UI is available at http://localhost:3000/api-docs when the app is running.

## Known Limitations

This project was originally built as university coursework (COM3504 — Intelligent Web). The following are accepted trade-offs that fall outside the scope of this project:

- **Client-side authentication only** — login is username-based with no password or server-side sessions. A production app would use proper session management or JWT-based auth.
- **No automated tests** — the project has no unit or integration test suite. A production codebase would include API and frontend tests.
- **Photos stored as base64 in MongoDB** — images are encoded and stored directly in documents rather than using file/object storage (e.g. S3, GridFS). This works for small-scale demos but does not scale.
