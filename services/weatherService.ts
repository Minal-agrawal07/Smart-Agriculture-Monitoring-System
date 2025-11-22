import { WeatherData } from '../types';
import { WEATHER_CODES } from '../constants';

export const getCurrentWeather = async (): Promise<WeatherData | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&wind_speed_unit=ms`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.current) {
            const code = data.current.weather_code as number;
            resolve({
              temperature: data.current.temperature_2m,
              conditionCode: code,
              description: WEATHER_CODES[code] || "Unknown"
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error("Weather fetch failed", e);
          resolve(null);
        }
      },
      (error) => {
        console.warn("Geolocation denied or failed", error);
        resolve(null);
      }
    );
  });
};