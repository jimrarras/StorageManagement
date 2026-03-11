# Quick Barcode Action, Color Rules & UI Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace camera Scan page with a floating barcode action dialog, add user-configurable color rules for reagents, rename activity log to "Κινήσεις", and make report tabs full-width.

**Architecture:** Four independent changes: (1) remove Scan page + scanner components, add floating barcode button/dialog to AppLayout; (2) new `color_rules` DB table + Settings UI + dynamic color lookup replacing hardcoded `getReagentColor()`; (3) string rename across 3 files; (4) CSS tweak on report tabs.

**Tech Stack:** React 19, TypeScript, SQLite/Drizzle ORM, Tailwind CSS, shadcn/base-ui, @dnd-kit, lucide-react, Tauri 2

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/color-rules.ts` | CRUD operations for color_rules table |
| Create | `src/hooks/useColorRules.ts` | Hook: fetch rules, expose `getItemColor()` + CRUD |
| Create | `src/components/barcode/BarcodeActionButton.tsx` | Floating action button + F2 shortcut |
| Create | `src/components/barcode/BarcodeActionDialog.tsx` | Barcode input dialog with add/remove/create flows |
| Modify | `src/lib/schema.ts` | Add `colorRules` table schema |
| Modify | `src/lib/db.ts` | Add migration + seed for color_rules |
| Modify | `src/lib/utils.ts` | Add `contrastText()` helper |
| Modify | `src/components/inventory/columns.tsx` | Replace `getReagentColor()` with dynamic color lookup |
| Modify | `src/components/inventory/InventoryTable.tsx` | Accept + pass `getItemColor` via table meta |
| Modify | `src/pages/StockPage.tsx` | Pass `getItemColor` to InventoryTable |
| Modify | `src/pages/SettingsPage.tsx` | Add Color Rules management section |
| Modify | `src/components/layout/Sidebar.tsx` | Remove "scan" from Page type + nav, rename log label |
| Modify | `src/components/layout/AppLayout.tsx` | Remove ScanPage, add BarcodeActionButton, remove scan route |
| Modify | `src/pages/LogPage.tsx` | Rename page title |
| Modify | `src/lib/export.ts` | Rename activity XLSX sheet/title |
| Modify | `src/pages/ReportsPage.tsx` | Full-width tabs |
| Delete | `src/pages/ScanPage.tsx` | Removed |
| Delete | `src/components/scanner/ScannerView.tsx` | Removed |
| Delete | `src/components/scanner/ScannedItemCard.tsx` | Removed |

---

## Chunk 1: UI Fixes (Rename + Tabs)

### Task 1: Rename "Ημερολόγιο Δραστηριότητας" → "Κινήσεις" and full-width report tabs

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:10`
- Modify: `src/pages/LogPage.tsx:28`
- Modify: `src/lib/export.ts:66,70`
- Modify: `src/pages/ReportsPage.tsx:147-152`

- [ ] **Step 1: Rename in Sidebar.tsx**

Change line 10:
```tsx
  { page: "log", label: "Κινήσεις", icon: ScrollText },
```

- [ ] **Step 2: Rename in LogPage.tsx**

Change the `<h1>` on line 28:
```tsx
        <h1 className="text-2xl font-bold">Κινήσεις</h1>
```

- [ ] **Step 3: Rename in export.ts**

Change line 66 sheet name:
```tsx
  const sheet = workbook.addWorksheet("Κινήσεις");
```

Change line 70 title row:
```tsx
  titleCell.value = `Αναφορά Κινήσεων — ${new Date().toLocaleDateString("el-GR")}`;
```

- [ ] **Step 4: Full-width report tabs in ReportsPage.tsx**

