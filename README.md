# MF Compass

An elegant, privacy-first discovery and outperformance analysis tool for Indian Mutual Funds. No tracking, no advertisements, no login walls — just raw, relative performance comparisons and peer-group analysis.

Live Application: [https://mf-compass.vercel.app/](https://mf-compass.vercel.app/)

---

## 🏗️ Codebase & Architecture

Next.js 16 (App Router), React 19, Neon Postgres and Drizzle ORM. How the score works: `docs/SCORE.md`. How data
gets in: `docs/DATA.md`.

### 1. Directory Structure

- **`src/app/`**: pages, each with its own phone and laptop layout.
  - `page.tsx` home · `funds/` kinds of fund and each kind's ranking · `fund/[code]/` a fund (ISR, 1 hour)
  - `compare/` up to four funds side by side · `saved/` · `finder/` three questions · `learn/` · `method/`
  - `api/`: two routes: `funds/lookup` (every fund for in-browser search) and `funds/[code]/growth` (the rankings preview chart).
- **`src/components/`**: the UI, one file per piece (header, tab bar, search, rankings table, charts, icons).
- **`src/lib/`**:
  - `data.ts`: every query the pages make, cached for an hour.
  - `metrics/`: category indexes and the Compass Score.
  - `picks.ts`: saved and compare lists, kept in this browser only (no accounts).
  - `format.ts`, `verdict.ts`, `growth.ts`: numbers, plain-language lines, SIP and growth maths.
- **`scripts/sync/`**: the daily and weekly jobs (Kuvera details, AMFI and mfapi.in prices, scores).
- **`drizzle/`**: schema and migrations.

### 2. Key Technical Implementations

- **Search in the browser**: one ~30 KB list of every fund, fetched once and searched locally on each keystroke.
- **Scores from price history**: every return, fall and score is computed from daily NAVs against an equal-weight
  average of the same kind of fund, over the same dates.
- **Motion with restraint**: page transitions use React View Transitions, in-page motion uses Motion; both honour
  the system's reduced-motion setting.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: Tailwind CSS v4, authored SVG icons
- **Motion**: React View Transitions and Motion
- **Database**: Neon Serverless Postgres with Drizzle ORM
- **Deployment**: Vercel

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) 24 (see `.nvmrc`) and [npm](https://www.npmjs.com/) installed.

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🗃️ Utility & Synchronization Scripts

The project includes pre-configured Node scripts for database synchronization, testing, and schema generation:

- **`npm run dev`**: Starts the hot-reloading Next.js development server.
- **`npm run build`**: Generates an optimized production build of the Next.js application.
- **`npm run typecheck`**: Runs the TypeScript compiler to audit type safety.
- **`npm run lint`**: Inspects static JavaScript/TypeScript code using ESLint.
- **`npm run test`**: Runs unit and integration tests using Vitest.
- **`npm run db:generate`**: Generates SQL migration files based on schema changes.
- **`npm run db:apply -- <file>`**: Applies one migration file in a single transaction (the production database has no drizzle history, so don't use `db:migrate`; see `docs/DATA.md`).
- **`npm run db:push`**: Pushes Drizzle schema definitions directly to the database (for rapid local prototyping).
- **`npm run sync:daily`**: Refreshes fund details (cost, size, latest NAV), appends today's prices and recomputes Compass Scores.
- **`npm run sync:weekly`**: Rediscovers eligible funds, refreshes their details, backfills and heals NAV history, and recomputes Compass Scores.
