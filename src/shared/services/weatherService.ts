import { WeatherData } from '../types';

export function getWeatherConditionText(code: number): { text: string; icon: string } {
  switch (code) {
    case 0:
      return { text: 'Céu Limpo / Ensolarado', icon: '☀️' };
    case 1:
      return { text: 'Predominantemente Limpo', icon: '🌤️' };
    case 2:
      return { text: 'Parcialmente Nublado', icon: '⛅' };
    case 3:
      return { text: 'Nublado', icon: '☁️' };
    case 45:
    case 48:
      return { text: 'Nevoeiro Humido', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { text: 'Chuvisco Leve', icon: '🌦️' };
    case 61:
    case 63:
      return { text: 'Chuva Moderada', icon: '🌧️' };
    case 65:
      return { text: 'Chuva Forte', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { text: 'Queda de Neve', icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { text: 'Aguaceiros Forte', icon: '🌦️' };
    case 95:
    case 96:
    case 99:
      return { text: 'Trovoada com Tempestade', icon: '🌩️' };
    default:
      return { text: 'Tempo Variável', icon: '🌤️' };
  }
}

export async function getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
  try {
    // 1. Fetch Weather Data from Open-Meteo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m`
    );
    const weatherJson = await weatherRes.json();
    const current = weatherJson.current || {};

    // 2. Reverse Geocode City & Country Name
    let cityName = 'Minha Localização';
    let regionName = '';
    let countryName = 'Portugal';

    try {
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
      );
      const geoJson = await geoRes.json();
      cityName = geoJson.city || geoJson.locality || geoJson.principalSubdivision || 'Localização Atual';
      regionName = geoJson.principalSubdivision || '';
      countryName = geoJson.countryName || 'Portugal';
    } catch (e) {
      console.warn('Geocoding fallback:', e);
    }

    const weatherCode = current.weather_code ?? 0;
    const cond = getWeatherConditionText(weatherCode);

    return {
      city: cityName,
      region: regionName,
      country: countryName,
      temp: Math.round(current.temperature_2m ?? 22),
      feels_like: Math.round(current.apparent_temperature ?? 22),
      condition: cond.text,
      weather_code: weatherCode,
      icon: cond.icon,
      humidity: Math.round(current.relative_humidity_2m ?? 60),
      wind_speed: Math.round(current.wind_speed_10m ?? 12),
      is_day: current.is_day !== 0,
      latitude: lat,
      longitude: lon
    };
  } catch (error) {
    console.error('Error fetching weather by coords:', error);
    // Fallback Portugal mock weather
    return {
      city: 'Lisboa',
      region: 'Distrito de Lisboa',
      country: 'Portugal',
      temp: 23,
      feels_like: 24,
      condition: 'Ensolarado com Brisa',
      weather_code: 0,
      icon: '☀️',
      humidity: 55,
      wind_speed: 14,
      is_day: true,
      latitude: lat,
      longitude: lon
    };
  }
}

export async function getWeatherByCityName(cityName: string): Promise<WeatherData> {
  try {
    // 1. Search Geocoding for City
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt`
    );
    const geoJson = await geoRes.json();

    if (geoJson.results && geoJson.results.length > 0) {
      const place = geoJson.results[0];
      const lat = place.latitude;
      const lon = place.longitude;

      const data = await getWeatherByCoordinates(lat, lon);
      return {
        ...data,
        city: place.name || cityName,
        region: place.admin1 || data.region,
        country: place.country || data.country
      };
    }
  } catch (e) {
    console.error('Error fetching city weather:', e);
  }

  // Fallback default city
  return {
    city: cityName || 'Lisboa',
    region: 'Portugal',
    country: 'Portugal',
    temp: 22,
    feels_like: 23,
    condition: 'Sol e Poucas Nuvens',
    weather_code: 1,
    icon: '🌤️',
    humidity: 58,
    wind_speed: 12,
    is_day: true
  };
}
