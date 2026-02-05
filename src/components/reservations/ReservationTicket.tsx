import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReservationTicketProps {
  reservation: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationTicket: React.FC<ReservationTicketProps> = ({
  reservation,
  isOpen,
  onClose,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!ticketRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = ticketRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de réservation</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            .ticket {
              max-width: 400px;
              margin: 0 auto;
              border: 2px solid #000;
              border-radius: 8px;
              padding: 20px;
              background: white;
            }
            .ticket-header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .ticket-header h1 {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .ticket-header p {
              font-size: 14px;
              color: #666;
            }
            .ticket-body {
              margin-bottom: 15px;
            }
            .ticket-section {
              margin-bottom: 15px;
            }
            .ticket-section h3 {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .ticket-section p {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 3px;
            }
            .ticket-qr {
              text-align: center;
              padding: 15px;
              border-top: 2px dashed #000;
              border-bottom: 2px dashed #000;
              margin: 15px 0;
            }
            .ticket-footer {
              text-align: center;
              font-size: 11px;
              color: #666;
              margin-top: 15px;
            }
            .reservation-number {
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 10px 0;
            }
            @media print {
              body {
                padding: 0;
              }
              .ticket {
                border: 2px solid #000;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!reservation) return null;

  const resource = reservation.resourceId;
  const resourceName = typeof resource === 'object' ? resource?.name : 'Ressource';
  const resourceType = typeof resource === 'object' ? resource?.type : 'room';
  const user = reservation.userId;
  const userName = typeof user === 'object' 
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    : 'Utilisateur';

  // Generate QR code data (reservation ID and number)
  const qrData = JSON.stringify({
    id: reservation._id || reservation.id,
    number: reservation.reservationNumber || reservation._id || reservation.id,
    resource: resourceName,
    date: reservation.startTime,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket de réservation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Ticket Preview */}
          <div ref={ticketRef} className="ticket bg-white border-2 border-gray-900 rounded-lg p-6 max-w-md mx-auto">
            {/* Header */}
            <div className="ticket-header text-center border-b-2 border-dashed border-gray-900 pb-4 mb-4">
              <h1 className="text-2xl font-bold mb-2">TICKET DE RÉSERVATION</h1>
              <p className="text-sm text-gray-600">sportResrve</p>
            </div>

            {/* Reservation Number */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-600 uppercase mb-1">Numéro de réservation</p>
              <p className="text-lg font-bold tracking-wider">
                {reservation.reservationNumber || reservation._id || reservation.id}
              </p>
            </div>

            {/* Resource Info */}
            <div className="ticket-section mb-4">
              <h3 className="text-xs text-gray-600 uppercase mb-1">Ressource</h3>
              <p className="text-base font-semibold">{resourceName}</p>
              <p className="text-sm text-gray-600 capitalize">{resourceType}</p>
            </div>

            {/* Date & Time */}
            <div className="ticket-section mb-4">
              <h3 className="text-xs text-gray-600 uppercase mb-1">Date et heure</h3>
              <p className="text-base font-semibold">
                {format(new Date(reservation.startTime), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
              <p className="text-base font-semibold">
                {format(new Date(reservation.startTime), "HH:mm")} - {format(new Date(reservation.endTime), "HH:mm")}
              </p>
              <p className="text-sm text-gray-600">
                Durée: {reservation.durationHours?.toFixed(1) || 'N/A'} heures
              </p>
            </div>

            {/* User Info */}
            <div className="ticket-section mb-4">
              <h3 className="text-xs text-gray-600 uppercase mb-1">Client</h3>
              <p className="text-base font-semibold">{userName}</p>
            </div>

            {/* Price */}
            <div className="ticket-section mb-4">
              <h3 className="text-xs text-gray-600 uppercase mb-1">Montant</h3>
              <p className="text-xl font-bold">{reservation.totalAmount?.toFixed(2) || '0.00'}€</p>
              {reservation.currency && reservation.currency !== 'EUR' && (
                <p className="text-xs text-gray-600">Devise: {reservation.currency}</p>
              )}
            </div>

            {/* Status */}
            <div className="ticket-section mb-4">
              <h3 className="text-xs text-gray-600 uppercase mb-1">Statut</h3>
              <p className="text-base font-semibold capitalize">
                {reservation.status === 'confirmed' ? 'Confirmé' :
                 reservation.status === 'paid' ? 'Payé' :
                 reservation.status === 'pending' ? 'En attente' :
                 reservation.status === 'active' ? 'Actif' :
                 reservation.status === 'completed' ? 'Terminé' :
                 reservation.status === 'cancelled' ? 'Annulé' :
                 reservation.status}
              </p>
            </div>

            {/* QR Code */}
            <div className="ticket-qr border-t-2 border-b-2 border-dashed border-gray-900 py-4 my-4">
              <QRCodeSVG
                value={qrData}
                size={150}
                level="H"
                includeMargin={true}
                className="mx-auto"
              />
              <p className="text-xs text-gray-600 mt-2">
                Présentez ce code QR à l'arrivée
              </p>
            </div>

            {/* Footer */}
            <div className="ticket-footer text-center text-xs text-gray-600 mt-4">
              <p>Merci pour votre réservation!</p>
              <p className="mt-1">
                Imprimé le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


