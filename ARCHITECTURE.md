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
├── shared/                       # Shared resources
│   ├── components/
│   │   └── layout/
│   │       ├── AppShell.tsx     # App layout wrapper
│   │       └── Sidebar.tsx      # Navigation sidebar
│   │
│   ├── lib/
│   │   └── store.ts             # Zustand store
│   │
│   ├── types/
│   │   └── index.ts             # Core TypeScript types
│   │
│   └── utils/
│       └── validation.ts        # Validation utilities
│
└── services/                     # External services
    └── aiVisionEngine.ts        # AI vision service
```

## Key Architectural Decisions

### 1. Feature-Based Organization
- **Why:** Co-locate related code per feature
- **Benefit:** Features are self-contained and easily discoverable
- **Current Features:** projects, blueprints, estimates

### 2. Zustand for State Management
- **Location:** `shared/lib/store.ts`
- **Pattern:** Single global store with feature-specific state
- **Benefits:** 
  - No prop drilling
  - TypeScript-friendly
  - Minimal boilerplate

### 3. Import Conventions
```typescript
// External libraries first
import { useState } from 'react';

// Then shared imports
import { useStore } from '../../shared/lib/store';
import type { Project } from '../../shared/types';

// Then sibling imports
import { ProjectCard } from './ProjectCard';
```

### 4. Type Safety
- All business entities typed in `shared/types/index.ts`
- Strict TypeScript mode enabled
- No `any` types allowed

## Build Status

```bash
✓ TypeScript compilation passes
✓ Vite build succeeds
✓ Zero errors, zero warnings
```

## Next Steps (for future development)

1. **Auth Feature** - Add authentication with Supabase
2. **API Layer** - Create service layer for Supabase integration
3. **Route Guards** - Add ProtectedRoute for authenticated routes
4. **Feature Stores** - Split store into feature-specific slices
5. **Testing** - Add test utilities and sample tests

## Migration Notes

- All components now use correct relative imports
- Old folders (components/, pages/, stores/, types/, utils/) removed
- Index.html updated to point to new main.tsx location
- Build output verified working