Change lines 147-152. Add `className="w-full"` to `TabsList` and `className="flex-1"` to each `TabsTrigger`:
```tsx
        <TabsList className="w-full">
          <TabsTrigger value="snapshot" className="flex-1">Στιγμιότυπο Αποθέματος</TabsTrigger>
          <TabsTrigger value="movement" className="flex-1">Κινήσεις</TabsTrigger>
          <TabsTrigger value="low_stock" className="flex-1">Ιστορικό Χαμηλού Αποθέματος</TabsTrigger>
          <TabsTrigger value="usage" className="flex-1">Χρήση Αντιδραστηρίων</TabsTrigger>
        </TabsList>
```

- [ ] **Step 5: Verify build**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/pages/LogPage.tsx src/lib/export.ts src/pages/ReportsPage.tsx
git commit -m "feat: rename activity log to Κινήσεις and make report tabs full-width"
```

---

## Chunk 2: Remove Scan Page

### Task 2: Remove Scan page, scanner components, and html5-qrcode dependency

**Files:**
- Delete: `src/pages/ScanPage.tsx`
- Delete: `src/components/scanner/ScannerView.tsx`
- Delete: `src/components/scanner/ScannedItemCard.tsx`
- Modify: `src/components/layout/Sidebar.tsx:1,5,7-13`
- Modify: `src/components/layout/AppLayout.tsx:7,37`

- [ ] **Step 1: Remove scan from Sidebar.tsx**

Remove `ScanBarcode` from the lucide import on line 1:
```tsx
import { LayoutDashboard, Package, ScrollText, FileBarChart, Settings } from "lucide-react";
```

Remove `"scan"` from the Page type on line 5:
```tsx
export type Page = "dashboard" | "stock" | "log" | "reports" | "settings";
```

Remove the scan entry from navItems (line 12):
```tsx
const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Πίνακας Ελέγχου", icon: LayoutDashboard },
  { page: "stock", label: "Απόθεμα", icon: Package },
  { page: "log", label: "Κινήσεις", icon: ScrollText },
  { page: "reports", label: "Αναφορές", icon: FileBarChart },
];
```

- [ ] **Step 2: Remove ScanPage from AppLayout.tsx**

Remove the ScanPage import (line 7):
```tsx
// Delete: import { ScanPage } from "@/pages/ScanPage";
```

Remove the scan render branch (line 37):
```tsx
// Delete: {currentPage === "scan" && <ScanPage />}
```

- [ ] **Step 3: Delete scanner files**

Delete these three files:
- `src/pages/ScanPage.tsx`
- `src/components/scanner/ScannerView.tsx`
- `src/components/scanner/ScannedItemCard.tsx`

- [ ] **Step 4: Remove html5-qrcode dependency**

```bash
pnpm remove html5-qrcode
```

- [ ] **Step 5: Verify build**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove Scan page, scanner components, and html5-qrcode dependency"
```

---

## Chunk 3: Color Rules Data Layer

### Task 3: Add color_rules schema, migration, seed, and CRUD

**Files:**
- Modify: `src/lib/schema.ts`
- Modify: `src/lib/db.ts`
- Create: `src/lib/color-rules.ts`

- [ ] **Step 1: Add colorRules table to schema.ts**

Add after the `settings` table (after line 36):
```typescript
export const colorRules = sqliteTable("color_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keyword: text("keyword").notNull().unique(),
  color: text("color").notNull(),
  sortOrder: integer("sort_order").notNull(),
});
```

- [ ] **Step 2: Add migration and seed to db.ts**

Add to the `MIGRATIONS` array (after line 54, before the closing `]`):
```typescript
  `CREATE TABLE IF NOT EXISTS color_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  )`,
```

Add seed after the settings seed (after line 136, before `_db = createDrizzle`):
```typescript
  // Seed default color rules
  await _sqlite.execute(
    `INSERT OR IGNORE INTO color_rules (keyword, color, sort_order) VALUES ('perCP', '#ea580c', 1)`
  );
  await _sqlite.execute(
    `INSERT OR IGNORE INTO color_rules (keyword, color, sort_order) VALUES ('FITC', '#166534', 2)`
  );
  await _sqlite.execute(
    `INSERT OR IGNORE INTO color_rules (keyword, color, sort_order) VALUES ('PE', '#dc2626', 3)`
  );
```

