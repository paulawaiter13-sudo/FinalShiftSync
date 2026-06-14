import { ShiftType } from '@prisma/client';

/** Canonical local shift windows (24h clock). */
export const SHIFT_SCHEDULE = {
  MORNING: { startHour: 7, endHour: 15, label: '7:00–15:00' },
  AFTERNOON: { startHour: 15, endHour: 23, label: '15:00–23:00' },
  NIGHT: { startHour: 23, endHour: 7, label: '23:00–7:00' },
} as const satisfies Record<
  ShiftType,
  { startHour: number; endHour: number; label: string }
>;

export function getCurrentShiftType(now = new Date()): ShiftType {
  const hour = now.getHours();
  if (hour >= 7 && hour < 15) return ShiftType.MORNING;
  if (hour >= 15 && hour < 23) return ShiftType.AFTERNOON;
  return ShiftType.NIGHT;
}

export function getPreviousShiftType(type: ShiftType): ShiftType {
  if (type === ShiftType.MORNING) return ShiftType.NIGHT;
  if (type === ShiftType.AFTERNOON) return ShiftType.MORNING;
  return ShiftType.AFTERNOON;
}

export function getNextShiftType(type: ShiftType): ShiftType {
  if (type === ShiftType.MORNING) return ShiftType.AFTERNOON;
  if (type === ShiftType.AFTERNOON) return ShiftType.NIGHT;
  return ShiftType.MORNING;
}

/** Local start/end for the shift period that contains `reference`. */
export function getShiftWindow(shiftType: ShiftType, reference = new Date()): {
  start: Date;
  end: Date;
} {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const day = reference.getDate();
  const hour = reference.getHours();

  if (shiftType === ShiftType.MORNING) {
    return {
      start: new Date(year, month, day, 7, 0, 0, 0),
      end: new Date(year, month, day, 15, 0, 0, 0),
    };
  }

  if (shiftType === ShiftType.AFTERNOON) {
    return {
      start: new Date(year, month, day, 15, 0, 0, 0),
      end: new Date(year, month, day, 23, 0, 0, 0),
    };
  }

  // Night crosses midnight: 23:00 → 07:00
  if (hour >= 23) {
    return {
      start: new Date(year, month, day, 23, 0, 0, 0),
      end: new Date(year, month, day + 1, 7, 0, 0, 0),
    };
  }

  if (hour < 7) {
    return {
      start: new Date(year, month, day - 1, 23, 0, 0, 0),
      end: new Date(year, month, day, 7, 0, 0, 0),
    };
  }

  // Daytime reference: most recent completed night (ended this morning)
  return {
    start: new Date(year, month, day - 1, 23, 0, 0, 0),
    end: new Date(year, month, day, 7, 0, 0, 0),
  };
}

/** Shift window immediately before the one containing `reference`. */
export function getPreviousShiftWindow(reference = new Date()): {
  type: ShiftType;
  start: Date;
  end: Date;
} {
  const current = getCurrentShiftType(reference);
  const type = getPreviousShiftType(current);
  const { end } = getShiftWindow(current, reference);
  const prevEnd = new Date(end.getTime() - 60_000);
  const window = getShiftWindow(type, prevEnd);
  return { type, ...window };
}

/** Shift window immediately after the one containing `reference`. */
export function getNextShiftWindow(reference = new Date()): {
  type: ShiftType;
  start: Date;
  end: Date;
} {
  const current = getCurrentShiftType(reference);
  const type = getNextShiftType(current);
  const { end } = getShiftWindow(current, reference);
  const nextStart = new Date(end.getTime() + 60_000);
  const window = getShiftWindow(type, nextStart);
  return { type, ...window };
}
