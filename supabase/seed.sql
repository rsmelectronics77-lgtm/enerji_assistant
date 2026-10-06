-- Cihaz kateqoriyaları (default_power_w ataq üçün boş saxlanılır: real dəyərlər sonra təsdiq ediləcək)
insert into public.device_categories (key, name_az) values
  ('air_conditioner', 'Kondisioner'),
  ('refrigerator', 'Soyuducu'),
  ('tv', 'Televizor'),
  ('lighting', 'İşıqlandırma'),
  ('washing_machine', 'Paltaryuyan maşın'),
  ('water_heater', 'Su qızdırıcısı'),
  ('electric_heater', 'Elektrik qızdırıcı'),
  ('computer', 'Kompüter'),
  ('oven', 'Elektrik soba / ocaq'),
  ('kettle', 'Çaydan'),
  ('other', 'Digər')
on conflict (key) do nothing;

-- Sistem tarifi BURADA YOXDUR: Azərbaycan tarifi rəsmi mənbədən təsdiqləndikdən sonra əlavə olunacaq.
