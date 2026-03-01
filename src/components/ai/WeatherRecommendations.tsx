/**
 * 🌤️ Recommandations Météo IA pour Clients
 * Affiche des recommandations intelligentes basées sur la météo
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  Wind,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface WeatherRecommendation {
  reservationId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  location?: string;
  recommendation: {
    status: 'good' | 'caution' | 'avoid' | 'unknown';
    score: number;
    summary: string;
    reasons: string[];
    metrics?: {
      tempMin?: number;
      tempMax?: number;
      precipitationMax?: number;
      windMax?: number;
    };
  };
  suggestedAlternative?: {
    resourceId: string;
    resourceName: string;
    reason: string;
  };
}

export const WeatherRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<WeatherRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWeatherRecommendations();
  }, []);

  const loadWeatherRecommendations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Récupérer les réservations à venir
      const reservationsRes = await fetch(`${API_BASE_URL}/bookings?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!reservationsRes.ok) {
        throw new Error('Erreur lors du chargement des réservations');
      }

      const reservationsData = await reservationsRes.json();
      const upcomingReservations = (reservationsData.reservations || [])
        .filter((r: any) => {
          const startTime = new Date(r.startTime);
          return startTime > new Date() && ['confirmed', 'paid'].includes(r.status);
        })
        .slice(0, 5); // Top 5 prochaines réservations

      // Charger les recommandations météo via l'endpoint bookings/recommendations
      const weatherRes = await fetch(
        `${API_BASE_URL}/bookings/recommendations?scope=upcoming&days=7&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let weatherMap: Record<string, any> = {};
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        (weatherData.recommendations || []).forEach((item: any) => {
          if (item.reservationId) {
            weatherMap[item.reservationId] = item.recommendation;
          }
        });
      }

      // Combiner réservations avec leurs recommandations météo
      const weatherRecs = upcomingReservations
        .map((reservation: any) => {
          const reservationId = reservation._id || reservation.id;
          const weatherRec = weatherMap[reservationId];

          if (!weatherRec) {
            return null; // Skip si pas de recommandation météo
          }

          return {
            reservationId,
            resourceName: typeof reservation.resourceId === 'object' 
              ? reservation.resourceId.name 
              : 'Ressource',
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            location: typeof reservation.resourceId === 'object'
              ? reservation.resourceId.city
              : undefined,
            recommendation: weatherRec,
          } as WeatherRecommendation;
        })
        .filter((r): r is WeatherRecommendation => r !== null);

      setRecommendations(weatherRecs.filter((r): r is WeatherRecommendation => r !== null));
    } catch (error: any) {
      console.error('Error loading weather recommendations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les recommandations météo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'caution':
        return <CloudSun className="h-5 w-5 text-orange-500" />;
      case 'avoid':
        return <CloudRain className="h-5 w-5 text-red-500" />;
      default:
        return <Cloud className="h-5 w-5 text-gray-500" />;
    }
  };

  const getWeatherBadge = (status: string, score: number) => {
    switch (status) {
      case 'good':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Excellent ({score}%)
          </Badge>
        );
      case 'caution':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Prudence ({score}%)
          </Badge>
        );
      case 'avoid':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Défavorable ({score}%)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Indisponible
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-2">
              <CloudSun className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Recommandations Météo</CardTitle>
              <CardDescription>
                Aucune réservation à venir avec prévisions météo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 text-center py-4">
            Vos recommandations météo apparaîtront ici pour vos prochaines réservations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-2">
              <CloudSun className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Recommandations Météo IA</CardTitle>
              <CardDescription>
                Prévisions intelligentes pour vos prochaines réservations
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadWeatherRecommendations}
            className="text-purple-600 hover:text-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => {
          const startDate = new Date(rec.startTime);
          const endDate = new Date(rec.endTime);
          const isIndoor = rec.recommendation.status === 'avoid' && rec.suggestedAlternative;

          return (
            <div
              key={rec.reservationId}
              className={`rounded-lg border p-4 transition-all ${
                rec.recommendation.status === 'good'
                  ? 'border-green-200 bg-green-50/50'
                  : rec.recommendation.status === 'caution'
                  ? 'border-yellow-200 bg-yellow-50/50'
                  : rec.recommendation.status === 'avoid'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getWeatherIcon(rec.recommendation.status)}
                    <h4 className="font-semibold text-slate-900">{rec.resourceName}</h4>
                    {getWeatherBadge(rec.recommendation.status, rec.recommendation.score)}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(startDate, 'PPp', { locale: fr })}
                    </div>
                    {rec.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {rec.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-700 font-medium">
                  {rec.recommendation.summary}
                </p>

                {rec.recommendation.reasons && rec.recommendation.reasons.length > 0 && (
                  <div className="space-y-1">
                    {rec.recommendation.reasons.map((reason, idx) => (
                      <p key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="text-purple-600">•</span>
                        {reason}
                      </p>
                    ))}
                  </div>
                )}

                {rec.recommendation.metrics && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200">
                    {rec.recommendation.metrics.tempMin !== null && rec.recommendation.metrics.tempMax !== null && (
                      <div className="text-xs">
                        <span className="text-slate-500">Température:</span>{' '}
                        <span className="font-semibold">
                          {rec.recommendation.metrics.tempMin}°C - {rec.recommendation.metrics.tempMax}°C
                        </span>
                      </div>
                    )}
                    {rec.recommendation.metrics.precipitationMax !== null && (
                      <div className="text-xs">
                        <span className="text-slate-500">Précipitation:</span>{' '}
                        <span className="font-semibold">
                          {rec.recommendation.metrics.precipitationMax.toFixed(1)}mm
                        </span>
                      </div>
                    )}
                    {rec.recommendation.metrics.windMax !== null && (
                      <div className="text-xs">
                        <span className="text-slate-500">Vent:</span>{' '}
                        <span className="font-semibold">
                          {rec.recommendation.metrics.windMax.toFixed(1)} km/h
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {rec.recommendation.status === 'avoid' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 font-medium mb-1">
                      💡 Recommandation IA:
                    </p>
                    <p className="text-xs text-blue-700">
                      Conditions météo défavorables. Considérez un terrain couvert ou reportez votre réservation.
                    </p>
                  </div>
                )}

                {rec.suggestedAlternative && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-800 font-medium mb-2">
                      🌟 Alternative suggérée:
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-purple-900">
                          {rec.suggestedAlternative.resourceName}
                        </p>
                        <p className="text-xs text-purple-600">
                          {rec.suggestedAlternative.reason}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-100"
                        asChild
                      >
                        <Link to={`/resources/terrains/${rec.suggestedAlternative.resourceId}`}>
                          Voir
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