- [ ] **Step 3: Create src/lib/color-rules.ts**

```typescript
import { eq } from "drizzle-orm";
import { getDb, getRawDb } from "./db";
import { colorRules } from "./schema";

export type ColorRule = typeof colorRules.$inferSelect;

export async function getAllColorRules(): Promise<ColorRule[]> {
  const db = getDb();
  return db.select().from(colorRules).orderBy(colorRules.sortOrder);
}

export async function addColorRule(keyword: string, color: string): Promise<void> {
  const db = getDb();
  const existing = await getAllColorRules();
  const nextSort = existing.length > 0 ? Math.max(...existing.map((r) => r.sortOrder)) + 1 : 1;
  await db.insert(colorRules).values({ keyword, color, sortOrder: nextSort });
}

export async function updateColorRule(
  id: number,
  data: { keyword?: string; color?: string }
): Promise<void> {
  const db = getDb();
  await db.update(colorRules).set(data).where(eq(colorRules.id, id));
}

export async function deleteColorRule(id: number): Promise<void> {
  const db = getDb();
  await db.delete(colorRules).where(eq(colorRules.id, id));
}

export async function reorderColorRules(
  updates: { id: number; sortOrder: number }[]
): Promise<void> {
  const db = getDb();
  const sqlite = getRawDb();
  await sqlite.execute("BEGIN TRANSACTION");
  try {
    for (const { id, sortOrder } of updates) {
      await db.update(colorRules).set({ sortOrder }).where(eq(colorRules.id, id));
    }
    await sqlite.execute("COMMIT");
  } catch (e) {
    await sqlite.execute("ROLLBACK");
    throw e;
  }
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts src/lib/db.ts src/lib/color-rules.ts
git commit -m "feat: add color_rules table, migration, seed, and CRUD operations"
```

---

## Chunk 4: Color Rules Hook and Inventory Integration

### Task 4: Create useColorRules hook, contrastText helper, and integrate with inventory table

**Files:**
- Create: `src/hooks/useColorRules.ts`
- Modify: `src/lib/utils.ts`
- Modify: `src/components/inventory/columns.tsx`
- Modify: `src/components/inventory/InventoryTable.tsx`
- Modify: `src/pages/StockPage.tsx`

- [ ] **Step 1: Add contrastText to utils.ts**

Add after the `statusLabel` function (after line 28):
```typescript
export function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  return brightness < 128 ? "#fff" : "#000";
}
```

- [ ] **Step 2: Create src/hooks/useColorRules.ts**

```typescript
import { useState, useEffect, useCallback } from "react";
import {
  getAllColorRules,
  addColorRule,
  updateColorRule,
  deleteColorRule,
  reorderColorRules,
  type ColorRule,
} from "@/lib/color-rules";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useColorRules() {
  const [rules, setRules] = useState<ColorRule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllColorRules();
    setRules(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getItemColor = useCallback(
    (description: string): string | null => {
      for (const rule of rules) {
        const regex = new RegExp("\\b" + escapeRegex(rule.keyword) + "\\b", "i");
        if (regex.test(description)) return rule.color;
      }
      return null;
    },
    [rules]
  );

  const add = async (keyword: string, color: string) => {
    await addColorRule(keyword, color);
    await refresh();
  };

  const update = async (id: number, data: { keyword?: string; color?: string }) => {
    await updateColorRule(id, data);
    await refresh();
  };

  const remove = async (id: number) => {
    await deleteColorRule(id);
    await refresh();
  };

  const reorder = async (updates: { id: number; sortOrder: number }[]) => {
    await reorderColorRules(updates);
    await refresh();
  };

  return { rules, loading, getItemColor, add, update, remove, reorder, refresh };
}
```

