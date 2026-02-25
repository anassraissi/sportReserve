import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Building2, MapPinned, Dumbbell, CalendarPlus, X, Loader2, Printer, Edit2, CreditCard, ArrowRight } from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ReservationTicket } from '@/components/reservations/ReservationTicket';
import { WeatherRecommendationBadge } from '@/components/reservations/WeatherRecommendationBadge';

export const ReservationsPage: React.FC = () => {
  const { user } = useAuth();
  const { reservationsVersion, triggerRefresh, checkForUpdates } = useDataSync();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [weatherRecommendations, setWeatherRecommendations] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setIsLoading(true);
        // Fetch only current user's reservations - backend filters by req.user._id
        const response = await bookingsAPI.getAll({ page: 1, limit: 100 });
        setReservations(response.reservations || []);

        try {
          const weatherRes = await bookingsAPI.getRecommendations({ scope: 'all', limit: 100 });
          const recMap: Record<string, any> = {};
          (weatherRes.recommendations || []).forEach((item: any) => {
            if (item?.reservationId) {
              recMap[item.reservationId] = item.recommendation;
            }
          });
          setWeatherRecommendations(recMap);
        } catch (weatherError) {
          console.warn('Failed to load weather recommendations:', weatherError);
        }
      } catch (error: any) {
        console.error('Error loading reservations:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les réservations.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadReservations();
    }
  }, [user, toast]); // Only reload on mount, not on version changes

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
      case 'field': return <MapPinned className="h-4 w-4" />;
      case 'equipment': return <Dumbbell className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await bookingsAPI.cancel(id);
      setReservations(prev => prev.map((r: any) => 
        (r._id === id || r.id === id) ? { ...r, status: 'cancelled' } : r
      ));
      
      // Trigger immediate data sync
      triggerRefresh('reservations');
      await checkForUpdates();
      
      toast({ title: 'Réservation annulée', description: 'Votre réservation a été annulée.' });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'annuler la réservation.',
        variant: 'destructive',
      });
    }
  };

  const upcoming = reservations.filter((r: any) => {
    const startTime = new Date(r.startTime);
    return startTime > new Date() && !['cancelled', 'completed'].includes(r.status);
  });
  const past = reservations.filter((r: any) => {
    const startTime = new Date(r.startTime);
    return startTime <= new Date() || ['cancelled', 'completed'].includes(r.status);
  });

  const handlePrintTicket = (reservation: any) => {
    setSelectedReservation(reservation);
    setIsTicketOpen(true);
  };

  const handleModifyReservation = (reservationId: string) => {
    navigate(`/reservations/review?reservationId=${reservationId}&edit=true`);
  };

  const handleCheckout = (reservationId: string) => {
    navigate(`/reservations/checkout?reservationId=${reservationId}`);
  };

  const ReservationCard = ({ reservation }: { reservation: any }) => {
    const resource = reservation.resourceId;
    const resourceType = typeof resource === 'object' ? resource?.type : 'room';
    const resourceName = typeof resource === 'object' ? resource?.name : 'Ressource';
    const recommendation = weatherRecommendations[reservation._id || reservation.id];
    
    const isPending = reservation.status === 'pending';
    const isPaid = reservation.status === 'paid';
    const isConfirmed = reservation.status === 'confirmed';
    const isActive = reservation.status === 'active';
    const isPast = new Date(reservation.startTime) <= new Date();
    
    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4" 
            style={{
              borderLeftColor: isPending ? '#f97316' : isPaid ? '#22c55e' : isConfirmed ? '#3b82f6' : '#6b7280'
            }}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-white font-semibold ${
              isPending ? 'bg-orange-500' :
              isPaid ? 'bg-green-500' :
              isConfirmed ? 'bg-blue-500' :
              'bg-gray-500'
            }`}>
              {getResourceIcon(resourceType)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{resourceName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(reservation.startTime), "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span className="font-mono">🕐</span>
                    {format(new Date(reservation.startTime), "HH:mm")} - {format(new Date(reservation.endTime), "HH:mm")}
                  </p>
                  <div className="mt-2">
                    <WeatherRecommendationBadge recommendation={recommendation} />
                  </div>
                </div>
                <Badge variant={isPending ? 'secondary' : isPaid ? 'default' : 'outline'} className="ml-2">
                  {isPending ? '⏳ En attente' :
                   isPaid ? '✓ Payé' :
                   isConfirmed ? '✓ Confirmé' :
                   isActive ? '▶ Actif' :
                   '✓ Terminé'}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                <span className="text-lg font-bold text-primary">{reservation.totalAmount} DH</span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {['confirmed', 'paid', 'active'].includes(reservation.status) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePrintTicket(reservation)}
                      className="hover:bg-blue-50"
                    >
                      <Printer className="h-4 w-4 mr-1" /> Ticket
                    </Button>
                  )}
                  {reservation.status === 'pending' && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleCheckout(reservation._id || reservation.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-1" /> Payer
                    </Button>
                  )}
                  {['confirmed'].includes(reservation.status) && !isPast && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleModifyReservation(reservation._id || reservation.id)}
                      className="hover:bg-amber-50"
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Modifier
                    </Button>
                  )}
                  {['confirmed', 'paid'].includes(reservation.status) && !isPast && (
                    <Button variant="ghost" size="sm" onClick={() => handleCancel(reservation._id || reservation.id)}
                            className="hover:bg-red-50 text-red-600">
                      <X className="h-4 w-4 mr-1" /> Annuler
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Mes réservations</h1>
            <p className="text-muted-foreground mt-1">Gérez vos réservations et effectuez vos paiements</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
            <Link to="/reservations/new">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Nouvelle réservation
            </Link>
          </Button>
        </div>
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming" className="gap-2">
              <span>📅</span> À venir ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <span>📋</span> Historique ({past.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {upcoming.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Aucune réservation à venir</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link to="/reservations/new">Créer une réservation</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcoming.map((r: any) => <ReservationCard key={r._id || r.id} reservation={r} />)
            )}
          </TabsContent>
          <TabsContent value="past" className="space-y-4 mt-6">
            {past.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Aucun historique</p>
                </CardContent>
              </Card>
            ) : (
              past.map((r: any) => <ReservationCard key={r._id || r.id} reservation={r} />)
            )}
          </TabsContent>
        </Tabs>

        {/* Ticket Dialog */}
        {selectedReservation && (
          <ReservationTicket
            reservation={selectedReservation}
            isOpen={isTicketOpen}
            onClose={() => {
              setIsTicketOpen(false);
              setSelectedReservation(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};
