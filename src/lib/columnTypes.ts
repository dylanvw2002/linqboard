import i18next from 'i18next';

export type ColumnType = 'regular' | 'sick_leave' | 'vacation' | 'announcement' | 'completed';

export const getColumnTypeLabel = (type: ColumnType): string => {
  const labels: Record<ColumnType, string> = {
    regular: i18next.t('column.typeRegular'),
    sick_leave: i18next.t('column.typeSickLeave'),
    vacation: i18next.t('column.typeVacation'),
    announcement: i18next.t('column.typeAnnouncement'),
    completed: i18next.t('column.typeCompleted'),
  };
  return labels[type];
};

export const getColumnTypeOptions = () => [
  { value: 'regular' as ColumnType, label: i18next.t('column.typeRegular') },
  { value: 'sick_leave' as ColumnType, label: i18next.t('column.typeSickLeave') },
  { value: 'vacation' as ColumnType, label: i18next.t('column.typeVacation') },
  { value: 'announcement' as ColumnType, label: i18next.t('column.typeAnnouncement') },
  { value: 'completed' as ColumnType, label: i18next.t('column.typeCompleted') },
];
