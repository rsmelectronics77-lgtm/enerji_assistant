# Enerji Köməkçisi

AI əsaslı enerji monitorinq və qənaət platforması (RSM Electronics). Stage 2: skeleton + DB + Auth.

## Qurulum
1. `npm install`
2. `cp .env.example .env.local` və Supabase dəyərlərini doldur
3. Supabase-də: SQL Editor-da ardıcıl işlət: `0001_init.sql` → `0002_security_hardening.sql` → `supabase/seed.sql`
   (və ya Supabase CLI ilə `supabase db push`)
4. Auth → URL Configuration: Site URL = `http://localhost:3000`, Redirect URL = `http://localhost:3000/auth/callback`
5. `npm run dev`

## Təhlükəsizlik
- `SUPABASE_SERVICE_ROLE_KEY` və `GEMINI_API_KEY` yalnız serverdə; heç vaxt `NEXT_PUBLIC_` ilə vermə.
- Bütün istifadəçi cədvəllərində RLS aktivdir. `supabase/tests/rls_check.sql` ilə yoxla.
