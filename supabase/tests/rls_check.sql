-- Əl ilə RLS yoxlaması (SQL Editor-da işlət). HƏLƏ İŞLƏDİLMƏYİB.
-- Əvvəlcə Auth-da iki test istifadəçisi yarat və aşağıda UUID-ləri əvəz et.
begin;
set local role authenticated;

-- A istifadəçisi kimi obyekt yarat
select set_config('request.jwt.claims', '{"sub":"<USER_A_UUID>","role":"authenticated"}', true);
insert into public.properties (name, type) values ('A evi', 'home');

-- B istifadəçisi A-nın obyektini görməməlidir (nəticə: 0 sətir)
select set_config('request.jwt.claims', '{"sub":"<USER_B_UUID>","role":"authenticated"}', true);
select count(*) as b_sees_a_properties from public.properties;  -- gözlənilən: 0

rollback;
