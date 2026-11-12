import data from '../../data/stations.json';

export type Station = {
  nom: string;
  geonamesId: number;
  lat: number;
  lon: number;
  altitude: number;
  departement: string;
  snowForecastSlug: string;
  categorieForcee?: 'montagne';
  codePostal?: string;
  meteoFranceSlug?: string;
};

export const STATIONS: Station[] = data.stations as Station[];
export const SLUGS_VALIDES = new Set(STATIONS.map((s) => s.snowForecastSlug));

export function snowForecastFeedUrl(slug: string): string | null {
  if (!SLUGS_VALIDES.has(slug)) return null;
  return `https://www.snow-forecast.com/resorts/${encodeURIComponent(slug)}/forecasts/feed/mid/m`;
}

export function snowForecastPageUrl(slug: string): string {
  return `https://www.snow-forecast.com/resorts/${encodeURIComponent(slug)}/6day/mid`;
}
