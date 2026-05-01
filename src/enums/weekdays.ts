export enum Weekday {
    MONDAY = 'monday',
    TUESDAY = 'tuesday',
    WEDNESDAY = 'wednesday',
    THURSDAY = 'thursday',
    FRIDAY = 'friday',
    SATURDAY = 'saturday',
}

export const WeekdayLabels: Record<Weekday, string> = {
    [Weekday.MONDAY]: 'Lunes',
    [Weekday.TUESDAY]: 'Martes',
    [Weekday.WEDNESDAY]: 'Miércoles',
    [Weekday.THURSDAY]: 'Jueves',
    [Weekday.FRIDAY]: 'Viernes',
    [Weekday.SATURDAY]: 'Sábado',
};

export const WeekdayMap: Record<Weekday, number> = {
    [Weekday.MONDAY]: 1,
    [Weekday.TUESDAY]: 2,
    [Weekday.WEDNESDAY]: 3,
    [Weekday.THURSDAY]: 4,
    [Weekday.FRIDAY]: 5,
    [Weekday.SATURDAY]: 6,
};
