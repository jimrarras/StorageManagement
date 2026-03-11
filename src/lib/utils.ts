import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  return brightness < 128 ? "#fff" : "#000";
}
