# PLnEX — Planning-to-Execution Bridge
### Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management
#### Developed for Oil India Limited (Smart India Hackathon — SIH26122)

[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.6-blue?logo=capacitor)](https://capacitorjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Live Demo:** [https://out-4h3e6w3tu-jatin-2525.vercel.app](https://out-4h3e6w3tu-jatin-2525.vercel.app)

---

## 📌 Executive Summary

Large-scale oil and gas capital projects (such as the Duliajan Gas Processing Plant) suffer from the classic **"Planning-Execution Disconnect"**: baseline schedules reside in siloed Primavera P6 / MS Project desktop files, while site execution happens via daily progress reports (DPRs), contractor logbooks, unstructured WhatsApp updates, and paper shift handover notes.

**PLnEX** closes this loop by serving as an intelligent, explainable data ingestion and schedule-linking bridge that transforms field execution data into verified, evidence-backed schedule updates, critical path slip calculations, and deterministic what-if delay impact assessments.

---

## 🔄 Core Value Chain (The 9-Stage Pipeline)

PLnEX structures industrial project control into nine traceable, verifiable stages:

```
PLAN ➔ FIELD ➔ EXTRACT ➔ MATCH ➔ VERIFY ➔ UPDATE ➔ VARIANCE ➔ IMPACT ➔ ACTION
```

| Stage | Key Capability | Primary Route |
|:---|:---|:---|
| **1. PLAN** | Master schedule baseline import, CPM critical path, and L1–L6 WBS hierarchy | `/schedule`, `/schedule-twin` |
| **2. FIELD** | Multi-modal site data capture (DPRs, diaries, photos with GPS metadata, voice notes) | `/field`, `/field/capture`, `/field/dpr` |
| **3. EXTRACT** | Entity extraction (Discipline, line numbers, isometric sheets, work packages, quantities) | `/field`, `/execution` |
| **4. MATCH** | Explainable AI schedule-activity matching with confidence signals ($\ge 90\%$, $70\text{--}89\%$, $< 70\%$) | `/matching` |
| **5. VERIFY** | Human-in-the-loop verification queue for project planners (Approve / Reject / Remap) | `/review` |
| **6. UPDATE** | Immutable evidence-linked actual progress synchronization and Schedule Twin | `/schedule-twin`, `/sync` |
| **7. VARIANCE**| Deterministic baseline vs actual start/finish slip, S-Curve variance, milestone tracking | `/variance`, `/dashboard` |
| **8. IMPACT** | Predecessor dependency chain tracing ("Why is this delayed?") & critical path propagation | `/variance`, `/risks` |
| **9. ACTION** | Deterministic What-If scenario modeling, mitigation strategies, and Project Memory | `/what-if`, `/reports` |

---

## 👥 Role-Based Experience Architecture

PLnEX strictly segregates persona workspaces to preserve cognitive clarity:

### 1. Project Manager Workspace (`/dashboard`)
- **Primary Persona Question**: *"Is the project on track, and what requires my decision right now?"*
- **Key Features**:
  - Full-fidelity Planned vs. Actual vs. Forecast **S-Curve** with variance metrics
  - High-level executive KPI cards (Schedule Health, Verified Progress, Critical Path Slip, Activities At Risk)
  - Action-oriented **"What Needs My Attention"** decision panel (unmatched events, critical delay cards, flagged evidence)
  - Schedule Variance Control Table with instant Activity Detail inspection drawer
  - Discipline breakdown progress bars (Civil, Piping, Mechanical, Electrical, Instrumentation)
  - Human-in-the-loop review queue for one-click approval / rejection of matched field items

### 2. Site Engineer Workspace (`/engineer`)
- **Primary Persona Question**: *"What work needs to happen in my assigned zone today, and how do I log progress?"*
- **Key Features**:
  - Offline-first execution banner with pending sync queue counters
  - Today's operational focus: Assigned tasks filtered by zone/shift (Civil, Piping, E&I)
  - Fast-action field buttons: **Capture Work**, **Create / Continue DPR**, **Add Site Evidence**
  - Live progress sliders with target indicators
  - Pending verification status tracker
  - Field media and GPS-tagged photo evidence grid
  - Shift summary, manpower headcount, and heavy plant equipment utilization

### 3. Governance & System Administrator (`/admin`)
- System health, baseline schedule locking, DCMA 14-point schedule integrity metrics
- User directory, organization management, joint venture partners
- Explicit role switcher for cross-persona auditing

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16.3.8](https://nextjs.org/) (App Router, Turbopack, Static Export `output: 'export'`)
- **Language**: [TypeScript 5.x](https://www.typescriptlang.org/) (Strict type checking, zero runtime exceptions)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) with enterprise color tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Mobile Runtime**: [Capacitor 8.6](https://capacitorjs.com/) with native Android wrapper
- **State & Storage**: React Context API (`AppContext`, `ToastContext`, `OfflineContext`) + LocalStorage persistence
- **Deployment**: [Vercel](https://vercel.com/) (Edge CDN static export)

---

## 🎨 Enterprise Design System Tokens

PLnEX strictly enforces an industrial, high-density, WCAG 2.1 AA compliant design system:

| Token Name | Hex Code | Semantic Purpose |
|:---|:---|:---|
| **Background** | `#F7F8FA` | Low-strain industrial neutral backdrop |
| **Surface** | `#FFFFFF` | Card and drawer containers |
| **Primary Text** | `#172033` | High-contrast typography |
| **Secondary Text** | `#596579` | Metadata, captions, secondary labels |
| **Border / Divider** | `#D9DEE5` | Structural boundaries and table borders |
| **Brand Accent** | `#176B87` | Deep petroleum teal for primary actions |
| **Success / Verified**| `#2E7D5B` | Completed activities, approved matches |
| **Warning / At Risk** | `#D98B32` | Schedule variance warnings, pending reviews |
| **Critical / Delayed** | `#B5473C` | Critical path delays, rejected matches |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18.0 or v20.x or higher
- **npm**: v9.x or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jatin-2525/plnex-foundation.git
   cd plnex-foundation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build & Verification:**
   ```bash
   npm run build
   ```
   Generates a fully verified static export bundle in the `out/` folder across all 46 routes with 0 TypeScript errors.

---

## 📱 Android App (Capacitor)

PLnEX includes a pre-configured native Android wrapper for rugged site tablets:

```bash
# Sync web build to Android platform
npx cap sync android

# Open Android project in Android Studio
npx cap open android
```

---

## 🔐 Demo Credentials

Use any of the following accounts to experience role-specific workspaces:

| Persona | Email | Password | Default Workspace |
|:---|:---|:---|:---|
| **Project Manager** | `rajesh.sharma@oilindia.in` | `Project2026!` | `/dashboard` |
| **Site Engineer** | `debajit.borah@oilindia.in` | `Field2026!` | `/engineer` |
| **Administrator** | `admin@oilindia.in` | `Admin2026!` | `/admin` |

*(Quick-fill buttons are also available directly on the login page at `/login`)*

---

## 📂 Project Directory Structure

```text
plnex-foundation/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI build pipeline
├── android/                     # Capacitor native Android project
├── public/                      # Static assets, logos, and icons
├── scripts/                     # Verification and integrity scripts
├── src/
│   ├── app/                     # Next.js App Router (46 production routes)
│   │   ├── admin/               # System administration & governance
│   │   ├── dashboard/           # Project Manager Control Dashboard
│   │   ├── engineer/            # Site Engineer Field Workspace
│   │   ├── evidence/            # Evidence ledger & media audit trail
│   │   ├── execution/           # Real-time execution stream
│   │   ├── field/               # Field capture & DPR creation
│   │   ├── matching/            # AI Match inspection & confidence scores
│   │   ├── review/              # Verification queue
│   │   ├── schedule/            # Master baseline schedule & Gantt
│   │   ├── schedule-twin/       # Digital Twin sync
│   │   ├── showcase/            # UI Design system showcase
│   │   ├── variance/            # S-Curve & critical path slip
│   │   └── what-if/             # What-if delay simulator
│   ├── components/
│   │   ├── shared/              # Reusable UI components (DataTable, Modal, StatusBadge...)
│   │   └── shell/               # AppShell, Sidebar, TopHeader, UserMenu
│   ├── context/                 # AppContext, ToastContext, OfflineContext
│   ├── lib/                     # Domain calculations, mock data, auth service
│   ├── tokens/                  # Design tokens (colors, typography, spacing)
│   └── types/                   # TypeScript interfaces, permissions, API contracts
├── capacitor.config.ts          # Capacitor mobile config
├── next.config.mjs              # Next.js static export configuration
├── package.json                 # Project dependencies & scripts
├── tailwind.config.ts           # Tailwind theme & design tokens
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🏆 Acknowledgments

- **Smart India Hackathon (SIH26122)**
- **Oil India Limited (OIL)** — Problem Statement Sponsor
