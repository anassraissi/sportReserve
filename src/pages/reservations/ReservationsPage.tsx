import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Building2, TreePine, Package, CalendarPlus, X } from 'lucide-react';
import { mockReservations, getResourceById } from '@/data/mockData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export const ReservationsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState(mockReservations.filter(r => r.userId === user?.id));

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

  const handleCancel = (id: string) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r));
    toast({ title: 'Réservation annulée', description: 'Votre réservation a été annulée.' });
  };

  const upcoming = reservations.filter(r => new Date(r.startTime) > new Date() && r.status !== 'cancelled');
  const past = reservations.filter(r => new Date(r.startTime) <= new Date() || r.status === 'cancelled');

  const ReservationCard = ({ reservation }: { reservation: typeof reservations[0] }) => {
    const resource = getResourceById(reservation.resourceId);
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {resource && getResourceIcon(resource.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{resource?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(reservation.startTime), "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(reservation.startTime), "HH:mm")} - {format(new Date(reservation.endTime), "HH:mm")}
                  </p>
                </div>
                {getStatusBadge(reservation.status)}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-medium">{reservation.totalPrice}€</span>
                {reservation.status === 'confirmed' && new Date(reservation.startTime) > new Date() && (
                  <Button variant="outline" size="sm" onClick={() => handleCancel(reservation.id)}>
                    <X className="h-4 w-4 mr-1" /> Annuler
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mes réservations</h1>
          <Button asChild><Link to="/reservations/new"><CalendarPlus className="h-4 w-4 mr-2" />Nouvelle</Link></Button>
        </div>
        <Tabs defaultValue="upcoming">
          <TabsList><TabsTrigger value="upcoming">À venir ({upcoming.length})</TabsTrigger><TabsTrigger value="past">Historique ({past.length})</TabsTrigger></TabsList>
          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {upcoming.length === 0 ? <Card className="text-center py-8"><CardContent><p className="text-muted-foreground">Aucune réservation à venir</p></CardContent></Card> : upcoming.map(r => <ReservationCard key={r.id} reservation={r} />)}
          </TabsContent>
          <TabsContent value="past" className="space-y-4 mt-4">
            {past.length === 0 ? <Card className="text-center py-8"><CardContent><p className="text-muted-foreground">Aucun historique</p></CardContent></Card> : past.map(r => <ReservationCard key={r.id} reservation={r} />)}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};
