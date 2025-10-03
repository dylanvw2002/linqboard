-- Maak de task-attachments bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'task-attachments';