# Stage 2 — Tamamlanma qeydi

**Hazırdır:** Next.js skeleton (strict TS), Tailwind v4, Supabase client/server/middleware, Auth
(login, register, forgot, reset, callback, logout), qorunan zona + middleware, env validasiyası,
`0001_init.sql` (V1 sxemi + RLS), seed (kateqoriyalar), UI primitivləri (Button, Input, Card), az.json.

**Hələ yoxdur / yoxlanmayıb:** `npm install`/`build` işlədilməyib (mühitdə şəbəkə yox idi); RLS testi əl ilə
skriptdir və işlədilməyib; Azərbaycan tarifi seed-də yoxdur; landing yer tutucudur; next-intl sonra.

**Qərarlar:** ay = 30 gün (default), shadcn/ui + Recharts (Stage 3/5-də), admin paneli yox,
IoT cədvəlləri Stage 10-da.

**Növbəti (Stage 3):** UI/UX — dizayn sistemi, landing, app layout (sidebar/bottom nav), boş vəziyyətlər.

## Stage 2 yoxlaması (review)
- `npm install` mühitdə şəbəkə olmadığı üçün (npm registry 403) işləmədi; build/dev yoxlanmadı. Yalnız statik TS sintaksis yoxlaması aparıldı (sintaksis xətası yoxdur; qalan xətalar quraşdırılmamış paketlərdən gəlir).
- Düzəlişlər: callback open-redirect (backslash), /reset-password qorunur, middleware redirect cookie itkisi, `<Link><Button>` iç-içə element, təhlükəsizlik başlıqları, `0002_security_hardening.sql` (RPC icazələri, profiles.default_tariff_plan_id və ai_conversations.property_id sahiblik yoxlaması).
- Qalan (Stage 4): tariff_tiers pillə üst-üstə düşməsi tətbiq səviyyəsində yoxlanmalıdır.

## Stage 3 üçün continuation prompt
"Enerji Köməkçisi layihəsində Stage 2 tamamlanıb (docs/STAGE-2.md və docs/ARCHITECTURE-STAGE-1 bax).
Stage 3-ü başla: professional UI/UX, Azərbaycan dili, premium energy-tech görünüş, responsive.
Əvvəlcə məqsədi izah et, sonra implement et. Hesablama məntiqini UI-a qoyma."
