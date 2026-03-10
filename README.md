# Coen Snake

Een klassiek Snake-spel in JavaScript. Bestuur de slang met je **muis** (cursor): de slang beweegt in de richting van je cursor. De kop van de slang heeft een **rode mohawk**. Topscores worden opgeslagen in een **SQLite**-database en het geheel draait in een **Docker**-container.

## Vereisten

- [Docker](https://docs.docker.com/get-docker/) en [Docker Compose](https://docs.docker.com/compose/install/) (of Docker Desktop met Compose)
- Of lokaal: **Node.js** 18+

## Snel starten met Docker

1. **Clone of open de projectmap** (als je dat nog niet gedaan hebt).

2. **Build en start de container:**

   ```bash
   docker compose up --build
   ```

3. **Open in je browser:** [http://localhost:3000](http://localhost:3000)

4. **Spelen:**
   - Klik op **Start spel** en beweeg je muis in het speelveld.
   - De slang volgt de richting van je cursor (binnen het rooster: omhoog, omlaag, links, rechts).
   - Eet het oranje voedsel om te groeien en punten te scoren.
   - Bij game over wordt je score automatisch opgeslagen; de topscores staan onder het speelveld.

Om te stoppen: `Ctrl+C` in de terminal. De database (topscores) blijft bewaard in een Docker-volume.

## Docker-opdrachten

| Opdracht | Uitleg |
|----------|--------|
| `docker compose up --build` | Bouwt de image en start de app (voorgrond). |
| `docker compose up -d --build` | Zelfde, maar op de achtergrond (detached). |
| `docker compose down` | Stopt en verwijdert de container(s). |
| `docker compose down -v` | Stopt en verwijdert ook het volume (alle topscores worden gewist). |

De SQLite-database staat in het volume `snake-data` op het pad `/data/scores.db` in de container.

## Lokaal draaien (zonder Docker)

1. **Node.js 18+** moet geïnstalleerd zijn.

2. **Installeer afhankelijkheden:**

   ```bash
   npm install
   ```

3. **Start de server:**

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000).

De database wordt lokaal aangemaakt als `scores.db` in de projectmap (tenzij je `SQLITE_DB_PATH` aanpast).

---

## Lokaal installeren – stap voor stap (Mac en Windows)

Als je nog nooit Node.js of de terminal hebt gebruikt, volg dan deze stappen.

### Stap 1: Node.js installeren

**Op Mac:**

1. Ga naar [nodejs.org](https://nodejs.org).
2. Download de **LTS**-versie (groene knop).
3. Open het gedownloade bestand (`.pkg`) en volg de installatiewizard (volgende → accepteren → installeren).
4. Controleer daarna in **Terminal** (zie stap 2) of het werkt: typ `node --version` en druk Enter. Je zou iets als `v20.x.x` moeten zien.

**Op Windows:**

1. Ga naar [nodejs.org](https://nodejs.org).
2. Download de **LTS**-versie.
3. Voer het gedownloade bestand (`.msi`) uit.
4. In de wizard: vink **“Add to PATH”** aan en klik door tot de installatie klaar is.
5. Sluit eventueel alle open Command Prompt- of PowerShell-vensters en open een nieuw venster.
6. Controleer: typ `node --version` en druk Enter. Je zou iets als `v20.x.x` moeten zien.

### Stap 2: De projectmap openen in de terminal

**Op Mac:**

1. Open **Terminal**: druk `Cmd + Spatie`, typ `Terminal` en druk Enter.
2. Ga naar de map van het project. Typ `cd` (met een spatie) en sleep daarna de map **coen-snake** vanuit de Finder naar het Terminal-venster. Druk Enter.
   - Of typ handmatig bijvoorbeeld: `cd ~/Documents/Development/coen-snake` (pas het pad aan als je project ergens anders staat).

**Op Windows:**

1. Open **Command Prompt** of **PowerShell**: druk op de Windows-toets, typ `cmd` of `powershell` en druk Enter.
2. Ga naar de map van het project, bijvoorbeeld:
   ```text
   cd C:\Users\JouwNaam\Documents\Development\coen-snake
   ```
   (Vervang `JouwNaam` door je gebruikersnaam en pas het pad aan als je project ergens anders staat.)

### Stap 3: Afhankelijkheden installeren

In dezelfde terminal (Mac of Windows) typ:

```bash
npm install
```

Wacht tot het klaar is (er verschijnen regels tekst). Als er geen rode foutmeldingen staan, is het goed.

### Stap 4: De server starten

Typ:

```bash
npm start
```

Je zou iets moeten zien als: `Coen Snake server running on http://0.0.0.0:3000`. Laat dit venster **open** staan zolang je het spel wilt spelen.

### Stap 5: Het spel openen in je browser

1. Open je webbrowser (Chrome, Edge, Firefox, Safari, …).
2. Ga in de adresbalk naar: **http://localhost:3000**
3. Druk Enter. De Coen Snake-pagina zou moeten laden.

Om te stoppen: ga terug naar het terminalvenster en druk **Ctrl+C**. Daarna kun je het venster sluiten.

## API (topscores)

- **GET** `/api/scores?limit=10` – Haalt de top scores op (standaard 10, max 100).
- **POST** `/api/scores` – Slaat een nieuwe score op. Body: `{ "player_name": "Naam", "score": 120 }`.

## Technische details

- **Backend:** Node.js, Express, [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) voor SQLite.
- **Frontend:** HTML5 Canvas, vanilla JavaScript; geen frameworks.
- **Besturing:** Richting van de slang wordt afgeleid van de cursorpositie ten opzichte van de kop (rooster: 4 richtingen).
- **Mohawk:** Getekend als rode driehoeken op de kop van de slang in de bewegingsrichting.

## Licentie

Vrij te gebruiken en aan te passen.
