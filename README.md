# MarketPrice - HBS Ticket Marketplace

A transparent event ticket marketplace for Harvard Business School, built with Next.js, Prisma, PostgreSQL, and Material UI.

[Drive link](https://drive.google.com/drive/folders/1AUi6W5qGDSq8zpbF9A1V8_JhedzzKCrL?usp=drive_link)

## Project Description
An anonymous marketplace for verified HBS students enables transparent resale of club event tickets through hourly modified Dutch auctions. Sellers upload redacted QR tickets with price floors, and buyers place bids with cards on file for instant, private matching. The platform streamlines last-minute trades while providing clubs with privacy-safe demand insights to inform future pricing.

## Features

### Admin Features
- **Event Creation**: Create events with comprehensive details including:
  - Title, description, club name, date/time, venue
  - Retail ticket price and optional max resale cap
  - Ticket format (QR Code or Eventbrite Link)
  - Listing window controls (open/close times)
  - Global enable/disable resales toggle

- **Live Preview Panel**: Real-time preview showing:
  - Event card as it appears in marketplace
  - Price chart with simulated data
  - Liquidity meter indicating market depth

- **Analytics Dashboard**: Post-event analytics including:
  - Total trades and average resale price
  - Sell-through rate
  - Price distribution charts
  - Time-series analysis of trades

### User Features
- **Magic Link Authentication**: Email-based login restricted to @hbs.edu addresses
- **Marketplace Feed**: Browse upcoming and past events
- **Event Details**: View comprehensive event information with active listings

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Prisma ORM with PostgreSQL (production) / SQLite (local dev)
- **UI**: Material UI v5 with custom Harvard-themed design
- **Validation**: Zod for form and API validation
- **Charts**: Material UI X-Charts for data visualization
- **Testing**: Playwright for E2E testing
- **Authentication**: JWT-based sessions with magic links

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd MRKT-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   The `.env.local` file is already configured for local development with SQLite:
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="dev-secret-key-change-in-production"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed the database with sample data**
   ```bash
   npm run db:seed
   ```

   This creates:
   - 1 admin user (admin@hbs.edu)
   - 8 regular users
   - 5 sample events (mix of upcoming and past)
   - 60-100 listings across events
   - 30-40 mock trades

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin Access

To access the admin panel:
1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Enter: `admin@hbs.edu`
3. Click "Send Magic Link"
4. Copy the magic link URL shown on the page (development mode only)
5. Navigate to that URL to log in

### Database Management

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Reset database and re-seed
npx prisma db push --force-reset
npm run db:seed

# View database schema
npx prisma studio
```

## Running Tests

### E2E Tests with Playwright

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui
```

The test suite covers:
- Complete admin flow: login → create event → preview → analytics
- Form validation
- Authentication and logout

## Project Structure

```
MRKT-project/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script with sample data
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Marketplace feed
│   │   ├── login/           # Login page
│   │   ├── admin/           # Admin dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── events/
│   │   │       ├── new/     # Create event form
│   │   │       └── [id]/
│   │   │           └── analytics/  # Analytics page
│   │   └── api/             # API routes
│   │       ├── auth/        # Authentication endpoints
│   │       └── events/      # Event CRUD + analytics
│   ├── components/
│   │   ├── admin/           # Admin-specific components
│   │   │   └── PreviewPanel.tsx
│   │   └── shared/          # Reusable components
│   │       ├── EventCard.tsx
│   │       ├── PriceChart.tsx
│   │       └── LiquidityMeter.tsx
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client
│   │   ├── auth.ts          # Auth utilities
│   │   ├── validation.ts    # Zod schemas
│   │   ├── utils.ts         # Helper functions
│   │   └── theme.ts         # Material UI theme
│   └── middleware.ts        # Auth middleware
├── tests/
│   └── e2e/
│       └── admin-flow.spec.ts
├── .env.example             # Environment variables template
├── .env.local               # Local environment (gitignored)
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

## Deployment to Vercel

### Prerequisites

- Vercel account ([sign up free](https://vercel.com/signup))
- PostgreSQL database (use Vercel Postgres or external provider)

### Deployment Steps

#### 1. Set Up PostgreSQL Database

**Option A: Vercel Postgres (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Create Postgres database
vercel postgres create
```

**Option B: External PostgreSQL Provider**

Use any PostgreSQL provider (Railway, Supabase, Neon, etc.) and get your connection string.

#### 2. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

#### 3. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `prisma generate && next build`

#### 4. Set Environment Variables

In Vercel dashboard, add these environment variables:

```env
# Database (from Vercel Postgres or your provider)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Auth (generate a secure random string)
AUTH_SECRET="<generate-secure-random-string>"

# App URL (your Vercel deployment URL)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Node Environment
NODE_ENV="production"
```

To generate a secure `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

#### 5. Update Database Provider for Production

If using PostgreSQL in production, update `prisma/schema.prisma`:

Change:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

To:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then push to trigger a new deployment.

#### 6. Run Database Migrations

After deployment, initialize the database:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link to your project
vercel link

# Run database push
vercel env pull .env.production
npx prisma db push

# Seed the database (optional)
npx prisma db seed
```

### Continuous Deployment

Every push to the `main` branch will trigger automatic deployment to Vercel.

## API Routes

### Authentication
- `POST /api/auth/login` - Send magic link
- `GET /api/auth/verify?token=xxx` - Verify token and create session
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current session

### Events
- `GET /api/events?status=upcoming|past|all` - List events
- `POST /api/events` - Create event (admin only)
- `GET /api/events/[id]` - Get event details
- `PATCH /api/events/[id]` - Update event (admin only)
- `DELETE /api/events/[id]` - Delete event (admin only)
- `GET /api/events/[id]/analytics` - Get event analytics
- `GET /api/events/[id]/preview-data` - Get preview data for event

## Key Features Deep Dive

### Magic Link Authentication

The authentication system uses JWT-based magic links:
1. User enters @hbs.edu email
2. Token generated and stored in database
3. Magic link sent (in dev, displayed on screen)
4. Clicking link verifies token and creates session
5. Session stored in httpOnly cookie

**Security Features**:
- Tokens expire after 30 minutes
- One-time use tokens (deleted after verification)
- Sessions expire after 7 days
- Email validation restricted to @hbs.edu domain

### Event Creation Flow

1. **Form Filling**: Admin fills comprehensive event details
2. **Real-time Validation**: Zod validates inputs client and server-side
3. **Live Preview**: Preview panel updates as fields change
4. **Submission**: Form data validated and event created via API
5. **Redirect**: Admin redirected to dashboard showing new event

### Analytics Calculations

The analytics page derives metrics from trade data:

```typescript
totalTrades = count of all trades for event
avgResalePrice = average price of all trades
sellThroughRate = (completed listings / total listings) * 100
```

Charts show:
- Price distribution (below/at/above retail)
- Time series of average prices
- Trade volume over time

## Troubleshooting

### Database Issues

**"Column not found" errors**:
```bash
npx prisma db push --force-reset
npm run db:seed
```

**Prisma Client out of sync**:
```bash
npx prisma generate
```

### Build Errors

**Module not found**:
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Authentication Issues

**Magic link not working**:
- Check that `AUTH_SECRET` is set correctly
- Verify token hasn't expired (30 min limit)
- Clear browser cookies and try again

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | Yes | `file:./dev.db` |
| `AUTH_SECRET` | JWT signing secret | Yes | (must set) |
| `NEXT_PUBLIC_APP_URL` | App base URL | Yes | `http://localhost:3000` |
| `NODE_ENV` | Node environment | No | `development` |

## License

MIT License

---

**Built for Harvard Business School**
