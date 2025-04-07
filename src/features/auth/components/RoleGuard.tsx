import { useRBAC } from '../hooks/useRBAC';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

type RoleGuardProps = {
  children: React.ReactNode;
  requiredRole: 'usuario' | 'chefe' | 'comandante';
  fallbackPath?: string;
};

export function RoleGuard({
  children,
  requiredRole,
  fallbackPath = '/dashboard',
}: RoleGuardProps) {
  const { hasRole } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    if (!hasRole(requiredRole)) {
      router.replace(fallbackPath);
    }
  }, [hasRole, requiredRole, fallbackPath, router]);

  if (!hasRole(requiredRole)) {
    return null;
  }

  return <>{children}</>;
} 