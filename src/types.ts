export type Categorie = 'ville' | 'montagne';

export type Lieu = {
  id: string;
  nom: string;
  pays: string; // ISO-3166 alpha-2
  lat: number;
  lon: number;
  altitude: number;
  geonamesId: number; // URL meteofrance.com hors France
  categorie: Categorie; // auto : altitude > 1200 m à l'ajout
  categorieManuelle?: boolean;
  snowForecastResort?: string; // slug snow-forecast.com
  codePostal?: string; // URL meteofrance.com en France
  meteoFranceSlug?: string; // surcharge du slug déduit du nom
};

export type ModelId = 'arome_france_hd' | 'arpege_europe' | 'arpege_world';

export type Heure = {
  time: string; // ISO local "2026-11-12T14:00"
  temp: number | null;
  pluie: number | null; // mm
  vent: number | null; // km/h
  rafales: number | null; // km/h
  code: number | null; // WMO
  modele: ModelId | null;
};

export type Resume = {
  tmin: number | null;
  tmax: number | null;
  pluie: number | null;
  ventMax: number | null;
  code: number | null;
  modeles: ModelId[]; // modèles utilisés, ordre d'apparition
};

export type Jour = Resume & { date: string; heures: Heure[] };

export type Prevision = { jours: Jour[]; recupereLe: number; decalageS: number /* utc_offset_seconds */ };
