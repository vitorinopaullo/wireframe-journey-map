# TreLink Wireframe — Full-App Code Review v1

Read-only review of all three flows (säljare, köpare, admin). No code was changed as part of
this pass — findings only. Severity legend: 🔴 Bug (breaks something) · 🟡 Missing empty state ·
🔵 UX/UI improvement.

---

## Top 10 (cross-flow, priority order)

1. 🔴 **Buyer session isolation leak** — `src/lib/kopare-workflow.ts:38` (`readBuyerInterests`) and `src/lib/favoriter.ts` never filter by `userId`, even though `BuyerInterest.userId` exists for exactly this purpose. Any second buyer account logged into the same browser sees the first buyer's deals, K-codes, and saved favorites. *(köpare)*
2. 🔴 **Seller session isolation leak, four places** — `src/routes/saljare.mina-annonser.tsx:32`, `src/routes/saljare.annons.$id.tsx:101`, `src/routes/saljare.skapa-annons.tsx:674` (edit mode), and `src/routes/saljare.affarer.$id.tsx:41` all read/mutate an ärende by id alone, with no check that `agarUserId` matches the logged-in seller. A seller who knows or guesses another seller's annons id can view, and in some states edit or sign, it. *(säljare)*
3. 🔴 **`saljare.intressenter.tsx:29` shows every seller's leads, not just the logged-in seller's** — the page is titled "Intresse på mina annonser" but calls `readBuyerInterests()` unfiltered; contrast with `saljare.affarer.index.tsx:100`, which filters correctly by `agarUserId`. This is the single most visible instance of finding #2's pattern. *(säljare)*
4. 🔴 **Unconditional "Dev · hoppa till steg" selector on the live ärende page** — `src/routes/saljare.annons.$id.tsx:328` renders a raw `<select>` that calls `jumpTo()` for every visitor, with no environment or role gate. Any seller can self-approve their own listing, "sign" the uppdragsavtal, and publish — fully bypassing TreLink's review pipeline from the UI. *(säljare)*
5. 🔴 **Buyer can bypass the required company-info step through one of two "Köp" entry points** — `src/routes/annons.$id.index.tsx:238` blocks purchase and redirects to profile completion when `bolag` is missing; `src/routes/annons.$id.underlag.tsx:174`'s sticky "Köp →" button calls `besluta("vill-ga-vidare")` directly with no such check, leaving `kopareBolag` `undefined` later in `src/routes/kopare.affarer.$id.tsx:99,264,289` (broken/blank signing documents). *(köpare)*
6. 🔴 **`annonsInfo()` reads a field that doesn't exist under that name** — `src/lib/affar-workflow.tsx:330` reads `annons?.kat`, but the annons record stores the category as `cat` (set at `src/routes/saljare.skapa-annons.tsx:1375`). The Kat/category column is always `"—"` everywhere `Affar` objects are shown (`admin.affarer.index.tsx`, `kopare.affarer.index.tsx`, `saljare.affarer.index.tsx`). *(shared lib, surfaces in all three flows)*
7. 🔴 **Skapa-annons wizard step indicator bypasses all validation** — `src/routes/saljare.skapa-annons.tsx:928` lets a seller click any step number directly (`onClick={() => setStep(i)}`), skipping the `disabled` gating that normally blocks "Nästa" until required fields are filled. Combined with finding #9 below, a seller can reach and submit step 3 with an incomplete underlag. *(säljare)*
8. 🔴 **Multiple dead buttons in buyer profile with no `onClick`** — `src/routes/kopare.profil.tsx:132` ("Spara ändringar") plus several controls in the Ekonomi/Säkerhet/Fakturor tabs (upload lånelöfte, ta bort, PDF, visa sessioner, exportera data, begär radering) render as clickable buttons that do nothing, with no disabled/coming-soon signal. *(köpare)*
9. 🔴 **Admin price field is never re-populated after sending an ärende back to granskning** — `src/routes/admin.annonser.$id.tsx:619` (`prisInput`) has no effect syncing it from `item.pris` on mount, unlike the sibling `utkastRubrik`/`utkastBeskrivning`/`utkastPris`. After `backaTillGranskning` (line 954), the price field is blank; re-approving risks silently overwriting the previously agreed price. A related gap: no input for `utkastPris` is ever rendered in the "Skriv annonstext" step at all (lines 1467-1520), so price can't be corrected there either. *(admin)*
10. 🔴 **`affar.$id.tsx` is dead code with its own diverged mock pipeline** — orphaned behind a hardcoded `DEAL_STATES: WorkflowState[] = []` in `src/routes/dashboard.tsx:22`, so the link that would reach it is never rendered, yet the route still ships a second, independent `SignModal` and hardcoded `PRIS`/`baseTimeline` that have drifted from the real `affar-workflow.tsx` pipeline now used by `kopare.affarer.$id.tsx`/`saljare.affarer.$id.tsx`. Risk of confusion or accidental re-linking to stale logic. *(köpare)*

