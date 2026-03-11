# Greek Translation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate all user-facing English text to Greek across the entire StorageManagement app.

**Architecture:** Direct string replacement — no i18n framework, no translations file. Two small helper functions (`actionLabel`, `statusLabel`) in `utils.ts` for mapping DB enum values to Greek display text. Everything else is inline string replacement.

**Tech Stack:** React 19, TypeScript, Tauri 2 (no new dependencies)

**Spec:** `docs/superpowers/specs/2026-03-11-greek-translation-design.md`

**Testing:** No unit tests — this is purely cosmetic string replacement with no logic changes. Verify by running `pnpm tauri dev` and visually checking each page after each task.

---

## Chunk 1: Foundation & Config

### Task 1: Create display helper functions in utils.ts

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Add `actionLabel()` and `statusLabel()` to utils.ts**

After the existing `cn()` function, add:

```typescript
const actionLabels: Record<string, string> = {
  ADD: "Προσθήκη",
  REMOVE: "Αφαίρεση",
  EDIT: "Επεξεργασία",
  DELETE: "Διαγραφή",
  TRANSFER: "Μεταφορά",
};

export function actionLabel(action: string): string {
  return actionLabels[action] ?? action;
}

const statusLabels: Record<string, string> = {
  OK: "Επαρκές",
  Low: "Χαμηλό",
  Depleted: "Εξαντλημένο",
};

export function statusLabel(status: string): string {
  return statusLabels[status] ?? status;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat(i18n): add actionLabel and statusLabel Greek display helpers"
```

---

### Task 2: Translate config files (index.html, tauri.conf.json)

**Files:**
- Modify: `index.html`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Update index.html**

Change `lang="en"` to `lang="el"` and title to `Διαχείριση Αποθήκης`:

```html
<html lang="el">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Διαχείριση Αποθήκης</title>
  </head>
```

- [ ] **Step 2: Update tauri.conf.json window title**

Change line 15:
```json
"title": "Διαχείριση Αποθήκης",
```

- [ ] **Step 3: Commit**

```bash
git add index.html src-tauri/tauri.conf.json
git commit -m "feat(i18n): translate HTML and Tauri config to Greek"
```

---

## Chunk 2: Layout & Navigation

### Task 3: Translate Sidebar, AppLayout, SearchBar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/components/layout/SearchBar.tsx`

- [ ] **Step 1: Translate Sidebar.tsx**

Replace nav item labels (lines 8-13):
```typescript
const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Πίνακας Ελέγχου", icon: LayoutDashboard },
  { page: "stock", label: "Απόθεμα", icon: Package },
  { page: "log", label: "Ημερολόγιο Δραστηριότητας", icon: ScrollText },
  { page: "reports", label: "Αναφορές", icon: FileBarChart },
  { page: "scan", label: "Σάρωση", icon: ScanBarcode },
];
```

Replace app title (line 23):
```tsx
<h2 className="mb-6 text-lg font-semibold">Διαχείριση Αποθήκης</h2>
```

Replace Settings button text (line 44):
```tsx
        Ρυθμίσεις
```

- [ ] **Step 2: Translate AppLayout.tsx**

Replace search placeholders (line 29):
```tsx
placeholder={currentPage === "stock" ? "Αναζήτηση barcode ή περιγραφής..." : "Αναζήτηση barcode ή ημερομηνίας..."}
```

- [ ] **Step 3: Translate SearchBar.tsx**

Replace default placeholder (line 10):
```tsx
export function SearchBar({ value, onChange, placeholder = "Αναζήτηση..." }: SearchBarProps) {
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/AppLayout.tsx src/components/layout/SearchBar.tsx
git commit -m "feat(i18n): translate layout and navigation to Greek"
```

---

## Chunk 3: Inventory Components

### Task 4: Translate inventory columns, table, dialog, transfer, location filter

