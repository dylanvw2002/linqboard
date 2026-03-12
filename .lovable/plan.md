

## Plan: Taakbeschrijving onbeperkt maken

De taakbeschrijving is momenteel beperkt tot 1000 tekens op drie plekken in `src/pages/Board.tsx`. De database kolom `tasks.description` is van type `text` (geen limiet). We hoeven dus alleen de frontend-limieten te verwijderen.

### Wijzigingen in `src/pages/Board.tsx`

1. **Zod schema** (regel 519): Verwijder `.max(1000, ...)` van de description validatie
2. **Nieuwe taak textarea** (regels 3278, 3756): Verwijder `maxLength={1000}` attributen
3. **Bewerk taak textarea** (regel 4151): Verwijder `maxLength={1000}` attribuut

Alle vier plekken in hetzelfde bestand. Geen database-wijzigingen nodig — de `text` kolom heeft al geen limiet.

