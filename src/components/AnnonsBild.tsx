// Liten bild-platshållare för grupperade objektkort i admin (Sparade,
// Intressenter, Affärer/Uppdrag) — samma "[ Bild · Kategori ]"-konvention
// som ListingCard.tsx använder på startsidan, bara i en kompakt storlek som
// passar en listrad istället för ett helt kort.
export function AnnonsBildPlaceholder({ kategori }: { kategori: string }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-dashed border-foreground/20 bg-muted/30 text-center font-mono text-[8px] leading-tight text-muted-foreground">
      Bild · {kategori}
    </div>
  );
}
