import { useAuth } from '../contexts/AuthContext';
import { User } from '@/lib/supabase';

type Role = 'usuario' | 'chefe' | 'comandante';

const roleHierarchy: Record<Role, number> = {
  usuario: 1,
  chefe: 2,
  comandante: 3,
};

export function useRBAC() {
  const { user } = useAuth();

  const hasRole = (requiredRole: Role): boolean => {
    if (!user) return false;
    const userRole = user.role as Role;
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const canManageMaterials = (): boolean => {
    return hasRole('chefe');
  };

  const canEditPastChecklists = (): boolean => {
    return hasRole('chefe');
  };

  const canManageUsers = (): boolean => {
    return hasRole('comandante');
  };

  const canViewReports = (): boolean => {
    return hasRole('chefe');
  };

  const canManageSettings = (): boolean => {
    return hasRole('comandante');
  };

  return {
    hasRole,
    canManageMaterials,
    canEditPastChecklists,
    canManageUsers,
    canViewReports,
    canManageSettings,
  };
} 