---

## Säljare-flödet

### 🔴 Buggar

- 🔴 **src/routes/saljare.intressenter.tsx:29-37** — `readBuyerInterests()` returnerar samtliga intresseanmälningar i hela databasen utan filtrering på `agarUserId`/inloggad säljare; sidan heter "Intresse på mina annonser" men visar alla säljares leads. Jämför `saljare.affarer.index.tsx:100-104` som filtrerar korrekt.
- 🔴 **src/routes/saljare.mina-annonser.tsx:32-39** — Listan läses direkt från `localStorage.getItem("saljare-annonser")` utan filter på `agarUserId` — en inloggad säljare ser alla sparade annonser i webbläsaren, inte bara sina egna.
- 🔴 **src/routes/saljare.annons.$id.tsx:101-103** — `getAnnons(id)` renderar ärendet enbart utifrån URL-id, utan att verifiera `item.agarUserId === getSession()?.userId`. En annan inloggad säljare kan navigera till `/saljare/annons/<annat-id>` och se, i vissa statusar även agera på (t.ex. signera uppdragsavtal), en annan säljares ärende.
- 🔴 **src/routes/saljare.skapa-annons.tsx:674-697** — Redigeringsflödet (`?edit=<id>`) kontrollerar bara `canSellerEdit(wfState)`, aldrig ägarskap. Kombinerat med förutsägbara id:n (`"n" + Date.now()`, rad 1395) kan en säljare öppna och redigera en annan säljares utkast i status `komplettering`/`avvisad`.
- 🔴 **src/routes/saljare.affarer.$id.tsx:41,54-61** — `getBuyerInterest(id)` hämtas utan kontroll att `getAnnons(interest.annonsId)?.agarUserId` matchar inloggad säljare; till skillnad från listvyn är detaljvyn öppen för alla som känner till/gissar id:t.
- 🔴 **src/routes/saljare.skapa-annons.tsx:928-930** — Stegvisaren tillåter fritt hopp till valfritt steg (`onClick={() => setStep(i)}`) helt utan validering, vilket kringgår `disabled`-gatingen på "Nästa" (rad 1358).
- 🔴 **src/routes/saljare.skapa-annons.tsx:1328-1336 (jfr rad 909-910)** — När `canSubmit` är `false` visas ingen förklaring till varför — de faktiska felmeddelandena i `validation` (rad 847-890) beräknas men renderas aldrig; säljaren ser bara en gråad knapp.
- 🔴 **src/routes/saljare.skapa-annons.tsx:1964-2027 (TagToggleGroup)** — `"Finns inte"` kan väljas samtidigt som konkreta taggar för samma fältgrupp; inget gör dem ömsesidigt uteslutande, vilket ger motsägelsefull data som ändå klarar valideringen.
- 🔴 **src/routes/saljare.annons.$id.tsx:328-344** — "Dev · hoppa till steg"-väljaren renderas ovillkorligt för alla besökare; en vanlig säljare kan flytta sitt eget ärende genom hela granskningsprocessen (godkänna, signera, publicera) utan TreLinks inblandning.
- 🔴 **src/components/AnnonsPreviewOverlay.tsx** — *(känt sedan tidigare, inte nyupptäckt)* Death code — komponenten importeras ingenstans i kodbasen (bekräftat via grep). Kandidat för borttagning.

