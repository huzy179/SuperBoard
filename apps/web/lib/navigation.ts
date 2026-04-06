export type NavItem = {
  href: string;
  label: string;
  icon: 'projects' | 'dashboard' | 'settings' | 'notifications' | 'chat' | 'docs';
  disabled?: boolean;
};

export const PUBLIC_ROUTES = {
  login: '/login',
} as const;

export const PRIVATE_ROUTES = {
  jira: '/jira',
  dashboard: '/dashboard',
  settings: '/settings',
  chat: '/chat',
  docs: '/docs',
} as const;

export const PRIVATE_NAV_ITEMS: NavItem[] = [
  { href: PRIVATE_ROUTES.jira, label: 'Dự án', icon: 'projects' },
  { href: PRIVATE_ROUTES.chat, label: 'Chat', icon: 'chat' },
  { href: PRIVATE_ROUTES.docs, label: 'Tài liệu', icon: 'docs' },
  { href: PRIVATE_ROUTES.dashboard, label: 'Dashboard', icon: 'dashboard' },
  { href: PRIVATE_ROUTES.settings, label: 'Cài đặt', icon: 'settings' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
