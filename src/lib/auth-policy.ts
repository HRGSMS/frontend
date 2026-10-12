export const roles = ['admin', 'manager', 'front_desk', 'service_staff', 'guest'] as const;
export type Role = (typeof roles)[number];
export function getRole(role: unknown): Role | null {
  return typeof role === 'string' && roles.includes(role as Role) ? (role as Role) : null;
}
export function homeForRole(role: unknown): string {
  switch (getRole(role)) {
    case 'admin':
      return '/admin/dashboard';
    case 'manager':
      return '/manager/dashboard';
    case 'front_desk':
      return '/frontdesk/dashboard';
    case 'service_staff':
      return '/services/dashboard';
    case 'guest':
      return '/guest/dashboard';
    default:
      return '/unauthorized';
  }
}
export function canAccessPath(role: unknown, path: string): boolean {
  const resolved = getRole(role);
  if (!resolved || !path.startsWith('/') || path.startsWith('//') || path.includes('\\'))
    return false;
  const pathname = path.split(/[?#]/)[0];
  if (
    pathname.split('/').some((segment) => segment === '.' || segment === '..') ||
    pathname.includes('%') ||
    Array.from(pathname).some((character) => character.charCodeAt(0) <= 32)
  )
    return false;
  const area = path.split(/[/?#]/)[1];
  switch (area) {
    case 'account':
      return true;
    case 'frontdesk':
      if (pathname === '/frontdesk/reports') {
        return false;
      }
      return ['admin', 'manager', 'front_desk'].includes(resolved);
    case 'admin':
      return resolved === 'admin';
    case 'manager':
      return resolved === 'admin' || resolved === 'manager';
    case 'services':
      return ['admin', 'manager', 'front_desk', 'service_staff'].includes(resolved);
    case 'guest':
      return resolved === 'guest';
    default:
      return false;
  }
}
export function loginDestination(role: unknown): string {
  return homeForRole(role);
}
export const roleLabels: Record<Role, string> = {
  admin: 'System Administrator',
  manager: 'Branch Manager',
  front_desk: 'Front Desk',
  service_staff: 'Service Staff',
  guest: 'Guest',
};
