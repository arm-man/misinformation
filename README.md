## Development

Add `DATABASE_URL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` to the ignored `.env.development.local` file. Use a long, random value for the session secret and a separate password. Run `npm run dev`, then open `http://localhost:3000/admin`.

Set the same three variable names in Vercel's **Production** environment with different values for the Administration secrets. Do not assign production secrets or the production database connection to Preview deployments.

Run `npm run lint`, `npm run typecheck`, and `npm run build` before deployment. The product and API contracts are in `docs/`.
