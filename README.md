# ManPhil&Co Back Office

Property management system for 300+ luxury vacation rentals.

## Quick Start

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your database URL and Clerk keys
   ```

3. Push database schema:
   ```bash
   bun prisma db push
   ```

4. Seed the database:
   ```bash
   bun prisma db seed
   ```

5. Run development server:
   ```bash
   bun run dev
   ```

## Database Seeding

### Run seed data
```bash
bun prisma db seed
```

### What gets seeded
- 10 destinations (French Riviera, Mallorca, Santorini, etc.)
- 4 sample properties with rooms and pricing
- 30+ contacts (owners, clients, providers)
- 19 activity providers
- 6 equipment requests

### Reset and reseed (dev only!)
```bash
bun prisma db push --force-reset
bun prisma db seed
```

⚠️ **WARNING**: Never run force-reset on production!

### Update existing data instead
If you have existing data, update destinations with coordinates:
```sql
UPDATE "Destination" SET latitude = 43.7102, longitude = 7.2620 WHERE name = 'French Riviera';
UPDATE "Destination" SET latitude = 39.5696, longitude = 2.6502 WHERE name = 'Mallorca';
```

## Common Commands

```bash
bun run dev          # Start dev server
bun run build        # Build for production
bun run lint         # Run linter
bun prisma studio    # Open database GUI
bun prisma generate  # Generate Prisma types
```

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Prisma + PostgreSQL
- Clerk Auth
- Tailwind CSS
- Bun