### 🟡 Saknade empty states

- 🟡 **src/routes/saljare.mina-annonser.tsx:55-125** — Om `items` är tom renderas bara en tom `<div className="space-y-3">` utan meddelande, till skillnad från affärs-/intressentvyerna. En ny säljare utan annonser möts av tomt utrymme.
- 🟡 **src/routes/saljare.affarer.$id.tsx:174-185** — Ärendehistoriken har ingen explicit noll-state; en tom `interest.timeline` renderar en tom `<ul>` utan meddelande (mindre kritiskt, en affär har normalt alltid minst en post).

*(`saljare.intressenter.tsx:47-48` och `saljare.affarer.index.tsx:118-121` har redan korrekta empty states — nämns här bara som positiv kontrast. `saljare.skapa-annons.tsx:1284-1308` har också en korrekt hanterad "Inga bilder uppladdade ännu."-text.)*

### 🔵 UX/UI

- 🔵 **src/routes/saljare.skapa-annons.tsx:1344** — "Spara som utkast" använder blockerande `alert()` istället för `sonner`-toasten som används konsekvent annars i samma flöde.
- 🔵 **src/routes/saljare.skapa-annons.tsx:1536-1543** — Ta-bort-knappen på uppladdade bilder syns bara vid `group-hover`, utan `focus-visible`-motsvarighet — osynlig för tangentbordsanvändare.
- 🔵 **src/routes/saljare.mina-annonser.tsx:41-45,111** — "Ta bort" på avvisade annonser raderar direkt utan bekräftelse, till skillnad från t.ex. hyresvärds-e-postuppdatering i `saljare.annons.$id.tsx:738-801` som har en tydlig "Är du säker?"-bekräftelse.
- 🔵 **src/routes/saljare.mina-annonser.tsx:114-119** — I legacy-grenen (icke-`isNew`) renderas "Redigera" och "Pausa" som knappar helt utan `onClick` — falsk affordance.
- 🔵 **src/routes/saljare.mina-annonser.tsx:57** — `isNew = i.id.startsWith("n")` avgör UI-gren via textprefix-konvention snarare än ett explicit datamodellsfält — skört mönster.
- 🔵 **src/lib/annons-model.ts — `Draft`-typen** — *(känt sedan tidigare, inte nyupptäckt)* ~10 vestigiella fält (`usp`, `kundunderlag`, `laget`, `anledning`, `potential`, m.fl.) sätts aldrig av något UI. Kandidater för borttagning eller för att kopplas in någonstans.

---

## Köpare-flödet

### 🔴 Buggar

