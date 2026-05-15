const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function kstTimestampNow(): string {
  return toKstTimestamp(new Date());
}

export function kstTimestampAfter(milliseconds: number): string {
  return toKstTimestamp(new Date(Date.now() + milliseconds));
}

export function todayKstDate(): string {
  return toKstDate(new Date());
}

export function yesterdayKstDate(): string {
  return toKstDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

export function currentKstTime(): string {
  return toKstTime(new Date());
}

export function nextMonthKstRange() {
  const shifted = new Date(Date.now() + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month + 1, 1));
  const lastDay = new Date(Date.UTC(year, month + 2, 0));

  return {
    fromDate: firstDay.toISOString().slice(0, 10),
    toDate: lastDay.toISOString().slice(0, 10),
  };
}

export function currentAndNextMonthKstRange() {
  const shifted = new Date(Date.now() + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 2, 0));

  return {
    fromDate: firstDay.toISOString().slice(0, 10),
    toDate: lastDay.toISOString().slice(0, 10),
  };
}

function toKstTimestamp(date: Date): string {
  return shiftToKst(date).toISOString().slice(0, 19);
}

function toKstDate(date: Date): string {
  return shiftToKst(date).toISOString().slice(0, 10);
}

function toKstTime(date: Date): string {
  return shiftToKst(date).toISOString().slice(11, 19);
}

function shiftToKst(date: Date): Date {
  return new Date(date.getTime() + KST_OFFSET_MS);
}
