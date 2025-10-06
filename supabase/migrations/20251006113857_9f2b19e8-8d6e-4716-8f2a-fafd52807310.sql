-- Maak de priority kolom nullable en verwijder de default waarde
ALTER TABLE public.tasks 
ALTER COLUMN priority DROP DEFAULT,
ALTER COLUMN priority DROP NOT NULL;