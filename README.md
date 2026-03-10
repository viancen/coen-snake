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
