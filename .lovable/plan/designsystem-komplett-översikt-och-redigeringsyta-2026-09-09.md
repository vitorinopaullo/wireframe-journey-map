# Designsystem — komplett översikt och redigeringsyta

## Svar på dina frågor först

**Ändras hela sidan om vi ändrar i designsystemet?**
Ja, för allt som är byggt på tokens. Färger, typsnitt, textstorlekar, radier och skuggor bor på ett enda ställe (`src/styles.css`). Ändrar vi lila-800 där, byter alla knappar, länkar och märken färg i hela prototypen samtidigt.

Undantag som inte följer med automatiskt: ställen där någon skrivit ett värde direkt i en enskild vy istället för att använda token. De finns idag, framför allt kring siffror — se nästa punkt.

**Vilket typsnitt och storlek använder siffrorna?**
Idag är det inte konsekvent. Samma sorts siffra visas på tre olika sätt beroende på sida:
- monospace-typsnitt (systemets SF Mono) — prislappar på annonskort och annonssida
- Instrument Serif — det stora priset i annonsens prisruta
- Inter (brödtextens typsnitt) — belopp i säljarens och adminens vyer

Alla har dock `tabular-nums`, alltså lika breda siffror. Vi behöver bestämma en regel, och den blir en del av det här arbetet.

**Saknas det grejer?**
Ja. Nuvarande sida visar typografi, färg, spacing, radie, skugga och knappar. Den saknar alla formkontroller — växlingsknapp (toggle), kryssruta, radioknapp, väljare, sökfält, textfält i sina olika lägen — samt märken/status, tabeller, flikar, modaler, tomma lägen, meddelanden och ikoner.

## Vad vi bygger

Vi gör om `/designsystem` till en fullständig, indelad översikt med egen vänstermeny, så att du kan gå igenom den sektion för sektion och lämna feedback på varje del.

### Sektioner

1. **Grunder** — kort förklaring av vad som är styrt centralt och därmed ändras överallt.
2. **Typografi** — hela skalan 12–60 px, rubriknivåer h1–h6, brödtext, hjälptext, etiketter, länkar.
3. **Siffror** — egen sektion: pris, värdering, yta, lagervärde, datum, procent, telefonnummer och organisationsnummer, med den regel vi bestämmer.
4. **Färg** — hela lila- och rosaskalan, plus rollerna (vad varje färg får användas till) och status: godkänd, väntar, varning, avslag.
5. **Spacing och layout** — skalan, sidbredd, avstånd mellan sektioner, rutnät.
6. **Radie, skugga och rörelse** — de tre radierna, tre skuggorna, hover- och tryckbeteende.
7. **Knappar** — primär, sekundär, textlänk, fara; storlekar; lägena normal, hover, tryckt, inaktiv, laddar.
8. **Formulär** — textfält, textruta, väljare, kryssruta, radioknapp, **växlingsknapp (toggle)**, filuppladdning, sökfält; lägena tom, ifylld, fokus, fel, inaktiv, samt etikett, hjälptext och felmeddelande.
9. **Märken och status** — statusprickar och etiketter för annonsflödets alla lägen.
10. **Data** — tabell med högerställda sifferkolumner, nyckeltalsruta, annonskort.
11. **Navigation** — meny, flikar, brödsmulor, paginering, stegindikator.
12. **Meddelanden** — informationsruta, varning, fel, bekräftelse, tomt läge, laddningsläge.
13. **Ikoner** — det urval av Lucide-ikoner vi faktiskt använder, i en storlek och en linjetjocklek.

Varje sektion visar det äkta utseendet plus en kort regel i klartext om när det ska användas — inga tekniska värden som du inte behöver.

### Så ger du feedback

Sidan blir en levande spegel av prototypen. Du säger till exempel "gör knapparnas hörn rundare" eller "siffrorna ska vara Inter, inte monospace", och vi ändrar på ett ställe — då slår det igenom både på designsystemsidan och i hela prototypen.

## Beslut jag behöver från dig

1. **Siffertypsnitt.** Mitt förslag: Inter med tabular-nums för alla siffror i tabeller, formulär och kort; Instrument Serif enbart för det stora priset på annonssidan. Monospace tas bort helt för siffror och sparas till tekniska koder som K-123 och A-2041.
2. **Status­färger.** Idag finns grönt, gult och rött som generiska värden. Förslag: tona dem varmt så de matchar den lila paletten istället för att se ut som standardvarningar.
3. **Åtkomst.** Ska `/designsystem` ligga kvar synlig i sidfoten för kunden, eller bara nås via direktlänk internt?

## Tekniska noteringar

- Tokens ligger i `src/styles.css` under Tailwind v4 `@theme`. Inga nya token-namn behövs för det här arbetet utom eventuellt statusfärgerna och en `--font-numeric`-roll om vi låser siffertypsnittet.
- `/designsystem` byggs om till egen route med undersektioner och innehållsmeny; primitiverna hämtas från `src/components/wire.tsx` och `src/components/ui/*` så sidan visar samma komponenter som appen kör.
- Efter beslut 1 följer en uppstädning: ersätt `font-mono` på belopp i `ListingCard.tsx`, `annons.$id.index.tsx`, `kopare.profil.tsx`, `kopare.jamfor.tsx` och admin-vyerna med den valda sifferregeln, så att framtida ändringar verkligen slår igenom överallt.
- Innehåll och svensk copy i övriga flöden rörs inte.
