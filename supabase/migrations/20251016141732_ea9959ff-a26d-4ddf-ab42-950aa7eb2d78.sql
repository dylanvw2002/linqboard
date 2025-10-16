-- Add foreign key constraint from widgets to boards
ALTER TABLE public.widgets
ADD CONSTRAINT widgets_board_id_fkey 
FOREIGN KEY (board_id) 
REFERENCES public.boards(id) 
ON DELETE CASCADE;