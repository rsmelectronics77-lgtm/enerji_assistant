-- 0003: sabit aylıq tarif sütunu + Azərbaycan əhali tarifi (sistem tarifi).
-- 0001 və 0002-dən SONRA işlət. İdempotentdir (təkrar işlətsən ikinci tarif yaranmır).
-- Mənbə: Tarif (Qiymət) Şurasının 29.12.2024 tarixli 19 nömrəli qərarı və sabit tarif dəyişikliyi
-- (01.01.2026-dan). Rəsmi cədvəl: regulator.gov.az. Qiymətlər ƏDV daxildir, AZN/kWh.

-- 1) Sabit aylıq tarif (istehlakdan asılı olmayan aylıq ödəniş)
alter table public.tariff_plans
  add column if not exists fixed_monthly_charge numeric(12,2) not null default 0
  check (fixed_monthly_charge >= 0);

-- 2) Azərbaycan əhali tarifi (yalnız bir dəfə yaradılır)
do $$
declare
  v_plan_id uuid;
begin
  select id into v_plan_id
  from public.tariff_plans
  where is_system and country = 'AZ' and name = 'Azərbaycan — əhali (ƏDV daxil)'
  limit 1;

  if v_plan_id is null then
    insert into public.tariff_plans
      (owner_id, country, currency, name, valid_from, is_system, fixed_monthly_charge)
    values
      (null, 'AZ', 'AZN', 'Azərbaycan — əhali (ƏDV daxil)', date '2026-01-01', true, 1.00)
    returning id into v_plan_id;

    insert into public.tariff_tiers (plan_id, from_kwh, to_kwh, price_per_kwh) values
      (v_plan_id,   0, 200, 0.0840),
      (v_plan_id, 200, 300, 0.1000),
      (v_plan_id, 300, null, 0.1500);
  end if;
end $$;
