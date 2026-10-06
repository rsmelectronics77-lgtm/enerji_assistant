-- Stage 2 təhlükəsizlik yoxlamasından sonra düzəlişlər. 0001-dən SONRA işlət. İdempotentdir.

-- 1) security definer funksiyalar RPC kimi anon/public tərəfindən çağırıla bilməsin
revoke execute on function public.owns_property(uuid)          from public, anon;
revoke execute on function public.owns_conversation(uuid)      from public, anon;
revoke execute on function public.owns_tariff_plan(uuid)       from public, anon;
revoke execute on function public.can_read_tariff_plan(uuid)   from public, anon;
grant  execute on function public.owns_property(uuid)          to authenticated;
grant  execute on function public.owns_conversation(uuid)      to authenticated;
grant  execute on function public.owns_tariff_plan(uuid)       to authenticated;
grant  execute on function public.can_read_tariff_plan(uuid)   to authenticated;

-- trigger funksiyaları birbaşa çağırılmasın (trigger kimi işləməyə təsir etmir)
revoke execute on function public.handle_new_user()            from public, anon, authenticated;
revoke execute on function public.check_device_room_property() from public, anon, authenticated;
revoke execute on function public.set_updated_at()             from public, anon, authenticated;

-- 2) profiles: istifadəçi başqasının şəxsi tarifini default kimi seçə bilməsin
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (default_tariff_plan_id is null or public.can_read_tariff_plan(default_tariff_plan_id))
  );

-- 3) ai_conversations: property_id yalnız istifadəçinin öz obyekti ola bilər
drop policy if exists ai_conversations_all on public.ai_conversations;
create policy ai_conversations_all on public.ai_conversations for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (property_id is null or public.owns_property(property_id))
  );

-- 4) gələcəkdə yaranan cədvəllərə anon çıxışı verilməsin
alter default privileges in schema public revoke all on tables from anon;
