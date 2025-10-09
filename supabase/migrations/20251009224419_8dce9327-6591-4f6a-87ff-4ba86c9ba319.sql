-- Set default background image URL for new boards
ALTER TABLE public.boards 
ALTER COLUMN background_image_url 
SET DEFAULT 'default';

-- Optionally update existing boards without a background to use the default
-- (Comment out if you don't want to change existing boards)
-- UPDATE public.boards 
-- SET background_image_url = 'default',
--     background_fit_mode = 'cover',
--     background_scale = 100,
--     background_position_x = 50,
--     background_position_y = 50
-- WHERE background_image_url IS NULL AND background_gradient IS NOT NULL;