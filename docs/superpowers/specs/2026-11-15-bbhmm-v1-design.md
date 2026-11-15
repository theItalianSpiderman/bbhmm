# BBHMM v1 – design

## Syfte
En enkel sida för att hålla koll på hur mycket som är kvar av en startsumma.
Man anger startpengar + datum, lägger till poster som dras av, och ser alltid
direkt vad som är kvar. Används främst på iPhone (iOS 27, stående läge).

## Mål
- **Header (fast, syns alltid):** "kvar" stort, startsumma + startdatum mindre. Två decimaler.
- **Lägg till (+):** belopp, datum (förvalt idag), kort anteckning. Spara- och ångra-ikon.
- **Lista:** en rad per post – `datum  summa  text  ×` – sorterad på datum, nyast längst ner.
  Sidan öppnar scrollad längst ner; äldre rader scrollas bort uppåt men nås genom att scrolla.
- **Ta bort:** ×-ikon per rad.
- **Lagring:** lokalt i webbläsaren (localStorage).
- **Utseende:** typsnittet Departure Mono; tabeller/ramar ritas med box drawing-tecken.

## Icke-mål (v1)
- Synk mellan enheter, konton, backend.
- Kategorier, statistik, grafer, flera budgetar.
- Redigera befintlig post (ta bort + lägg till igen räcker).

## Antimål
- Får inte kräva inloggning eller skicka data någonstans.
- Får inte se ut som en generisk "app-mall" – det monospace/box-drawing-uttrycket är poängen.

## Begränsningar
- Måste få plats och vara lätt att använda i iPhone stående (~390pt bred, ~36 tecken per rad).
- Hostas på GitHub Pages (https) så att den kan läggas till på hemskärmen.
  Datan stannar i telefonen.

## Tillvägagångssätt
1. **Fristående webbsida (vald).** En HTML-fil + typsnittsfil + manifest. Minst underhåll, lätt att ändra.
2. iOS-app i Swift – mest "riktig", men kräver Xcode och omsignering (7 dagar gratis / 99 USD/år). Overkill.
3. Webbapp med ramverk (React m.fl.) – fler beroenden utan nytta i nuläget.

Vald: 1, hostad på GitHub Pages. Användaren valde detta.

## Beslut tagna av användaren
- Stor siffra = kvar; startsumman visas mindre.
- Sparas lokalt till att börja med.
- Departure Mono + box drawing-tecken.
- GitHub Pages.

## Mina val (kan ändras)
- Negativt belopp (`-500`) = pengar in, ökar "kvar".
- Tryck på headern för att ändra startsumma/datum. Första start: fråga efter startsumma + datum.
- Svenska format: `1 234,50`, datum `ÅÅÅÅ-MM-DD`. Både komma och punkt accepteras vid inmatning.
- För lång anteckning kapas med `…` i listan.
- Poster före startdatum tillåts (ingen spärr).
- Ta bort sker direkt utan bekräftelsedialog (v1); kan ändras om det känns riskabelt.
- Belopp lagras som heltal i ören för att undvika avrundningsfel.
- Departure Mono (OFL) bundlas lokalt i repot, inte från CDN.
- Web app manifest + `apple-mobile-web-app`-metataggar så den öppnas i helskärm från hemskärmen; respekterar safe-area (notch/hemindikator).

## Lämnat till byggaren
- Exakt ikonval för spara/ångra/ta bort/plus (gärna tecken ur fontens eget teckenförråd).
- Exakta kolumnbredder i tabellen inom ~36 tecken.
- Datastrukturens nyckelnamn i localStorage (versionerad, t.ex. `bbhmm.v1`).
