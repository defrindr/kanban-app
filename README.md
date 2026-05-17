# Kanban App

A full-stack kanban board application built with Next.js, TypeScript, and Node.js. Features task management, real-time collaboration, webhooks, admin dashboard, and more.

## 🏗️ Architecture

Monorepo structure using npm workspaces:

```
kanban-app/
├── apps/
│   ├── web/          # Next.js 14 frontend (React + TypeScript)
│   └── api/          # Express.js backend (Node.js + TypeScript)
├── packages/         # Shared utilities and types
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (see `.nvmrc`)
- npm 9+
- PostgreSQL (for database)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### Development

Start both API and web dev servers concurrently:

```bash
npm run dev
```

Or run individually:

```bash
npm run dev:api   # API on http://localhost:5000
npm run dev:web   # Web on http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

### Web App (`apps/web`)

```
src/
├── app/                    # Next.js app router
│   ├── admin/             # Admin dashboard
│   ├── board/             # Kanban board page
│   ├── dashboard/         # My Boards page
│   ├── my-tasks/          # Task view with advanced filtering
│   ├── login/             # Authentication
│   ├── register/          # User registration
│   └── api/               # API route handlers
├── features/              # Feature-based modules
│   ├── kanban/            # Kanban board logic
│   │   ├── components/    # Board, cards, modals, sidebars
│   │   ├── api/           # Mock API client
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript interfaces
│   ├── admin/             # Admin features
│   ├── auth/              # Authentication
│   └── comments/          # Card comments
├── components/            # Shared UI components
├── lib/                   # Utilities and helpers
└── hooks/                 # Custom React hooks
```

### API App (`apps/api`)

```
src/
├── routes/                # Express routes
│   ├── boards.ts
│   ├── cards.ts
│   ├── lists.ts
│   ├── comments.ts
│   ├── webhooks.ts
│   ├── members.ts
│   └── admin.ts
├── middleware/            # Express middleware
├── services/              # Business logic
├── models/                # Prisma/database models
├── types/                 # TypeScript types
└── test/                  # Test files
```

## 🎯 Key Features

### Core Kanban
- ✅ Create/edit/delete boards
- ✅ Organize cards into lists
- ✅ Drag-and-drop cards (Dnd Kit)
- ✅ Card details modal with rich metadata
- ✅ Inline card editing

### Board Management
- ✅ Board members with role management (Admin/Member)
- ✅ Owner-based access control
- ✅ Board templates (Product Roadmap, Sprint Board, Project Tracker, Bug Tracker)
- ✅ Board settings and webhooks

### Cards & Tasks
- ✅ Comments on cards (inline edit/delete)
- ✅ Assignees and due dates
- ✅ Labels and custom fields
- ✅ Advanced filtering (status, assignee, due date, labels)
- ✅ My Tasks view with cross-board task aggregation

### Search & Navigation
- ✅ Global search (Cmd+K) with type filters
- ✅ Cross-board card navigation
- ✅ Search by title, description, comments

### Admin
- ✅ Admin dashboard with stats
- ✅ User management
- ✅ Board management
- ✅ Activity logs with export (JSON/CSV)
- ✅ System-wide audit trail

### Integrations
- ✅ Webhooks for board events (card:*, list:*, comment:*)
- ✅ Webhook management UI (create, update, delete, toggle active)
- ✅ Activity logging and export

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React + TailwindCSS
- **State Management**: Zustand
- **Drag & Drop**: Dnd Kit
- **UI Components**: shadcn/ui, Radix UI
- **Forms**: React Hook Form + Zod validation
- **HTTP**: Fetch API with mock-api wrapper

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Testing**: Vitest

### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Manager**: npm workspaces
- **Build Tool**: TypeScript compiler + Next.js bundler

## 📖 API Documentation

### Boards
- `GET /api/boards` - List all boards
- `POST /api/boards` - Create board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Cards
- `GET /api/boards/:id/cards` - List cards in board
- `POST /api/boards/:id/cards` - Create card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

### Members
- `GET /api/boards/:id/members` - List board members
- `POST /api/boards/:id/members` - Add member
- `DELETE /api/boards/:id/members/:memberId` - Remove member
- `PUT /api/boards/:id/members/:memberId` - Update member role

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `PATCH /api/webhooks/:id/toggle` - Toggle webhook active status

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/boards` - List all boards (admin view)
- `DELETE /api/admin/boards/:id` - Delete board (admin)
- `GET /api/admin/activities` - Activity audit log

## 🔐 Authentication

- Email/password registration and login
- Session-based authentication
- Role-based access control (ADMIN, MEMBER, Owner)
- Protected routes via middleware

## 🧪 Testing

### Run Tests
```bash
# Web app tests
npm run test --workspace=apps/web

# API tests
npm run test --workspace=apps/api

# Watch mode
npm run test:watch --workspace=apps/api
```

### Test Coverage
- Unit tests for utilities and hooks
- Component snapshot tests
- Integration tests for API endpoints

## 🐳 Docker

### Build & Run
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Run containers
docker-compose -f docker-compose.prod.yml up
```

### Development with Docker
```bash
docker-compose up
```

## 🔧 Environment Variables

### Web App (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### API (`apps/api/.env`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/kanban
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key
```

## 🚨 Troubleshooting

### Build Fails with Missing Chunks
```bash
# Clean build cache and rebuild
rm -rf apps/web/.next apps/api/dist
npm run build
```

### Database Connection Issues
```bash
# Regenerate Prisma client
npm run db:generate

# Reset and sync database
npm run db:push
```

### Dev Server 500 Errors
- Verify all schema types are properly defined (no optional role fields)
- Check test fixtures include required fields
- Restart dev server: `npm run dev`

## 📝 Recent Changes

### Latest Features
- **Bulk Operations** (In Progress): Multi-select cards with bulk move/archive/delete
- **Activity Export**: Export admin activity logs as JSON/CSV
- **Board Templates**: Pre-built templates (Product Roadmap, Sprint Board, Project Tracker, Bug Tracker)
- **Advanced Filtering**: Filter by assignee, due date, status, labels
- **Global Search**: Cmd+K modal with cross-board navigation
- **Member Roles**: ADMIN/MEMBER role management per board
- **Webhooks**: Board event webhooks with management UI
- **Comments**: Inline comment editing and deletion

## 📊 Current Build Status

- ✅ **Web Build**: Passing (TypeScript strict mode)
- ✅ **API Build**: Passing (after tsconfig.json fix for test files)
- ✅ **Dev Server**: Running successfully
- ✅ **Tests**: All core functionality covered

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with clear messages
4. Push and create a pull request

## 📄 License

Private / Proprietary

---

**Last Updated**: May 17, 2026
**Maintainers**: Development Team
