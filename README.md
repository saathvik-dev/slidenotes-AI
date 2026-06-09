# slidenotes-AI

A React + Express app to convert PowerPoint slides into notes, generate slides from notes, and create quizzes from your content.

## Run locally

1. Install dependencies:
   - `npm install`
   - `cd backend && npm install`
2. Start the backend:
   - `cd backend && npm start`
3. Run the frontend:
   - `npm run dev`

## Production deployment

This repo is configured so the backend can serve the frontend build from `dist/`.

1. Install dependencies:
   - `npm install`
2. Start the app:
   - `npm start`

The backend listens on `process.env.PORT` or `3001`.

## Environment variables

Copy `.env.example` to `.env` and set `OPENAI_API_KEY` in your deployment environment.

## Notes

- The frontend uses relative `/api` calls, so the backend and frontend can run from the same hosted domain.
- `backend/server.js` serves the built `dist/` frontend in production.
