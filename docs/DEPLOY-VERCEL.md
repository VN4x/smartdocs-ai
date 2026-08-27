# Vercel deployment

This app uses TanStack Start with Nitro's **Vercel** preset (`vite.config.ts` → `nitro: { preset: "vercel" }`).

## Build

```bash
npm install
npm run build
```

Output is written to `.vercel/output/` (Nitro prebuilt format).

## Environment variables

Set these in the Vercel project (Settings → Environment Variables):

| Variable | Scope | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | Production, Preview | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | Production, Preview | Same as `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_PROJECT_ID` | Production, Preview | Optional; used for reference |
| `VITE_SUPABASE_URL` | Production, Preview | Client-side Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview | Client-side anon key |
| `VITE_SUPABASE_PROJECT_ID` | Production, Preview | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Server only** — required for magic-link login |

Never prefix the service role key with `VITE_`.

## Deploy

### Git integration (recommended)

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. Framework preset: **Other** (or TanStack Start if offered).
3. Build command: `npm run build`
4. Output directory: leave default — Nitro emits `.vercel/output` automatically.
5. Add environment variables above.
6. Deploy.

### CLI (prebuilt)

```bash
npm run build
npx vercel deploy --prebuilt --prod
```

## Supabase auth redirect URLs

After the first deploy, add your Vercel URL to Supabase:

**Authentication → URL configuration → Redirect URLs**

- `https://<your-project>.vercel.app/`
- `https://<your-custom-domain>/` (if used)

Site URL can be set to the production Vercel domain.

## Lovable vs Vercel

- **Lovable Cloud** builds with the Cloudflare preset inside the sandbox.
- **Vercel** uses `nitro: { preset: "vercel" }` in `vite.config.ts` (outside Lovable, or in your CI).
- Both can share the same Supabase project; use separate redirect URLs if both are active.
