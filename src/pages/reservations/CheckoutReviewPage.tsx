import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit2, Loader2, AlertCircle, X } from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useDataSync } from '@/contexts/DataSyncContext';

interface CheckoutReviewPageProps {}

export const CheckoutReviewPage: React.FC<CheckoutReviewPageProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { triggerRefresh, checkForUpdates } = useDataSync();

  const [reservation, setReservation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reservationId = searchParams.get('reservationId');

  // Load reservation data
  useEffect(() => {
    const loadReservation = async () => {
      if (!reservationId) {
        setError('Réservation non trouvée');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await bookingsAPI.getById(reservationId);
        setReservation(response.reservation);
        setError(null);
      } catch (error: any) {
        console.error('Error loading reservation:', error);
        setError('Impossible de charger la réservation');
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la réservation.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [reservationId, toast]);

  const handleEditReservation = () => {
    // Navigate back to new reservation with pre-filled data
    navigate(`/reservations/new?edit=${reservationId}`);
  };

  const handleGoToPayment = () => {
    // Redirect to payment page with card form
    navigate(`/reservations/checkout?reservationId=${reservationId}`);
  };

  const handleConfirmPayment = async () => {
    // STRIPE PAYMENT COMMENTED OUT - Using direct confirmation with 'not paid' status
    try {
      setIsConfirming(true);
      // Update reservation status to 'confirmed' and set confirmation time
      await bookingsAPI.update(reservationId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
      });
      
      // Trigger data sync for all pages
      triggerRefresh('reservations');      await checkForUpdates();      
      toast({
        title: 'Réservation confirmée!',
        description: 'Veuillez passer à l\'étape de paiement.',
      });
      // Redirect to payment page
      setTimeout(() => {
        navigate(`/reservations/checkout?reservationId=${reservationId}`);
      }, 500);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de confirmer la réservation.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsConfirming(true);
      await bookingsAPI.cancel(reservationId);
      
      // Trigger immediate data sync
      triggerRefresh('reservations');
      await checkForUpdates();
      
      toast({
        title: 'Réservation annulée',
        description: 'Votre réservation a été annulée.',
      });
      setTimeout(() => {
        navigate('/reservations');
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler la réservation.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
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

  if (!reservation || error) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">{error || 'Réservation non trouvée'}</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const resource = reservation.resourceId;
  const resourceName = typeof resource === 'object' ? resource?.name : 'Ressource';
  const resourceType = typeof resource === 'object' ? resource?.type : 'room';
  const user = reservation.userId;
  const userName = typeof user === 'object' 
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    : 'Utilisateur';

  const startTime = new Date(reservation.startTime);
  const endTime = new Date(reservation.endTime);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Vérification de votre réservation
            </h1>
            <p className="text-muted-foreground mt-2">Vérifiez les détails avant de procéder au paiement</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Reservation Details */}
            <div className="md:col-span-2 space-y-4">
              {/* Resource Card */}
              <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                <CardHeader className="bg-blue-50">
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🏢</span> Ressource
                    </CardTitle>
                    <Badge variant="outline" className="capitalize">{resourceType}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-6">
                  <p className="text-2xl font-bold">{resourceName}</p>
                  {reservation.description && (
                    <p className="text-sm text-muted-foreground">
                      <strong>📝 Notes:</strong> {reservation.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Date & Time Card */}
              <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📅</span> Date et horaire
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">📆 Date</p>
                      <p className="text-lg font-semibold">
                        {format(startTime, 'EEEE d MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">⏱️ Durée</p>
                      <p className="text-lg font-semibold">
                        {duration.toFixed(1)} heures
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                    <p className="text-sm font-medium text-green-900">
                      🕐 {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* User Info Card */}
              <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👤</span> Informations client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-semibold text-lg">{userName}</p>
                  </div>
                  {user && typeof user === 'object' && user.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{user.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleEditReservation}
                  className="flex-1 hover:bg-amber-50"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isConfirming}
                  className="flex-1 hover:bg-red-50 text-red-600"
                >
                  {isConfirming ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Annuler
                </Button>
              </div>
            </div>

            <div>
              <Card className="sticky top-6 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">💳</span> Récapitulatif du prix
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tarif par heure</span>
                      <span className="font-medium">
                        {typeof resource === 'object' ? `${resource?.pricePerUnit || 0} DH` : '0 DH'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Durée</span>
                      <span className="font-medium">{duration.toFixed(1)}h</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{reservation.totalAmount} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes</span>
                      <span>0 DH</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-3xl font-bold text-primary">
                      {reservation.totalAmount} DH
                    </span>
                  </div>

                  <Button
                    onClick={handleConfirmPayment}
                    disabled={isConfirming}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    size="lg"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Confirmation en cours...
                      </>
                    ) : (
                      <>💳 Continuer vers le paiement</>
                    )}
                  </Button>

                  <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span>✓</span> Paiement 100% sécurisé
                    </p>
                    <p className="flex items-center gap-2">
                      <span>✓</span> Confirmation instantanée
                    </p>
                    <p className="flex items-center gap-2">
                      <span>✓</span> Pas de frais cachés
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
