-- 0004: authenticated rolu üçün açıq cədvəl icazələri (GRANT).
-- Əvvəlki fayllar bu icazələri Supabase-in "Automatically expose new tables" xanasına
-- güvənirdi. İndi icazələr SQL-də açıq yazılıb. Hər sətri yenə də RLS qaydaları qoruyur.
-- İdempotentdir: təkrar işlətmək zərərsizdir.

grant usage on schema public to authenticated, service_role;

grant select, update                 on public.profiles          to authenticated;
grant select, insert, update, delete on public.properties        to authenticated;
grant select, insert, update, delete on public.rooms             to authenticated;
grant select, insert, update, delete on public.devices           to authenticated;
grant select                         on public.device_categories to authenticated;
grant select, insert, update, delete on public.tariff_plans      to authenticated;
grant select, insert, update, delete on public.tariff_tiers      to authenticated;
grant select, insert, update, delete on public.ai_conversations  to authenticated;
grant select, insert, delete         on public.ai_messages       to authenticated;

-- Gələcək server tərəfi (IoT API və s.) üçün. service_role RLS-i keçir, amma icazə lazımdır.
grant all on all tables in schema public to service_role;

-- Supabase-in standart qalıq icazələrini götür. Xüsusilə TRUNCATE RLS-i keçir,
-- ona görə giriş etmiş istifadəçidə olmamalıdır. Saytın bunlara ehtiyacı yoxdur.
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Yoxlama: authenticated üçün 9 sətir görünməlidir (yalnız SELECT/INSERT/UPDATE/DELETE).
select table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as authenticated_privileges
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'authenticated'
group by table_name
order by table_name;
