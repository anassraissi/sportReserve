/**
 * 🤖 Natural Language Booking Component
 * Permet de réserver en langage naturel: "Je veux terrain foot vendredi soir à Rabat"
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ParsedBooking {
  intent: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  duration?: string;
  budget?: string;
  confidence: 'high' | 'medium' | 'low';
  suggested_resources?: any[];
  needs_clarification?: string;
}

export const NaturalLanguageBooking: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedBooking | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleParse = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message requis',
        description: 'Veuillez entrer votre demande de réservation',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setParsed(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai/booking/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du parsing');
      }

      const data = await response.json();
      
      if (data.success && data.parsed) {
        setParsed(data.parsed);
        
        if (data.parsed.confidence === 'high' && data.parsed.suggested_resources?.length > 0) {
          toast({
            title: '✅ Réservation trouvée !',
            description: data.message || 'Terrains disponibles trouvés',
          });
        } else if (data.parsed.needs_clarification) {
          toast({
            title: '❓ Clarification nécessaire',
            description: data.parsed.needs_clarification,
          });
        }
      } else {
        throw new Error(data.message || 'Erreur lors du parsing');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de traiter votre demande',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookResource = (resourceId: string) => {
    navigate(`/resources/terrains/${resourceId}`);
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-2">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Réservation Intelligente</CardTitle>
            <CardDescription>
              Dites simplement ce que vous voulez, l&apos;IA comprend tout
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder='Ex: "Je veux terrain foot vendredi soir à Rabat"'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleParse()}
            className="flex-1"
          />
          <Button
            onClick={handleParse}
            disabled={isLoading || !message.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {parsed && (
          <div className="mt-4 space-y-4 rounded-lg border border-purple-200 bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <Badge
                variant={
                  parsed.confidence === 'high'
                    ? 'default'
                    : parsed.confidence === 'medium'
                    ? 'secondary'
                    : 'outline'
                }
                className={
                  parsed.confidence === 'high'
                    ? 'bg-green-100 text-green-700'
                    : parsed.confidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }
              >
                Confiance: {parsed.confidence}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {parsed.sport && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-600">Sport:</span>
                  <Badge variant="outline">{parsed.sport}</Badge>
                </div>
              )}
              {parsed.date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-slate-600">Date:</span>
                  <span>{parsed.date}</span>
                </div>
              )}
              {parsed.time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-slate-600">Heure:</span>
                  <span>{parsed.time}</span>
                </div>
              )}
              {parsed.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-slate-600">Ville:</span>
                  <span>{parsed.location}</span>
                </div>
              )}
            </div>

            {parsed.needs_clarification && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-sm text-yellow-800">
                  <strong>❓</strong> {parsed.needs_clarification}
                </p>
              </div>
            )}

            {parsed.suggested_resources && parsed.suggested_resources.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  Terrains disponibles ({parsed.suggested_resources.length}):
                </p>
                <div className="space-y-2">
                  {parsed.suggested_resources.slice(0, 3).map((resource: any) => (
                    <div
                      key={resource._id || resource.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{resource.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-600">
                          {resource.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {resource.city}
                            </span>
                          )}
                          {resource.suggestedPrice && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {resource.suggestedPrice.finalPrice} DH
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleBookResource(resource._id || resource.id)}
                        className="ml-2"
                      >
                        Réserver
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-slate-500 space-y-1">
          <p className="font-semibold">💡 Exemples:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>&quot;Je veux terrain foot vendredi soir à Rabat&quot;</li>
            <li>&quot;Réserve-moi un terrain de tennis demain après-midi&quot;</li>
            <li>&quot;Terrain padel samedi matin Casablanca&quot;</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
