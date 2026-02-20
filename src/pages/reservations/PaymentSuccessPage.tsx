import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Printer, Home } from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reservationId = searchParams.get('reservationId');

  useEffect(() => {
    const loadReservation = async () => {
      if (!reservationId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await bookingsAPI.getById(reservationId);
        setReservation(response.reservation);
      } catch (error: any) {
        console.error('Error loading reservation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [reservationId]);

  const handlePrint = () => {
    window.print();
  };

  const generateQRCode = (text: string) => {
    // Simple QR code generator URL (larger size for readability)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
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

  if (!reservation) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Réservation non trouvée</p>
              <Button className="mt-4" onClick={() => navigate('/reservations')}>
                Retour aux réservations
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }


  const duration = reservation.durationHours || 1;
  const userName = reservation.userId?.firstName && reservation.userId?.lastName 
    ? `${reservation.userId.firstName} ${reservation.userId.lastName}`
    : (reservation.userId?.email || 'N/A');
  const startTime = format(new Date(reservation.startTime), 'HH:mm', { locale: fr });
  const endTime = format(new Date(reservation.endTime), 'HH:mm', { locale: fr });
  const resNumber = reservation.number || reservationId || 'N/A';

  // Professional, timezone-free QR payload (one value per line)
  const qrData = [
    'RESERVATION CONFIRMATION',
    `Reservation ID: ${resNumber}`,
    `Reserved by: ${userName}`,
    `Resource: ${reservation.resourceId?.name || 'N/A'}`,
    `Date: ${format(new Date(reservation.startTime), 'dd MMM yyyy', { locale: fr })}`,
    `Time: ${startTime} - ${endTime}`,
    `Duration: ${duration.toFixed(1)} h`,
    `Amount: ${reservation.totalAmount} DH`,
    'Please present this QR code at entry.'
  ].join('\n');
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h1 className="text-3xl font-bold text-green-600">Paiement réussi!</h1>
          <p className="text-xl text-slate-600">Votre réservation a été confirmée</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Reservation Details */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-green-50 border-b border-green-200">
                <CardTitle className="text-green-700">📋 Détails de la réservation</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Numéro de réservation</p>
                    <p className="text-lg font-mono font-semibold text-slate-900 break-all">{reservationId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Statut</p>
                    <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">✅ Confirmée</Badge>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Ressource</p>
                    <p className="text-lg font-semibold text-slate-900">{reservation.resourceId?.name || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Date de début</p>
                      <p className="font-semibold text-slate-900">
                        {format(new Date(reservation.startTime), 'PPP', { locale: fr })}
                      </p>
                      <p className="text-sm text-slate-600">
                        {format(new Date(reservation.startTime), 'HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Date de fin</p>
                      <p className="font-semibold text-slate-900">
                        {format(new Date(reservation.endTime), 'PPP', { locale: fr })}
                      </p>
                      <p className="text-sm text-slate-600">
                        {format(new Date(reservation.endTime), 'HH:mm')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Durée</p>
                    <p className="font-semibold text-slate-900">{duration.toFixed(1)} heures</p>
                  </div>
                </div>

                {reservation.description && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-500">Notes</p>
                    <p className="text-slate-700">{reservation.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Breakdown */}
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-base">💳 Récapitulatif du paiement</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Prix unitaire</span>
                  <span className="font-semibold">
                    {reservation.resourceId?.pricePerUnit || Math.round((reservation.totalAmount || 0) / (reservation.durationHours || 1))} DH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Durée</span>
                  <span className="font-semibold">{duration.toFixed(1)} heures</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Frais de service</span>
                  <span className="font-semibold">0 DH</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-bold text-lg">Montant total</span>
                  <span className="text-2xl font-bold text-green-600">{reservation.totalAmount} DH</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: QR Code */}
          <div className="md:col-span-1">
            <Card className="text-center border-2 border-blue-200 sticky top-6">
              <CardHeader className="bg-blue-50 border-b border-blue-200">
                <CardTitle className="text-blue-700 text-base">🔖 Code QR</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <img
                  src={generateQRCode(qrData)}
                  alt="QR Code de réservation"
                  className="w-full border-2 border-slate-200 rounded"
                />
                <p className="text-xs text-slate-500">Présentez ce code QR à l'entrée</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center print:hidden">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button
            size="lg"
            onClick={() => navigate('/reservations')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Retour aux réservations
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};
