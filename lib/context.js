// Optional location context: weather + sunrise/sunset from Open-Meteo (no API key).
// Coordinates are rounded to ~1 km before being sent anywhere.

const WMO = {
  0: 'clear sky', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'fog', 48: 'fog',
  51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle', 61: 'light rain', 63: 'rain', 65: 'heavy rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 80: 'rain showers', 81: 'rain showers', 82: 'heavy showers',
  95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
};

const cache = new Map();

function minutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export async function getContext(lat, lon) {
  lat = Number(lat); lon = Number(lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const rl = lat.toFixed(2); const ro = lon.toFixed(2);
  const key = `${rl},${ro}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return hit.v;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${rl}&longitude=${ro}` +
      '&current=temperature_2m,cloud_cover,weather_code,is_day&daily=sunrise,sunset&timezone=auto&forecast_days=1';
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = await r.json();
    const cur = j.current || {};
    const sunrise = (j.daily?.sunrise?.[0] || '').slice(11, 16) || null;
    const sunset = (j.daily?.sunset?.[0] || '').slice(11, 16) || null;
    const localTime = cur.time || null;
    let sunNote = null;
    if (localTime && sunset && sunrise) {
      const now = minutes(localTime.slice(11, 16));
      const ss = minutes(sunset); const sr = minutes(sunrise);
      if (now >= sr && now < sr + 60) sunNote = 'morning golden hour right now';
      else if (now >= ss - 60 && now <= ss) sunNote = `golden hour right now (${ss - now} min to sunset)`;
      else if (now > ss && now <= ss + 30) sunNote = 'blue hour / just after sunset';
      else if (now > ss + 30 || now < sr) sunNote = 'it is dark outside';
      else if (now < ss - 60) sunNote = `${ss - 60 - now} min until golden hour starts`;
    }
    const v = {
      temperatureC: cur.temperature_2m ?? null,
      cloudCover: cur.cloud_cover ?? null,
      condition: WMO[cur.weather_code] || null,
      isDay: cur.is_day === 1,
      localTime, sunrise, sunset, sunNote,
      timezone: j.timezone || null,
    };
    cache.set(key, { t: Date.now(), v });
    return v;
  } catch {
    return null; // optional feature: fail quietly
  }
}
