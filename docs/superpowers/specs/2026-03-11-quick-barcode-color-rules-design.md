# Quick Barcode Action, Color Rules & UI Fixes Design

## Overview

Three changes to the StorageManagement app:

1. **Quick Barcode Action** — Replace the camera-based Scan page with a floating action button that opens a barcode input dialog for rapid add/remove operations using a USB barcode scanner.
2. **Color Rules** — Replace the hardcoded reagent color coding with user-configurable keyword → color rules managed in Settings.
3. **UI Fixes** — Rename "Ημερολόγιο Δραστηριότητας" to "Κινήσεις" everywhere, and make report tabs full-width.

## 1. Quick Barcode Action

### What's Removed

- `src/pages/ScanPage.tsx`
- `src/components/scanner/ScannerView.tsx`
- `src/components/scanner/ScannedItemCard.tsx`
- Sidebar "Σάρωση" entry and its route: remove `"scan"` from the `Page` type union in `Sidebar.tsx`, remove the `ScanPage` import and render branch in `AppLayout.tsx`
- `html5-qrcode` npm dependency

### What's Added

**`src/components/barcode/BarcodeActionButton.tsx`**

Floating action button rendered in `AppLayout.tsx`, visible on all pages. Positioned bottom-right corner. Opens the `BarcodeActionDialog`. Keyboard shortcut: `F2` (registered in `BarcodeActionButton.tsx` via a global `keydown` listener; suppressed when the dialog is already open).

**`src/components/barcode/BarcodeActionDialog.tsx`**

Modal dialog for rapid barcode operations:

1. Opens with an auto-focused barcode text input field.
2. On Enter/submit: calls `getInventoryByBarcode(barcode)`.
3. **Single match:** Shows item details (barcode, description, current qty) and +/- controls with an amount input field. The add operation reuses `item.description` and `item.locationId` from the lookup result.
4. **Multiple matches (same barcode, different locations):** Shows a location picker listing each location name + quantity. Location names are resolved via `useLocations()` hook (used internally by the dialog). After selection, shows the +/- controls.
5. **No match:** Shows a "Νέο Είδος — Barcode Δεν Βρέθηκε" inline form with barcode pre-filled, description field, quantity field, and location picker (if multiple locations exist).
6. After a successful add/remove/create: resets the barcode input for the next scan. The dialog stays open for successive scans. On operation failure, an inline error message is shown briefly above the controls.
7. User closes the dialog manually via X button or Escape. The "Ακύρωση" button appears on the new-item form (step 5) to cancel creation and return to the barcode input.

### Labels (Greek)

| Element | Text |
|---------|------|
| FAB tooltip | Γρήγορη Σάρωση |
| Dialog title | Γρήγορη Σάρωση |
| Barcode input placeholder | Σαρώστε ή πληκτρολογήστε barcode... |
| Not found heading | Νέο Είδος — Barcode Δεν Βρέθηκε |
| Multiple locations prompt | Αυτό το barcode υπάρχει σε πολλές τοποθεσίες. Επιλέξτε μία: |
| Add button | Προσθήκη |
| Remove button | Αφαίρεση |
| Save (new item) button | Αποθήκευση |
| Cancel button | Ακύρωση |
| Amount label | Ποσότητα |
| Current stock label | Τρέχον Απόθεμα |
| Description label | Περιγραφή |
| Location label | Τοποθεσία |
| Unknown location fallback | Άγνωστη |

## 2. Color Rules

### Database

New table: `color_rules`

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-increment |
| keyword | text | NOT NULL, UNIQUE (COLLATE NOCASE) |
| color | text | NOT NULL — hex string, e.g. `#FF0000` |
| sortOrder | integer | NOT NULL |

### Data Layer

**New file: `src/lib/color-rules.ts`**

- `getAllColorRules(): Promise<ColorRule[]>` — returns all rules ordered by `sortOrder`
- `addColorRule(keyword: string, color: string): Promise<void>` — insert new rule
- `updateColorRule(id: number, data: { keyword?: string; color?: string }): Promise<void>` — edit
- `deleteColorRule(id: number): Promise<void>` — remove
- `reorderColorRules(updates: { id: number; sortOrder: number }[]): Promise<void>` — batch reorder

### Hook

**New file: `src/hooks/useColorRules.ts`**

