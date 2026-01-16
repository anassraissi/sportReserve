import React, { useState } from 'react';
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
import { mockResources } from '@/data/mockData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const NewReservationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resourceId, setResourceId] = useState(searchParams.get('resource') || '');
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  const resource = mockResources.find(r => r.id === resourceId);
  const hours = Array.from({ length: 13 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);

  const calculatePrice = () => {
    if (!resource || !startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    return Math.round((duration / 60) * resource.pricePerHour);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId || !date || !startTime || !endTime) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast({ title: 'Réservation créée', description: 'Votre réservation a été enregistrée.' });
    navigate('/reservations');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
        <Card>
          <CardHeader><CardTitle>Nouvelle réservation</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Ressource</Label>
                <Select value={resourceId} onValueChange={setResourceId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une ressource" /></SelectTrigger>
                  <SelectContent>
                    {mockResources.filter(r => r.isActive).map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name} - {r.pricePerHour}€/h</SelectItem>
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
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} /></PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Début</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger><Clock className="h-4 w-4 mr-2" /><SelectValue placeholder="Heure" /></SelectTrigger>
                    <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger><Clock className="h-4 w-4 mr-2" /><SelectValue placeholder="Heure" /></SelectTrigger>
                    <SelectContent>{hours.filter(h => h > startTime).map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Notes (optionnel)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informations complémentaires..." /></div>
              {resource && startTime && endTime && (
                <div className="p-4 rounded-lg bg-muted text-center"><p className="text-sm text-muted-foreground">Total estimé</p><p className="text-3xl font-bold">{calculatePrice()}€</p></div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmer la réservation</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
