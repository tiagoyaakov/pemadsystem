import { useRBAC } from '@/features/auth/hooks/useRBAC';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconType } from 'react-icons';
import { 
  HiOutlineClipboardCheck, 
  HiOutlineChartBar, 
  HiOutlineFire,
  HiOutlineDocumentReport,
  HiOutlineCog
} from 'react-icons/hi';

interface NavItem {
  name: string;
  href: string;
  icon: IconType;
  requiresRole?: 'usuario' | 'chefe' | 'comandante';
}

const navigation: NavItem[] = [
  { name: 'Conferência', href: '/conferencia', icon: HiOutlineClipboardCheck },
  { name: 'Dashboard', href: '/dashboard', icon: HiOutlineChartBar },
  { name: 'Queimadas', href: '/queimadas', icon: HiOutlineFire },
  { name: 'Relatórios', href: '/relatorios', icon: HiOutlineDocumentReport, requiresRole: 'chefe' },
  { name: 'Configurações', href: '/configuracoes', icon: HiOutlineCog, requiresRole: 'comandante' },
];

export function Sidebar() {
  const router = useRouter();
  const { hasRole } = useRBAC();

  const isActive = (href: string) => router.pathname === href;

  return (
    <nav className="flex-1 px-2 py-4 bg-white space-y-1">
      {navigation.map((item) => {
        if (item.requiresRole && !hasRole(item.requiresRole)) {
          return null;
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md
              ${
                isActive(item.href)
                  ? 'bg-cbmmg-red text-white'
                  : 'text-cbmmg-gray-600 hover:bg-cbmmg-red hover:text-white'
              }
            `}
          >
            <item.icon
              className={`
                mr-3 flex-shrink-0 h-6 w-6
                ${
                  isActive(item.href)
                    ? 'text-white'
                    : 'text-cbmmg-gray-400 group-hover:text-white'
                }
              `}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
} 