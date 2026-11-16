import { useEffect, useState } from 'react';
import { getWeather } from '../../api';

const REFRESH_MS = 60 * 60 * 1000;

export default function WeatherBadge() {
    const [weather,setWeather] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await getWeather();
                if (!cancelled) setWeather(data);
            } catch (err) {
                console.error('Error loading weather:', err);
            }
        }

        load();
        const timer = setInterval(load, REFRESH_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    if (!weather) return null;

    return (
        <div className="kiosk-weather">
            <span className="kiosk-weather-condition">{weather.condition}</span>
            <span className="kiosk-weather-temps">
                H {Math.round(weather.high)}° · L {Math.round(weather.low)}°
            </span>
            {weather.rainChance != null && (
                <span className="kiosk-weather-temps">Rain {weather.rainChance}%</span>
            )}
            <span className="kiosk-weather-credit">Weather data by Open-Meteo.com</span>
        </div>
    );
}