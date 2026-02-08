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
            'fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700 bg-gradient-to-r from-blue-600 to-purple-600">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-white" />
              <span className="font-bold text-lg text-white">sportResrve</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex flex-col gap-1 p-3 overflow-y-auto flex-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-base">{item.emoji}</span>
                  {item.name}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="my-3 border-t border-slate-700" />
                <p className="px-3 text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  🔧 Mes ressources
                </p>
                <Link
                  to="/resources/my"
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    location.pathname === '/resources/my' || location.pathname.startsWith('/resources/') && (location.pathname.includes('/new') || location.pathname.includes('/edit') || location.pathname.includes('/media'))
                      ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-base">🧩</span>
                  Mes ressources
                </Link>

                <div className="my-3 border-t border-slate-700" />
                <p className="px-3 text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  ⚙️ Administration
                </p>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="text-base">{item.emoji}</span>
                      {item.name}
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
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 px-4 lg:px-6 shadow-md">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-700 hover:bg-slate-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

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


