import type { ShiftType } from '../types';

/** Canonical local shift windows (24h clock). */
export const SHIFT_SCHEDULE: Record<
  ShiftType,
  { startHour: number; endHour: number; label: string }
> = {
  MORNING: { startHour: 7, endHour: 15, label: '7:00–15:00' },
  AFTERNOON: { startHour: 15, endHour: 23, label: '15:00–23:00' },
  NIGHT: { startHour: 23, endHour: 7, label: '23:00–7:00' },
};

export function shiftTypeWithHours(type: string, labels: Record<string, string>): string {
  const name = labels[type] ?? type;
  const hours = SHIFT_SCHEDULE[type as ShiftType]?.label;
  return hours ? `${name} (${hours})` : name;
}