**Files:**
- Modify: `src/components/inventory/columns.tsx`
- Modify: `src/components/inventory/InventoryTable.tsx`
- Modify: `src/components/inventory/ItemDialog.tsx`
- Modify: `src/components/inventory/TransferDialog.tsx`
- Modify: `src/components/inventory/LocationFilter.tsx`

- [ ] **Step 1: Translate inventory/columns.tsx**

Replace column headers (lines 27, 32, 41, 54):
```typescript
    header: "Barcode",    // line 27 — keep as-is
    header: "Τοποθεσία",  // line 32 — was "Location"
    header: "Περιγραφή",  // line 41 — was "Description"
    header: "Ποσότητα",   // line 54 — was "Quantity"
```

- [ ] **Step 2: Translate InventoryTable.tsx**

Replace empty state (line 173):
```tsx
                No items found.
```
→
```tsx
                Δεν βρέθηκαν είδη.
```

- [ ] **Step 3: Translate ItemDialog.tsx**

Replace form labels (lines 53, 56, 61):
- `Barcode` stays as `Barcode`
- `Description` → `Περιγραφή`
- `Quantity` → `Ποσότητα`

Replace button text (lines 65-66):
- `Cancel` → `Ακύρωση`
- `Save` → `Αποθήκευση`

- [ ] **Step 4: Translate TransferDialog.tsx**

Replace dialog title (line 84):
```tsx
          <DialogTitle>Μεταφορά Είδους</DialogTitle>
```

Replace "Available:" (line 91):
```tsx
                {item.barcode} — Διαθέσιμα: {item.quantity}
```

Replace "Destination Location" label (line 96):
```tsx
              <Label>Τοποθεσία Προορισμού</Label>
```

Replace "Select location..." placeholder (line 102):
```tsx
                  <SelectValue placeholder="Επιλέξτε τοποθεσία..." />
```

Replace "Quantity" label (line 115):
```tsx
              <Label htmlFor="transfer-qty">Ποσότητα</Label>
```

Replace button text (lines 131, 142):
- `Cancel` → `Ακύρωση`
- `Transfer` → `Μεταφορά`

- [ ] **Step 5: Translate LocationFilter.tsx**

Replace "All Locations" (lines 27, 30):
```tsx
        <SelectValue placeholder="Όλες οι Τοποθεσίες" />
        ...
        <SelectItem value="all">Όλες οι Τοποθεσίες</SelectItem>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/inventory/columns.tsx src/components/inventory/InventoryTable.tsx src/components/inventory/ItemDialog.tsx src/components/inventory/TransferDialog.tsx src/components/inventory/LocationFilter.tsx
git commit -m "feat(i18n): translate inventory components to Greek"
```

---

## Chunk 4: Dashboard Components

### Task 5: Translate KpiCards, StockMovementChart, LowStockList, MostUsedChart

**Files:**
- Modify: `src/components/dashboard/KpiCards.tsx`
- Modify: `src/components/dashboard/StockMovementChart.tsx`
- Modify: `src/lib/analytics.ts` (rename DailyMovement keys to match Greek chart categories)
- Modify: `src/components/dashboard/LowStockList.tsx`
- Modify: `src/components/dashboard/MostUsedChart.tsx`

- [ ] **Step 1: Translate KpiCards.tsx**

Replace kpi labels (lines 11-15):
```typescript
const kpis = [
  { key: "totalItems", label: "Μοναδικά Είδη", icon: Package, color: "text-blue-600" },
  { key: "totalQuantity", label: "Σύνολο σε Απόθεμα", icon: Archive, color: "text-green-600" },
  { key: "lowStockCount", label: "Χαμηλό Απόθεμα", icon: AlertTriangle, color: "text-amber-600" },
  { key: "itemsAddedThisMonth", label: "Προσθήκες Μήνα", icon: TrendingUp, color: "text-purple-600" },
] as const;
```

- [ ] **Step 2: Translate StockMovementChart.tsx**

