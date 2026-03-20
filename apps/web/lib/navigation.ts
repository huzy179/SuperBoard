export type NavItem = {
  href: string;
  label: string;
  icon: 'projects' | 'dashboard' | 'settings';
  disabled?: boolean;
};

export const PUBLIC_ROUTES = {
  login: '/login',
} as const;

export const PRIVATE_ROUTES = {
  jira: '/jira',
} as const;

export const PRIVATE_NAV_ITEMS: NavItem[] = [
  { href: PRIVATE_ROUTES.jira, label: 'Dự án', icon: 'projects' },
  { href: '#', label: 'Dashboard', icon: 'dashboard', disabled: true },
  { href: '#', label: 'Cài đặt', icon: 'settings', disabled: true },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
