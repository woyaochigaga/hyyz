# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI SaaS boilerplate (ShipAny Template One) built with Next.js 14 App Router, designed for rapid deployment of AI-powered applications. The project uses pnpm as the package manager.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (suppresses Node warnings)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Bundle analysis
pnpm analyze

# Database migration (requires SUPABASE_URL env var)
pnpm db:migrate

# Cloudflare deployment
pnpm cf:build      # Build for Cloudflare Pages
pnpm cf:preview    # Preview locally
pnpm cf:deploy     # Deploy to Cloudflare
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- Supabase credentials (database)
- Stripe keys (payments)
- NextAuth configuration
- AI provider API keys (OpenAI, DeepSeek, Replicate, OpenRouter)
- AWS S3 credentials (file storage)

For Cloudflare deployment, use `.env.production` and configure `wrangler.toml`.

## Architecture

### Routing Structure

The app uses Next.js App Router with internationalization (next-intl):

```
app/
├── [locale]/                    # Locale-based routing (i18n)
│   ├── (default)/              # Main user-facing routes
│   │   ├── page.tsx            # Landing page
│   │   ├── (console)/          # User dashboard area
│   │   │   ├── api-keys/       # API key management
│   │   │   ├── my-credits/     # Credit management
│   │   │   ├── my-invites/     # Invite system
│   │   │   └── personal_center/ # User profile
│   │   ├── posts/              # Blog/content pages
│   │   └── i/[code]/           # Invite code handling
│   ├── (admin)/                # Admin dashboard
│   │   └── admin/
│   │       ├── posts/          # Content management
│   │       ├── users/          # User management
│   │       └── paid-orders/    # Order management
│   ├── home/                   # Alternative home layout
│   ├── auth/signin/            # Authentication pages
│   └── pay-success/            # Payment confirmation
└── api/                        # API routes
    ├── auth/                   # NextAuth endpoints
    ├── demo/                   # AI demo endpoints
    │   ├── gen-text/           # Text generation
    │   ├── gen-stream-text/    # Streaming text
    │   └── gen-image/          # Image generation
    └── checkout/               # Stripe integration
```

**Route Groups**: Parentheses like `(default)`, `(admin)`, `(console)` organize routes without affecting URLs.

### Key Directories

- **components/**: React components
  - `blocks/`: Landing page sections (header, footer, hero, pricing, etc.)
  - `ui/`: Shadcn UI components (reusable primitives)
- **i18n/**: Internationalization
  - `pages/landing/`: Page-specific translations for landing page
  - `messages/`: Global translation messages
- **lib/**: Utility functions and custom libraries
- **services/**: Business logic layer
- **models/**: Data models and database operations
- **types/**: TypeScript type definitions
  - `blocks/`: Types for layout blocks
  - `pages/`: Types for page components
- **contexts/**: React Context providers for state management
- **hooks/**: Custom React hooks
- **aisdk/**: AI SDK configurations and utilities
- **auth/**: NextAuth configuration
- **public/**: Static assets

### Key Integrations

**Supabase** (Database & Auth)
- PostgreSQL database with migrations in `data/install.sql`
- Run migrations: `pnpm db:migrate`
- Client initialized in `lib/` directory
- Used for user data, posts, orders, API keys, credits, invites

**Stripe** (Payments)
- Checkout flow via `/api/checkout` and `/api/stripe/*` routes
- Success redirect to `/pay-success/[session_id]`
- Order management in admin dashboard
- Webhook handling for payment events

**NextAuth** (Authentication)
- Configuration in `auth/` directory
- API routes at `/api/auth/[...nextauth]`
- Supports multiple providers (check auth config for enabled providers)
- Session management integrated with Supabase

**AI SDKs** (Multiple Providers)
- Vercel AI SDK as the main interface
- Configured providers: OpenAI, DeepSeek, Replicate, OpenRouter
- Demo endpoints in `/api/demo/` show usage patterns:
  - `gen-text`: Standard text generation
  - `gen-stream-text`: Streaming responses
  - `gen-image`: Image generation
- Provider configurations in `aisdk/` directory

**AWS S3** (File Storage)
- Used for user uploads and static assets
- Client configuration in `lib/` with `@aws-sdk/client-s3`

### Internationalization (i18n)

The app uses `next-intl` for multi-language support:

- All routes are prefixed with `[locale]` (e.g., `/en/...`, `/zh/...`)
- Translations organized in `i18n/`:
  - `messages/`: Global translations (common UI elements, errors, etc.)
  - `pages/landing/`: Landing page specific content
- Middleware in `middleware.ts` handles locale detection and routing
- To add new translations: update JSON files in `i18n/messages/[locale].json`
- To customize landing page content: edit `i18n/pages/landing/[locale].json`

### Styling

- **Tailwind CSS**: Utility-first styling framework
- **Shadcn UI**: Component library built on Radix UI primitives
  - Components in `components/ui/`
  - Configuration in `components.json`
- **Theme**: Customizable via `app/theme.css`
  - Use [shadcn-ui-theme-generator](https://zippystarter.com/tools/shadcn-ui-theme-generator) for theme generation
- **Dark Mode**: Supported via `next-themes`
- **Animations**: `framer-motion` for complex animations, `tailwindcss-animate` for utilities

## Development Conventions

### Component Development
- Use functional components with React hooks
- Component names in CamelCase
- Keep components modular and reusable
- Place layout blocks in `components/blocks/`
- Place reusable UI primitives in `components/ui/`

### State Management
- Use React Context for global state (see `contexts/`)
- Context providers wrap the app in layout files
- Avoid prop drilling by using appropriate context

### Type Safety
- All components and functions should have proper TypeScript types
- Define types in `types/` directory, organized by domain
- Use type definitions from `types/blocks/` for layout components
- Use type definitions from `types/pages/` for page-specific types

### Code Organization
- **Separation of Concerns**:
  - `models/`: Database operations and data access
  - `services/`: Business logic and orchestration
  - `components/`: UI presentation
  - `lib/`: Utility functions and helpers
- Keep API routes thin - delegate logic to services
- Database queries belong in models, not in API routes or components

### Toast Notifications
- Use `sonner` for all toast notifications
- Import from `sonner` package, not custom implementations

## Deployment

**Vercel** (Recommended):
- Push to main branch for automatic deployment
- Environment variables configured in Vercel dashboard

**Cloudflare Pages**:
- Requires `wrangler.toml` configuration
- Environment variables in `.env.production` and `wrangler.toml`
- Build with `@cloudflare/next-on-pages` adapter
- Deploy: `pnpm cf:deploy`
