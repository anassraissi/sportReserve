import express from 'express';
import { query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { getRegionalWeatherSummary } from '../utils/regionWeatherService.js';
import { fetchHourlyForecast, getWeatherRecommendation } from '../utils/weatherService.js';
import Resource from '../models/Resource.js';

const router = express.Router();

// Get regional weather summary (today + tomorrow)
router.get('/regions', authenticate, async (req, res) => {
  try {
    const summary = await getRegionalWeatherSummary();
    res.json(summary);
  } catch (error) {
    console.error('Get regional weather error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get hourly forecast + recommendation for a resource and time window
router.get('/forecast', authenticate, [
  query('resourceId').isMongoId().withMessage('Valid resourceId required'),
  query('startTime').isISO8601().withMessage('Valid startTime required'),
  query('endTime').isISO8601().withMessage('Valid endTime required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { resourceId, startTime, endTime } = req.query;
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      return res.status(400).json({ message: 'Invalid time window' });
    }

    const resource = await Resource.findById(resourceId)
      .populate('locationId', 'name address latitude longitude city timezone');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const latitude = resource.latitude ?? resource.locationId?.latitude ?? null;
    const longitude = resource.longitude ?? resource.locationId?.longitude ?? null;

    if (latitude === null || longitude === null) {
      return res.status(400).json({ message: 'Resource coordinates missing' });
    }

    const recommendation = await getWeatherRecommendation({
      latitude,
      longitude,
      startTime,
      endTime,
    });

    const maxMs = Date.now() + 16 * 24 * 60 * 60 * 1000;
    if (startMs > maxMs || recommendation.status === 'unknown') {
      return res.json({
        recommendation,
        hourly: [],
        source: 'open-meteo',
      });
    }

    const forecast = await fetchHourlyForecast({ latitude, longitude, startTime, endTime });
    const hourly = [];

    if (forecast?.hourly?.time?.length) {
      const fields = ['temperature_2m', 'precipitation', 'windspeed_10m', 'visibility', 'weathercode'];
      for (let idx = 0; idx < forecast.hourly.time.length; idx += 1) {
        const time = forecast.hourly.time[idx];
        const timeMs = new Date(time).getTime();
        if (Number.isNaN(timeMs) || timeMs < startMs || timeMs > endMs) {
          continue;
        }
        const entry = { time };
        fields.forEach((field) => {
          if (Array.isArray(forecast.hourly[field])) {
            entry[field] = forecast.hourly[field][idx];
          }
        });
        hourly.push(entry);
      }
    }

    res.json({
      recommendation,
      hourly,
      source: 'open-meteo',
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get 16-day daily forecast for a resource
router.get('/forecast-16days', authenticate, [
  query('resourceId').optional().isMongoId().withMessage('Valid resourceId'),
  query('latitude').optional().isFloat().withMessage('Valid latitude'),
  query('longitude').optional().isFloat().withMessage('Valid longitude'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    let latitude = parseFloat(req.query.latitude);
    let longitude = parseFloat(req.query.longitude);

    // If resourceId provided, get coordinates from resource
    if (req.query.resourceId && Number.isNaN(latitude)) {
      const resource = await Resource.findById(req.query.resourceId)
        .populate('locationId', 'latitude longitude');
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      latitude = resource.latitude ?? resource.locationId?.latitude;
      longitude = resource.longitude ?? resource.locationId?.longitude;
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      console.error(`[Weather] Missing coordinates for resourceId: ${req.query.resourceId}`, {
        resourceLatitude: latitude,
        resourceLongitude: longitude,
        locationId: req.query.resourceId ? 'populated' : 'not requested',
      });
      return res.status(400).json({
        message: 'Coordinates required. Please set coordinates for resource or location.',
        details: 'Resource and its location are missing latitude/longitude',
      });
    }

    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    const endDate = new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const baseUrl = process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast';
    const url = new URL(baseUrl);
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode');
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);
    url.searchParams.set('timezone', 'Africa/Casablanca');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const forecastData = await response.json();
    const daily = [];

    if (forecastData?.daily?.time?.length) {
      for (let idx = 0; idx < forecastData.daily.time.length; idx += 1) {
        const date = forecastData.daily.time[idx];
        const dayData = {
          date,
          tempMin: forecastData.daily.temperature_2m_min?.[idx],
          tempMax: forecastData.daily.temperature_2m_max?.[idx],
          precipitation: forecastData.daily.precipitation_sum?.[idx],
          windMax: forecastData.daily.windspeed_10m_max?.[idx],
          weathercode: forecastData.daily.weathercode?.[idx],
        };

        // Assign weather description based on WMO code
        dayData.weatherDescription = getWeatherDescription(dayData.weathercode);
        
        // Calculate daily recommendation
        dayData.recommendation = calculateDailyRecommendation(dayData);
        
        daily.push(dayData);
      }
    }

    res.json({
      days: daily,
      location: {
        latitude,
        longitude,
      },
      period: `${startDate} to ${endDate}`,
      source: 'open-meteo',
    });
  } catch (error) {
    console.error('Get 16-day forecast error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper: Get weather description from WMO code
const getWeatherDescription = (code) => {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
};

// Helper: Calculate recommendation for a day
const calculateDailyRecommendation = (dayData) => {
  let score = 100;
  const reasons = [];

  if (dayData.precipitation !== null && dayData.precipitation > 0) {
    if (dayData.precipitation >= 10) {
      score -= 40;
      reasons.push('Heavy rain expected');
    } else if (dayData.precipitation >= 2.5) {
      score -= 25;
      reasons.push('Moderate rain expected');
    } else {
      score -= 10;
      reasons.push('Light rain possible');
    }
  }

  if (dayData.windMax !== null) {
    if (dayData.windMax >= 35) {
      score -= 20;
      reasons.push('Strong wind');
    } else if (dayData.windMax >= 20) {
      score -= 10;
      reasons.push('Moderate wind');
    }
  }

  if (dayData.tempMin !== null && dayData.tempMax !== null) {
    if (dayData.tempMax > 35) {
      score -= 15;
      reasons.push('Very hot');
    } else if (dayData.tempMin < 5) {
      score -= 15;
      reasons.push('Very cold');
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = 'good';
  if (score < 40) {
    status = 'avoid';
  } else if (score < 70) {
    status = 'caution';
  }

  return {
    status,
    score,
    reasons: reasons.length > 0 ? reasons : ['Good conditions'],
  };
};

// Comprehensive weather forecast with location info (ville, latitude, longitude, address, etc.)
router.post('/forecast-comprehensive', authenticate, async (req, res) => {
  try {
    const {
      resourceId,
      ville,
      address,
      latitude,
      longitude,
      startDate,
      selectedHour,
    } = req.body;

    // Validate coordinates
    let lat = parseFloat(latitude);
    let lon = parseFloat(longitude);

    // If resourceId provided and coordinates are missing, fetch from resource
    if (resourceId && (Number.isNaN(lat) || Number.isNaN(lon))) {
      const resource = await Resource.findById(resourceId)
        .populate('locationId', 'latitude longitude name address');
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      lat = resource.latitude ?? resource.locationId?.latitude;
      lon = resource.longitude ?? resource.locationId?.longitude;
      
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return res.status(400).json({
          message: 'Coordinates not found',
          details: 'Resource or location missing latitude/longitude',
        });
      }
    }

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        message: 'Coordinates required',
        details: 'Please provide latitude and longitude or resourceId',
      });
    }

    const date = startDate ? new Date(startDate) : new Date();
    const startDateStr = date.toISOString().slice(0, 10);
    const endDate = new Date(date.getTime() + 16 * 24 * 60 * 60 * 1000);
    const endDateStr = endDate.toISOString().slice(0, 10);

    // Fetch daily forecast
    const dailyUrl = new URL(process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast');
    dailyUrl.searchParams.set('latitude', lat.toString());
    dailyUrl.searchParams.set('longitude', lon.toString());
    dailyUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode');
    dailyUrl.searchParams.set('start_date', startDateStr);
    dailyUrl.searchParams.set('end_date', endDateStr);
    dailyUrl.searchParams.set('timezone', 'Africa/Casablanca');

    const dailyResponse = await fetch(dailyUrl.toString());
    if (!dailyResponse.ok) throw new Error(`Weather API error: ${dailyResponse.status}`);
    const dailyData = await dailyResponse.json();

    // Fetch hourly forecast for selected day
    let hourlyData = null;
    let hourlyForecast = [];

    const hourlyUrl = new URL(process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast');
    hourlyUrl.searchParams.set('latitude', lat.toString());
    hourlyUrl.searchParams.set('longitude', lon.toString());
    hourlyUrl.searchParams.set('hourly', 'temperature_2m,precipitation,windspeed_10m,relativehumidity_2m,weathercode');
    hourlyUrl.searchParams.set('start_date', startDateStr);
    hourlyUrl.searchParams.set('end_date', startDateStr);
    hourlyUrl.searchParams.set('timezone', 'Africa/Casablanca');

    const hourlyResponse = await fetch(hourlyUrl.toString());
    if (hourlyResponse.ok) {
      hourlyData = await hourlyResponse.json();
      
      if (hourlyData?.hourly?.time?.length) {
        for (let idx = 0; idx < hourlyData.hourly.time.length; idx += 1) {
          const time = hourlyData.hourly.time[idx];
          const hour = parseInt(time.split('T')[1]) || idx;
          
          hourlyForecast.push({
            hour,
            time,
            temperature: hourlyData.hourly.temperature_2m?.[idx],
            precipitation: hourlyData.hourly.precipitation?.[idx],
            windspeed: hourlyData.hourly.windspeed_10m?.[idx],
            humidity: hourlyData.hourly.relativehumidity_2m?.[idx],
            weathercode: hourlyData.hourly.weathercode?.[idx],
            weatherDescription: getWeatherDescription(hourlyData.hourly.weathercode?.[idx]),
          });
        }
      }
    }

    // Build 16-day forecast
    const dailyForecast = [];
    if (dailyData?.daily?.time?.length) {
      for (let idx = 0; idx < dailyData.daily.time.length; idx += 1) {
        const date = dailyData.daily.time[idx];
        const dayData = {
          date,
          day: new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }),
          tempMin: dailyData.daily.temperature_2m_min?.[idx],
          tempMax: dailyData.daily.temperature_2m_max?.[idx],
          precipitation: dailyData.daily.precipitation_sum?.[idx],
          windMax: dailyData.daily.windspeed_10m_max?.[idx],
          weathercode: dailyData.daily.weathercode?.[idx],
          weatherDescription: getWeatherDescription(dailyData.daily.weathercode?.[idx]),
          recommendation: calculateDailyRecommendation({
            precipitation: dailyData.daily.precipitation_sum?.[idx],
            windMax: dailyData.daily.windspeed_10m_max?.[idx],
            tempMin: dailyData.daily.temperature_2m_min?.[idx],
            tempMax: dailyData.daily.temperature_2m_max?.[idx],
            weathercode: dailyData.daily.weathercode?.[idx],
          }),
          indicators: {
            temperature: {
              value: dailyData.daily.temperature_2m_max?.[idx],
              label: `${Math.round(dailyData.daily.temperature_2m_min?.[idx])}° - ${Math.round(dailyData.daily.temperature_2m_max?.[idx])}°C`,
              level: calculateLevel(dailyData.daily.temperature_2m_max?.[idx], [5, 15, 25, 35]),
            },
            precipitation: {
              value: dailyData.daily.precipitation_sum?.[idx],
              label: `${(dailyData.daily.precipitation_sum?.[idx] || 0).toFixed(1)} mm`,
              level: calculateLevel(dailyData.daily.precipitation_sum?.[idx], [0.5, 2.5, 10]),
            },
            wind: {
              value: dailyData.daily.windspeed_10m_max?.[idx],
              label: `${Math.round(dailyData.daily.windspeed_10m_max?.[idx])} km/h`,
              level: calculateLevel(dailyData.daily.windspeed_10m_max?.[idx], [10, 20, 35]),
            },
          },
        };
        dailyForecast.push(dayData);
      }
    }

    // Calculate hourly recommendation for selected hour
    let selectedHourRecommendation = null;
    if (selectedHour !== undefined && hourlyForecast.length > 0) {
      const hourData = hourlyForecast[selectedHour];
      if (hourData) {
        selectedHourRecommendation = calculateHourlyRecommendation(hourData);
      }
    }

    res.json({
      location: {
        ville,
        address,
        latitude: lat,
        longitude: lon,
      },
      period: {
        start: startDateStr,
        end: endDateStr,
      },
      selectedDate: startDateStr,
      selectedHour,
      daily: dailyForecast,
      hourly: hourlyForecast,
      selectedHourRecommendation,
      source: 'open-meteo',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Weather Comprehensive] Error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

// Helper: Calculate level for indicators
const calculateLevel = (value, thresholds) => {
  if (value === null || value === undefined) return 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (value < thresholds[i]) return i;
  }
  return thresholds.length;
};

// Helper: Calculate hourly recommendation
const calculateHourlyRecommendation = (hourData) => {
  let score = 100;
  const reasons = [];

  if (hourData.precipitation > 0) {
    if (hourData.precipitation >= 2.5) {
      score -= 40;
      reasons.push('Heavy rain');
    } else if (hourData.precipitation >= 0.5) {
      score -= 20;
      reasons.push('Light rain');
    }
  }

  if (hourData.windspeed >= 35) {
    score -= 20;
    reasons.push('Strong wind');
  } else if (hourData.windspeed >= 20) {
    score -= 10;
    reasons.push('Moderate wind');
  }

  if (hourData.temperature < 5 || hourData.temperature > 35) {
    score -= 15;
    reasons.push('Uncomfortable temperature');
  }

  if (hourData.humidity > 85) {
    score -= 10;
    reasons.push('High humidity');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = 'good';
  if (score < 40) status = 'avoid';
  else if (score < 70) status = 'caution';

  return {
    status,
    score,
    reasons: reasons.length > 0 ? reasons : ['Good conditions'],
    metrics: {
      temperature: hourData.temperature,
      precipitation: hourData.precipitation,
      windspeed: hourData.windspeed,
      humidity: hourData.humidity,
      weatherDescription: hourData.weatherDescription,
    },
  };
};

export default router;
