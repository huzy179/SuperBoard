export function toLocalDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCalendarCells(
  currentMonth: Date,
): Array<{ date: Date; inMonth: boolean; key: string }> {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      date,
      inMonth: date.getMonth() === month,
      key: toLocalDayKey(date),
    };
  });
}

export function buildCurrentFilterUrl(pathname: string, queryString: string): string {
  return `${window.location.origin}${pathname}${queryString ? `?${queryString}` : ''}`;
}
