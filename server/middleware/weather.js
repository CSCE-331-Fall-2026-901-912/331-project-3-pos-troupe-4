const path = require('path');
const { readFile, writeFile } = require('node:fs/promises');

const CACHE_FILE = path.join(__dirname, './weather-cache.json');
const STORE_TZ = 'America/Chicago';
const RETRY_AFTER_FAILURE_MS = 30 * 60 * 1000;

let cache = null;
let loadedFromDisk = false;
let inFlight = null;
let lastFailureAt = 0;

function todayInStoreTz() {
    return new Date().toLocaleDateString('en-CA', { timeZone: STORE_TZ });
}

function describeWeatherCode(code) {
    if (code === 0) return 'Clear skies';
    if (code <= 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45 || code === 48) return 'Foggy';
    if (code >= 51 && code <= 57) return 'Drizzle';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code === 85 || code === 86) return 'Snow showers';
    if (code >= 95) return 'Thunderstorms';
    return 'Mixed conditions';
}

async function fetchFromProvider() {
    const params = new URLSearchParams({
        latitude: '30.628',
        longitude: '-96.3344',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        temperature_unit: 'fahrenheit',
        timezone: STORE_TZ,
        forecast_days: '1',
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);

    const { daily } = await res.json();
    return {
        high: daily.temperature_2m_max[0],
        low: daily.temperature_2m_min[0],
        rainChance: daily.precipitation_probability_max[0],
        condition: describeWeatherCode(daily.weather_code[0]),
    };
}

async function loadCacheFromDisk() {
    if (loadedFromDisk) return;
    loadedFromDisk = true;
    try {
        cache = JSON.parse(await readFile(CACHE_FILE, 'utf8'));
    } catch {
        cache = null;
    }
}

async function getDailyWeather() {
    await loadCacheFromDisk();
    const today = todayInStoreTz();

    if (cache?.day === today) return cache.data;

    if (Date.now() - lastFailureAt < RETRY_AFTER_FAILURE_MS) {
        return cache?.data ?? null;
    }

    if (!inFlight) {
        inFlight = fetchFromProvider()
            .then(async (data) => {
                cache = { day: today, data: { ...data, fetchedAt: new Date().toISOString() } };
                await writeFile(CACHE_FILE, JSON.stringify(cache));
                return cache.data;
            })
            .catch((err) => {
                console.error('Weather fetch failed:', err);
                lastFailureAt = Date.now();
                return cache?.data ?? null;
            })
            .finally(() => { inFlight = null; });
    }
    return inFlight;
}

module.exports = { getDailyWeather };