- 🔴 **src/lib/kopare-workflow.ts:38-49 + src/routes/kopare.affarer.index.tsx:91, kopare.affarer.$id.tsx:81, kopare.favoriter.tsx:24** — `readBuyerInterests()`/`getBuyerInterest()` filtrerar aldrig på `userId`; fältet skrivs vid skapande (kopare-workflow.ts:95) men läses aldrig. Vilken köpare som helst i samma webbläsare ser alla köpares affärer, K-koder och tidslinjer.
- 🔴 **src/lib/favoriter.ts:15-44** — `Favorit` saknar ägarfält; `readFavoriter()`/`toggleFavorit()`/`removeFavorit()` arbetar mot en global nyckel. Samma läckageklass som ovan för sparade favoriter.
- 🔴 **src/routes/annons.$id.underlag.tsx:174 vs src/routes/annons.$id.index.tsx:238-250** — Två vägar in i samma beslut divergerar: `index.tsx`s `handleKop()` blockerar köp och skickar till profilkomplettering om `bolag` saknas; `underlag.tsx`s "Köp →"-knapp anropar `besluta("vill-ga-vidare")` direkt utan denna kontroll, vilket ger `kopareBolag === undefined` senare i signeringsdokumenten (`kopare.affarer.$id.tsx:99,264,289`).
- 🔴 **src/routes/kopare.profil.tsx:132-136** — "Spara ändringar" har ingen `onClick`, och fälten ovanför är icke-interaktiva placeholder-`<div>`:ar (via `WireField`) utan state/`onChange` — knappen ser handlingsbar ut men gör ingenting.
- 🔴 **src/routes/kopare.profil.tsx (Ekonomi/Säkerhet/Fakturor-flikarna)** — "Ladda upp nytt lånelöfte", "Ta bort" (ekonomi), "PDF" (fakturor), "Visa aktiva sessioner", "Exportera data (JSON)", "Begär radering" renderas alla som knappar utan `onClick` — döda kontroller utan feedback om att de är overksamma.
- 🔴 **src/routes/affar.$id.tsx + src/routes/dashboard.tsx:22,58,72-99** — Föräldralös/dead route: enda länken dit är gated bakom `DEAL_STATES: WorkflowState[] = []` (hårdkodat tom), så länken är aldrig nåbar. Filen har en egen, från `affar-workflow.tsx` helt avvikande mock-pipeline (`baseTimeline`, `PRIS`, egen `SignModal`).
- 🔴 **src/lib/affar-workflow.tsx:170-224 (reserveraAnnons/avreserveraAnnons + hyresvardBesked)** — Ingen kontroll att annonsen fortfarande finns: om `annonsId` inte går att slå upp gör `avreserveraAnnons` inget synligt, men affären markeras ändå `avvisad: true` och texten säger "Annonsen är åter publik" trots att den aldrig faktiskt avreserverades.

### 🟡 Saknade empty states

- 🟡 **src/routes/kopare.jamfor.tsx:82-117** — "Lägg till objekt" erbjuder bara 3 hårdkodade `ALLA`-poster, inte köparens riktiga favoriter; jämförsidan drivs aldrig av `favoriter.ts`, så att favoritmarkera på `kopare.favoriter.tsx` och klicka "Jämför alla →" fyller inte tabellen. Funktionell data-kopplingslucka, inte bara saknad tomtext.
- 🟡 **src/routes/kopare.affarer.index.tsx:192-209 ("klar"-fliken)** — Ingen explicit empty state när `avslutade.length === 0`; till skillnad från de andra två flikarna (som har dashed-box-fallback) blir innehållsytan helt blank.
- 🟡 **src/routes/kopare.profil.tsx (fakturor-fliken)** — Hårdkodad 2-radslista utan noll-stateshantering; skulle den bli tom visas bara en tabellhuvudrad.
- 🟡 **src/routes/annons.$id.index.tsx:363-385 (dokumentlistan)** — Faller tillbaka på `DEMO_DOKUMENT` när `godkandaDokument` är tom, vilket döljer det genuina "inga godkända dokument än"-läget bakom fejkdata.

*(`kopare.affarer.index.tsx:183-190` "Pågår hos andra" har en korrekt empty state — nämns bara som kontrast.)*

### 🔵 UX/UI

