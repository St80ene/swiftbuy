export interface Dashboard {
  title: string;
}

export interface DashboardSection extends Dashboard {
  cards: DashboardCard[];
}

export interface DashboardCard extends Dashboard {
  id: string;

  value: number | string;

  subtitle?: string;

  severity?: 'success' | 'warning' | 'danger' | 'info';

  icon?: string;

  action?: DashboardAction;
}

export interface DashboardAction {
  label: string;
  url: string;
}
