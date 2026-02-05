import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Lock, Loader2, AlertCircle } from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CheckoutPageProps {}

export const CheckoutPage: React.FC<CheckoutPageProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [reservation, setReservation] = useState<any>(null);
  const [isLoadingReservation, setIsLoadingReservation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
  });

  const reservationId = searchParams.get('reservationId');

  // Load reservation data
  useEffect(() => {
    const loadReservation = async () => {
      if (!reservationId) {
        setError('No reservation found');
        setIsLoadingReservation(false);
        return;
      }

      try {
        setIsLoadingReservation(true);
        const response = await bookingsAPI.getById(reservationId);
        setReservation(response.reservation);
        setError(null);
      } catch (error: any) {
        console.error('Error loading reservation:', error);
        setError('Unable to load reservation');
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la réservation.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingReservation(false);
      }
    };

    loadReservation();
  }, [reservationId, toast]);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s+/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .slice(0, 5);
  };

  // Format CVC (3-4 digits)
  const formatCVC = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 4);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setCardDetails(prev => ({ ...prev, expiryDate: formatted }));
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCVC(e.target.value);
    setCardDetails(prev => ({ ...prev, cvc: formatted }));
  };

  const validateCardDetails = () => {
    if (!cardDetails.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      setError('Numéro de carte invalide (16 chiffres requis)');
      return false;
    }
    if (!cardDetails.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError('Date d\'expiration invalide (MM/YY)');
      return false;
    }
    if (!cardDetails.cvc.match(/^\d{3,4}$/)) {
      setError('CVC invalide (3-4 chiffres)');
      return false;
    }
    if (!cardDetails.cardholderName.trim()) {
      setError('Nom du titulaire requis');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCardDetails()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Process payment
      const paymentResponse = await bookingsAPI.processPayment(reservationId, {
        amount: Math.round(reservation.totalAmount * 100), // Convert to cents
        currency: 'dh',
        cardDetails: {
          number: cardDetails.cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(cardDetails.expiryDate.split('/')[0]),
          exp_year: parseInt('20' + cardDetails.expiryDate.split('/')[1]),
          cvc: cardDetails.cvc,
          name: cardDetails.cardholderName,
        },
        reservationId: reservationId,
      });

      if (paymentResponse.success) {
        toast({
          title: 'Paiement réussi',
          description: 'Votre réservation a été confirmée.',
        });
        // Redirect to success page after 1 second
        setTimeout(() => {
          navigate(`/reservations/success?reservationId=${reservationId}`);
        }, 1000);
      } else {
        setError(paymentResponse.message || 'Paiement échoué');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Erreur lors du paiement');
      toast({
        title: 'Erreur de paiement',
        description: error.message || 'Une erreur est survenue lors du paiement.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingReservation) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!reservation) {
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
              <p className="text-muted-foreground">Réservation non trouvée</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const resource = reservation.resourceId;
  const resourceName = typeof resource === 'object' ? resource?.name : 'Ressource';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="space-y-4 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Paiement sécurisé
          </h1>
          <p className="text-muted-foreground">Complétez votre paiement pour confirmer votre réservation</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="md:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-600" />
                  Détails de paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Card Number */}
                  <div className="space-y-2">
                    <Label>Numéro de carte</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      disabled={isLoading}
                      className="font-mono text-lg tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">16 chiffres</p>
                  </div>

                  {/* Cardholder Name */}
                  <div className="space-y-2">
                    <Label>Nom du titulaire</Label>
                    <Input
                      placeholder="JEAN DUPONT"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value.toUpperCase() }))}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Expiry and CVC */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date d'expiration</Label>
                      <Input
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        disabled={isLoading}
                        className="font-mono text-lg tracking-widest"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVC</Label>
                      <Input
                        placeholder="123"
                        value={cardDetails.cvc}
                        onChange={handleCVCChange}
                        maxLength={4}
                        disabled={isLoading}
                        className="font-mono text-lg tracking-widest"
                        type="password"
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-3 rounded-lg bg-muted flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    Votre paiement est sécurisé et chiffré (256-bit SSL)
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Traitement en cours...' : `Payer ${reservation.totalAmount} DH`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="shadow-lg border-0 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-base">📋 Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3 pb-4 border-b">
                  <div>
                    <p className="text-sm text-muted-foreground">Ressource</p>
                    <p className="font-medium">{resourceName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(new Date(reservation.startTime), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horaire</p>
                    <p className="font-medium">
                      {format(new Date(reservation.startTime), "HH:mm")} -{' '}
                      {format(new Date(reservation.endTime), "HH:mm")}
                    </p>
                  </div>
                  {reservation.durationHours && (
                    <div>
                      <p className="text-sm text-muted-foreground">Durée</p>
                      <p className="font-medium">
                        {reservation.durationHours.toFixed(1)} heures
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{reservation.totalAmount} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxes</span>
                    <span>0 DH</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{reservation.totalAmount} DH</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                  <p>✓ Paiement 100% sécurisé</p>
                  <p>✓ Confirmation instantanée</p>
                  <p>✓ Pas de frais cachés</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
