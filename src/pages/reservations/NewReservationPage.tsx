import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { resourcesAPI, bookingsAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDataSync } from '@/contexts/DataSyncContext';
import { WeatherPreviewCard } from '@/components/reservations/WeatherPreviewCard';

export const NewReservationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { triggerRefresh, checkForUpdates } = useDataSync();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [resourceId, setResourceId] = useState(searchParams.get('resource') || '');
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [reservedHours, setReservedHours] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<string | null>(searchParams.get('edit'));
  const [weatherPreview, setWeatherPreview] = useState<any | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const response = await resourcesAPI.getAll({ status: 'active', page: 1, limit: 1000 });
        setResources(response.resources || []);
      } catch (error: any) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les ressources.',
          variant: 'destructive',
        });
      }
    };
    
    const loadEditingReservation = async () => {
      if (!editingId) return;
      try {
        const response = await bookingsAPI.getById(editingId);
        const reservation = response.reservation;
        setResourceId(reservation.resourceId._id || reservation.resourceId.id || '');
        setDate(new Date(reservation.startTime));
        setStartTime(format(new Date(reservation.startTime), 'HH:mm'));
        setEndTime(format(new Date(reservation.endTime), 'HH:mm'));
        setNotes(reservation.description || '');
      } catch (error: any) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la réservation.',
          variant: 'destructive',
        });
      }
    };
    
    loadResources();
    loadEditingReservation();
  }, [toast, editingId]);

  // Initialize with today's weather on first load
  useEffect(() => {
    if (!editingId && !date && resources.length > 0) {
      const today = new Date();
      const nextHour = new Date(today);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const startTimeStr = `${nextHour.getHours().toString().padStart(2, '0')}:00`;
      
      setDate(today);
      setStartTime(startTimeStr);
      setEndTime(startTimeStr);
    }
  }, [resources.length, editingId]);

  // Fetch reserved hours when date changes
  const handleDateSelect = async (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    
    // Set default times: next hour for start, same as start for end
    if (selectedDate) {
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      
      if (isToday) {
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        const startTimeStr = `${nextHour.getHours().toString().padStart(2, '0')}:00`;
        setStartTime(startTimeStr);
        setEndTime(startTimeStr);
      } else {
        // For future dates, default to 08:00 - 08:00
        setStartTime('08:00');
        setEndTime('08:00');
      }
    } else {
      setStartTime('');
      setEndTime('');
    }
    
    setReservedHours([]);

    if (!selectedDate || !resourceId) return;

    try {
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const response = await bookingsAPI.checkAvailability(
        resourceId,
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

      if (response.conflictingReservations && response.conflictingReservations.length > 0) {
        const reserved = response.conflictingReservations.map((reservation: any) => {
          const startHour = new Date(reservation.startTime).getHours();
          return startHour;
        });
        setReservedHours([...new Set(reserved)]);
      }
    } catch (error: any) {
      console.error('Error checking availability:', error);
    }
  };

  const resource = resources.find((r: any) => (r._id || r.id) === resourceId);
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  const isBeyondForecastWindow = Boolean(
    date && date.getTime() > Date.now() + 16 * 24 * 60 * 60 * 1000
  );

  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(async () => {
      if (!resourceId || !date || !startTime || !endTime) {
        if (isActive) {
          setWeatherPreview(null);
          setWeatherError(null);
        }
        return;
      }

      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(sh, sm, 0, 0);
      const endDateTime = new Date(date);
      endDateTime.setHours(eh, em, 0, 0);

      if (endDateTime <= startDateTime) {
        if (isActive) {
          setWeatherPreview(null);
          setWeatherError(null);
        }
        return;
      }

      try {
        setIsWeatherLoading(true);
        setWeatherError(null);
        const response = await bookingsAPI.getRecommendationPreview({
          resourceId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        });
        if (isActive) {
          setWeatherPreview(response.recommendation);
        }
      } catch (error: any) {
        if (isActive) {
          console.error('[Weather Preview] Error:', error);
          const errorMsg = error.message || 'Impossible de recuperer la meteo pour ce creneau.';
          setWeatherError(errorMsg);
          setWeatherPreview(null);
        }
      } finally {
        if (isActive) {
          setIsWeatherLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [resourceId, date, startTime, endTime]);

  const calculatePrice = () => {
    if (!resource || !startTime || !endTime || !date) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(date);
    end.setHours(eh, em, 0, 0);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(duration * (resource.pricePerUnit || 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId || !date || !startTime || !endTime) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      
      // Combine date and time
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(sh, sm, 0, 0);
      const endDateTime = new Date(date);
      endDateTime.setHours(eh, em, 0, 0);

      // Check availability first
      setCheckingAvailability(true);
      const availability = await bookingsAPI.checkAvailability(
        resourceId,
        startDateTime.toISOString(),
        endDateTime.toISOString()
      );

      if (!availability.available && !editingId) {
        toast({
          title: 'Indisponible',
          description: 'Ce créneau n\'est pas disponible.',
          variant: 'destructive',
        });
        setIsLoading(false);
        setCheckingAvailability(false);
        return;
      }

      let response;
      
      if (editingId) {
        // Update existing reservation
        response = await bookingsAPI.update(editingId, {
          resourceId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          description: notes,
        });
        toast({ title: 'Réservation mise à jour', description: 'Vos modifications ont été enregistrées.' });
      } else {
        // Create new reservation
        response = await bookingsAPI.create({
          resourceId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          description: notes,
        });
        toast({ title: 'Réservation créée', description: 'Vérification des détails...' });
      }

      const reservationId = response.reservation._id || response.reservation.id;
      
      // Trigger data sync for all pages
      triggerRefresh('reservations');
      await checkForUpdates();
      
      // Redirect to review page
      setTimeout(() => {
        navigate('/reservations/review?reservationId=' + reservationId);
      }, 500);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la réservation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setCheckingAvailability(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Modifier la réservation' : 'Nouvelle réservation'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Ressource</Label>
                <Select value={resourceId} onValueChange={setResourceId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une ressource" /></SelectTrigger>
                  <SelectContent>
                    {resources.filter((r: any) => r.status === 'active').map((r: any) => (
                      <SelectItem key={r._id || r.id} value={r._id || r.id}>
                        {r.name} - {r.pricePerUnit} DH/{r.pricingModel === 'hourly' ? 'h' : r.pricingModel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={handleDateSelect} 
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Previsions meteo disponibles jusqu'a 16 jours.
                </p>
                {isBeyondForecastWindow && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    La meteo s'affichera a partir de 16 jours avant la date choisie.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Début</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger><Clock className="h-4 w-4 mr-2" /><SelectValue placeholder="Heure" /></SelectTrigger>
                    <SelectContent>
                      {hours.map(h => {
                        const hour = parseInt(h.split(':')[0]);
                        const isReserved = reservedHours.includes(hour);
                        const now = new Date();
                        const isToday = date && date.toDateString() === now.toDateString();
                        const isPastHour = isToday && hour <= now.getHours();
                        const isDisabled = isReserved || isPastHour;
                        
                        return (
                          <SelectItem key={h} value={h} disabled={isDisabled}>
                            {h} {isReserved && '(réservé)'} {isPastHour && !isReserved && '(passé)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger><Clock className="h-4 w-4 mr-2" /><SelectValue placeholder="Heure" /></SelectTrigger>
                    <SelectContent>
                      {hours.filter(h => h > startTime).map(h => {
                        const hour = parseInt(h.split(':')[0]);
                        const isReserved = reservedHours.includes(hour);
                        const now = new Date();
                        const isToday = date && date.toDateString() === now.toDateString();
                        const isPastHour = isToday && hour <= now.getHours();
                        const isDisabled = isReserved || isPastHour;
                        
                        return (
                          <SelectItem key={h} value={h} disabled={isDisabled}>
                            {h} {isReserved && '(réservé)'} {isPastHour && !isReserved && '(passé)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Notes (optionnel)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informations complémentaires..." /></div>
              {resource && startTime && endTime && (
                <div className="p-4 rounded-lg bg-muted text-center"><p className="text-sm text-muted-foreground">Total estimé</p><p className="text-3xl font-bold">{calculatePrice()} DH</p></div>
              )}
              <WeatherPreviewCard
                recommendation={weatherPreview}
                isLoading={isWeatherLoading}
                error={weatherError}
              />
              <Button type="submit" className="w-full" disabled={isLoading || checkingAvailability}>
                {(isLoading || checkingAvailability) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {checkingAvailability ? 'Vérification de la disponibilité...' : 'Confirmer la réservation'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
