# AI-Powered Interview Platform

A full-stack interview practice platform built with **Next.js**, **PostgreSQL**, **Prisma**, **NextAuth**, and **OpenAI**.

## Features

- **Modern UI/UX**: Beautiful gradient-based design with custom fonts (Inter, Playfair Display, JetBrains Mono)
- **Interactive Elements**: Smooth animations, hover effects, and responsive components
- **Shared Access Authentication**: Simple password-based access for shared user accounts
- **Interview Session Creation**: Configure role, experience level, and topics
- **Question Bank**: Behavioral, technical, coding, and system design prompts
- **AI-Powered Evaluation**: Structured rubric scores with detailed feedback
- **Dashboard Analytics**: Session history, topic-level progress with visual progress bars
- **Rate Limiting**: Token usage logging and rate limiting on AI endpoints

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Typography**: Google Fonts (Inter, Playfair Display, JetBrains Mono)
- **Icons**: Lucide React
- **Backend**: Next.js API routes + server actions
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js (NextAuth v5) with JWT sessions
- **AI**: OpenAI Chat Completions with JSON schema validation (Zod)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - Postgres connection string (Neon, Supabase, or local)
- `AUTH_SECRET` - generate with `openssl rand -base64 32`
- `ACCESS_PASSWORD` - Shared password for platform access
- `OPENAI_API_KEY` - your OpenAI API key

Optional:
- `OPENAI_BASE_URL` - Base URL for an OpenAI-compatible provider (free options: Groq, Gemini, OpenRouter)
- `SHARED_USER_EMAIL` - Custom email for shared user (defaults to `shared@interviewai.local`)
- `OPENAI_MODEL` - AI model to use (defaults to `gpt-4o-mini`; e.g. `llama-3.3-70b-versatile` on Groq)
- `AI_RATE_LIMIT_MAX` - Max AI requests per window (default: 10)
- `AI_RATE_LIMIT_WINDOW_MS` - Rate limit window in ms (default: 60000)

### 3. Set Up the Database

```bash
npm run db:push
npm run db:seed
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Access**: Use the `ACCESS_PASSWORD` configured in your `.env` file to sign in.

## Deployment (Vercel + Neon)

1. Create a Neon Postgres database and copy `DATABASE_URL`
2. Import the repo to Vercel
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL` (your production URL, e.g. `https://your-app.vercel.app`)
   - `ACCESS_PASSWORD`
   - `OPENAI_API_KEY`
   - `SHARED_USER_EMAIL` (optional)
   - `OPENAI_MODEL` (optional)
   - `AI_RATE_LIMIT_MAX` (optional)
   - `AI_RATE_LIMIT_WINDOW_MS` (optional)
4. Deploy - `postinstall` runs `prisma generate` automatically
5. Run migrations against production:

```bash
npx prisma db push
npx prisma db seed
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/sessions` | Create interview session |
| GET | `/api/sessions` | List user sessions |
| GET | `/api/sessions/[id]` | Get session details |
| POST | `/api/sessions/[id]/turns` | Submit answer + AI evaluation |
| POST | `/api/ai/evaluate` | Standalone AI evaluation |

## UI/UX Features

- **Typography System**: 
  - Inter for body text
  - Playfair Display for headings
  - JetBrains Mono for code and data
- **Color Scheme**: Blue-purple-pink gradient theme
- **Animations**: Fade-in, slide-up, and hover effects
- **Components**: Enhanced cards with icons, progress bars, and interactive elements
- **Responsive Design**: Mobile-friendly layout with Tailwind CSS

## Interview Talking Points

- **Auth**: JWT sessions with shared password access, protected routes via middleware
- **AI Safety**: Zod validation, prompt versioning, rate limiting, token tracking
- **Data Model**: Users -> Sessions -> Turns with JSON feedback storage
- **Scalability**: Stateless API routes, managed Postgres, serverless deployment
- **UI/UX**: Modern design system with reusable components and animations

## Project Structure

```
src/
  app/           # Pages and API routes
    dashboard/    # Dashboard with analytics
    sign-in/      # Authentication page
    sessions/     # Session management
    globals.css   # Global styles and utilities
  auth.ts        # NextAuth configuration
  components/
    layout/       # Layout components (header)
    ui/           # shadcn/ui components
    sessions/     # Session-specific components
  lib/
    ai/          # OpenAI client, prompts, schemas
    prisma.ts    # Database client
    rate-limit.ts # Rate limiting utilities
    utils.ts     # Utility functions
prisma/
  schema.prisma  # Database schema
  seed.ts        # Sample data
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm test` - Run tests