Replace chart title (line 17):
```tsx
        <h3 className="font-semibold">Κίνηση Αποθέματος</h3>
```

Replace day selector format (line 26):
```tsx
              {d}ημ
```

Replace chart categories (line 34):
```tsx
        categories={["προσθήκες", "αφαιρέσεις"]}
```

- [ ] **Step 3: Rename DailyMovement keys in analytics.ts (MUST be atomic with Step 2)**

The Tremor `AreaChart` categories must match the data object keys exactly. Since we changed categories to Greek, the data keys must also change.

In `src/lib/analytics.ts`, update the `DailyMovement` interface (lines 87-91):
```typescript
export interface DailyMovement {
  date: string;
  "προσθήκες": number;
  "αφαιρέσεις": number;
}
```

Update the pivot logic in `getStockMovement()` (lines 127-133):
```typescript
    const existing = map.get(row.date) ?? {
      date: row.date,
      "προσθήκες": 0,
      "αφαιρέσεις": 0,
    };
    if (row.action === "ADD") existing["προσθήκες"] = row.total;
    if (row.action === "REMOVE") existing["αφαιρέσεις"] = row.total;
```

- [ ] **Step 4: Translate LowStockList.tsx**

Replace title (line 31):
```tsx
        <h3 className="font-semibold">Είδη σε Χαμηλό Απόθεμα</h3>
```

Replace empty state (line 34):
```tsx
        <p className="text-sm text-muted-foreground">Όλα τα είδη έχουν επαρκές απόθεμα.</p>
```

Replace table headers (lines 40-42):
- `Description` → `Περιγραφή`
- `Location` → `Τοποθεσία`
- `Qty` → `Ποσ.`

- [ ] **Step 5: Translate MostUsedChart.tsx**

Replace title (line 19):
```tsx
        <h3 className="font-semibold">Πιο Χρησιμοποιημένα Αντιδραστήρια</h3>
```

Replace empty state (line 22):
```tsx
        <p className="text-sm text-muted-foreground">Δεν υπάρχουν δεδομένα χρήσης.</p>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/KpiCards.tsx src/components/dashboard/StockMovementChart.tsx src/lib/analytics.ts src/components/dashboard/LowStockList.tsx src/components/dashboard/MostUsedChart.tsx
git commit -m "feat(i18n): translate dashboard components and chart data keys to Greek"
```

---

## Chunk 5: Activity Components

### Task 6: Translate activity columns and table

**Files:**
- Modify: `src/components/activity/columns.tsx`
- Modify: `src/components/activity/ActivityTable.tsx`

- [ ] **Step 1: Translate activity/columns.tsx**

Add import at top:
```typescript
import { actionLabel } from "@/lib/utils";
```

Replace column headers:
- `"Date/Time"` → `"Ημερομηνία/Ώρα"` (line 16)
- `"Barcode"` stays as `"Barcode"` (line 25)
- `"Action"` → `"Ενέργεια"` (line 30)
- `"Qty Change"` → `"Μεταβολή Ποσ."` (line 39)
- `"Location"` → `"Τοποθεσία"` (line 49)

Replace action badge display (line 33):
```tsx
      return <Badge className={actionColors[action] ?? ""}>{actionLabel(action)}</Badge>;
```

- [ ] **Step 2: Translate ActivityTable.tsx**

Replace empty state (lines 55-56):
```tsx
                No activity recorded yet.
```
→
```tsx
                Δεν έχει καταγραφεί δραστηριότητα.
```

- [ ] **Step 3: Commit**

```bash
git add src/components/activity/columns.tsx src/components/activity/ActivityTable.tsx
git commit -m "feat(i18n): translate activity components to Greek"
```

---

## Chunk 6: Report Components

### Task 7: Translate DateRangeBar and all report sub-components

