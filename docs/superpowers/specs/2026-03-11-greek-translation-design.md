# Greek Translation Design

## Overview

Translate all user-facing English text in the StorageManagement app to Greek. This is a Greek-only translation — no multi-language support or i18n framework. Direct string replacement across all files.

## Approach

Direct replacement: go file-by-file and replace every English string with its Greek equivalent. No abstraction layer, no translations file, no i18n library.

## Scope

### Files to translate

| Area | Files |
|------|-------|
| HTML | `index.html` (`lang="en"` → `lang="el"`, page title) |
| Tauri config | `src-tauri/tauri.conf.json` (window title) |
| Navigation & Layout | `AppLayout.tsx`, `Sidebar.tsx`, `SearchBar.tsx` |
| Pages | `StockPage.tsx`, `DashboardPage.tsx`, `LogPage.tsx`, `ReportsPage.tsx`, `ScanPage.tsx`, `SettingsPage.tsx` |
| Inventory components | `InventoryTable.tsx`, `AddItemDialog.tsx` (or inline dialog), `TransferDialog.tsx`, `LocationFilter.tsx` |
| Dashboard components | `KpiCards.tsx`, `StockMovementChart.tsx`, `LowStockList.tsx`, `MostUsedChart.tsx` |
| Report components | `DateRangeBar.tsx`, `InventorySnapshot.tsx`, `MovementReport.tsx`, `LowStockHistory.tsx`, `UsageReport.tsx` |
| Scanner components | `ScannerView.tsx`, `ScannedItemCard.tsx` |
| Activity components | `ActivityTable.tsx`, `columns.tsx` |
| Business logic | `export.ts` (XLSX headers/sheet names), `csv-import.ts` (file dialog titles) |
| Utilities | `utils.ts` — **create new** `actionLabel()` helper to map DB action values to Greek |
| Validation/errors | `locations.ts` (error messages), `inventory.ts` (error messages) |

### Not touched

- Database schema
- Internal DB action values (ADD, REMOVE, EDIT, DELETE, TRANSFER)
- Variable/function names
- Code comments

## Translation Reference

### Navigation & App Title

| English | Greek |
|---------|-------|
| StorageManagement | Διαχείριση Αποθήκης |
| Dashboard | Πίνακας Ελέγχου |
| Stock | Απόθεμα |
| Activity Log | Ημερολόγιο Δραστηριότητας |
| Reports | Αναφορές |
| Scan | Σάρωση |
| Settings | Ρυθμίσεις |

### Table Headers

| English | Greek |
|---------|-------|
| Barcode | Barcode |
| Description | Περιγραφή |
| Quantity | Ποσότητα |
| Location | Τοποθεσία |
| Date | Ημερομηνία |
| Date/Time | Ημερομηνία/Ώρα |
| Action | Ενέργεια |
| Qty Change | Μεταβολή Ποσ. |
| Last Updated | Τελευταία Ενημέρωση |

### Actions (display mapping — DB values stay English)

| DB Value | Display Greek |
|----------|--------------|
| ADD | Προσθήκη |
| REMOVE | Αφαίρεση |
| EDIT | Επεξεργασία |
| DELETE | Διαγραφή |
| TRANSFER | Μεταφορά |

A new `actionLabel(action: string): string` function in `utils.ts` maps DB action values to Greek display strings. Used in `activity/columns.tsx` and `export.ts`.

### KPI Cards

| English (actual code) | Greek |
|----------------------|-------|
| Unique Items | Μοναδικά Είδη |
| Total In Stock | Σύνολο σε Απόθεμα |
| Low Stock | Χαμηλό Απόθεμα |
| Added This Month | Προσθήκες Μήνα |

### Buttons & Common UI

| English | Greek |
|---------|-------|
| Save | Αποθήκευση |
| Cancel | Ακύρωση |
| Confirm | Επιβεβαίωση |
| Search | Αναζήτηση |
| Export | Εξαγωγή |
| Export XLSX | Εξαγωγή XLSX |
| Import | Εισαγωγή |
| Add | Προσθήκη |
| Add Item | Προσθήκη Είδους |
| Edit | Επεξεργασία |
| Edit Item | Επεξεργασία Είδους |
| Delete | Διαγραφή |
| Transfer | Μεταφορά |
| Transfer Item | Μεταφορά Είδους |
| Load More | Φόρτωση Περισσότερων |
| Scan Again | Νέα Σάρωση |
| All Locations | Όλες οι Τοποθεσίες |

