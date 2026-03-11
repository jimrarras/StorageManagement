# StorageManagement

A desktop inventory management application built for the Molecular Biology Unit of the Hematology Laboratory, PGNI Hospital of Ioannina. Tracks reagent stock levels, logs all activity, and supports barcode scanning for fast item lookup.

## Features

- **Inventory management** -- add, edit, delete, and reorder reagent stock
- **Barcode scanner** -- camera-based scanning for quick item lookup
- **Activity log** -- every change is recorded for full traceability
- **Multi-location support** -- manage stock across multiple storage locations with transfers
- **Dashboard** -- KPI cards, stock movement charts, low-stock alerts, and most-used reagents
- **Reports** -- inventory snapshots, movement history, low-stock, and usage reports with date filtering
- **Import / Export** -- CSV import and XLSX export for inventory, activity logs, and reports
- **Drag-and-drop reordering** -- rearrange inventory rows manually
- **Global search** -- filter across all views instantly

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | [Tauri 2](https://tauri.app/) (Rust) |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | SQLite via `@tauri-apps/plugin-sql` |
| ORM | Drizzle ORM |
| Charts | Tremor |
| Tables | TanStack Table |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run in development mode (opens the desktop app with hot reload)
pnpm tauri dev

# Build for production
pnpm tauri build
```

The production build outputs a portable `.exe` in `src-tauri/target/release/`.