**Files:**
- Modify: `src/components/reports/DateRangeBar.tsx`
- Modify: `src/components/reports/InventorySnapshot.tsx`
- Modify: `src/components/reports/MovementReport.tsx`
- Modify: `src/components/reports/LowStockHistory.tsx`
- Modify: `src/components/reports/UsageReport.tsx`

- [ ] **Step 1: Translate DateRangeBar.tsx**

Replace preset labels (lines 4-10):
```typescript
const presets: { key: DatePreset; label: string }[] = [
  { key: "this_week", label: "Αυτή την Εβδομάδα" },
  { key: "this_month", label: "Αυτόν τον Μήνα" },
  { key: "last_30", label: "30 Ημέρες" },
  { key: "last_90", label: "90 Ημέρες" },
  { key: "this_year", label: "Φέτος" },
];
```

- [ ] **Step 2: Translate InventorySnapshot.tsx**

Replace empty state (line 19):
```tsx
        No inventory items found.
```
→
```tsx
        Δεν βρέθηκαν είδη αποθέματος.
```

Replace table headers (lines 45-48):
- `Barcode` stays as `Barcode`
- `Description` → `Περιγραφή`
- `Quantity` → `Ποσότητα`
- `Last Updated` → `Τελευταία Ενημέρωση`

- [ ] **Step 3: Translate MovementReport.tsx**

Replace empty state (line 23):
```tsx
        No movement recorded in this period.
```
→
```tsx
        Δεν καταγράφηκαν κινήσεις σε αυτήν την περίοδο.
```

Replace table headers (lines 32-38):
- `Barcode` stays
- `Description` → `Περιγραφή`
- `Added` → `Προσθήκες`
- `Removed` → `Αφαιρέσεις`
- `Transfers In` → `Εισερχόμενες Μεταφορές`
- `Transfers Out` → `Εξερχόμενες Μεταφορές`
- `Net Change` → `Καθαρή Μεταβολή`

- [ ] **Step 4: Translate LowStockHistory.tsx**

Add import at top:
```typescript
import { statusLabel } from "@/lib/utils";
```

Replace empty state (line 25):
```tsx
        No items went below threshold in this period.
```
→
```tsx
        Κανένα είδος δεν έπεσε κάτω από το όριο σε αυτήν την περίοδο.
```

Replace table headers (lines 35-41):
- `Barcode` stays
- `Description` → `Περιγραφή`
- `Location` → `Τοποθεσία`
- `Times Below` → `Φορές Κάτω`
- `Days Below` → `Ημέρες Κάτω`
- `Current Qty` → `Τρέχουσα Ποσ.`
- `Status` → `Κατάσταση`

Replace badge display (line 63) — keep `statusStyles[row.status]` (English key for styling), but display Greek:
```tsx
              <Badge className={statusStyles[row.status]}>
                {statusLabel(row.status)}
              </Badge>
```

- [ ] **Step 5: Translate UsageReport.tsx**

Replace `formatDepletion` function (lines 15-19):
```typescript
function formatDepletion(days: number | null): string {
  if (days === null) return "Δ/Υ";
  if (days === 0) return "Εξαντλημένο";
  return `${days} ημέρες`;
}
```

Replace empty state (line 32):
```tsx
        No reagent usage recorded in this period.
```
→
```tsx
        Δεν καταγράφηκε χρήση αντιδραστηρίων σε αυτήν την περίοδο.
```

Replace table headers (lines 42-47):
- `Barcode` stays
- `Description` → `Περιγραφή`
- `Current Qty` → `Τρέχουσα Ποσ.`
- `Total Consumed` → `Συνολική Κατανάλωση`
- `Avg Daily Usage` → `Μέση Ημερήσια Χρήση`
- `Est. Depletion` → `Εκτ. Εξάντληση`

- [ ] **Step 6: Commit**

