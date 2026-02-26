import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CloudRain, Eye, Sun, Thermometer, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherRecommendation {
  status?: 'good' | 'caution' | 'avoid' | 'unknown';
  summary?: string;
  score?: number;
  reasons?: string[];
  metrics?: {
    tempMin?: number | null;
    tempMax?: number | null;
    precipitationMax?: number | null;
    windMax?: number | null;
    visibilityMin?: number | null;
  };
  updatedAt?: string;
}

interface WeatherPreviewCardProps {
  recommendation?: WeatherRecommendation | null;
  isLoading?: boolean;
  error?: string | null;
}

const STATUS_STYLE: Record<string, { label: string; badge: string; ring: string; gradient: string; bar: string; icon: React.ElementType; textColor: string; motivation: string[] }>= {
  good: {
    label: '✨ Parfait pour jouer!',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ring: 'ring-emerald-200/60',
    gradient: 'from-emerald-50 via-white to-emerald-100/40',
    bar: 'bg-emerald-500',
    icon: Sun,
    textColor: 'text-emerald-700',
    motivation: [
      '🎾 Conditions ideales pour jouer!',
      '☀️ Excellent choix de creneau!',
      '🌟 Le meteo vous sourit!',
      '💪 Conditions parfaites pour vous!',
    ],
  },
  caution: {
    label: '⚠️ A surveiller',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    ring: 'ring-amber-200/60',
    gradient: 'from-amber-50 via-white to-amber-100/40',
    bar: 'bg-amber-500',
    icon: CloudRain,
    textColor: 'text-amber-700',
    motivation: [
      '🌦️ Parfois oui, soyez prudent!',
      '⛅ Possible mais surveillance requise',
      '🏃 Jouer avec quelques precautions',
      '👀 Conditions changeantes - restez alerte!',
    ],
  },
  avoid: {
    label: '❌ Non recommande',
    badge: 'bg-red-100 text-red-800 border-red-200',
    ring: 'ring-red-200/60',
    gradient: 'from-red-50 via-white to-red-100/40',
    bar: 'bg-red-500',
    icon: AlertTriangle,
    textColor: 'text-red-700',
    motivation: [
      '🚫 Mieux reporter pour votre securite',
      '🌧️ Conditions trop difficiles',
      '⛈️ Rejouer un autre moment!',
      '❌ Securite avant tout - reprogrammez!',
    ],
  },
  unknown: {
    label: '❓ Donnees indisponibles',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    ring: 'ring-slate-200/60',
    gradient: 'from-slate-50 via-white to-slate-100/40',
    bar: 'bg-slate-400',
    icon: AlertTriangle,
    textColor: 'text-slate-600',
    motivation: [
      '📍 Verifiez vos coordonnees d\'adresse',
      '🗺️ Meteo temporairement indisponible',
    ],
  },
};

const formatRange = (min?: number | null, max?: number | null, unit?: string) => {
  if (typeof min === 'number' && typeof max === 'number') {
    return `${Math.round(min)}-${Math.round(max)}${unit || ''}`;
  }
  if (typeof max === 'number') {
    return `${Math.round(max)}${unit || ''}`;
  }
  if (typeof min === 'number') {
    return `${Math.round(min)}${unit || ''}`;
  }
  return null;
};

export const WeatherPreviewCard: React.FC<WeatherPreviewCardProps> = ({
  recommendation,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
        <div className="mt-3 h-6 w-64 rounded bg-slate-200 animate-pulse" />
        <div className="mt-4 h-2 w-full rounded bg-slate-200 animate-pulse" />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-10 rounded bg-slate-200 animate-pulse" />
          <div className="h-10 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
          <AlertTriangle className="h-4 w-4" />
          Meteo indisponible
        </div>
        <p className="mt-1 text-xs text-red-600">{error}</p>
        <p className="mt-2 text-xs text-red-500">
          💡 Conseil: Assurez-vous que la ressource a des coordonnees géographiques définies.
        </p>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm text-slate-600">Selectionnez une date et une heure pour voir la meteo.</p>
      </div>
    );
  }

  const status = recommendation.status || 'unknown';
  const config = STATUS_STYLE[status] || STATUS_STYLE.unknown;
  const score = typeof recommendation.score === 'number' ? recommendation.score : 0;
  const ScoreIcon = config.icon;

  // Get random motivational message
  const motivationMessage = config.motivation[Math.floor(Math.random() * config.motivation.length)];

  const metrics = recommendation.metrics || {};
  const metricItems = [
    {
      label: 'Temperature',
      value: formatRange(metrics.tempMin, metrics.tempMax, '°C'),
      icon: Thermometer,
    },
    {
      label: 'Pluie',
      value: typeof metrics.precipitationMax === 'number'
        ? `${metrics.precipitationMax.toFixed(1)} mm`
        : null,
      icon: CloudRain,
    },
    {
      label: 'Vent',
      value: typeof metrics.windMax === 'number' ? `${Math.round(metrics.windMax)} km/h` : null,
      icon: Wind,
    },
    {
      label: 'Visibilite',
      value: typeof metrics.visibilityMin === 'number'
        ? `${Math.round(metrics.visibilityMin / 1000)} km`
        : null,
      icon: Eye,
    },
  ].filter((item) => item.value);

  return (
    <div className={cn('rounded-2xl border bg-gradient-to-br p-6 shadow-lg ring-1 overflow-hidden', config.gradient, config.ring)}>
      {/* Motivation Banner */}
      <div className={cn('mb-4 rounded-lg p-3 text-center', config.textColor)}>
        <p className="text-sm font-bold leading-relaxed">{motivationMessage}</p>
      </div>

      {/* Header with Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meteo pour ce creneau</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{recommendation.summary || 'Apercu meteo'}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={cn('border text-xs font-bold px-3 py-1.5', config.badge)}>
            {config.label}
          </Badge>
          <div className="flex items-center gap-1 text-xs font-bold" style={{ color: config.textColor.replace('text-', '') }}>
            <ScoreIcon className="h-4 w-4" />
            <span className={config.textColor}>{score}/100</span>
          </div>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
        <div 
          className={cn('h-full rounded-full transition-all border border-white/30 shadow-sm', config.bar)} 
          style={{ width: `${score}%` }} 
        />
      </div>

      {/* Reasons */}
      {recommendation.reasons && recommendation.reasons.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {recommendation.reasons.map((reason, idx) => (
            <span
              key={`${reason}-${idx}`}
              className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      {metricItems.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metricItems.map((item) => (
            <div key={item.label} className="rounded-xl bg-white/70 p-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-800">{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
