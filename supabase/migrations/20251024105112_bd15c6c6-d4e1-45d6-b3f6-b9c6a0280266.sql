-- Drop oude constraint
ALTER TABLE public.widgets DROP CONSTRAINT IF EXISTS widgets_widget_type_check;

-- Voeg nieuwe constraint toe met alle widget types
ALTER TABLE public.widgets ADD CONSTRAINT widgets_widget_type_check 
  CHECK (widget_type IN (
    'chat',           -- Al geïmplementeerd
    'notes',          -- Widget 1
    'timer',          -- Widget 3
    'weather',        -- Widget 5
    'calculator',     -- Widget 9
    'quick-links',    -- Widget 14
    'team-status',    -- Widget 15
    'spotify'         -- Widget 17
  ));