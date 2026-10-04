# PLnEX — Planning-to-Execution Bridge
## Shared Application Foundation & Design System

A shared frontend foundation and design system built for **PLnEX** (SIH26122 — Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management for **Oil India Limited**).

---

### 1. Architectural Principles
- **Serious Engineering & Project Controls**: Restrained enterprise interface with high information density, clear typographic hierarchy, and zero futuristic neon/AI decoration.
- **Strict Decoupling**: Zero business logic inside UI components; pure deterministic calculation engines reside in `src/lib/domain/`.
- **API-Ready Contracts**: Standardized generic `ApiResponse<T>`, query params, and asynchronous data state wrappers in `src/types/api.ts` and `src/lib/api/projectService.ts`.
- **Non-Destructive Workspace**: Built in this dedicated, isolated directory (`C:\Users\mk\.gemini\antigravity\scratch\plnex-foundation`) without modifying or merging existing files.

---

### 2. Core Value Chain Workflow
The foundation explicitly maps the 9 stages defined in the specification:
$$\text{PLAN} \rightarrow \text{FIELD} \rightarrow \text{EXTRACT} \rightarrow \text{MATCH} \rightarrow \text{VERIFY} \rightarrow \text{UPDATE} \rightarrow \text{VARIANCE} \rightarrow \text{IMPACT} \rightarrow \text{ACTION}$$

1. **PLAN**: Master schedule baseline import and L1–L6 WBS hierarchy (`/schedule`)
2. **FIELD**: Unstructured site execution data capture (DPRs, diaries, Excel, voice) (`/field`)
3. **EXTRACT**: Entity extraction (Discipline, line, area, quantity, work type) (`/field`)
4. **MATCH**: Explainable AI matching with confidence signals (`/matching`)
5. **VERIFY**: Human-in-the-loop review queue for planner verification (`/matching`)
6. **UPDATE**: Evidence-linked actual progress synchronization & Schedule Twin (`/`)
7. **VARIANCE**: Baseline vs actual start/finish schedule slip calculation (`/`)
8. **IMPACT**: Predecessor dependency chain tracing ("Why is this delayed?") (`/variance`)
9. **ACTION**: Deterministic What-If delay simulator and Project Memory store (`/variance`)

---

### 3. Design Tokens & Visual Tokens
Defined in `src/tokens/`:
- **Background**: `#F7F8FA`
- **Surface**: `#FFFFFF`
- **Primary Text**: `#172033`
- **Secondary Text**: `#596579`
- **Borders**: `#D9DEE5`
- **Primary Accent**: `#176B87`
- **Success**: `#2E7D5B` (`#EDF7F2` bg, `#B8DCC9` border)
- **Warning**: `#D98B32` (`#FDF6ED` bg, `#F0D4A6` border)
- **Critical**: `#B5473C` (`#FBEFEE` bg, `#E4B0AA` border)
- **Information**: `#3B6EA8` (`#EDF2F8` bg, `#B3CBE0` border)
- **Radius**: Restrained 8–12px (`rounded-md`, `rounded-lg`)
- **Typography**: Inter (sans-serif) & JetBrains Mono (monospace metrics)

---

### 4. Shared Component Inventory

#### Shell Components (`src/components/shell/`)
- `AppShell`: Layout shell orchestrating navigation, header, drawer, and global state
- `Sidebar`: 9-stage pipeline navigation with collapse toggle and role-based badges
- `TopHeader`: Brand banner, project switcher, search trigger, state simulator, and user menu
- `ProjectSelector`: Dropdown switcher for portfolio projects (e.g. Duliajan Gas Processing)
- `GlobalSearch`: ⌘K command palette for activities, DPRs, line numbers, and events
- `NotificationCenter`: Critical schedule alerts, delays, and review queue notifications
- `UserMenu`: Role selector simulating Manager, Site Engineer, Admin, and Viewer
- `Breadcrumbs`: Accessible hierarchical route navigation

#### Shared UI Components (`src/components/shared/`)
- `PageHeader`: Title, stage badge, action buttons, and project metadata
- `FilterBar`: Universal search input, discipline/status selectors, and reset actions
- `DataTable`: Generic `<T>` table with sorting, row selection, pagination, and sticky headers
- `StatusBadge`: Semantic badge for Activity and Event lifecycle statuses
- `ConfidenceBadge`: AI matching confidence score with threshold categories ($\ge 90\%$, $70\text{--}89\%$, $< 70\%$)
- `ProgressBar`: Dual-layer bar comparing actual progress against baseline planned targets
- `VarianceBadge`: Schedule variance indicator ($+2\text{ days}$, slip, ahead)
- `EmptyState`: Enterprise empty state with primary/secondary actions
- `LoadingState`: Clean skeleton and spinner loader states
- `ErrorState`: Failure boundary with error code, message, and retry button
- `ProcessingState`: Asynchronous multi-step pipeline progress indicator
- `Modal`: Accessible centered dialog with backdrop and action footer
- `Drawer`: Slide-over inspection drawer for deep activity details and evidence
- `Toast`: Global notification toast stack with auto-dismiss
- `ConfirmationDialog`: High-impact confirmation modal for schedule overrides and rejections
- `PermissionDenied`: RBAC access violation view
- `StateWrapper`: Viewport wrapper enabling 1-click preview of all state variants

---

### 5. Running the Application
```bash
cd C:\Users\mk\.gemini\antigravity\scratch\plnex-foundation
npm run build   # Successfully compiles and verifies all routes
npm run dev     # Starts development server on http://localhost:3000
```