```bash
git add src/components/reports/DateRangeBar.tsx src/components/reports/InventorySnapshot.tsx src/components/reports/MovementReport.tsx src/components/reports/LowStockHistory.tsx src/components/reports/UsageReport.tsx
git commit -m "feat(i18n): translate report components to Greek"
```

---

## Chunk 7: Scanner Components

### Task 8: Translate ScannerView and ScannedItemCard

**Files:**
- Modify: `src/components/scanner/ScannerView.tsx`
- Modify: `src/components/scanner/ScannedItemCard.tsx`

- [ ] **Step 1: Translate ScannerView.tsx**

Replace camera error prefix (line 33):
```tsx
      .catch((err) => setError(`Σφάλμα κάμερας: ${err}`));
```

- [ ] **Step 2: Translate ScannedItemCard.tsx**

Replace labels (lines 20, 24, 28, 33):
- `Barcode` stays as `Barcode`
- `Description` → `Περιγραφή`
- `Current Stock` → `Τρέχον Απόθεμα`
- `Amount` → `Ποσότητα`

Replace button text (lines 44, 47):
- `Add` → `Προσθήκη`
- `Remove` → `Αφαίρεση`

- [ ] **Step 3: Commit**

```bash
git add src/components/scanner/ScannerView.tsx src/components/scanner/ScannedItemCard.tsx
git commit -m "feat(i18n): translate scanner components to Greek"
```

---

## Chunk 8: Pages

### Task 9: Translate all six pages

**Files:**
- Modify: `src/pages/StockPage.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/pages/LogPage.tsx`
- Modify: `src/pages/ReportsPage.tsx`
- Modify: `src/pages/ScanPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Translate StockPage.tsx**

Replace error alerts and confirm (lines 43, 53, 59, 65):
- `Failed to add item:` → `Αποτυχία προσθήκης είδους:`
- `Failed to edit item:` → `Αποτυχία επεξεργασίας είδους:`
- `Are you sure you want to delete this item?` → `Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το είδος;`
- `Failed to delete item:` → `Αποτυχία διαγραφής είδους:`

Replace loading state (line 69):
```tsx
  if (loading) return <div>Φόρτωση...</div>;
```

Replace page title (line 74):
```tsx
        <h1 className="text-2xl font-bold">Απόθεμα</h1>
```

Replace button labels (lines 82, 85, 88, 92, 96):
- `Add Item` → `Προσθήκη Είδους`
- `Edit` → `Επεξεργασία`
- `Delete` → `Διαγραφή`
- `Transfer` → `Μεταφορά`
- `Export XLSX` → `Εξαγωγή XLSX`

Replace dialog title prop (line 116):
```tsx
        title={dialogMode === "edit" ? "Επεξεργασία Είδους" : "Προσθήκη Είδους"}
```

- [ ] **Step 2: Translate DashboardPage.tsx**

Replace loading and error states (lines 20-21):
```tsx
  if (loading) return <div>Φόρτωση...</div>;
  if (error) return <div className="text-red-600">Αποτυχία φόρτωσης πίνακα ελέγχου: {error}</div>;
```

Replace page title (line 27):
```tsx
        <h1 className="text-2xl font-bold">Πίνακας Ελέγχου</h1>
```

- [ ] **Step 3: Translate LogPage.tsx**

Replace loading state (line 23):
```tsx
  if (loading) return <div>Φόρτωση...</div>;
```

Replace page title (line 28):
```tsx
        <h1 className="text-2xl font-bold">Ημερολόγιο Δραστηριότητας</h1>
```

Replace "Export XLSX" button (line 30):
```tsx
          <FileSpreadsheet className="mr-1 h-4 w-4" /> Εξαγωγή XLSX
```

Replace "Load More" button (line 37):
```tsx
            Load More
```
→
```tsx
            Φόρτωση Περισσότερων
