import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Building2, 
  TreePine, 
  Package, 
  Clock,
  TrendingUp,
  CalendarPlus,
  ArrowRight,
} from 'lucide-react';
import { mockReservations, mockResources, getResourceById } from '@/data/mockData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  const userReservations = mockReservations.filter(r => r.userId === user?.id);
  const upcomingReservations = userReservations
    .filter(r => new Date(r.startTime) > new Date() && r.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  const stats = {
    totalReservations: userReservations.length,
    activeReservations: userReservations.filter(r => r.status === 'confirmed').length,
    rooms: mockResources.filter(r => r.type === 'room').length,
    fields: mockResources.filter(r => r.type === 'field').length,
    equipment: mockResources.filter(r => r.type === 'equipment').length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      confirmed: { label: 'Confirmé', variant: 'default' },
      cancelled: { label: 'Annulé', variant: 'destructive' },
      completed: { label: 'Terminé', variant: 'outline' },
    };
    const { label, variant } = variants[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'room': return <Building2 className="h-4 w-4" />;
      case 'field': return <TreePine className="h-4 w-4" />;
      case 'equipment': return <Package className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Bonjour, {user?.firstName} 👋
            </h1>
            <p className="text-muted-foreground">
              Gérez vos réservations et découvrez les ressources disponibles
            </p>
          </div>
          <Button asChild>
            <Link to="/reservations/new">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Nouvelle réservation
            </Link>
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mes réservations</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReservations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeReservations} actives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Salles</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rooms}</div>
              <p className="text-xs text-muted-foreground">disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Terrains</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fields}</div>
              <p className="text-xs text-muted-foreground">disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Matériel</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.equipment}</div>
              <p className="text-xs text-muted-foreground">articles</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming reservations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Prochaines réservations
              </CardTitle>
              <CardDescription>
                Vos réservations à venir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingReservations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune réservation à venir</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/reservations/new">Faire une réservation</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingReservations.map((reservation) => {
                    const resource = getResourceById(reservation.resourceId);
                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center gap-4 p-3 rounded-lg border"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {resource && getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {resource?.name || 'Ressource inconnue'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(reservation.startTime), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                          </p>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>
                    );
                  })}
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/reservations">
                      Voir toutes mes réservations
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Accès rapide
              </CardTitle>
              <CardDescription>
                Réservez rapidement une ressource
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-auto py-4" asChild>
                <Link to="/resources/rooms">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Réserver une salle</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.rooms} salles disponibles
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-4" asChild>
                <Link to="/resources/fields">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TreePine className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Réserver un terrain</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.fields} terrains disponibles
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-4" asChild>
                <Link to="/resources/equipment">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Réserver du matériel</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.equipment} articles disponibles
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};
