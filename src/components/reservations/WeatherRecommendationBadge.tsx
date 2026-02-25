import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WeatherRecommendation {
  status?: 'good' | 'caution' | 'avoid' | 'unknown';
  summary?: string;
  score?: number;
  reasons?: string[];
}

interface WeatherRecommendationBadgeProps {
  recommendation?: WeatherRecommendation | null;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  good: { label: 'Bon', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  caution: { label: 'Prudence', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  avoid: { label: 'A eviter', className: 'bg-red-100 text-red-800 border-red-200' },
  unknown: { label: 'Indisponible', className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const WeatherRecommendationBadge: React.FC<WeatherRecommendationBadgeProps> = ({
  recommendation,
  compact = false,
}) => {
  const status = recommendation?.status || 'unknown';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const summary = recommendation?.summary || 'Meteo non disponible pour ce creneau.';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', compact ? 'text-xs' : 'text-sm')}>
      <Badge variant="outline" className={cn('border', config.className)}>
        Meteo: {config.label}
      </Badge>
      {!compact && <span className="text-muted-foreground">{summary}</span>}
    </div>
  );
};
