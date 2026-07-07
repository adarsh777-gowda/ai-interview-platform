# AI-Powered Interview Platform

A full-stack interview practice platform built with **Next.js**, **PostgreSQL**, **Prisma**, **NextAuth**, and **OpenAI**.

## Features

- Email/password + Google OAuth authentication
- Interview session creation (role, level, topics)
- Question bank with behavioral, technical, coding, and system design prompts
- AI-powered answer evaluation with structured rubric scores
- Dashboard with session history and topic-level progress
- Rate limiting and token usage logging on AI endpoints

## Tech stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes + server actions
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js (NextAuth v5)
- **AI**: OpenAI Chat Completions with JSON schema validation (Zod)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - Postgres connection string (Neon, Supabase, or local)
- `AUTH_SECRET` - generate with `openssl rand -base64 32`
- `OPENAI_API_KEY` - your OpenAI API key

Optional:
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - for Google sign-in

### 3. Set up the database

```bash
npm run db:push
npm run db:seed
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo account** (after seeding):
- Email: `demo@interviewai.dev`
- Password: `password123`

## Deployment (Vercel + Neon)

1. Create a Neon Postgres database and copy `DATABASE_URL`
2. Import the repo to Vercel
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL` (your production URL, e.g. `https://your-app.vercel.app`)
   - `OPENAI_API_KEY`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (optional)
4. Deploy - `postinstall` runs `prisma generate` automatically
5. Run migrations against production:

```bash
npx prisma db push
npx prisma db seed
```

## API routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/register` | Create account |
| GET/POST | `/api/sessions` | List/create sessions |
| GET | `/api/sessions/[id]` | Session detail |
| POST | `/api/sessions/[id]/turns` | Submit answer + AI evaluation |
| POST | `/api/ai/evaluate` | Standalone AI evaluation |

## Interview talking points

- **Auth**: JWT sessions with credentials + OAuth, protected routes via middleware
- **AI safety**: Zod validation, prompt versioning, rate limiting, token tracking
- **Data model**: Users -> Sessions -> Turns with JSON feedback storage
- **Scalability**: Stateless API routes, managed Postgres, serverless deployment

## Project structure

```
src/
  app/           # Pages and API routes
  auth.ts        # NextAuth configuration
  components/    # UI and feature components
  lib/
    ai/          # OpenAI client, prompts, schemas
    prisma.ts    # Database client
    rate-limit.ts
prisma/
  schema.prisma  # Database schema
  seed.ts        # Sample data
```
