const DEFAULT_WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const MAX_FORECAST_DAYS = 16;
const HOURLY_FIELDS = [
  'temperature_2m',
  'precipitation',
  'windspeed_10m',
  'visibility',
  'weathercode',
];

const toUtcDateString = (date) => {
  let dateObj;
  
  if (typeof date === 'string') {
    // Handle ISO string format
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return null;
  }
  
  if (Number.isNaN(dateObj.getTime())) {
    return null;
  }
  
  return dateObj.toISOString().slice(0, 10);
};

const buildUnknownRecommendation = (reason) => {
  return {
    status: 'unknown',
    score: 0,
    summary: 'Meteo indisponible pour cette reservation.',
    reasons: reason ? [reason] : [],
    updatedAt: new Date().toISOString(),
    source: 'open-meteo',
  };
};

const extractWindowMetrics = (hourly, startTime, endTime) => {
  if (!hourly || !hourly.time || hourly.time.length === 0) {
    return null;
  }

  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();

  const metrics = {
    tempMin: null,
    tempMax: null,
    precipitationMax: null,
    windMax: null,
    visibilityMin: null,
  };

  for (let idx = 0; idx < hourly.time.length; idx += 1) {
    const timeMs = new Date(hourly.time[idx]).getTime();
    if (Number.isNaN(timeMs)) {
      continue;
    }
    if (timeMs < startMs || timeMs > endMs) {
      continue;
    }

    const temp = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m[idx] : null;
    const precipitation = Array.isArray(hourly.precipitation) ? hourly.precipitation[idx] : null;
    const wind = Array.isArray(hourly.windspeed_10m) ? hourly.windspeed_10m[idx] : null;
    const visibility = Array.isArray(hourly.visibility) ? hourly.visibility[idx] : null;

    if (typeof temp === 'number') {
      metrics.tempMin = metrics.tempMin === null ? temp : Math.min(metrics.tempMin, temp);
      metrics.tempMax = metrics.tempMax === null ? temp : Math.max(metrics.tempMax, temp);
    }

    if (typeof precipitation === 'number') {
      metrics.precipitationMax = metrics.precipitationMax === null
        ? precipitation
        : Math.max(metrics.precipitationMax, precipitation);
    }

    if (typeof wind === 'number') {
      metrics.windMax = metrics.windMax === null ? wind : Math.max(metrics.windMax, wind);
    }

    if (typeof visibility === 'number') {
      metrics.visibilityMin = metrics.visibilityMin === null
        ? visibility
        : Math.min(metrics.visibilityMin, visibility);
    }
  }

  const hasData = Object.values(metrics).some((value) => value !== null);
  return hasData ? metrics : null;
};

const buildRecommendationFromMetrics = (metrics) => {
  if (!metrics) {
    return buildUnknownRecommendation('Aucune donnee meteo pour ce creneau.');
  }

  let score = 100;
  const reasons = [];

  if (metrics.precipitationMax !== null) {
    if (metrics.precipitationMax >= 2.5) {
      score -= 40;
      reasons.push('Forte precipitation attendue.');
    } else if (metrics.precipitationMax >= 0.5) {
      score -= 20;
      reasons.push('Pluie possible.');
    }
  }

  if (metrics.windMax !== null) {
    if (metrics.windMax >= 35) {
      score -= 20;
      reasons.push('Vent fort prevu.');
    } else if (metrics.windMax >= 20) {
      score -= 10;
      reasons.push('Vent modere prevu.');
    }
  }

  if (metrics.tempMin !== null && metrics.tempMax !== null) {
    if (metrics.tempMin < 5 || metrics.tempMax > 35) {
      score -= 15;
      reasons.push('Temperature potentiellement inconfortable.');
    }
  }

  if (metrics.visibilityMin !== null && metrics.visibilityMin < 2000) {
    score -= 10;
    reasons.push('Visibilite reduite.');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = 'good';
  if (score < 40) {
    status = 'avoid';
  } else if (score < 70) {
    status = 'caution';
  }

  const summaryMap = {
    good: 'Conditions favorables pour votre reservation.',
    caution: 'Conditions mixtes. Prevoyez une tenue adaptee.',
    avoid: 'Conditions difficiles. Un report est conseille.',
  };

  return {
    status,
    score,
    summary: summaryMap[status] || summaryMap.good,
    reasons: reasons.length > 0 ? reasons : ['Conditions globalement stables.'],
    metrics,
    updatedAt: new Date().toISOString(),
    source: 'open-meteo',
  };
};

export const fetchHourlyForecast = async ({ latitude, longitude, startTime, endTime }) => {
  const startDate = toUtcDateString(startTime);
  const endDate = toUtcDateString(endTime);

  if (!startDate || !endDate) {
    throw new Error('Invalid date range for weather request');
  }

  const baseUrl = process.env.WEATHER_API_BASE_URL || DEFAULT_WEATHER_BASE_URL;
  const url = new URL(baseUrl);
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('hourly', HOURLY_FIELDS.join(','));
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('timezone', 'UTC');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
};

export const getWeatherRecommendation = async ({ latitude, longitude, startTime, endTime }) => {
  console.log(`[Weather] Getting recommendation for (${latitude}, ${longitude}) from ${startTime} to ${endTime}`);
  
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    console.warn('[Weather] Missing coordinates');
    return buildUnknownRecommendation('Coordonnees manquantes pour la localisation.');
  }

  const startMs = startTime ? new Date(startTime).getTime() : null;
  const nowMs = Date.now();

  if (startTime && startMs < nowMs) {
    console.warn(`[Weather] Start time in past: ${startTime}`);
    return buildUnknownRecommendation('Creneau deja passe.');
  }

  if (startTime) {
    const maxMs = nowMs + MAX_FORECAST_DAYS * 24 * 60 * 60 * 1000;
    if (!Number.isNaN(startMs) && startMs > maxMs) {
      console.warn(`[Weather] Start time beyond forecast window: ${startTime} (max: ${new Date(maxMs).toISOString()})`);
      return buildUnknownRecommendation('Previsions disponibles 16 jours avant la date.');
    }
  }

  try {
    console.log(`[Weather] Fetching forecast from Open-Meteo API...`);
    const forecast = await fetchHourlyForecast({ latitude, longitude, startTime, endTime });
    console.log(`[Weather] Forecast received. Time points: ${forecast.hourly?.time?.length || 0}`);
    
    const metrics = extractWindowMetrics(forecast.hourly, startTime, endTime);
    console.log(`[Weather] Metrics extracted:`, metrics);
    
    const recommendation = buildRecommendationFromMetrics(metrics);
    console.log(`[Weather] Recommendation built: status=${recommendation.status}, score=${recommendation.score}`);
    
    return recommendation;
  } catch (error) {
    console.error(`[Weather] Error during forecast fetch:`, error.message);
    console.error(`[Weather] Full error:`, error);
    return buildUnknownRecommendation(`Erreur API: ${error.message}`);
  }
};

export const getReservationWeatherRecommendation = async (reservation) => {
  const resource = reservation?.resourceId;
  const location = resource?.locationId;
  const latitude = resource?.latitude ?? location?.latitude ?? null;
  const longitude = resource?.longitude ?? location?.longitude ?? null;

  return getWeatherRecommendation({
    latitude,
    longitude,
    startTime: reservation?.startTime,
    endTime: reservation?.endTime,
  });
};
