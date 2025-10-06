import i18next from 'i18next';

export type ColumnType = 'regular' | 'sick_leave' | 'vacation';

export const getColumnTypeLabel = (type: ColumnType): string => {
  const labels: Record<ColumnType, string> = {
    regular: i18next.t('column.typeRegular'),
    sick_leave: i18next.t('column.typeSickLeave'),
    vacation: i18next.t('column.typeVacation'),
  };
  return labels[type];
};

export const getColumnTypeOptions = () => [
  { value: 'regular' as ColumnType, label: i18next.t('column.typeRegular') },
  { value: 'sick_leave' as ColumnType, label: i18next.t('column.typeSickLeave') },
  { value: 'vacation' as ColumnType, label: i18next.t('column.typeVacation') },
];