- 🔵 **src/routes/kopare.favoriter.tsx:94, kopare.jamfor.tsx:143-145** — "Ta bort" på en favorit är ett enda klick utan bekräftelse eller ångra-möjlighet.
- 🔵 **src/routes/kopare.profil.tsx:284-293** — "Begär radering" (kontoradering) har ingen bekräftelsedialog trots att den beskrivs som irreversibel.
- 🔵 **kopare.affarer.$id.tsx / affar-workflow.tsx `Progress`** — Steget "Intresse-inskickat" markeras alltid som "klart" retroaktivt eftersom `getDeal()` defaultar till `"granskning"`, inte till ett faktiskt spårat `"intresse-inskickat"`-läge — något missvisande progress-semantik.
- 🔵 **src/routes/kopare.profil.tsx:128** — Telefonfältet är en statisk `WireField`-platshållare, inte kopplad till `formatTelefon` från `src/lib/format.ts`, trots att samma hjälpfunktion används korrekt i `onboarding.tsx`.
- 🔵 **src/routes/annons.$id.index.tsx:252-256,373 samt annons.$id.underlag.tsx:88-99,117-127** — "Öppna"-dokumentknappar öppnar `about:blank` utan laddnings-/aktiv-feedback (upprepat mönster på 4+ ställen).
- 🔵 **src/routes/kopare.jamfor.tsx** — Använder rå `<table>`/`<button>`-markup med ad hoc-klasser istället för `WireBox`/`WireTag`-mönstren som används konsekvent i övriga köparflödet.
- 🔵 **src/routes/affar.$id.tsx:216-222 (SignModal)** — En andra, fristående BankID/Signicat-signeringsmodal som duplicerar `src/components/SignicatFlow` med egna faser/timing — inkonsekvent med det delade mönster resten av köparflödet standardiserat på.

---

## Admin-flödet

### 🔴 Buggar

- 🔴 **src/routes/admin.annonser.$id.tsx:625,1467-1520** — `utkastPris`/`setUtkastPris` finns i state (används för att gata och fylla "Publicera annons") men inget inputfält för det renderas någonsin i "Skriv annonstext"-blocket — admin kan redigera Rubrik/Beskrivning men saknar UI för att korrigera priset före publicering.
- 🔴 **src/routes/admin.annonser.$id.tsx:619,1244-1245** — `prisInput` initieras till `""` och synkas aldrig från `item.pris` (ingen effekt, till skillnad från `utkastRubrik`/`utkastBeskrivning`/`utkastPris`). Efter `backaTillGranskning` (rad 954) visas fältet tomt trots redan godkänt pris — omgodkännande riskerar att tyst skriva över det tidigare överenskomna priset.
- 🔴 **src/lib/affar-workflow.tsx:324-332** — `annonsInfo()` läser `annons?.kat`, men fältet lagras som `cat` (satt i `saljare.skapa-annons.tsx:1375`) — Kat/kategori-kolumnen är alltid `"—"` i `admin.affarer.index.tsx`, `kopare.affarer.index.tsx` och `saljare.affarer.index.tsx`.
- 🔴 **admin.annonser.$id.tsx (approveAnnons ~904, reject ~997, submitKomplettering ~978, backaTillGranskning ~954, backaTillUppdragsavtal ~966, publishAnnons ~1017, approveDoc ~870, markDocNotApplicable ~879)** — Ingen av dessa mutatorer kontrollerar att ärendets sparade tillstånd fortfarande matchar det UI:t antog innan skrivning; med två öppna admin-flikar (eller ett fördröjt klick efter extern ändring) kan admin t.ex. återuppliva ett redan avvisat ärende eller godkänna ett dokument som just markerats N/A någon annanstans.
- 🔴 **src/lib/affar-workflow.tsx (matchaAffar ~99, hyresvardBesked ~202, signeraKopeavtal ~124, signeraOverenskommelse ~252, bekraftaTilltrade ~282)** — Samma mönster: `patchDeal` skriver utifrån vilket steg UI:t tror det är på, utan att först kontrollera att `deal.steg` fortfarande stämmer. `hyresvardBesked` kan från ett inaktuellt render-läge flippa `steg` eller sätta `avvisad: true` i fel ordning om affären redan gått vidare via en annan flik.
- 🔴 **src/routes/admin.installningar.tsx:17-23** — `rensaTestdata()` rensar konton/annonser/köpar-intressen men inte `trelink-admin-notiser` eller `trelink-affarer` — efter "Rensa testdata" kan sidopanelens badge-siffror fortfarande peka på konton/annonser som inte längre finns ("kunde inte hittas"-sidor).