### Dialog & Form Labels

| English | Greek |
|---------|-------|
| Destination Location | Τοποθεσία Προορισμού |
| Available: | Διαθέσιμα: |
| Select location... | Επιλέξτε τοποθεσία... |
| Location for new item | Τοποθεσία νέου είδους |
| New Item — Barcode Not Found | Νέο Είδος — Barcode Δεν Βρέθηκε |
| This barcode exists in multiple locations. Select one: | Αυτό το barcode υπάρχει σε πολλές τοποθεσίες. Επιλέξτε μία: |
| Current Stock | Τρέχον Απόθεμα |
| Amount | Ποσότητα |
| Qty: | Ποσ.: |

### Report Tabs & XLSX

| English | Greek |
|---------|-------|
| Snapshot | Στιγμιότυπο |
| Movement | Κινήσεις |
| Low Stock | Χαμηλό Απόθεμα |
| Usage | Χρήση |
| Inventory Snapshot | Στιγμιότυπο Αποθέματος |
| Movement Report | Αναφορά Κινήσεων |
| Low Stock History | Ιστορικό Χαμηλού Αποθέματος |
| Reagent Usage | Χρήση Αντιδραστηρίων |

### Report-Specific Column Headers

| English | Greek |
|---------|-------|
| Added | Προσθήκες |
| Removed | Αφαιρέσεις |
| Transfers In | Εισερχόμενες Μεταφορές |
| Transfers Out | Εξερχόμενες Μεταφορές |
| Net Change | Καθαρή Μεταβολή |
| Times Below | Φορές Κάτω |
| Days Below | Ημέρες Κάτω |
| Current Qty | Τρέχουσα Ποσ. |
| Status | Κατάσταση |
| Total Consumed | Συνολική Κατανάλωση |
| Avg Daily Usage | Μέση Ημερήσια Χρήση |
| Est. Depletion | Εκτ. Εξάντληση |

### Status Badges

| English | Greek |
|---------|-------|
| OK | Επαρκές |
| Low | Χαμηλό |
| Depleted | Εξαντλημένο |

### Date Presets (DateRangeBar)

| English | Greek |
|---------|-------|
| This Week | Αυτή την Εβδομάδα |
| This Month | Αυτόν τον Μήνα |
| 30 Days | 30 Ημέρες |
| 90 Days | 90 Ημέρες |
| This Year | Φέτος |

### Dashboard Chart Labels

| English | Greek |
|---------|-------|
| Stock Movement | Κίνηση Αποθέματος |
| Low Stock Items | Είδη σε Χαμηλό Απόθεμα |
| Most Used Reagents | Πιο Χρησιμοποιημένα Αντιδραστήρια |
| added (chart legend) | προσθήκες |
| removed (chart legend) | αφαιρέσεις |

### Day Selector Abbreviations

| English | Greek |
|---------|-------|
| 7d, 14d, 30d, 90d | 7ημ, 14ημ, 30ημ, 90ημ |

### Loading & Empty States

| English | Greek |
|---------|-------|
| Loading... | Φόρτωση... |
| Loading report... | Φόρτωση αναφοράς... |
| No items found. | Δεν βρέθηκαν είδη. |
| No activity recorded yet. | Δεν έχει καταγραφεί δραστηριότητα. |
| No inventory items found. | Δεν βρέθηκαν είδη αποθέματος. |
| No movement recorded in this period. | Δεν καταγράφηκαν κινήσεις σε αυτήν την περίοδο. |
| No items went below threshold in this period. | Κανένα είδος δεν έπεσε κάτω από το όριο σε αυτήν την περίοδο. |
| No reagent usage recorded in this period. | Δεν καταγράφηκε χρήση αντιδραστηρίων σε αυτήν την περίοδο. |
| All items are well-stocked. | Όλα τα είδη έχουν επαρκές απόθεμα. |
| No usage data yet. | Δεν υπάρχουν δεδομένα χρήσης. |
| N/A | Δ/Υ |
| days | ημέρες |

