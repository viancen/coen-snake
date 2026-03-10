# Nasty Snake

Een klassiek Snake-spel in JavaScript (**18+**). Bij het openen moet je bevestigen dat je 18 jaar of ouder bent. Bestuur de slang met je **muis** of **pijltjestoetsen**. De kop heeft een **rode mohawk**. Er zijn **5 levels** (meer punten = groter veld en meer voedsel tegelijk). Topscores worden opgeslagen in een **SQLite**-database. Draait in een **Docker**-container of lokaal met Node.js.

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
   - Bevestig dat je 18+ bent om de site te betreden.
   - Klik op **Start spel** en stuur met muis of pijltjestoetsen.
   - Eet het oranje voedsel om te groeien en punten te scoren. Bij 150, 300, 450 en 600 punten ga je naar het volgende level (groter veld, meer voedsel).
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

De database wordt lokaal aangemaakt als `data/scores.db` (tenzij je `SQLITE_DB_PATH` aanpast).

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
2. Ga naar de map van het project. Typ `cd` (met een spatie) en sleep daarna de map **nasty-snake** vanuit de Finder naar het Terminal-venster. Druk Enter.
   - Of typ handmatig bijvoorbeeld: `cd ~/Documents/Development/nasty-snake` (pas het pad aan als je project ergens anders staat).

**Op Windows:**

1. Open **Command Prompt** of **PowerShell**: druk op de Windows-toets, typ `cmd` of `powershell` en druk Enter.
2. Ga naar de map van het project, bijvoorbeeld:
   ```text
   cd C:\Users\JouwNaam\Documents\Development\nasty-snake
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

Je zou iets moeten zien als: `Nasty Snake server running on http://0.0.0.0:3000`. Laat dit venster **open** staan zolang je het spel wilt spelen.

### Stap 5: Het spel openen in je browser

1. Open je webbrowser (Chrome, Edge, Firefox, Safari, …).
2. Ga in de adresbalk naar: **http://localhost:3000**
3. Druk Enter. De Nasty Snake-pagina zou moeten laden.

Om te stoppen: ga terug naar het terminalvenster en druk **Ctrl+C**. Daarna kun je het venster sluiten.

## Deployen op Laravel Forge (scores opslaan)

Dit is een **Node.js**-app met **SQLite**, geen Laravel. Alle verkeer (inclusief `/api/scores`) moet naar de **Node-server** gaan, niet naar een PHP- of static-website-setup.

### Waarom krijg ik 404 op /api/scores?

Forge staat vaak standaard zo ingesteld dat Nginx bestanden uit de map `public` serveert (Laravel-stijl). Dan bestaat het pad `/api/scores` niet als bestand en krijg je **404**. De Node-app moet **als proces draaien** en Nginx moet **alle requests naar dat proces sturen** (reverse proxy).

### 1. Nginx: proxy naar Node (belangrijk)

De Node-app luistert op een poort (bijv. **3000**). Nginx moet al het verkeer voor je domein naar die poort doorsturen.

- Ga in Forge naar je **Site** → **Files** → **Edit Nginx Configuration** (of de plek waar je de server block bewerkt).
- Zorg dat de `location /` (of de hele server block) **niet** alleen `root`/`public` gebruikt voor de app, maar **proxy** naar Node. Voorbeeld:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
(Voeg dit toe in je bestaande `server { ... }` block, of vervang de bestaande `location /` door dit. Gebruik de juiste `server_name` voor jouw domein.)

- Vervang **3000** als je in je Node-app (of Environment) een andere `PORT` gebruikt.
- Sla op en voer in Forge **"Restart Nginx"** uit (of equivalent).

Daarna gaan alle requests (inclusief `/api/scores`) naar de Node-app en zou de 404 weg moeten zijn.

### 2. Node-app laten draaien (PM2)

- In Forge: **Site** → **Daemons** (of **Processes**), of gebruik op de server PM2.
- Startcommando (uit de **projectroot**, niet uit `public`):  
  `node server.js`  
  of:  
  `npm start`
- Laat de app luisteren op dezelfde poort als in de Nginx-config (bijv. 3000). Die poort kun je instellen via Environment: `PORT=3000`.

### 3. Schrijfbare map voor de database
   - De app gebruikt standaard de map `data` in de projectroot en maakt daar `data/scores.db` aan.
   - Zorg dat die map bestaat en schrijfbaar is voor de `forge` user:
     ```bash
     cd /home/forge/jouw-site.nl   # of jouw projectpad
     mkdir -p data
     chown forge:forge data
     chmod 755 data
     ```
   - Bij elke deploy moet `data` blijven bestaan. Voeg in je deploy-script toe:
     ```bash
     mkdir -p data && chown forge:forge data
     ```

4. **Optioneel: vaste locatie via environment**
   - In Forge: Site → Environment (`.env` of Environment Variables).
   - Zet bijvoorbeeld: `SQLITE_DB_PATH=/home/forge/jouw-site.nl/data/scores.db`
   - De user die de app start (meestal `forge`) moet schrijfrechten hebben op die map.

Als de database niet kan schrijven, stopt de server bij opstarten met een foutmelding. Controleer dan de rechten op de map en eventueel de Forge-logs.

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
