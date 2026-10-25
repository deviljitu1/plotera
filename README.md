# Plotera

Next.js application with a public landing page, separate /admin workspace, interactive 2D/3D brochures and Supabase database, authentication and private storage. Plotview is a separate repository and database.

## Local development

Node.js 22.13 or later. Run npm ci, configure .env.local from .env.example, then npm run dev (port 5173). Run npm run build for production. Never commit private environment files.

## Vercel

Import deviljitu1/plotera, branch main, root ./, framework Next.js. Build command: npm run build. Leave output directory at the framework default. Functions use Mumbai (bom1).

Set server-only environment variables SUPABASE_URL, SUPABASE_SECRET_KEY and PLOTERA_ADMIN_EMAILS (comma-separated email allowlist). Set SITE_URL to the final HTTPS production origin. Never prefix the secret key with NEXT_PUBLIC_. Preview deployments are noindex.

Apply supabase/migrations/202610250001_plotera.sql to the dedicated Plotera Supabase project. Create the intended admin in Supabase Authentication > Users; their confirmed email must match the allowlist. Sign in at /login using that app account, not the database password. No account is granted admin access when the allowlist is empty.

Old development drafts retain their original owner and are not automatically reassigned. No Plotview customer records are accessed or migrated.

Uploads use signed direct-to-Supabase URLs (25 MB maximum), avoiding Vercel request-body limits. Private downloads require project ownership or an asset referenced by a published brochure, then redirect to a short-lived signed URL.

## MCP

POST /mcp exposes project tools using a verified, allowlisted Supabase user access token in Authorization: Bearer. Tokens expire; configure a client that refreshes its Supabase session. This endpoint does not implement an OAuth discovery/authorization server. Never use the Supabase service secret as an MCP bearer token.

## Landing page

Reference: design/reference.html. Regenerate with node scripts/prepare-home.mjs. Illustrative project artwork is labelled as concept imagery.