### Error & Confirmation Messages

| English | Greek |
|---------|-------|
| Failed to add item: | Αποτυχία προσθήκης είδους: |
| Failed to edit item: | Αποτυχία επεξεργασίας είδους: |
| Failed to delete item: | Αποτυχία διαγραφής είδους: |
| Failed to load dashboard: | Αποτυχία φόρτωσης πίνακα ελέγχου: |
| Export failed: | Αποτυχία εξαγωγής: |
| Import failed: | Αποτυχία εισαγωγής: |
| Are you sure you want to delete this item? | Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το είδος; |
| Camera error: | Σφάλμα κάμερας: |
| Source item not found | Το είδος προέλευσης δεν βρέθηκε |
| Insufficient quantity | Ανεπαρκής ποσότητα |
| Location name cannot be empty | Το όνομα τοποθεσίας δεν μπορεί να είναι κενό |
| Cannot delete the Default location | Δεν είναι δυνατή η διαγραφή της Προεπιλεγμένης τοποθεσίας |
| Cannot delete a location that has items | Δεν είναι δυνατή η διαγραφή τοποθεσίας που περιέχει είδη |

### Settings Page

| English | Greek |
|---------|-------|
| Dashboard Settings | Ρυθμίσεις Πίνακα Ελέγχου |
| Low Stock Threshold | Όριο Χαμηλού Αποθέματος |
| Items with quantity at or below this number will appear in the Low Stock alerts. | Τα είδη με ποσότητα ίση ή κάτω από αυτόν τον αριθμό θα εμφανίζονται στις ειδοποιήσεις Χαμηλού Αποθέματος. |
| Saved. | Αποθηκεύτηκε. |
| Locations | Τοποθεσίες |
| Manage storage locations. Items can be tracked per location. | Διαχείριση τοποθεσιών αποθήκευσης. Τα είδη μπορούν να παρακολουθούνται ανά τοποθεσία. |
| New location name... | Νέο όνομα τοποθεσίας... |
| CSV Import (Migration) | Εισαγωγή CSV (Μετάπτωση) |
| Import data from the old StorageManagement app. This is a one-time operation. | Εισαγωγή δεδομένων από την παλιά εφαρμογή. Αυτή είναι μια εφάπαξ ενέργεια. |
| Import Inventory.csv | Εισαγωγή Inventory.csv |
| Import Report.csv | Εισαγωγή Report.csv |
| Imported {count} inventory items. | Εισήχθησαν {count} είδη αποθέματος. |
| Imported {count} activity log entries. | Εισήχθησαν {count} εγγραφές δραστηριότητας. |
| Select Inventory.csv | Επιλέξτε Inventory.csv |
| Select Report.csv | Επιλέξτε Report.csv |
| About | Σχετικά |

### XLSX Export Details

| English | Greek |
|---------|-------|
| Inventory (sheet name) | Απόθεμα |
| Activity Log (sheet name) | Ημερολόγιο Δραστηριότητας |
| Report (sheet name) | Αναφορά |
| Activity Report (title) | Αναφορά Δραστηριότητας |
| Excel (file dialog filter) | Excel |

- Sheet names and column headers use Greek translations from the tables above
- XLSX action values use the `actionLabel()` mapper
- Date formatting unchanged (ISO/locale)
- "Excel" file filter label stays as-is (recognized universally)

## Implementation Notes

- `index.html`: change `lang="en"` to `lang="el"`
- `tauri.conf.json`: translate window title
- "Barcode" stays untranslated — universally used in Greek lab contexts
- "Default" location name in the DB: keep as-is since it's user-modifiable data, but display mapping could be considered in future
- Action values in the database remain English (ADD, REMOVE, etc.) to preserve existing data
- A new `actionLabel()` function must be **created** in `utils.ts` — it does not exist today
- `activity/columns.tsx` currently renders raw action strings; must call `actionLabel()` after it's created
- `export.ts` must also use `actionLabel()` when writing activity data to XLSX
- No new dependencies required
