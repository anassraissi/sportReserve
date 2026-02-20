import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  MapPinned,
  Dumbbell,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, emoji: '📊' },
  { name: 'Réservations', href: '/reservations', icon: Calendar, emoji: '📅' },
  { name: 'Terrains de sport', href: '/resources/terrains', icon: MapPinned, emoji: '🏟️' },
  { name: 'Salles de sport', href: '/resources/salles', icon: Building2, emoji: '🏛️' },
  { name: 'Équipements', href: '/resources/equipment', icon: Dumbbell, emoji: '🏋️' },
];

const adminNavigation = [
  { name: 'Avis & Commentaires', href: '/reviews', icon: Star, emoji: '⭐' },
  { name: 'Gestion Utilisateurs', href: '/admin/users', icon: Users, emoji: '👥' },
  { name: 'Gestion Réservations', href: '/admin/reservations', icon: Calendar, emoji: '🔧' },
  { name: 'Gestion Ressources', href: '/admin/resources', icon: Dumbbell, emoji: '🏛️' },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const navSizing = isAdmin
    ? {
        navGap: 'gap-0.5',
        navPadding: 'p-2.5',
        item: 'gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]',
        iconBox: 'h-8 w-8 rounded-md',
        iconSize: 'h-3.5 w-3.5',
        section: 'px-2.5 text-[9px] tracking-[0.18em] mb-0.5',
        divider: 'my-2',
      }
    : {
        navGap: 'gap-1.5',
        navPadding: 'p-3',
        item: 'gap-3 rounded-xl px-3 py-2.5 text-sm',
        iconBox: 'h-9 w-9 rounded-lg',
        iconSize: 'h-4 w-4',
        section: 'px-3 text-[10px] tracking-[0.2em] mb-1',
        divider: 'my-3',
      };
  const navItems = [
    ...navigation,
    ...(isAdmin
      ? [
          { name: 'Mes ressources', href: '/resources/my', icon: Dumbbell, emoji: '🧩' },
          ...adminNavigation,
        ]
      : []),
  ];
  const activeItem = navItems.find(
    (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  );
  const pageTitle = activeItem?.name ?? 'Tableau de bord';

  return (
      <div className="min-h-screen">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}></div>
        )}
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 lg:w-64 transform bg-slate-950 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-display text-lg shadow-lg">
                SR
              </div>
              <span className="font-display text-lg text-white">sportReserve</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className={cn('flex flex-col flex-1 overflow-hidden', navSizing.navGap, navSizing.navPadding)}>
            {navigation.map((item) => {
              // Hide "Réservations" for admin users
              if (isAdmin && item.name === 'Réservations') return null;
              
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={item.name}
                  className={cn(
                    'group flex items-center font-medium transition-all duration-200',
                    navSizing.item,
                    isActive
                      ? 'bg-white/10 text-white shadow-lg shadow-purple-500/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={cn(
                    'flex items-center justify-center transition-colors',
                    navSizing.iconBox,
                    isActive ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-slate-800 text-slate-200 group-hover:bg-slate-700'
                  )}>
                    <item.icon className={navSizing.iconSize} />
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="my-3 border-t border-slate-700" />
                <p className={cn('font-semibold uppercase text-slate-500', navSizing.section)}>
                  🔧 Mes ressources
                </p>
                <Link
                  to="/resources/my"
                  title="Mes ressources"
                  className={cn(
                    'group flex items-center font-medium transition-all duration-200',
                    navSizing.item,
                    location.pathname === '/resources/my' || location.pathname.startsWith('/resources/') && (location.pathname.includes('/new') || location.pathname.includes('/edit') || location.pathname.includes('/media'))
                      ? 'bg-white/10 text-white shadow-lg shadow-purple-500/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={cn(
                    'flex items-center justify-center transition-colors',
                    navSizing.iconBox,
                    location.pathname === '/resources/my' || location.pathname.startsWith('/resources/') && (location.pathname.includes('/new') || location.pathname.includes('/edit') || location.pathname.includes('/media'))
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                      : 'bg-slate-800 text-slate-200 group-hover:bg-slate-700'
                  )}>
                    <Dumbbell className={navSizing.iconSize} />
                  </span>
                  <span>Mes ressources</span>
                </Link>

                <div className={cn('border-t border-slate-700', navSizing.divider)} />
                <p className={cn('font-semibold uppercase text-slate-500', navSizing.section)}>
                  ⚙️ Administration
                </p>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      title={item.name}
                      className={cn(
                        'group flex items-center font-medium transition-all duration-200',
                        navSizing.item,
                        isActive
                          ? 'bg-white/10 text-white shadow-lg shadow-purple-500/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className={cn(
                        'flex items-center justify-center transition-colors',
                        navSizing.iconBox,
                        isActive ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-slate-800 text-slate-200 group-hover:bg-slate-700'
                      )}>
                        <item.icon className={navSizing.iconSize} />
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur border-slate-200 px-4 lg:px-6 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-700 hover:bg-slate-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-display text-base shadow-sm">
                {pageTitle.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-xl font-medium text-slate-900">{pageTitle}</h1>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-slate-200">
                  <Avatar className="h-8 w-8 border-2 border-blue-600">
                    <AvatarImage 
                      src={user?.avatarUrl 
                        ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`)
                        : undefined
                      } 
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block text-slate-700 font-semibold">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
                    <span className="text-xs text-slate-500">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">👤 Mon profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/reservations">📅 Mes réservations</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/users">👥 Gestion des utilisateurs</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
  );
};


