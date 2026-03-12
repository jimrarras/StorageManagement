# Enhanced Stock Table — Design Spec

**Date:** 2026-03-12
**Status:** Approved
**Scope:** Row selection, inline editing, bulk delete, and visual polish for the inventory table

---

## Problem

The current stock table has poor visual feedback for selection (subtle `bg-muted` on click), requires a modal dialog for editing (slow workflow), only supports single-item operations, and gives no visual affordance for what's clickable or editable.

## Solution

Replace the current interaction model with: checkbox-based multi-select for bulk delete, per-row inline editing with explicit Save/Cancel, strong visual states for hover/selected/checked/editing, and a floating bulk action bar.

### Design Principles

- **Discoverable** — visible edit buttons, clear visual states, no hidden interactions
- **Safe** — explicit Save/Cancel for edits, confirm dialog for bulk delete
- **Efficient** — inline editing avoids dialog round-trips, bulk delete for batch cleanup

---

## Prerequisites

Generate the shadcn Checkbox component before implementation:

```bash
pnpm dlx shadcn@latest add checkbox
```

---

## Interaction Model

### Row States

| State | Trigger | Visual |
|-------|---------|--------|
| Default | — | Normal row. Drag handle visible. Pencil icon in actions column (muted, full opacity on hover) |
| Hovered | Mouse over row | Subtle background tint (`bg-muted/50`) |
| Selected | Single-click row | Left 3px border accent (primary) + `bg-accent` background. Toolbar Transfer button activates |
| Checked | Click checkbox | Checkbox filled + light accent background (`bg-accent/30`). Independent from selection |
| Editing | Click pencil icon | All cells become inputs. Row gets subtle ring/outline. Save/Cancel replace pencil icon |

### Key Behaviors

- **Single-click** a row → selects it (clears previous selection). Does not toggle checkbox.
- **Click checkbox** → checks/unchecks without selecting the row.
- **Header checkbox** → toggles all checkboxes (select all / deselect all).
- **Click pencil icon** → enters edit mode for that row. Only one row editable at a time.
- **Enter** while editing → save changes.
- **Escape** while editing → cancel, revert to original values.
- **Tab** while editing → move to next editable field (barcode → description → quantity).
- **Double-click** is removed — no longer used for editing.
- The `ItemDialog` is kept only for Add (no existing row to edit inline). Editing always happens inline.

### Checked State & Filtering

When the user types a search query or changes the location filter, **all checked state is cleared**. This prevents confusing scenarios where bulk delete could affect items no longer visible in the table. The floating bulk action bar disappears on filter change.

---

## Column Layout

| # | Column | Width | Editable | Notes |
|---|--------|-------|----------|-------|
| 1 | Checkbox | 40px | — | Multi-select for bulk ops |
| 2 | Drag handle | 40px | — | Existing. Hidden when filtering or "All locations" (column fully hidden — 0px) |
| 3 | Barcode | 150px | Yes | Text input in edit mode |
| 4 | Location | 120px | No | Read-only. Use Transfer to change location |
| 5 | Description | flex | Yes | Text input in edit mode. Color rules still applied in view mode |
| 6 | Quantity | 80px | Yes | Number input in edit mode (min 0) |
| 7 | Actions | 80px | — | Pencil icon (view) or Save/Cancel icons (edit) |

### Actions Column Behavior

- **View mode:** Pencil icon, muted color, full opacity on hover
- **Edit mode:** Checkmark (save) + X (cancel) icons, spaced apart to prevent misclicks
- **Row is checked:** Pencil still available — can edit a checked row

---

## Inline Edit Validation

When saving inline edits, the following validation rules apply (matching the existing `ItemDialog` constraints):

- **Barcode:** Required, cannot be empty. Trimmed of whitespace.
- **Description:** Required, cannot be empty. Trimmed of whitespace.
- **Quantity:** Required, must be a finite number >= 0. Integer only.
- **Barcode uniqueness:** The `updateInventoryItem` function in `inventory.ts` does not check uniqueness — the UNIQUE(barcode, location_id) constraint in SQLite will throw if the user changes a barcode to one that already exists at the same location. The error is caught and displayed via the existing error pattern. No special handling needed beyond showing the error and keeping the row in edit mode.

If validation fails, the cell input shows a red border and the save is blocked. The user must fix or cancel.

---

## Floating Bulk Action Bar

### Appearance

Fixed to bottom center of viewport. Pill-shaped container (`rounded-full`) with shadow (`shadow-lg`), `bg-card` background with `border`. Slides up with CSS transition (`transition-all duration-200 translate-y-0` / `translate-y-16`) when first checkbox is checked.

### Positioning

Uses `bottom-16` to sit above the `BarcodeActionButton` (which is `fixed bottom-6 right-6` in `AppLayout.tsx`). This prevents overlap on any viewport width.

### Contents (left to right)

1. **Count label:** "3 επιλεγμένα" (number + "selected")
2. **Divider** (vertical `border-r`)
3. **Delete button:** Destructive variant, trash icon + "Διαγραφή"
4. **Deselect button:** X icon to uncheck all

### Behavior

- Delete triggers existing `ConfirmDialog`: "Θέλετε να διαγράψετε 3 είδη; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
- After delete completes, bar disappears, checked state clears, table refreshes
- Checked state persists after inline edit save (editing and checking are independent)

---

## Toolbar Changes

### Removed from toolbar

- **Επεξεργασία (Edit)** button — replaced by per-row inline edit
- **Διαγραφή (Delete)** button — replaced by bulk action bar

### Kept in toolbar

