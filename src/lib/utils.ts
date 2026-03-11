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
