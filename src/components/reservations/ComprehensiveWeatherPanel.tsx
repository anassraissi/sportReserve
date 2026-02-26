import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Gauge,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WeatherForecastData {
  location: {
    ville: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  period: {
    start: string;
    end: string;
  };
  selectedDate: string;
  selectedHour?: number;
  daily: Array<{
    date: string;
    day: string;
    tempMin: number;
    tempMax: number;
    precipitation: number;
    windMax: number;
    weathercode: number;
    weatherDescription: string;
    recommendation: { status: string; score: number; reasons: string[] };
    indicators: {
      temperature: { value: number; label: string; level: number };
      precipitation: { value: number; label: string; level: number };
      wind: { value: number; label: string; level: number };
    };
  }>;
  hourly: Array<{
    hour: number;
    time: string;
    temperature: number;
    precipitation: number;
    windspeed: number;
    humidity: number;
    weathercode: number;
    weatherDescription: string;
  }>;
  selectedHourRecommendation?: {
    status: string;
    score: number;
    reasons: string[];
    metrics: {
      temperature: number;
      precipitation: number;
      windspeed: number;
      humidity: number;
      weatherDescription: string;
    };
  };
  updatedAt: string;
}

interface ComprehensiveWeatherProps {
  data: WeatherForecastData | null;
  isLoading?: boolean;
  error?: string | null;
  onDateChange?: (date: string) => void;
  onHourChange?: (hour: number) => void;
}

const STATUS_COLORS: Record<string, { badge: string; bar: string; icon: React.ElementType }> = {
  good: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bar: 'bg-emerald-500',
    icon: CheckCircle,
  },
  caution: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    bar: 'bg-amber-500',
    icon: AlertCircle,
  },
  avoid: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    bar: 'bg-red-500',
    icon: AlertTriangle,
  },
};

export const ComprehensiveWeatherPanel: React.FC<ComprehensiveWeatherProps> = ({
  data,
  isLoading = false,
  error,
  onDateChange,
  onHourChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>();
  const [selectedHour, setSelectedHour] = useState<number>(8);

  useEffect(() => {
    if (data?.selectedDate) {
      setSelectedDate(data.selectedDate);
    }
  }, [data?.selectedDate]);

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
            <div className="h-20 rounded bg-slate-200 animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Erreur données météo</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Aucune donnée météo disponible</p>
        </CardContent>
      </Card>
    );
  }

  const selectedDayData = data.daily[0];
  const currentHourData = selectedHour !== undefined ? data.hourly[selectedHour] : null;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="hourly">Horaire</TabsTrigger>
        <TabsTrigger value="16days">16 jours</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        {/* Header with location */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">{data.location.ville}</h3>
                <p className="text-sm text-slate-600 mt-1">{data.location.address}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                Mise à jour: {format(new Date(data.updatedAt), 'dd/MM HH:mm')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Recommendation */}
        {selectedDayData && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(new Date(selectedDayData.date), 'EEEE d MMMM', { locale: fr })}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-sm',
                    STATUS_COLORS[selectedDayData.recommendation.status]?.badge
                  )}
                >
                  {selectedDayData.recommendation.status === 'good'
                    ? '✓ Bon'
                    : selectedDayData.recommendation.status === 'caution'
                      ? '⚠ Prudence'
                      : '✕ À éviter'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-700">Score de conditions</span>
                  <span className="text-lg font-bold text-slate-900">
                    {selectedDayData.recommendation.score}/100
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      STATUS_COLORS[selectedDayData.recommendation.status]?.bar
                    )}
                    style={{ width: `${selectedDayData.recommendation.score}%` }}
                  />
                </div>
              </div>

              {/* Indicators grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-semibold text-slate-600">Température</span>
                  </div>
                  <p className="font-semibold text-slate-900">{selectedDayData.indicators.temperature.label}</p>
                  <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-red-500"
                      style={{
                        width: `${Math.min(100, (selectedDayData.indicators.temperature.level / 4) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CloudRain className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-semibold text-slate-600">Pluie</span>
                  </div>
                  <p className="font-semibold text-slate-900">{selectedDayData.indicators.precipitation.label}</p>
                  <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${Math.min(100, (selectedDayData.indicators.precipitation.level / 3) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="h-4 w-4 text-cyan-500" />
                    <span className="text-xs font-semibold text-slate-600">Vent</span>
                  </div>
                  <p className="font-semibold text-slate-900">{selectedDayData.indicators.wind.label}</p>
                  <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500"
                      style={{
                        width: `${Math.min(100, (selectedDayData.indicators.wind.level / 3) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recommendations reasons */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Détails:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDayData.recommendation.reasons.map((reason, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Weather description */}
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <p className="text-sm text-slate-700">
                  <strong>Conditions:</strong> {selectedDayData.weatherDescription}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="hourly" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prévisions horaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {data.hourly.map((hour) => (
                <button
                  key={hour.hour}
                  onClick={() => {
                    setSelectedHour(hour.hour);
                    onHourChange?.(hour.hour);
                  }}
                  className={cn(
                    'p-2 rounded-lg border transition-all text-center',
                    selectedHour === hour.hour
                      ? 'bg-blue-100 border-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="font-semibold text-sm">{String(hour.hour).padStart(2, '0')}h</div>
                  <div className="text-xs mt-1">{Math.round(hour.temperature)}°C</div>
                  <div className="text-xs text-blue-600">{(hour.precipitation || 0).toFixed(1)} mm</div>
                </button>
              ))}
            </div>

            {currentHourData && data.selectedHourRecommendation && (
              <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">
                    Recommandation pour {String(selectedHour).padStart(2, '0')}h
                  </h4>
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[data.selectedHourRecommendation.status]?.badge}
                  >
                    {data.selectedHourRecommendation.status === 'good'
                      ? '✓ Bon'
                      : data.selectedHourRecommendation.status === 'caution'
                        ? '⚠ Prudence'
                        : '✕ À éviter'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-slate-600">Score</p>
                    <p className="text-lg font-bold text-slate-900">
                      {data.selectedHourRecommendation.score}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Humidité</p>
                    <p className="text-lg font-bold text-slate-900">
                      {data.selectedHourRecommendation.metrics.humidity}%
                    </p>
                  </div>
                </div>

                {data.selectedHourRecommendation.reasons.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.selectedHourRecommendation.reasons.map((reason, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="16days" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prévisions 16 jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.daily.map((day, idx) => {
                const StatusIcon = STATUS_COLORS[day.recommendation.status]?.icon || CheckCircle;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(day.date);
                      onDateChange?.(day.date);
                    }}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-all',
                      selectedDate === day.date
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="font-semibold text-sm text-slate-900 capitalize">{day.day}</p>
                          <p className="text-xs text-slate-600">{day.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="font-semibold text-slate-900">
                            {Math.round(day.tempMin)}° - {Math.round(day.tempMax)}°
                          </p>
                          <p className="text-xs text-slate-600">{day.weatherDescription}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right text-xs">
                            <p className="font-semibold text-slate-900">{day.recommendation.score}%</p>
                            <p className="text-slate-600">Score</p>
                          </div>
                          <StatusIcon
                            className={cn(
                              'h-5 w-5',
                              day.recommendation.status === 'good'
                                ? 'text-emerald-600'
                                : day.recommendation.status === 'caution'
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