- **Προσθήκη Είδους (Add Item)** — still opens `ItemDialog` for new items
- **Μεταφορά (Transfer)** — acts on the single **selected** row only. Ignores checkboxes entirely. This is intentional: transfer requires choosing source/destination per item, so batch transfer is not meaningful for this workflow.
- **Εξαγωγή XLSX (Export)** — exports all items (same as before)
- **LocationFilter** — same as before

---

## Visual Design Details

### Selected row
- Left border: 3px solid `hsl(var(--primary))`
- Background: `bg-accent`
- Feels "lifted" from surrounding rows

### Checked rows
- Background: `bg-accent/30` (lighter than selected)
- Checkbox shows filled state (shadcn Checkbox component)

### Edit mode row
- Each editable cell shows an `Input` component with visible border
- Row gets `ring-1 ring-primary/30` outline
- Non-editing rows remain normal (not dimmed)
- Save icon: `Check` from lucide (green tint)
- Cancel icon: `X` from lucide (muted)
- Description column: in view mode, color rules render the colored span. In edit mode, the colored span is replaced by a plain `Input`. Color rule styling returns after save.

### Floating bar animation
- Use CSS transition: `transition-all duration-200`
- Visible: `translate-y-0 opacity-100`
- Hidden: `translate-y-16 opacity-0 pointer-events-none`

---

## TanStack Table Meta Interface

The table meta object is the central contract between `InventoryTable`, `columns.tsx`, and `EditableCell`. It extends the existing meta shape:

```typescript
interface InventoryTableMeta {
  // Existing
  locationMap?: Map<number, string>;
  getItemColor?: (description: string) => string | null;

  // Selection
  selectedId: number | null;

  // Checkboxes
  checkedIds: Set<number>;
  onToggleCheck: (id: number) => void;
  onToggleAllChecked: () => void;
  allChecked: boolean;

  // Inline editing
  editingId: number | null;
  editValues: { barcode: string; description: string; quantity: number } | null;
  onStartEdit: (id: number) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditValueChange: (field: "barcode" | "description" | "quantity", value: string | number) => void;
}
```

State lives in `InventoryTable.tsx`. Columns and `EditableCell` read from meta.

---

## EditableCell Component

**File:** `src/components/inventory/EditableCell.tsx`

A single generic component used for all editable columns. Renders view mode or edit mode based on table meta.

### Props

```typescript
interface EditableCellProps {
  value: string | number;
  field: "barcode" | "description" | "quantity";
  type: "text" | "number";
  editingId: number | null;
  rowId: number;
  editValues: { barcode: string; description: string; quantity: number } | null;
  onEditValueChange: (field: string, value: string | number) => void;
  viewContent?: React.ReactNode; // Optional custom view (e.g., color-styled description)
}
```

### Behavior

- If `editingId !== rowId` → renders `viewContent` (if provided) or plain `value`
- If `editingId === rowId` → renders an `Input` with the value from `editValues[field]`
- Calls `onEditValueChange` on input change
- For quantity: `type="number"` with `min={0}`
- Validation: red border (`border-destructive`) if field is empty (barcode/description) or invalid (quantity < 0)

---

## Error Handling

- **Inline edit save fails:** Show error message below the table (existing error pattern in StockPage). Row stays in edit mode so user can retry or cancel.
- **Bulk delete fails:** Loop individual `deleteItem` calls. If any fail, show error with message. Refresh table to show current state. Remaining items stay checked.
- **Edit mode + drag:** Disable drag while any row is in edit mode (prevent conflicts).
- **Edit mode + bulk action bar:** If the row being edited is also checked and user clicks bulk delete, cancel the edit first, then proceed with delete confirmation.

---

## Bulk Delete Implementation

The existing `deleteItem(id)` in `useInventory.ts` deletes one item and refreshes. For bulk delete, `StockPage` will:

1. Collect all checked IDs
2. Loop `deleteInventoryItem(id)` from `inventory.ts` directly (not the hook's `deleteItem` which refreshes per call)
3. Call `refresh()` once at the end
4. Clear checked state

This avoids modifying `useInventory.ts` or `inventory.ts`. The individual calls each run in their own transaction (existing pattern), so partial failures leave the DB consistent.

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/components/inventory/BulkActionBar.tsx` | Floating pill bar: count, delete button, deselect button |
| `src/components/inventory/EditableCell.tsx` | Generic input cell renderer for inline edit mode |

### Modified Files

| File | Change |
|------|--------|
| `src/components/inventory/columns.tsx` | Add checkbox column and actions column. Use `EditableCell` for barcode, description, quantity columns. Read edit/check state from table meta |
| `src/components/inventory/InventoryTable.tsx` | Add checked set, editingId, editValues state. Build `InventoryTableMeta` and pass as table meta. Handle keyboard events (Enter/Escape). Disable drag during edit |
| `src/pages/StockPage.tsx` | Remove Edit/Delete toolbar buttons. Add `BulkActionBar`. Wire bulk delete with `ConfirmDialog`. Clear checked state on filter/search change. Keep `ItemDialog` for Add only |

### Unchanged

| File | Reason |
|------|--------|
| `src/hooks/useInventory.ts` | Existing `editItem`, `deleteItem`, `refresh` work as-is. Bulk delete calls `deleteInventoryItem` directly |
| `src/lib/inventory.ts` | No backend changes needed |
| `src/lib/schema.ts` | No schema changes |
| `src/components/inventory/ItemDialog.tsx` | Kept for Add flow |

### Dependencies

- **Generate:** shadcn Checkbox (`pnpm dlx shadcn@latest add checkbox`)
- **Existing:** TanStack Table, lucide icons, tw-animate-css
