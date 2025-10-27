-- Eerst de oude constraint verwijderen
ALTER TABLE public.widgets DROP CONSTRAINT IF EXISTS widgets_widget_type_check;

-- Dan bestaande widgets updaten naar nieuwe types
UPDATE public.widgets SET widget_type = 'achievements' WHERE widget_type = 'team-status';
UPDATE public.widgets SET widget_type = 'notifications' WHERE widget_type = 'spotify';

-- Nu de nieuwe constraint toevoegen
ALTER TABLE public.widgets ADD CONSTRAINT widgets_widget_type_check 
  CHECK (widget_type IN (
    'chat',              -- AI Chat Widget
    'notes',             -- 1. Notities Widget
    'timer',             -- Timer Widget (blijft)
    'calculator',        -- 3. Calculator Widget
    'calendar',          -- 5. Kalender Widget (nieuw)
    'quick-links',       -- 15. Quick Links Widget
    'notifications',     -- 9. Notificaties Center (nieuw)
    'achievements',      -- 14. Achievement Badges (nieuw)
    'weather'            -- 17. Weer Widget
  ));