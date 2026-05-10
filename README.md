# EduAI Assistant 2.0 — Learning Intelligence System

An AI-powered adaptive learning platform that understands student study behavior, extracts knowledge from multiple documents, tracks topic mastery, detects weaknesses, predicts exam readiness, and automatically adjusts learning strategies.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Express.js + MongoDB
- **AI:** Google Gemini API
- **Auth:** JWT + bcrypt

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key

### Setup

1. Clone the repository (replace with your repo URL):
```bash
git clone <your-github-repo-url>
cd eduai-assistant
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Configure environment variables:
```bash
cd ../server
cp .env.example .env
# Edit .env with your values
```

5. Start the development servers:

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000`.

## Features

- Cross-document reasoning with AI
- Topic extraction and hierarchical mapping
- Mastery scoring per topic
- Weakness detection engine
- Exam readiness predictor (0-100)
- Adaptive quiz generation
- Smart revision scheduler (spaced repetition)
- Learning analytics dashboard

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/profile` — Profile

### Documents
- `POST /api/documents/upload` — Upload PDF
- `GET /api/documents` — List documents
- `DELETE /api/documents/:id` — Delete document

### AI
- `POST /api/ai/ask` — Ask across documents
- `POST /api/ai/summarize` — Summarize document
- `POST /api/ai/generate-quiz` — Adaptive quiz
- `POST /api/ai/compare-documents` — Compare documents
- `POST /api/ai/extract-topics` — Extract topics

### Analytics
- `GET /api/analytics/mastery` — Topic mastery
- `GET /api/analytics/weak-topics` — Weak areas
- `GET /api/analytics/exam-readiness` — Readiness score
- `GET /api/analytics/study-time` — Study time data
- `GET /api/analytics/revision-plan` — Revision schedule

## Repository structure

- `server/` — Express backend and API
- `client/` — React (Vite) frontend
- `README.md`, `.gitignore`, etc.

## Environment variables

- `server/.env` (see `server/.env.example`): `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, etc.
- `client/.env` (see `client/.env.example`): `VITE_API_BASE_URL` (set to your backend URL in production)

## Pushing this folder to GitHub

From the `eduai-assistant` root, run:

```bash
git init
git add .
git commit -m "Initial commit: EduAI Assistant"
# create a repo on GitHub and replace the URL below
git remote add origin https://github.com/Teshome-Worku/eduai-assistant.git
git branch -M main
git push -u origin main
```

## Deploying

- Backend: Render / Heroku / any Node host. Ensure `MONGO_URI` and API keys are set in the host's environment.
- Frontend: Build with `npm run build` and serve `dist` as a static site (Render Static Site, Netlify, Vercel).