- [ ] **Step 3: Replace getReagentColor in columns.tsx**

Replace the entire file with:
```tsx
import { type ColumnDef } from "@tanstack/react-table";
import type { InventoryItem } from "@/lib/inventory";
import { contrastText } from "@/lib/utils";
import { GripVertical } from "lucide-react";

export const columns: ColumnDef<InventoryItem>[] = [
  {
    id: "drag",
    header: "",
    size: 40,
    cell: () => (
      <span className="cursor-grab active:cursor-grabbing text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </span>
    ),
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    size: 150,
  },
  {
    accessorKey: "locationId",
    header: "Τοποθεσία",
    cell: ({ row, table }) => {
      const locationMap = (table.options.meta as { locationMap?: Map<number, string> })?.locationMap;
      return locationMap?.get(row.original.locationId) ?? "\u2014";
    },
    size: 120,
  },
  {
    accessorKey: "description",
    header: "Περιγραφή",
    cell: ({ row, table }) => {
      const desc = row.getValue<string>("description");
      const getItemColor = (table.options.meta as { getItemColor?: (desc: string) => string | null })?.getItemColor;
      const color = getItemColor?.(desc) ?? null;
      if (!color) return desc;
      return (
        <span
          className="px-2 py-1 rounded"
          style={{ backgroundColor: color, color: contrastText(color) }}
        >
          {desc}
        </span>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Ποσότητα",
    size: 80,
  },
];
```

- [ ] **Step 4: Update InventoryTable.tsx to accept getItemColor**

Add `getItemColor` to the props interface (after line 39):
```typescript
interface InventoryTableProps {
  data: InventoryItem[];
  isFiltering: boolean;
  disableDrag?: boolean;
  onRowClick: (item: InventoryItem) => void;
  onRowDoubleClick: (item: InventoryItem) => void;
  onReorder: (updates: { id: number; sortOrder: number }[]) => void;
  locationMap?: Map<number, string>;
  getItemColor?: (description: string) => string | null;
}
```

Update the destructuring (line 88) to include `getItemColor`:
```typescript
export function InventoryTable({
  data,
  isFiltering,
  disableDrag,
  onRowClick,
  onRowDoubleClick,
  onReorder,
  locationMap,
  getItemColor,
}: InventoryTableProps) {
```

Update the meta useMemo (line 97):
```typescript
  const meta = useMemo(() => ({ locationMap, getItemColor }), [locationMap, getItemColor]);
```

- [ ] **Step 5: Update StockPage.tsx to pass getItemColor**

Add import at top:
```typescript
import { useColorRules } from "@/hooks/useColorRules";
```

Add hook call inside the component (after the `locationMap` useMemo, around line 29):
```typescript
  const { getItemColor } = useColorRules();
```

Add `getItemColor` prop to `InventoryTable` (around line 101):
```tsx
      <InventoryTable
        data={items}
        isFiltering={!!searchQuery}
        disableDrag={locationId == null}
        onRowClick={setSelectedItem}
        onRowDoubleClick={(item) => { setSelectedItem(item); setDialogMode("edit"); }}
        onReorder={reorder}
        locationMap={locationMap}
        getItemColor={getItemColor}
      />
```

- [ ] **Step 6: Verify build**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils.ts src/hooks/useColorRules.ts src/components/inventory/columns.tsx src/components/inventory/InventoryTable.tsx src/pages/StockPage.tsx
git commit -m "feat: add dynamic color rules with word-boundary matching for inventory table"
```

---

## Chunk 5: Color Rules Settings UI

### Task 5: Add color rules management section to SettingsPage

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add Color Rules section to SettingsPage.tsx**

Add imports at the top of the file (after existing imports):
```typescript
import { useColorRules } from "@/hooks/useColorRules";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
```

Add the hook call inside `SettingsPage()` (after the `locationError` state, around line 21):
```typescript
  const { rules: colorRules, add: addRule, update: updateRule, remove: removeRule, reorder: reorderRules } = useColorRules();
  const [newKeyword, setNewKeyword] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editingRuleKeyword, setEditingRuleKeyword] = useState("");
  const [editingRuleColor, setEditingRuleColor] = useState("");
  const [ruleError, setRuleError] = useState<string | null>(null);
