-- MetaLink — seed do catálogo de medicamentos (Seção 6 do CLAUDE.md).
-- Meias-vidas aproximadas dos princípios ativos (uso EDUCATIVO na curva PK):
--   semaglutida ~168h (7 dias), tirzepatida ~120h (5 dias), liraglutida ~13h.
-- Titulação típica de bula, em jsonb: [{"dose_mg": X, "weeks": Y}, ...]

insert into public.medications (brand_name, active_ingredient, route, half_life_hours, typical_titration)
values
  ('Ozempic', 'semaglutida', 'weekly_injectable', 168,
   '[{"dose_mg":0.25,"weeks":4},{"dose_mg":0.5,"weeks":4},{"dose_mg":1.0,"weeks":4},{"dose_mg":2.0,"weeks":null}]'),
  ('Wegovy', 'semaglutida', 'weekly_injectable', 168,
   '[{"dose_mg":0.25,"weeks":4},{"dose_mg":0.5,"weeks":4},{"dose_mg":1.0,"weeks":4},{"dose_mg":1.7,"weeks":4},{"dose_mg":2.4,"weeks":null}]'),
  ('Rybelsus', 'semaglutida', 'oral', 168,
   '[{"dose_mg":3,"weeks":4},{"dose_mg":7,"weeks":4},{"dose_mg":14,"weeks":null}]'),
  ('Mounjaro', 'tirzepatida', 'weekly_injectable', 120,
   '[{"dose_mg":2.5,"weeks":4},{"dose_mg":5,"weeks":4},{"dose_mg":7.5,"weeks":4},{"dose_mg":10,"weeks":4},{"dose_mg":12.5,"weeks":4},{"dose_mg":15,"weeks":null}]'),
  ('Zepbound', 'tirzepatida', 'weekly_injectable', 120,
   '[{"dose_mg":2.5,"weeks":4},{"dose_mg":5,"weeks":4},{"dose_mg":7.5,"weeks":4},{"dose_mg":10,"weeks":4},{"dose_mg":12.5,"weeks":4},{"dose_mg":15,"weeks":null}]'),
  ('Saxenda', 'liraglutida', 'daily_injectable', 13,
   '[{"dose_mg":0.6,"weeks":1},{"dose_mg":1.2,"weeks":1},{"dose_mg":1.8,"weeks":1},{"dose_mg":2.4,"weeks":1},{"dose_mg":3.0,"weeks":null}]'),
  ('Victoza', 'liraglutida', 'daily_injectable', 13,
   '[{"dose_mg":0.6,"weeks":1},{"dose_mg":1.2,"weeks":1},{"dose_mg":1.8,"weeks":null}]')
on conflict (brand_name) do nothing;
