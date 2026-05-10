# EduAI Assistant — Adaptive Learning Platform

EduAI Assistant is an AI-powered learning platform that extracts knowledge from documents, tracks topic mastery, detects weaknesses, predicts exam readiness, and adapts learning strategies.


## Preview

Below are example screenshots. 
# login
![Login](screenshots/login.png)

# register
![Register](screenshots/register.png)

# dashboard
![Dashboard](screenshots/dashboard.png)

# document list and upload
![Document](screenshots/documentUpload.png)

# AI assistant
![AI Assistant](screenshots/AI-assistant.png)

# quiz
![Quiz](screenshots/quiz.png)

# Exam readiness
![Exam Readiness](screenshots/examready.png)

# Revision
![Revision](screenshots/revision.png)

## Quick overview

- Frontend: React + Vite
- Backend: Node.js (Express) + MongoDB
- AI: Google Gemini (via server/service integration)
- Auth: JWT + bcrypt

This repository contains two main folders:

- `client/` — React frontend (Vite)
- `server/` — Express API and services

## Quickstart (development)

Prerequisites:

- Node.js 18+
- MongoDB (local or Atlas)

Install dependencies and run both apps locally:

```bash
# from repo root
cd server
npm install
cp .env.example .env
# edit server/.env (MONGO_URI, JWT_SECRET, API keys)
npm run dev

# in another terminal
cd ../client
npm install
cp .env.example .env
# edit client/.env (VITE_API_BASE_URL)
npm run dev
```

Default dev ports:
- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

## Important folders

- `client/` — frontend source in `src/` (pages, components, api helpers)
- `server/` — API, controllers, models, services
- `uploads/` — uploaded PDFs and assets (server)
- `screenshots/` — place README screenshots here (created for you)

## Screenshots and documentation images

I've added a `screenshots/` folder to the repo. Place your images there and reference them in this README. Suggested images to include (depends on how many pages/features you want to show):

- Login / Register
- Dashboard (overview)
- Documents (upload / list)
- AI Assistant chat / ask UI
- Quiz / adaptive question
- Profile / Progress
- Revision Plan / Analytics

Recommended count: 6–10 images to cover main flows. Filename suggestions: `01-login.png`, `02-dashboard.png`, `03-documents.png`, etc.

Example markdown to embed an image (root README):

```md
![Dashboard](screenshots/02-dashboard.png)
```

## Key API endpoints (server)

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/profile` — Profile
- `POST /api/documents/upload` — Upload PDF
- `GET /api/documents` — List documents
- `POST /api/ai/ask` — Ask across documents
- `POST /api/ai/generate-quiz` — Adaptive quiz

Refer to `server/` and `client/src/` for implementation details.

## Environment variables

- `server/.env` (see `server/.env.example`): `MONGO_URI`, `JWT_SECRET`, `GOOGLE_GEMINI_API_KEY`, etc.
- `client/.env` (see `client/.env.example`): `VITE_API_BASE_URL`

## Deployment notes

- Backend: host on any Node provider (Render, Heroku, DigitalOcean). Ensure environment variables are set.
- Frontend: `npm run build` in `client/` then deploy `client/dist` to static host (Vercel, Netlify, or static site on Render).



