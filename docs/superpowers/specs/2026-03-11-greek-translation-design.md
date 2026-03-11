# Greek Translation Design

## Overview

Translate all user-facing English text in the StorageManagement app to Greek. This is a Greek-only translation — no multi-language support or i18n framework. Direct string replacement across all files.

## Approach

Direct replacement: go file-by-file and replace every English string with its Greek equivalent. No abstraction layer, no translations file, no i18n library.

## Scope

### Files to translate

| Area | Files |
|------|-------|
| Navigation & Layout | `AppLayout.tsx`, `Sidebar.tsx`, `SearchBar.tsx` |
| Pages | `StockPage.tsx`, `DashboardPage.tsx`, `LogPage.tsx`, `ReportsPage.tsx`, `ScanPage.tsx`, `SettingsPage.tsx` |
| Components | Inventory dialogs/table, dashboard widgets, report views, scanner, activity table |
| Business logic | `export.ts` (XLSX headers/sheet names), action display mapping in `utils.ts` |

### Not touched

- Database schema
- Internal DB action values (ADD, REMOVE, EDIT, DELETE, TRANSFER)
- Variable/function names
- Code comments

## Translation Reference

### Navigation

| English | Greek |
|---------|-------|
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
| Action | Ενέργεια |

### Actions (display mapping only — DB values stay English)

| DB Value | Display Greek |
|----------|--------------|
| ADD | Προσθήκη |
| REMOVE | Αφαίρεση |
| EDIT | Επεξεργασία |
| DELETE | Διαγραφή |
| TRANSFER | Μεταφορά |

A helper function in `utils.ts` maps DB action values to Greek display strings.

### KPI Cards

| English | Greek |
|---------|-------|
| Total Items | Σύνολο Ειδών |
| Total Quantity | Συνολική Ποσότητα |
| Low Stock | Χαμηλό Απόθεμα |
| Added This Month | Προσθήκες Τρέχοντος Μήνα |

### Buttons & Common UI

| English | Greek |
|---------|-------|
| Save | Αποθήκευση |
| Cancel | Ακύρωση |
| Confirm | Επιβεβαίωση |
| Search | Αναζήτηση |
| Export | Εξαγωγή |
| Import | Εισαγωγή |

### Report Tabs & XLSX Sheet Names

| English | Greek |
|---------|-------|
| Inventory Snapshot | Στιγμιότυπο Αποθέματος |
| Movement Report | Αναφορά Κινήσεων |
| Low Stock History | Ιστορικό Χαμηλού Αποθέματος |
| Reagent Usage | Χρήση Αντιδραστηρίων |

### XLSX Exports

- Sheet names use Greek translations from the report tabs table above
- Column headers match Greek table headers
- Date formatting unchanged (ISO/locale)

## Implementation Notes

- "Barcode" stays untranslated — universally used in Greek lab contexts
- Action values in the database remain English (ADD, REMOVE, etc.) to preserve existing data; a display mapper converts to Greek in the UI
- No new dependencies required