### 🟡 Saknade empty states

- 🟡 **src/routes/admin.affarer.$id.tsx:74-83** — Vid `!interest || !info` visas en generisk "Affären hittades inte", men ingen distinkt text för en affär vars annons raderats (t.ex. via "Rensa testdata") medan affären/intresset finns kvar — `annonsInfo()` faller tyst tillbaka på `"Annons #<id>"`/"Pris ej tillgängligt" istället för att flagga att annonsen är borta.
- 🟡 **src/routes/admin.anvandare.index.tsx:104-105 vs 136-137** — Två olika (korrekta) meddelanden för "inga konton alls" vs "inga matchande konton" finns, men ingen "rensa filter"-genväg vid en dödläges-filterkombination.

*(Empty states är överlag väl hanterade i adminflödet — `admin.annonser.index.tsx:217-221`, `admin.publicerat.tsx:71-74`, `admin.affarer.index.tsx:135-138/168-171`, `admin.kopare.tsx:96-97` har alla explicita, korrekta tomtexter. Detta var den starkaste kategorin i adminflödet.)*

### 🔵 UX/UI

- 🔵 **admin.annonser.index.tsx:223-227, admin.affarer.index.tsx:38-41,73-76, admin.publicerat.tsx:77-81, admin.anvandare.index.tsx:165-171** — Hela listrader görs klickbara via `<div onClick>`/`<tr onClick>` med `cursor-pointer` istället för `<Link>`/`<button>` — inte tangentbordsoperérbara (ingen `tabIndex`/`role`/`onKeyDown`), till skillnad från `admin.index.tsx:100` som korrekt använder `<Link>`.
- 🔵 **src/components/layouts/AdminLayout.tsx:26-57** — Badge-räknarna (`useGranskningCount`, `useNotisCount`) uppdateras bara via cross-tab `storage`-eventet, som webbläsaren aldrig triggar för skrivningar i samma flik. En badge-påverkande åtgärd utan att lämna sidan uppdaterar inte sidopanelen förrän man navigerar bort och tillbaka.
- 🔵 **src/routes/admin.affarer.$id.tsx:264-272** — "Hyresvärd nekade" avslutar affären direkt vid ett enda klick, utan bekräftelse — till skillnad från annons-avvisningsflödet (`admin.annonser.$id.tsx:1368-1405`) som kräver vald orsak innan den destruktiva knappen aktiveras. Inkonsekvent friktionsnivå för två likvärdigt destruktiva/terminala åtgärder.
- 🔵 **src/routes/admin.annonser.$id.tsx:1053** — `sellerEpost`/`hyresvardEpost` faller tillbaka på strängen `"—"`, som sedan hamnar direkt i simulerade mails "till:"-fält — ser konstigt ut i mailförhandsvisningen om adressen saknas.
- 🔵 **src/routes/admin.kopare.tsx:172-174** — "Märk för ombokning" är en vanlig `WireBtn` i en tabellcell utan mycket kontext; lätt att missa jämfört med taggbaserad statusframställning på andra ställen (`StatusTag`).
- 🔵 **src/routes/admin.annonser.$id.tsx:243-322 (`Field`)** — Inline-redigeringsfältet har ingen `aria-label`/kopplad `<label for>`; bara den föregående `<Annotation>`-texten labelar fältet visuellt, så skärmläsaranvändare som redigerar ett `Field` får inte fältnamnet uppläst tillsammans med inputen.

---

## Metodanteckning

Denna rapport togs fram genom tre parallella, fullständiga genomläsningar (en per flöde) av alla
route-filer och tillhörande delad logik i `src/lib/`. Radnummer avser filernas tillstånd vid
granskningstillfället och kan ha förskjutits av senare, orelaterade ändringar. Inga kodändringar
gjordes som en del av denna granskning.
