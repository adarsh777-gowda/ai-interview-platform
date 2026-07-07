# Deployment

This project is configured for **Vercel** + **managed Postgres** (Neon or Supabase).

## Quick deploy steps

1. Push `ai-interview-platform` to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Set root directory to `ai-interview-platform` if the repo contains other folders
4. Add environment variables (see `.env.example`)
5. Deploy
6. Run database setup against production:

```bash
cd ai-interview-platform
npx prisma db push
npx prisma db seed
```

## Environment variables (production)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | Session encryption secret |
| `AUTH_URL` | Yes | Production URL (e.g. `https://your-app.vercel.app`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for evaluations |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth client secret |
| `AI_RATE_LIMIT_MAX` | No | Max AI requests per window (default: 10) |
| `AI_RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: 60000) |

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs tests, lint, and build on push.

## Smoke test checklist

- [ ] Home page loads
- [ ] Sign in with demo account works
- [ ] Dashboard shows (empty or with sessions)
- [ ] New session form creates a session
- [ ] Answer submission returns AI feedback
- [ ] Dashboard shows updated scores
