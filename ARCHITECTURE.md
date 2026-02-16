# VoltEstimate Pro - Architecture Documentation

**Status:** ✅ Build Passing | **Last Updated:** 2025-02-16

## Folder Structure

```
src/
├── app/                          # Application entry points & pages
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # Vite entry point
│   ├── ProjectsPage.tsx         # Projects list page
│   ├── ProjectDetailPage.tsx    # Single project view
│   ├── BlueprintsPage.tsx       # Blueprints list page
│   ├── EstimatesPage.tsx        # Estimates list page
│   └── SettingsPage.tsx         # Settings page
│
├── features/                     # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginPage.tsx      # Authentication page
│   │   │   └── ProtectedRoute.tsx # Route guard for auth
│   │   ├── hooks/
│   │   │   └── useAuth.ts         # Auth state management
│   │   └── services/
│   │       └── authService.ts     # Auth API calls
│   │
│   ├── projects/
│   │   └── components/
│   │       ├── CreateProjectModal.tsx
│   │       ├── ProjectCard.tsx
│   │       └── ProjectList.tsx
│   │
│   ├── blueprints/
│   │   └── components/
│   │       ├── BlueprintViewer.tsx
│   │       ├── ConflictOverlay.tsx
│   │       └── DeviceInfoPopup.tsx
│   │
│   └── estimates/
│       └── components/
│           ├── EstimateList.tsx
│           └── StatusBadge.tsx
│
├── services/                     # External services
│   ├── supabase.ts              # Supabase client setup
│   ├── database.ts              # Database operations
│   └── aiVisionEngine.ts        # AI vision service
│
├── shared/                       # Shared resources
│   ├── components/
│   │   └── layout/
│   │       ├── AppShell.tsx     # App layout wrapper
│   │       └── Sidebar.tsx      # Navigation sidebar
│   │
│   ├── lib/
│   │   └── store.ts             # Zustand global store
│   │
│   ├── types/
│   │   ├── index.ts             # Core TypeScript types
│   │   └── database.ts          # Database schema types
│   │
│   └── utils/
│       └── validation.ts        # Validation utilities
│
└── index.css                     # Global styles
```

## Key Architectural Decisions

### 1. Feature-Based Organization
- **Why:** Co-locate related code per feature
- **Benefit:** Features are self-contained and easily discoverable
- **Current Features:** auth, projects, blueprints, estimates

### 2. Supabase Integration
- **Auth:** Supabase Auth with email/password
- **Database:** PostgreSQL via Supabase client
- **Types:** Database types defined in `shared/types/database.ts`
- **Security:** Row Level Security (RLS) policies required

### 3. Authentication Flow
```
LoginPage → useAuth → supabase.auth → ProtectedRoute → App
```

### 4. Zustand for State Management
- **Location:** `shared/lib/store.ts`
- **Pattern:** Single global store with feature-specific state
- **Benefits:** 
  - No prop drilling
  - TypeScript-friendly
  - Minimal boilerplate

### 5. Import Conventions
```typescript
// External libraries first
import { useState } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';

// Then shared imports
import { useStore } from '../../shared/lib/store';
import type { Project } from '../../shared/types';

// Then sibling imports
import { ProjectCard } from './ProjectCard';
```

### 6. Type Safety
- All business entities typed in `shared/types/index.ts`
- Database types in `shared/types/database.ts`
- Strict TypeScript mode enabled
- No `any` types allowed

## Build Status

```bash
✓ TypeScript compilation passes
✓ Vite build succeeds
✓ Zero errors, zero warnings
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

See `.env.example` for reference.

## Next Steps (for future development)

1. **Database Schema** - Set up Supabase tables with RLS policies
2. **API Layer** - Replace mock data with real Supabase queries
3. **Feature Stores** - Split store into feature-specific slices
4. **Testing** - Add test utilities and sample tests
5. **Error Handling** - Add global error boundary and toast notifications

## Migration Notes

- All components now use correct relative imports
- Old folders (components/, pages/, stores/, types/, utils/) removed
- Index.html updated to point to new main.tsx location
- Build output verified working
- Auth foundation added with Supabase integration