```

- [ ] **Step 4: Translate ReportsPage.tsx**

Replace XLSX column configs (lines 24-68). Translate all `header` values:

**snapshotCols** (lines 25-29):
- `"Barcode"` stays
- `"Description"` → `"Περιγραφή"`
- `"Quantity"` → `"Ποσότητα"`
- `"Location"` → `"Τοποθεσία"`
- `"Last Updated"` → `"Τελευταία Ενημέρωση"`

**movementCols** (lines 33-39):
- `"Barcode"` stays
- `"Description"` → `"Περιγραφή"`
- `"Added"` → `"Προσθήκες"`
- `"Removed"` → `"Αφαιρέσεις"`
- `"Transfers In"` → `"Εισερχόμενες Μεταφορές"`
- `"Transfers Out"` → `"Εξερχόμενες Μεταφορές"`
- `"Net Change"` → `"Καθαρή Μεταβολή"`

**lowStockCols** (lines 43-49):
- `"Barcode"` stays
- `"Description"` → `"Περιγραφή"`
- `"Location"` → `"Τοποθεσία"`
- `"Times Below"` → `"Φορές Κάτω"`
- `"Days Below"` → `"Ημέρες Κάτω"`
- `"Current Qty"` → `"Τρέχουσα Ποσ."`
- `"Status"` → `"Κατάσταση"`
- **Also** change the Status accessor to use `statusLabel` for Greek display in XLSX: `accessor: (r) => statusLabel(r.status)`
- Add import at top of file: `import { statusLabel } from "@/lib/utils";`

**usageCols** (lines 53-67):
- `"Barcode"` stays
- `"Description"` → `"Περιγραφή"`
- `"Current Qty"` → `"Τρέχουσα Ποσ."`
- `"Total Consumed"` → `"Συνολική Κατανάλωση"`
- `"Avg Daily Usage"` → `"Μέση Ημερήσια Χρήση"`
- `"Est. Depletion"` → `"Εκτ. Εξάντληση"`

**Also translate the formatDepletion accessor in usageCols** (lines 61-66):
```typescript
    accessor: (r) =>
      r.estDaysUntilDepletion == null
        ? "Δ/Υ"
        : r.estDaysUntilDepletion === 0
          ? "Εξαντλημένο"
          : `${r.estDaysUntilDepletion} ημέρες`,
```

**Translate export title strings** (lines 78-84):
- `"Inventory Snapshot"` → `"Στιγμιότυπο Αποθέματος"`
- `"Movement Report"` → `"Αναφορά Κινήσεων"`
- `"Low Stock History"` → `"Ιστορικό Χαμηλού Αποθέματος"`
- `"Reagent Usage"` → `"Χρήση Αντιδραστηρίων"`

Replace page title (line 112):
```tsx
        <h1 className="text-2xl font-bold">Αναφορές</h1>
```

Replace "Export XLSX" button (line 131):
```tsx
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Εξαγωγή XLSX
```

Replace export error (line 127):
```tsx
                alert(`Αποτυχία εξαγωγής: ${err}`);
```

Replace loading state (line 162):
```tsx
          <p className="text-sm text-muted-foreground">Φόρτωση αναφοράς...</p>
```

Replace tab labels (lines 147-150):
- `Inventory Snapshot` → `Στιγμιότυπο Αποθέματος`
- `Movement` → `Κινήσεις`
- `Low Stock History` → `Ιστορικό Χαμηλού Αποθέματος`
- `Reagent Usage` → `Χρήση Αντιδραστηρίων`

- [ ] **Step 5: Translate ScanPage.tsx**

Replace page title (line 90):
```tsx
        <h1 className="text-2xl font-bold">Σάρωση</h1>
```

Replace "Scan Again" button (line 93):
```tsx
            Νέα Σάρωση
```

Replace multi-location prompt (line 103):
```tsx
            This barcode exists in multiple locations. Select one:
```
→
```tsx
            Αυτό το barcode υπάρχει σε πολλές τοποθεσίες. Επιλέξτε μία:
