# Deploying Vibe Check Edge Function

## 1 – Prerequisites
* Supabase CLI installed (`npm i -g supabase`)
* `OPENAI_API_KEY` configured in project (Project → Settings → Functions → Env Vars)

## 2 – Local test
```bash
cd supabase/functions/vibe-check
supabase functions serve vibe-check --no-verify-jwt
# POST test payload with curl or Thunder Client
```

## 3 – Deploy
```bash
supabase functions deploy vibe-check
supabase secrets set OPENAI_API_KEY="sk-..."
```

## 4 – Update client
No extra env vars; uses existing `supabase.functions.invoke(...)`.

## 5 – Roll-back
```bash
supabase functions versions list vibe-check
supabase functions deploy vibe-check --version <id>
```