```

Add a `SortableRuleRow` component before the `SettingsPage` function:
```tsx
function SortableRuleRow({
  rule,
  isEditing,
  editKeyword,
  editColor,
  onEditKeyword,
  onEditColor,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  rule: { id: number; keyword: string; color: string; sortOrder: number };
  isEditing: boolean;
  editKeyword: string;
  editColor: string;
  onEditKeyword: (v: string) => void;
  onEditColor: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <span {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </span>
      {isEditing ? (
        <>
          <Input
            value={editKeyword}
            onChange={(e) => onEditKeyword(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
          />
          <input
            type="color"
            value={editColor}
            onChange={(e) => onEditColor(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded border p-0.5"
          />
          <Button size="sm" onClick={onSaveEdit}>Αποθήκευση</Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{rule.keyword}</span>
          <span
            className="h-6 w-6 rounded border"
            style={{ backgroundColor: rule.color }}
          />
          <Button size="icon" variant="ghost" onClick={onStartEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}
```

Add the Color Rules section in the JSX, after the Locations `</div>` and before the `<Separator />` that precedes the About section (insert before the About `<Separator />`):
```tsx
      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Κανόνες Χρωμάτων</h2>
        <p className="text-sm text-muted-foreground">
          Ορίστε χρώματα βάσει λέξεων-κλειδιών στην περιγραφή. Ο πρώτος κανόνας που ταιριάζει εφαρμόζεται.
        </p>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = colorRules.findIndex((r) => r.id === active.id);
            const newIndex = colorRules.findIndex((r) => r.id === over.id);
            const reordered = arrayMove(colorRules, oldIndex, newIndex);
            reorderRules(reordered.map((r, i) => ({ id: r.id, sortOrder: i + 1 })));
          }}
        >
          <SortableContext items={colorRules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {colorRules.map((rule) => (
                <SortableRuleRow
                  key={rule.id}
                  rule={rule}
                  isEditing={editingRuleId === rule.id}
                  editKeyword={editingRuleKeyword}
                  editColor={editingRuleColor}
                  onEditKeyword={setEditingRuleKeyword}
                  onEditColor={setEditingRuleColor}
                  onStartEdit={() => {
                    setEditingRuleId(rule.id);
                    setEditingRuleKeyword(rule.keyword);
                    setEditingRuleColor(rule.color);
                  }}
                  onSaveEdit={async () => {
                    if (!editingRuleKeyword.trim()) return;
                    setRuleError(null);
                    try {
                      await updateRule(rule.id, { keyword: editingRuleKeyword.trim(), color: editingRuleColor });
                      setEditingRuleId(null);
                    } catch (err) {
                      setRuleError(err instanceof Error ? err.message : String(err));
                    }
                  }}
                  onCancelEdit={() => setEditingRuleId(null)}
                  onDelete={async () => {
                    setRuleError(null);
                    try {
                      await removeRule(rule.id);
                    } catch (err) {
                      setRuleError(err instanceof Error ? err.message : String(err));
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2">
          <Input
            placeholder="Λέξη-κλειδί..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!newKeyword.trim()) return;
                setRuleError(null);
                addRule(newKeyword.trim(), newColor)
                  .then(() => setNewKeyword(""))
                  .catch((err) => setRuleError(err instanceof Error ? err.message : String(err)));
              }
            }}
            className="flex-1"
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded border p-0.5"
          />
          <Button
            size="sm"
            onClick={async () => {
              if (!newKeyword.trim()) return;
              setRuleError(null);
              try {
                await addRule(newKeyword.trim(), newColor);
                setNewKeyword("");
              } catch (err) {
                setRuleError(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Προσθήκη
          </Button>
        </div>

        {ruleError && (
          <p className="text-sm text-red-600">{ruleError}</p>
        )}
      </div>
```

- [ ] **Step 2: Verify build**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat: add color rules management UI in Settings"
```

---

## Chunk 6: Quick Barcode Action

### Task 6: Create BarcodeActionButton and BarcodeActionDialog

**Files:**
- Create: `src/components/barcode/BarcodeActionButton.tsx`
- Create: `src/components/barcode/BarcodeActionDialog.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Create src/components/barcode/BarcodeActionDialog.tsx**

```tsx
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus } from "lucide-react";
import {
  getInventoryByBarcode,
  addInventoryItem,
  removeQuantity,
  getNextSortOrder,
  type InventoryItem,
} from "@/lib/inventory";
import { useLocations } from "@/hooks/useLocations";

type DialogState =
  | { step: "input" }
  | { step: "found"; item: InventoryItem }
  | { step: "pick_location"; items: InventoryItem[] }
  | { step: "not_found"; barcode: string };

interface BarcodeActionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BarcodeActionDialog({ open, onClose }: BarcodeActionDialogProps) {
  const { locations } = useLocations();
  const [state, setState] = useState<DialogState>({ step: "input" });
  const [barcode, setBarcode] = useState("");
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // New item form state
  const [newDescription, setNewDescription] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newLocationId, setNewLocationId] = useState(1);

  // Focus barcode input when dialog opens or resets to input step
  useEffect(() => {
    if (open && state.step === "input") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, state.step]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      resetToInput();
    }
  }, [open]);

  // Set default location
  useEffect(() => {
    if (locations.length > 0) {
      setNewLocationId(locations[0].id);
    }
  }, [locations]);

  function resetToInput() {
    setState({ step: "input" });
    setBarcode("");
    setAmount(1);
    setError(null);
    setFeedback(null);
    setNewDescription("");
    setNewQuantity(1);
  }

  async function handleLookup() {
    if (!barcode.trim()) return;
    setError(null);
    setFeedback(null);

    const items = await getInventoryByBarcode(barcode.trim());
    if (items.length === 0) {
      setState({ step: "not_found", barcode: barcode.trim() });
    } else if (items.length === 1) {
      setState({ step: "found", item: items[0] });
    } else {
      setState({ step: "pick_location", items });
    }
  }

  async function handleAdd(item: InventoryItem) {
    try {
      setError(null);
      const sortOrder = await getNextSortOrder();
      await addInventoryItem({
        barcode: item.barcode,
        description: item.description,
        quantity: amount,
        locationId: item.locationId,
        sortOrder,
      });
      setFeedback(`+${amount}`);
      // Refresh the item to get updated quantity
      const updated = await getInventoryByBarcode(item.barcode);
      const refreshed = updated.find((i) => i.locationId === item.locationId);
      if (refreshed) setState({ step: "found", item: refreshed });
      setTimeout(() => setFeedback(null), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRemove(item: InventoryItem) {
    try {
      setError(null);
      await removeQuantity(item.barcode, amount, item.locationId);
      setFeedback(`-${amount}`);
      const updated = await getInventoryByBarcode(item.barcode);
      const refreshed = updated.find((i) => i.locationId === item.locationId);
      if (refreshed) setState({ step: "found", item: refreshed });
      setTimeout(() => setFeedback(null), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreateNew() {
    if (!newDescription.trim()) return;
    try {
      setError(null);
      if (state.step !== "not_found") return;
      const sortOrder = await getNextSortOrder();
      await addInventoryItem({
        barcode: state.barcode,
        description: newDescription.trim(),
        quantity: newQuantity,
        locationId: newLocationId,
        sortOrder,
      });
      setFeedback("Δημιουργήθηκε!");
      setTimeout(() => {
        resetToInput();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const locationName = (id: number) =>
    locations.find((l) => l.id === id)?.name ?? "Άγνωστη";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Γρήγορη Σάρωση</DialogTitle>
        </DialogHeader>

        {/* Barcode input — always visible */}
        {state.step === "input" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="space-y-3"
          >
            <Input
              ref={inputRef}
              placeholder="Σαρώστε ή πληκτρολογήστε barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              autoFocus
            />
          </form>
        )}

        {/* Found item — show details + add/remove */}
        {state.step === "found" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Barcode</p>
              <p className="font-mono">{state.item.barcode}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Περιγραφή</p>
              <p>{state.item.description}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Τρέχον Απόθεμα</p>
              <p className="text-3xl font-bold">
                {state.item.quantity}
                {feedback && (
                  <span className={`ml-2 text-lg ${feedback.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {feedback}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <Label>Ποσότητα</Label>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <Button onClick={() => handleAdd(state.item)} className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-1 h-4 w-4" /> Προσθήκη
              </Button>
              <Button onClick={() => handleRemove(state.item)} variant="destructive" disabled={state.item.quantity === 0}>
                <Minus className="mr-1 h-4 w-4" /> Αφαίρεση
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={resetToInput}>
              Νέα σάρωση
            </Button>
          </div>
        )}

        {/* Multiple locations — pick one */}
        {state.step === "pick_location" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Αυτό το barcode υπάρχει σε πολλές τοποθεσίες. Επιλέξτε μία:
            </p>
            {state.items.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => setState({ step: "found", item })}
              >
                <span>{locationName(item.locationId)}</span>
                <span className="text-muted-foreground">Ποσ.: {item.quantity}</span>
              </Button>
            ))}
            <Button variant="outline" className="w-full" onClick={resetToInput}>
              Ακύρωση
            </Button>
          </div>
        )}

        {/* Not found — create new item */}
        {state.step === "not_found" && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Νέο Είδος — Barcode Δεν Βρέθηκε</p>
            <div>
              <Label>Barcode</Label>
              <Input value={state.barcode} disabled />
            </div>
            <div>
              <Label>Περιγραφή</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>Ποσότητα</Label>
              <Input
                type="number"
                min={0}
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                className="w-24"
              />
            </div>
            {locations.length > 1 && (
              <div>
                <Label>Τοποθεσία</Label>
                <Select value={String(newLocationId)} onValueChange={(v) => setNewLocationId(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetToInput}>Ακύρωση</Button>
              <Button onClick={handleCreateNew}>Αποθήκευση</Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {feedback && state.step !== "found" && (
          <p className="text-sm text-green-600">{feedback}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create src/components/barcode/BarcodeActionButton.tsx**

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { BarcodeActionDialog } from "./BarcodeActionDialog";

export function BarcodeActionButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2" && !open) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        title="Γρήγορη Σάρωση (F2)"
      >
        <ScanBarcode className="h-6 w-6" />
      </Button>
      <BarcodeActionDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

- [ ] **Step 3: Add BarcodeActionButton to AppLayout.tsx**

Add import at top:
```typescript
import { BarcodeActionButton } from "@/components/barcode/BarcodeActionButton";
```

Add `<BarcodeActionButton />` inside the root `<div>`, after `</main>` (before the closing `</div>` on line 40):
```tsx
      <BarcodeActionButton />
```

- [ ] **Step 4: Verify build**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/barcode/BarcodeActionButton.tsx src/components/barcode/BarcodeActionDialog.tsx src/components/layout/AppLayout.tsx
git commit -m "feat: add floating barcode action button and dialog for quick add/remove"
```

---

## Chunk 7: Final Verification

### Task 7: Build verification

- [ ] **Step 1: Type check**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 2: Production build**

```bash
pnpm build
```

- [ ] **Step 3: Fix any errors and commit if needed**

```bash
git add -A
git commit -m "fix: resolve build issues from quick barcode and color rules features"
```

(Only if changes were needed)
