export type ColumnType = 'regular' | 'sick_leave' | 'vacation';

export const columnTypeLabels: Record<ColumnType, string> = {
  regular: 'Regulier',
  sick_leave: 'Ziekte',
  vacation: 'Verlof',
};

export const columnTypeOptions = [
  { value: 'regular' as ColumnType, label: 'Regulier' },
  { value: 'sick_leave' as ColumnType, label: 'Ziekte' },
  { value: 'vacation' as ColumnType, label: 'Verlof' },
];
