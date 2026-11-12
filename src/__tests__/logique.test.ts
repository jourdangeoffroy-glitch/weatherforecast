import { describe, expect, it } from 'vitest';
import { demiJournees, forecastUrl, grouperParJour, heureLocale, parseHourly } from '../lib/forecast';
import { choisirCodePostal, meteoFranceUrl, slugifier } from '../lib/meteofrance';
import { categorieAuto, LISTE_INITIALE, validerLieu, validerListe } from '../lib/lieux';
import { snowForecastFeedUrl } from '../lib/stations';
import { codeDominant } from '../lib/weathercode';

const heures = (n: number, start = '2026-11-12') =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${start}T00:00:00Z`); d.setUTCHours(i);
    return d.toISOString().slice(0, 16);
  });

describe('parseHourly : choix du modèle par heure', () => {
  it('AROME HD tant qu’il fournit la température, puis ARPEGE Europe', () => {
    const time = heures(4);
    const raw = { hourly: {
      time,
      temperature_2m_arome_france_hd: [1, 2, null, null],
      temperature_2m_arpege_europe: [9, 9, 3, 4],
      temperature_2m_arpege_world: [8, 8, 8, 8],
      precipitation_arome_france_hd: [0.5, null, null, null],
      precipitation_arpege_europe: [9, 0.2, 0.1, 0],
      weather_code_arome_france_hd: [61, 3, null, null],
      weather_code_arpege_europe: [0, 0, 2, 1],
    } };
    const h = parseHourly(raw);
    expect(h.map((x) => x.modele)).toEqual(['arome_france_hd', 'arome_france_hd', 'arpege_europe', 'arpege_europe']);
    expect(h.map((x) => x.temp)).toEqual([1, 2, 3, 4]);
    expect(h[1].pluie).toBe(0.2); // variable absente d'AROME : repli sur ARPEGE
    expect(h[0].vent).toBeNull();
  });
  it('hors Europe : ARPEGE Monde', () => {
    const h = parseHourly({ hourly: { time: heures(1), temperature_2m_arome_france_hd: [null], temperature_2m_arpege_europe: [null], temperature_2m_arpege_world: [-12] } });
    expect(h[0].modele).toBe('arpege_world');
  });
  it('rejette une réponse sans heures', () => {
    expect(() => parseHourly({})).toThrow();
  });
});

describe('agrégation', () => {
  const time = heures(48);
  const h = parseHourly({ hourly: {
    time,
    temperature_2m_arome_france_hd: time.map((_, i) => i),
    precipitation_arome_france_hd: time.map(() => 0.1),
    wind_speed_10m_arome_france_hd: time.map((_, i) => i % 24),
  } });
  const jours = grouperParJour(h);
  it('groupe par date locale, min/max/cumul', () => {
    expect(jours).toHaveLength(2);
    expect(jours[0]).toMatchObject({ date: '2026-11-12', tmin: 0, tmax: 23, pluie: 2.4, ventMax: 23, modeles: ['arome_france_hd'] });
  });
  it('demi-journées 6–12 h et 12–18 h', () => {
    const [m, a] = demiJournees(jours[1]);
    expect(m.resume).toMatchObject({ tmin: 30, tmax: 35 });
    expect(a.resume).toMatchObject({ tmin: 36, tmax: 41 });
  });
  it('heure locale du lieu', () => {
    expect(heureLocale(3600, Date.UTC(2026, 10, 12, 23, 30))).toBe('2026-11-13T00');
  });
});

describe('codeDominant', () => {
  it('une averse isolée ne l’emporte pas sur une journée nuageuse', () => {
    expect(codeDominant([3, 3, 3, 3, 3, 63, 2, 2])).toBe(3);
  });
  it('orage sur 2 h retenu', () => {
    expect(codeDominant([0, 0, 0, 0, 95, 95, 0, 0])).toBe(95);
  });
});

describe('URL', () => {
  it('Open-Meteo : 3 modèles explicites, 4 jours', () => {
    const u = new URL(forecastUrl({ lat: 45.7, lon: 4.8, altitude: 173 }));
    expect(u.pathname).toBe('/v1/meteofrance');
    expect(u.searchParams.get('models')).toBe('arome_france_hd,arpege_europe,arpege_world');
    expect(u.searchParams.get('forecast_days')).toBe('4');
  });
  it('Météo-France : formats vérifiés', () => {
    const lyon = LISTE_INITIALE.find((l) => l.nom === 'Lyon')!;
    const rova = LISTE_INITIALE.find((l) => l.nom === 'Rovaniemi')!;
    const arc = LISTE_INITIALE.find((l) => l.nom === 'Arc 1800')!;
    expect(meteoFranceUrl(lyon)).toBe('https://meteofrance.com/previsions-meteo-france/lyon/69000');
    expect(meteoFranceUrl(rova)).toBe('https://meteofrance.com/meteo-monde/rovaniemi/638936');
    expect(meteoFranceUrl(LISTE_INITIALE.find((l) => l.nom === 'Winnipeg')!)).toBeNull();
    expect(meteoFranceUrl(arc)).toBe('https://meteofrance.com/previsions-meteo-france/bourg-saint-maurice/73700');
  });
  it('slug et code postal', () => {
    expect(slugifier('Le Grand-Bornand')).toBe('le-grand-bornand');
    expect(slugifier('Besançon')).toBe('besancon');
    expect(choisirCodePostal(['69061 CEDEX 06', '69001', '69000'])).toBe('69000');
    expect(choisirCodePostal(['74450'])).toBe('74450');
  });
  it('Snow-Forecast : seulement les slugs de la liste', () => {
    expect(snowForecastFeedUrl('Les-Arcs')).toBe('https://www.snow-forecast.com/resorts/Les-Arcs/forecasts/feed/mid/m');
    expect(snowForecastFeedUrl('../../evil')).toBeNull();
  });
});

describe('lieux', () => {
  it('seuil 1 200 m', () => {
    expect(categorieAuto(1200)).toBe('ville');
    expect(categorieAuto(1201)).toBe('montagne');
  });
  it('liste initiale : 7 lieux, Grand-Bornand forcé Montagne, Rovaniemi Ville', () => {
    expect(LISTE_INITIALE).toHaveLength(7);
    expect(LISTE_INITIALE.find((l) => l.nom === 'Le Grand-Bornand')?.categorie).toBe('montagne');
    expect(LISTE_INITIALE.find((l) => l.nom === 'Rovaniemi')?.categorie).toBe('ville');
  });
  it('import : aller-retour et filtrage des entrées invalides', () => {
    const ok = validerListe({ lieux: LISTE_INITIALE });
    expect(ok).toEqual(LISTE_INITIALE);
    const sale = validerListe([
      { ...LISTE_INITIALE[0], snowForecastResort: 'javascript:alert(1)', meteoFranceSlug: '../x' },
      { id: '<img>', nom: 'x' },
    ]);
    expect(sale).toHaveLength(1);
    expect(sale[0].snowForecastResort).toBeUndefined();
    expect(sale[0].meteoFranceSlug).toBeUndefined();
    expect(() => validerListe({ foo: 1 })).toThrow();
    expect(() => validerListe(Array(51).fill(LISTE_INITIALE[0]))).toThrow();
  });
  it('chargement : > 50 lieux tronqués, pas de rejet (H2)', () => {
    const big = Array.from({ length: 60 }, (_, i) => ({ ...LISTE_INITIALE[0], id: `gn-${i + 1}`, geonamesId: i + 1 }));
    expect(validerListe(big, { tronquer: true })).toHaveLength(50);
  });
  it('géocodage malformé rejeté par validerLieu (H2)', () => {
    expect(validerLieu({ ...LISTE_INITIALE[0], lon: '6' })).toBeNull();
    expect(validerLieu({ ...LISTE_INITIALE[0], nom: 42 })).toBeNull();
  });
});