- Fetches all rules on mount, exposes CRUD operations + a `getItemColor(description: string): string | null` function.
- `getItemColor` iterates rules in sort order, returns the hex color of the first rule whose keyword matches in the description using **word-boundary matching** (case-insensitive). This preserves the existing behavior where "PE" matches "PE", "PE-Cy5", "PE/Cy7" but not "SPECIMEN". Implementation: test with regex `new RegExp("\\b" + escapeRegex(keyword) + "\\b", "i")`. Returns `null` if no match.

### Settings UI

New section in `SettingsPage.tsx`: **"Κανόνες Χρωμάτων"** (placed after the Locations section).

- Description text: "Ορίστε χρώματα βάσει λέξεων-κλειδιών στην περιγραφή. Ο πρώτος κανόνας που ταιριάζει εφαρμόζεται."
- Each rule row: drag handle | keyword text | color swatch | edit button | delete button
- Drag-to-reorder sets rule priority (first match wins)
- Add button ("Προσθήκη") appends a new rule
- Inline editing: keyword input + `<input type="color">` picker + save/cancel
- No new dependencies — uses native HTML color input

### Settings Labels (Greek)

| Element | Text |
|---------|------|
| Section title | Κανόνες Χρωμάτων |
| Section description | Ορίστε χρώματα βάσει λέξεων-κλειδιών στην περιγραφή. Ο πρώτος κανόνας που ταιριάζει εφαρμόζεται. |
| Keyword placeholder | Λέξη-κλειδί... |
| Add button | Προσθήκη |
| Save button | Αποθήκευση |

### Inventory Table Integration

**Replace `getReagentColor()` in `src/components/inventory/columns.tsx`:**

- Remove the hardcoded `getReagentColor()` function.
- `StockPage.tsx` calls `useColorRules()` and passes the `getItemColor` function to `InventoryTable.tsx` via props. `InventoryTable.tsx` forwards it to the table via `meta`.
- `columns.tsx` reads `getItemColor` from `table.options.meta` and applies color via inline `style={{ backgroundColor: color, color: textColor }}` instead of Tailwind classes. `textColor` is auto-computed based on perceived brightness (white text on dark backgrounds, black text on light backgrounds).
- Brightness helper: add `contrastText(hex: string): string` to `utils.ts` — returns `"#fff"` or `"#000"` based on perceived brightness using `L = 0.299*R + 0.587*G + 0.114*B`; returns white if L < 128, black otherwise.

### Pre-seeded Rules

Migrate the three existing hardcoded rules as initial data so current behavior is preserved:

| keyword | color |
|---------|-------|
| perCP | #ea580c |
| FITC | #166534 |
| PE | #dc2626 |

These are inserted in the DB initialization (same pattern as the Default location seed). Users can edit/delete them later.

## 3. UI Fixes

### Rename "Ημερολόγιο Δραστηριότητας" → "Κινήσεις"

| File | What changes |
|------|-------------|
| `Sidebar.tsx` | Nav label |
| `LogPage.tsx` | Page title (`<h1>`) |
| `export.ts` | Sheet name: "Ημερολόγιο Δραστηριότητας" → "Κινήσεις" |
| `export.ts` | Title row: "Αναφορά Δραστηριότητας" → "Αναφορά Κινήσεων" |

### Reports Tabs Full Width

In `ReportsPage.tsx`:
- `TabsList`: add `className="w-full"`
- Each `TabsTrigger`: add `className="flex-1"`

## Implementation Notes

- No new npm dependencies (removing `html5-qrcode` is a net reduction)
- `color_rules` table: add Drizzle schema to `schema.ts` following existing convention (camelCase field names, snake_case SQL column names — e.g., `sortOrder: integer("sort_order")`). Add `CREATE TABLE IF NOT EXISTS color_rules(...)` to the `MIGRATIONS` array in `db.ts`. Seed the three default rules with `INSERT OR IGNORE` in `initDatabase()`, after the migration loop.
- The `BarcodeActionDialog` reuses existing business logic: `getInventoryByBarcode()`, `addInventoryItem()`, `removeQuantity()`, `getNextSortOrder()`. It uses `useLocations()` hook internally to resolve location names.
- The floating button uses a `ScanBarcode` icon from lucide-react
- Color rules drag-and-drop in Settings reuses the `@dnd-kit/core` and `@dnd-kit/sortable` pattern already established in `InventoryTable.tsx`
- `contrastText()` uses the perceived brightness formula (ITU-R BT.601): `L = 0.299*R + 0.587*G + 0.114*B`; returns `"#fff"` if L < 128, `"#000"` otherwise
