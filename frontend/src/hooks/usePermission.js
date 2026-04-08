import { useAuth } from '../context/AuthContext';

export function usePermission(perm) {
  const { hasPermission } = useAuth();
  return hasPermission(perm);
}
