import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, X, User, CreditCard, CheckCircle, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfDay, addMonths, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mediaAPI } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

interface ReservationCalendarProps {
  reservations: any[];
  onDateClick?: (date: Date) => void;
  isAdminView?: boolean;
}

interface DayReservations {
  reservations: any[];
  count: number;
  types: string[];
  colors: string[];
}

export const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  reservations,
  onDateClick,
  isAdminView = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayReservations, setSelectedDayReservations] = useState<any[]>([]);
  const [resourceMedia, setResourceMedia] = useState<{ [key: string]: any }>({});

  // Get all days in current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();

  // Create array with empty slots before first day
  const calendarDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth
  ];

  // Group reservations by date
  const reservationsByDate = useMemo(() => {
    const grouped: { [key: string]: DayReservations } = {};

    reservations.forEach(reservation => {
      const reservationDate = new Date(reservation.startTime);
      const dateKey = format(startOfDay(reservationDate), 'yyyy-MM-dd');

      if (!grouped[dateKey]) {
        grouped[dateKey] = { reservations: [], count: 0, types: [], colors: [] };
      }

      grouped[dateKey].reservations.push(reservation);
      grouped[dateKey].count += 1;

      // Get resource type and assign color
      const resourceType = reservation.resourceId?.type || 'general';
      const typeName = reservation.resourceId?.name || 'Réservation';

      if (!grouped[dateKey].types.includes(typeName)) {
        grouped[dateKey].types.push(typeName);
      }

      // Assign color based on type
      let color = '#3b82f6'; // Default blue
      if (resourceType === 'terrain') {
        color = '#10b981'; // Green for terrains
      } else if (resourceType === 'salle') {
        color = '#f59e0b'; // Amber for salles
      } else if (resourceType === 'equipment') {
        color = '#8b5cf6'; // Purple for equipment
      }

      if (!grouped[dateKey].colors.includes(color)) {
        grouped[dateKey].colors.push(color);
      }
    });

    return grouped;
  }, [reservations]);

  const getResourceTypeLabel = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      terrain: '🏟️ Terrain',
      salle: '🏛️ Salle',
      equipment: '💪 Équipement'
    };
    return typeMap[type] || '📍 Ressource';
  };

  const getResourceTypeColor = (type: string): string => {
    const colorMap: { [key: string]: string } = {
      terrain: 'bg-green-100 text-green-700 border-green-300',
      salle: 'bg-amber-100 text-amber-700 border-amber-300',
      equipment: 'bg-purple-100 text-purple-700 border-purple-300'
    };
    return colorMap[type] || 'bg-blue-100 text-blue-700 border-blue-300';
  };

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const handlePreviousMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = async (date: Date, dayReservations: any[]) => {
    setSelectedDate(date);
    setSelectedDayReservations(dayReservations);
    setIsModalOpen(true);
    onDateClick?.(date);

    // Fetch media for all resources in this day's reservations
    const resourceIds = dayReservations
      .map(r => r.resourceId?._id || r.resourceId?.id)
      .filter(Boolean);

    const uniqueResourceIds = [...new Set(resourceIds)];
    const mediaPromises = uniqueResourceIds.map(async (resourceId) => {
      if (!resourceMedia[resourceId]) {
        try {
          const response = await mediaAPI.getByResource(resourceId, { mediaType: 'image' });
          return { resourceId, media: response.mediaAssets };
        } catch (error) {
          return { resourceId, media: [] };
        }
      }
      return null;
    });

    const results = await Promise.all(mediaPromises);
    const newMedia: { [key: string]: any } = { ...resourceMedia };
    results.forEach(result => {
      if (result) {
        newMedia[result.resourceId] = result.media;
      }
    });
    setResourceMedia(newMedia);
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
      paid: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
      completed: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: { [key: string]: string } = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      paid: 'Payée',
      cancelled: 'Annulée',
      completed: 'Terminée'
    };
    return labelMap[status] || status;
  };

  return (
    <Card className="w-full bg-white/95 backdrop-blur border-purple-200/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75" />
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">Calendrier des réservations</CardTitle>
              <CardDescription className="text-xs">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-9 w-9 hover:bg-purple-50 hover:text-purple-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(new Date())}
              className="h-9 w-9 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600"
            >
              {format(new Date(), 'd')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-9 w-9 hover:bg-purple-50 hover:text-purple-600"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs pt-3 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Terrain</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-gray-600">Salle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-600">Équipement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Autre</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="h-10 flex items-center justify-center font-bold text-sm text-gray-600 bg-gray-50/50 rounded"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const dateKey = day ? format(startOfDay(day), 'yyyy-MM-dd') : null;
            const dayReservations = dateKey ? reservationsByDate[dateKey] : null;
            const isCurrentMonth = day && isSameMonth(day, currentDate);
            const isToday = day && isSameDay(day, new Date());
            const isPastDay = day && isPast(day) && !isToday;

            return (
              <div
                key={idx}
                onClick={() => day && dayReservations && handleDateClick(day, dayReservations.reservations)}
                className={`
                  min-h-20 p-1.5 rounded-lg border transition-all
                  ${!day ? 'bg-gray-50/30 border-transparent' : ''}
                  ${!isCurrentMonth ? 'bg-gray-50/50 border-gray-200' : 'bg-white border-gray-200 hover:border-purple-300'}
                  ${isToday ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-400' : ''}
                  ${isPastDay && dayReservations ? 'opacity-60' : ''}
                  ${dayReservations && dayReservations.count > 0 ? 'cursor-pointer hover:shadow-md hover:scale-105 transform' : ''}
                `}
              >
                {day && (
                  <div className="flex flex-col gap-1 h-full">
                    {/* Day number */}
                    <div className={`
                      text-right font-bold text-sm
                      ${!isCurrentMonth ? 'text-gray-400' : ''}
                      ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center ml-auto' : 'text-gray-700'}
                    `}>
                      {format(day, 'd')}
                    </div>

                    {/* Reservation indicators */}
                    <div className="flex-1 flex flex-col gap-0.5 justify-start">
                      {dayReservations && dayReservations.count > 0 ? (
                        <>
                          {/* Show up to 2 reservation indicators */}
                          {dayReservations.colors.slice(0, 2).map((color, idx) => (
                            <div
                              key={idx}
                              className="h-1.5 rounded-full w-full"
                              style={{ backgroundColor: color }}
                              title={dayReservations.types[idx]}
                            />
                          ))}
                          {/* Count badge if more than 2 */}
                          {dayReservations.count > 2 && (
                            <div className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-center">
                              +{dayReservations.count - 1}
                            </div>
                          )}
                          {/* Show first reservation time */}
                          {dayReservations.reservations[0] && (
                            <div className="text-xs text-gray-600 font-semibold truncate">
                              {format(new Date(dayReservations.reservations[0].startTime), 'HH:mm')}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-300">-</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
              <div className="text-2xl font-bold text-blue-600">
                {reservations.length}
              </div>
              <div className="text-xs text-blue-600/70">Réservations totales</div>
            </div>
            
            <div className="text-center p-3 bg-green-50/50 rounded-lg border border-green-200/50">
              <div className="text-2xl font-bold text-green-600">
                {reservations.filter(r => r.resourceId?.type === 'terrain').length}
              </div>
              <div className="text-xs text-green-600/70">Terrains</div>
            </div>

            <div className="text-center p-3 bg-amber-50/50 rounded-lg border border-amber-200/50">
              <div className="text-2xl font-bold text-amber-600">
                {reservations.filter(r => r.resourceId?.type === 'salle').length}
              </div>
              <div className="text-xs text-amber-600/70">Salles</div>
            </div>

            <div className="text-center p-3 bg-purple-50/50 rounded-lg border border-purple-200/50">
              <div className="text-2xl font-bold text-purple-600">
                {reservations.filter(r => r.resourceId?.type === 'equipment').length}
              </div>
              <div className="text-xs text-purple-600/70">Équipements</div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Reservation Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              Réservations du {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedDayReservations.length} réservation{selectedDayReservations.length > 1 ? 's' : ''} pour cette journée
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            {selectedDayReservations.map((reservation, idx) => {
              const isPastReservation = isPast(new Date(reservation.endTime));
              const isFutureReservation = isFuture(new Date(reservation.startTime));
              const resourceType = reservation.resourceId?.type || 'general';
              const resourceName = reservation.resourceId?.name || 'Ressource';

              return (
                <div
                  key={reservation._id || idx}
                  className={`
                    relative overflow-hidden rounded-lg border p-3 transition-all
                    ${isPastReservation 
                      ? 'bg-gray-50 border-gray-300 opacity-75' 
                      : isFutureReservation
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-purple-300 shadow-sm'
                      : 'bg-white border-blue-300'
                    }
                  `}
                >
                  {/* Past/Future Badge */}
                  {isPastReservation && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gray-500 text-white text-xs">
                        Passée
                      </Badge>
                    </div>
                  )}
                  {isFutureReservation && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                        À venir
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-2">
                    {/* Client Info - Admin Only */}
                    {isAdminView && reservation.userId && (
                      <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-300">
                        <div className="p-1.5 rounded-full bg-blue-100">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 font-medium">
                            {typeof reservation.userId === 'object' 
                              ? `${reservation.userId.firstName} ${reservation.userId.lastName}`
                              : 'Client'}
                          </p>
                          {typeof reservation.userId === 'object' && reservation.userId.email && (
                            <p className="text-xs text-gray-600">
                              📧 {reservation.userId.email}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resource Info with Image */}
                    <div className="flex items-start gap-3">
                      {(() => {
                        const resourceId = reservation.resourceId?._id || reservation.resourceId?.id;
                        const mediaAssets = resourceId ? resourceMedia[resourceId] : null;
                        const firstImage = mediaAssets && mediaAssets.length > 0 ? mediaAssets[0] : null;
                        
                        return firstImage ? (
                          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={getImageUrl(firstImage.originalUrl)}
                              alt={resourceName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to icon if image fails
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center ${
                                    resourceType === 'terrain' ? 'bg-green-100' :
                                    resourceType === 'salle' ? 'bg-amber-100' :
                                    resourceType === 'equipment' ? 'bg-purple-100' : 'bg-blue-100'
                                  }"><svg class="w-8 h-8 ${
                                    resourceType === 'terrain' ? 'text-green-600' :
                                    resourceType === 'salle' ? 'text-amber-600' :
                                    resourceType === 'equipment' ? 'text-purple-600' : 'text-blue-600'
                                  }" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`
                            flex-shrink-0 p-2 rounded-lg w-14 h-14 flex items-center justify-center
                            ${resourceType === 'terrain' ? 'bg-green-100' : ''}
                            ${resourceType === 'salle' ? 'bg-amber-100' : ''}
                            ${resourceType === 'equipment' ? 'bg-purple-100' : ''}
                            ${resourceType === 'general' ? 'bg-blue-100' : ''}
                          `}>
                            <MapPin className={`
                              h-6 w-6
                              ${resourceType === 'terrain' ? 'text-green-600' : ''}
                              ${resourceType === 'salle' ? 'text-amber-600' : ''}
                              ${resourceType === 'equipment' ? 'text-purple-600' : ''}
                              ${resourceType === 'general' ? 'text-blue-600' : ''}
                            `} />
                          </div>
                        );
                      })()}
                      <div className="flex-1">
                        <h3 className="font-semibold text-base text-gray-900">{resourceName}</h3>
                        <p className="text-xs text-gray-600">{getResourceTypeLabel(resourceType)}</p>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 p-2 bg-white/80 rounded border border-gray-200">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Début</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {format(new Date(reservation.startTime), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-white/80 rounded border border-gray-200">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">Fin</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {format(new Date(reservation.endTime), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Price */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center justify-between p-2 bg-white/80 rounded border border-gray-200">
                        <span className="text-xs text-gray-600">Statut</span>
                        <Badge className={`${getStatusColor(reservation.status)} text-xs`}>
                          {getStatusLabel(reservation.status)}
                        </Badge>
                      </div>
                      {reservation.totalAmount && (
                        <div className="flex items-center gap-1.5 p-2 bg-green-50 rounded border border-green-200">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-bold text-green-700">
                            {reservation.totalAmount} DH
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Location & Capacity */}
                    {(reservation.resourceId?.location || reservation.resourceId?.capacity) && (
                      <div className="flex gap-2 text-xs">
                        {reservation.resourceId?.location && (
                          <div className="flex items-center gap-1 flex-1 p-2 bg-white/80 rounded border border-gray-200">
                            <MapPin className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-gray-700 truncate">{reservation.resourceId.location}</span>
                          </div>
                        )}
                        {reservation.resourceId?.capacity && (
                          <div className="flex items-center gap-1 p-2 bg-white/80 rounded border border-gray-200">
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-gray-900 font-medium">{reservation.resourceId.capacity}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="gap-2"
            >
              <X className="h-3.5 w-3.5" />
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