```

Replace "Unknown" fallback (line 106):
```tsx
            const locName = locations.find((l) => l.id === item.locationId)?.name ?? "Άγνωστη";
```

Replace "Qty:" (line 118):
```tsx
                <span className="text-muted-foreground">Ποσ.: {item.quantity}</span>
```

Replace "Location for new item" label (line 131):
```tsx
          <Label>Τοποθεσία νέου είδους</Label>
```

Replace dialog title (line 155):
```tsx
        title="Νέο Είδος — Barcode Δεν Βρέθηκε"
```

- [ ] **Step 6: Translate SettingsPage.tsx**

Replace page title (line 101):
```tsx
      <h1 className="text-2xl font-bold">Ρυθμίσεις</h1>
```

**CSV Import section** (lines 104-121):
- `"CSV Import (Migration)"` → `"Εισαγωγή CSV (Μετάπτωση)"`
- The description paragraph → `Εισαγωγή δεδομένων από την παλιά εφαρμογή. Αυτή είναι μια εφάπαξ ενέργεια.`
- `"Import Inventory.csv"` → `"Εισαγωγή Inventory.csv"`
- `"Import Report.csv"` → `"Εισαγωγή Report.csv"`

Replace import status messages (lines 53, 55, 62, 64):
- `` `Imported ${count} inventory items.` `` → `` `Εισήχθησαν ${count} είδη αποθέματος.` ``
- `` `Import failed: ${err}` `` → `` `Αποτυχία εισαγωγής: ${err}` ``
- `` `Imported ${count} activity log entries.` `` → `` `Εισήχθησαν ${count} εγγραφές δραστηριότητας.` ``

Replace import status check (line 118):
```tsx
          <p className={`text-sm ${importStatus.startsWith("Αποτυχία") ? "text-red-600" : "text-green-600"}`}>
