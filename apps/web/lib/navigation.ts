export type NavItem = {
  href: string;
  label: string;
};

export const PUBLIC_ROUTES = {
  login: '/login',
} as const;

export const PRIVATE_ROUTES = {
  jira: '/jira',
} as const;

export const PRIVATE_NAV_ITEMS: NavItem[] = [{ href: PRIVATE_ROUTES.jira, label: 'Projects' }];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
