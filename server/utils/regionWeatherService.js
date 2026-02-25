const DEFAULT_WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const HOURLY_FIELDS = [
  'temperature_2m',
  'precipitation',
  'windspeed_10m',
  'relativehumidity_2m',
  'weathercode',
];

const REGION_DEFINITIONS = [
  { key: 'sale', name: 'Sale', latitude: 34.0393, longitude: -6.7985 },
  { key: 'rabat', name: 'Rabat', latitude: 34.0209, longitude: -6.8416 },
  { key: 'skhirat', name: 'Skhirat', latitude: 33.8522, longitude: -7.0379 },
];

const toDateString = (date) => {
  if (!(date instanceof Date)) return null;
  return date.toISOString().slice(0, 10);
};

const addDays = (date, days) => {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

const extractDayMetrics = (hourly, dayString) => {
  if (!hourly || !hourly.time || hourly.time.length === 0) return null;

  const metrics = {
    tempMin: null,
    tempMax: null,
    precipitationMax: null,
    windMax: null,
    humidityMax: null,
  };

  for (let idx = 0; idx < hourly.time.length; idx += 1) {
    const timestamp = hourly.time[idx];
    if (!timestamp || !timestamp.startsWith(dayString)) {
      continue;
    }

    const temp = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m[idx] : null;
    const precipitation = Array.isArray(hourly.precipitation) ? hourly.precipitation[idx] : null;
    const wind = Array.isArray(hourly.windspeed_10m) ? hourly.windspeed_10m[idx] : null;
    const humidity = Array.isArray(hourly.relativehumidity_2m) ? hourly.relativehumidity_2m[idx] : null;

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

    if (typeof humidity === 'number') {
      metrics.humidityMax = metrics.humidityMax === null ? humidity : Math.max(metrics.humidityMax, humidity);
    }
  }

  const hasData = Object.values(metrics).some((value) => value !== null);
  return hasData ? metrics : null;
};

const buildDaySummary = (metrics) => {
  if (!metrics) {
    return { status: 'unknown', score: 0, summary: 'Donnees meteo indisponibles.' };
  }

  let score = 100;
  const reasons = [];

  if (metrics.precipitationMax !== null) {
    if (metrics.precipitationMax >= 2.5) {
      score -= 40;
      reasons.push('Forte precipitation.');
    } else if (metrics.precipitationMax >= 0.5) {
      score -= 20;
      reasons.push('Pluie possible.');
    }
  }

  if (metrics.windMax !== null) {
    if (metrics.windMax >= 35) {
      score -= 20;
      reasons.push('Vent fort.');
    } else if (metrics.windMax >= 20) {
      score -= 10;
      reasons.push('Vent modere.');
    }
  }

  if (metrics.tempMax !== null) {
    if (metrics.tempMax >= 36) {
      score -= 25;
      reasons.push('Chaleur intense.');
    } else if (metrics.tempMax >= 30) {
      score -= 12;
      reasons.push('Chaleur elevee.');
    }
  }

  if (metrics.humidityMax !== null) {
    if (metrics.humidityMax >= 85) {
      score -= 12;
      reasons.push('Humidite elevee.');
    } else if (metrics.humidityMax >= 70) {
      score -= 6;
      reasons.push('Humidite sensible.');
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = 'good';
  if (score < 40) {
    status = 'avoid';
  } else if (score < 70) {
    status = 'caution';
  }

  const summaryMap = {
    good: 'Bonne fenetre pour le sport en exterieur.',
    caution: 'Conditions mixtes. Prevoyez un equipement adapte.',
    avoid: 'Conditions difficiles. Mieux vaut reporter.',
  };

  return {
    status,
    score,
    summary: summaryMap[status] || summaryMap.good,
    reasons,
    metrics,
  };
};

const fetchHourlyForecast = async ({ latitude, longitude, startDate, endDate }) => {
  const baseUrl = process.env.WEATHER_API_BASE_URL || DEFAULT_WEATHER_BASE_URL;
  const url = new URL(baseUrl);
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('hourly', HOURLY_FIELDS.join(','));
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('timezone', 'Africa/Casablanca');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
};

export const getRegionalWeatherSummary = async () => {
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const startDate = toDateString(today);
  const endDate = toDateString(tomorrow);

  if (!startDate || !endDate) {
    throw new Error('Invalid date range');
  }

  const summaries = await Promise.all(
    REGION_DEFINITIONS.map(async (region) => {
      try {
        const forecast = await fetchHourlyForecast({
          latitude: region.latitude,
          longitude: region.longitude,
          startDate,
          endDate,
        });

        const todayMetrics = extractDayMetrics(forecast.hourly, startDate);
        const tomorrowMetrics = extractDayMetrics(forecast.hourly, endDate);

        return {
          key: region.key,
          name: region.name,
          today: buildDaySummary(todayMetrics),
          tomorrow: buildDaySummary(tomorrowMetrics),
        };
      } catch (error) {
        return {
          key: region.key,
          name: region.name,
          today: { status: 'unknown', score: 0, summary: 'Donnees indisponibles.' },
          tomorrow: { status: 'unknown', score: 0, summary: 'Donnees indisponibles.' },
        };
      }
    })
  );

  return {
    regions: summaries,
    updatedAt: new Date().toISOString(),
  };
};
