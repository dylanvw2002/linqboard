

## Probleem

Het bevestigingsdialoog voor het verwijderen van leden verschijnt **achter** het ledendialoog. Dit komt doordat:
- Het ledendialoog (`Dialog`) een z-index van `z-[9999]` heeft
- Het bevestigingsdialoog (`AlertDialog`) een overlay met `z-50` en content met `z-[200]` heeft — beide lager dan `z-[9999]`

## Oplossing

Verhoog de z-index van de `AlertDialogContent` naar `z-[10000]` zodat het boven het ledendialoog verschijnt. Daarnaast moet de `AlertDialogOverlay` ook een hogere z-index krijgen — dit kan door een extra className mee te geven.

### Wijziging in `src/pages/Dashboard.tsx`

- Wrap de AlertDialog content met een eigen `AlertDialogOverlay` die `z-[10000]` heeft, of gebruik een inline style
- Zet `AlertDialogContent` op `z-[10001]`

Concreet: verander regel 933 van:
```tsx
<AlertDialogContent className="z-[200]">
```
naar:
```tsx
<AlertDialogContent className="z-[10001]">
```

En voeg een custom overlay toe met `z-[10000]` in het AlertDialog blok.

