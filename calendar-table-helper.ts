import dayjs from "./dayjs";
import head from 'lodash.head';
import last from 'lodash.last'

export type PatchedDate = Date & { notCurrentMonth: boolean }
export type WeeksTable = PatchedDate[][]
export type DatePositionMap = Record<string, {row: number, col: number}>

function getDaysOfMonth(date: Date): PatchedDate[] {
  const numberOfDays = dayjs(date).daysInMonth();

  const daysArray:PatchedDate[] = [];

  for (let i = 1; i <= numberOfDays; i++) {
    const day = dayjs(date).set('date', i);
    daysArray.push(Object.assign(day.toDate(), { notCurrentMonth: false }));
  }

  return daysArray;
}

// Get days from previous month overlapping current month
function getPreviousMonthOverlappingDays(date: Date, startAtMon: boolean): PatchedDate[] {
  const firstDay = dayjs(date).startOf('month');
  const firstWeekDay = dayjs(firstDay).weekday();
  const prevMonthDays:PatchedDate[] = [];
  const prevMonthDaysCount = startAtMon ? firstWeekDay === 0 ? 6 : firstWeekDay - 1 : firstWeekDay;

  for (let i = startAtMon ? 1 : 0; i <= prevMonthDaysCount; i++) {
    const originalDay = firstDay;
    const preDay = dayjs(originalDay).weekday(firstWeekDay - i);
    prevMonthDays.push(Object.assign(preDay.toDate(), { notCurrentMonth: true }));
  }

  return prevMonthDays.reverse();
}

// Get days from previous month overlapping current month
function getNextMonthOverlappingDays(date: Date, startAtMon: boolean): PatchedDate[] {
  const lastDay = dayjs(date).endOf('month');
  const lastWeekDay = dayjs(lastDay).weekday();
  const nextMonthDays:PatchedDate[] = [];
  const nextMonthDaysCount = startAtMon ? 7 - (lastWeekDay === 0 ? 7 : lastWeekDay) : 7 - lastWeekDay;

  for (let i = 1; i <= nextMonthDaysCount; i += 1) {
    const nextDay = dayjs(lastDay).add(i, 'days');
    nextMonthDays.push(Object.assign(nextDay.toDate(), { notCurrentMonth: true }));
  }

  return nextMonthDays;
}

export function initWeekDays(startAtMon: boolean): string[] {
  const weekdays = startAtMon ? [ 1, 2, 3, 4, 5, 6, 0 ] : [ 0, 1, 2, 3, 4, 5, 6 ];
  const date = new Date();
  return weekdays.map(w => dayjs(dayjs(date).weekday(w)).format( 'ddd'));
}

export function buildWeeksTable(date: Date, startAtMon: boolean) {
  const weeksTable: WeeksTable = [];
  const datePositionMap: DatePositionMap = {};

  const monthDays = getPreviousMonthOverlappingDays(date, startAtMon)
    .concat(getDaysOfMonth(date))
    .concat(getNextMonthOverlappingDays(date, startAtMon));

  for (let j = 0, rowId = 0; j < monthDays.length; j = j + 7) {
    const week = monthDays.slice(j, j + 7);
    week.forEach((day, colId) => {
      datePositionMap[dayjs(day).format('YYYY-MM-DD')] = { row: rowId, col: colId };
    });

    weeksTable.push(week);
    rowId++;
  }

  return {
    datePositionMap,
    weeksTable
  };
}

function getFirstDateInCalendar(monthDate: Date) {
  const firstDayOfMonth = dayjs(monthDate).startOf('month');
  if (dayjs(firstDayOfMonth).weekday() === 1) {
    return firstDayOfMonth;
  }
  return head(getPreviousMonthOverlappingDays(monthDate, true));
}

function getLastDateInCalendar(monthDate: Date) {
  const lastDayOfMonth = dayjs(monthDate).endOf('month');
  if (dayjs(lastDayOfMonth).weekday() === 0) {
    return lastDayOfMonth;
  }
  return last(getNextMonthOverlappingDays(monthDate, true));
}

export function getCalendarRange(monthDate: Date) {
  return [ getFirstDateInCalendar(monthDate), getLastDateInCalendar(monthDate) ];
}