```

**Dashboard Settings section** (lines 126-146):
- `"Dashboard Settings"` → `"Ρυθμίσεις Πίνακα Ελέγχου"`
- `"Low Stock Threshold"` → `"Όριο Χαμηλού Αποθέματος"`
- Description paragraph → `Τα είδη με ποσότητα ίση ή κάτω από αυτόν τον αριθμό θα εμφανίζονται στις ειδοποιήσεις Χαμηλού Αποθέματος.`
- `"Saved."` → `"Αποθηκεύτηκε."`

**Locations section** (lines 150-225):
- `"Locations"` → `"Τοποθεσίες"`
- Description paragraph → `Διαχείριση τοποθεσιών αποθήκευσης. Τα είδη μπορούν να παρακολουθούνται ανά τοποθεσία.`
- `"Save"` button → `"Αποθήκευση"`
- `"New location name..."` placeholder → `"Νέο όνομα τοποθεσίας..."`
- `"Add"` button → `"Προσθήκη"`

**About section** (lines 229-238):
- `"About"` → `"Σχετικά"`
- Description paragraph → `Διαχείριση Αποθήκης — Παρακολούθηση αποθέματος για τη Μονάδα Μοριακής Βιολογίας, ΠΓΝΙ Ιωαννίνων.`
- `"Licensed under CC BY-NC-SA 4.0"` → `"Άδεια χρήσης CC BY-NC-SA 4.0"`

- [ ] **Step 7: Commit**

```bash
git add src/pages/StockPage.tsx src/pages/DashboardPage.tsx src/pages/LogPage.tsx src/pages/ReportsPage.tsx src/pages/ScanPage.tsx src/pages/SettingsPage.tsx
git commit -m "feat(i18n): translate all pages to Greek"
```

---

## Chunk 9: Business Logic

### Task 10: Translate export.ts, csv-import.ts, locations.ts, inventory.ts

**Files:**
- Modify: `src/lib/export.ts`
- Modify: `src/lib/csv-import.ts`
- Modify: `src/lib/locations.ts`
- Modify: `src/lib/inventory.ts`

- [ ] **Step 1: Translate export.ts**

Add import at top:
```typescript
import { actionLabel } from "./utils";
```

**exportInventoryXlsx:**
- Sheet name (line 12): `"Inventory"` → `"Απόθεμα"`
- Title (line 17): `"Inventory Report"` → `"Αναφορά Αποθέματος"`
- Headers (line 24): `["Barcode", "Description", "Quantity", "Location", "Last Updated"]` → `["Barcode", "Περιγραφή", "Ποσότητα", "Τοποθεσία", "Τελευταία Ενημέρωση"]`

**exportActivityXlsx:**
- Sheet name (line 65): `"Activity Log"` → `"Ημερολόγιο Δραστηριότητας"`
- Title (line 69): `"Activity Report"` → `"Αναφορά Δραστηριότητας"`
- Headers (line 74): `["Date/Time", "Barcode", "Action", "Qty Change", "Location"]` → `["Ημερομηνία/Ώρα", "Barcode", "Ενέργεια", "Μεταβολή Ποσ.", "Τοποθεσία"]`
- Action value (line 93): Replace `entry.action` with `actionLabel(entry.action)`

**exportReportXlsx:**
- Sheet name (line 128): `"Report"` → `"Αναφορά"`

- [ ] **Step 2: Translate csv-import.ts**

Replace file dialog titles:
- Line 49: `"Select Inventory.csv"` → `"Επιλέξτε Inventory.csv"`
- Line 93: `"Select Report.csv"` → `"Επιλέξτε Report.csv"`

- [ ] **Step 3: Translate locations.ts**

Replace error messages:
- Line 14: `"Location name cannot be empty"` → `"Το όνομα τοποθεσίας δεν μπορεί να είναι κενό"`
- Line 21 (same error, renameLocation): same translation
- Line 30: `"Cannot delete the Default location"` → `"Δεν είναι δυνατή η διαγραφή της Προεπιλεγμένης τοποθεσίας"`
- Line 39: `"Cannot delete a location that has items"` → `"Δεν είναι δυνατή η διαγραφή τοποθεσίας που περιέχει είδη"`

- [ ] **Step 4: Translate inventory.ts**

Replace error messages:
- Line 99: `` `Item with barcode ${barcode} not found` `` → `` `Το είδος με barcode ${barcode} δεν βρέθηκε` ``
- Line 135: `` `Item with id ${id} not found` `` → `` `Το είδος με id ${id} δεν βρέθηκε` ``
- Line 166: same as line 135
- Line 199: `"Source item not found"` → `"Το είδος προέλευσης δεν βρέθηκε"`
- Line 200: `"Insufficient quantity"` → `"Ανεπαρκής ποσότητα"`

- [ ] **Step 5: Commit**

```bash
git add src/lib/export.ts src/lib/csv-import.ts src/lib/locations.ts src/lib/inventory.ts
git commit -m "feat(i18n): translate business logic strings to Greek"
```

---

## Chunk 10: Verification

### Task 11: Final verification

**Files:** None expected (analytics.ts was already updated in Task 5, Step 3)

- [ ] **Step 1: Run type check**

```bash
pnpm tsc --noEmit
```

Fix any TypeScript errors that arise from the translations.

- [ ] **Step 2: Build verification**

```bash
pnpm build
```

Ensure the build completes without errors.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(i18n): fix type errors from Greek translation"
```

(Only if changes were needed)

- [ ] **Step 4: Visual verification**

Run `pnpm tauri dev` and check each page:
1. Sidebar navigation labels are Greek
2. Dashboard KPIs, chart titles, day selector show Greek
3. Stock page buttons, table headers, dialogs all Greek
4. Activity Log page headers, action badges show Greek labels
5. Reports page tabs, date presets, all four report views Greek
6. Scan page labels, multi-location prompt, scanner errors Greek
7. Settings page all sections Greek
8. XLSX exports have Greek headers and sheet names
