# MF Compass

An elegant, privacy-first discovery and outperformance analysis tool for Indian Mutual Funds. No tracking, no advertisements, no login walls — just raw, relative performance comparisons and peer-group analysis.

Live Application: [https://mf-compass.vercel.app/](https://mf-compass.vercel.app/)

---

## 🏗️ Codebase & Architecture

The application is built on Next.js 16 (App Router), React 19, Neon Postgres, and Drizzle ORM, prioritizing type safety, small payload sizes, and extremely low latency.

### 1. Directory Structure

* **`src/app/`**: Next.js App Router entrypoints.
  * `funds/`: Leaderboard view with filtering.
  * `fund/[code]/`: ISR-cached detail pages (revalidated every 5 minutes) configured with static loading fallbacks (`loading.tsx`) for instant route switches.
  * `compare/`: Multi-fund comparison dashboard.
  * `watchlist/`: Client-side saved watchlist tracking.
  * `api/`: API routes (including cached search indexing and parameter-validated fund querying).
* **`src/components/`**: Meticulously separated React components:
  * `ui/`: Core styling blocks (such as squirpled AMC Logo tags and toast notifications).
  * `funds/`: Category sorting and list triggers.
  * Global shell elements (`Navbar`, `Footer`, `CommandMenu`, `CompareStickyBar`).
* **`src/hooks/`**: Custom React state managers (`useWatchlist`, `useCompare`) synchronized with LocalStorage.
* **`src/lib/`**:
  * `db/`: Neon Serverless Postgres client setup.
  * `format/`: Numeric formatting helpers with formatting safeguards.
  * `scoring/`: Category benchmarks and outperformance criteria.

### 2. Key Technical Implementations

* **In-Memory Search Index**: The search API caches minimal fund data columns in-memory with a 5-minute TTL to keep query latencies under 5ms, avoiding heavy SQL queries on every keystroke.
* **Tokenized Relevance Search**: Relies on a deterministic query-tokenization algorithm that splits multi-word searches into prefixes and yields precise, weighted outperformance scores rather than fuzzy matching.
* **Optimized State Transitions**: Employs dynamic React keys on tables to trigger hardware-accelerated CSS animations during filter switches.
* **Accessibility & Reduced Motion**: Full keyboard focus sequencing, active `aria-sort` column status tags, and a global `@media (prefers-reduced-motion: reduce)` rule that instantly disables animations for users with motion-sensitive configurations.
* **Type-Safe Database Interfacing**: Uses Drizzle ORM to compile queries down to SQL, mapping results directly to inferred schemas and preventing input injection.

---

## 🛠️ Technology Stack

* **Framework**: Next.js 16 (App Router) & React 19
* **Styling**: Tailwind CSS v4 & Lucide React Icons
* **Database**: Neon Serverless Postgres
* **Database ORM**: Drizzle ORM
* **Deployment**: Vercel

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and [npm](https://www.npmjs.com/) installed.

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

* **`npm run dev`**: Starts the hot-reloading Next.js development server.
* **`npm run build`**: Generates an optimized production build of the Next.js application.
* **`npm run typecheck`**: Runs the TypeScript compiler to audit type safety.
* **`npm run lint`**: Inspects static JavaScript/TypeScript code using ESLint.
* **`npm run test`**: Runs unit and integration tests using Vitest.
* **`npm run db:generate`**: Generates SQL migration files based on schema changes.
* **`npm run db:migrate`**: Applies SQL migration files to the database (recommended for production environments).
* **`npm run db:push`**: Pushes Drizzle schema definitions directly to the database (for rapid local prototyping).
* **`npm run sync:daily`**: Synchronizes NAV values, assets under management (AUM), and fund parameters.
* **`npm run sync:weekly`**: Executes heavier category-wide benchmarking, calculates averages, and normalizes outperformance rankings.
