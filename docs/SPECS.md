# Spécifications — WeatherForecast

> **Statut** : v0.3 — en cours de rédaction avec le PO
> **Dernière mise à jour** : 2026-11-12
> **Règle** : reflète en continu l'état réel de l'application (synchronisé avec `CADRAGE.md`).

## 1. Architecture (proposition)
- **TypeScript + React + Vite** → build statique, hébergé sans backend.
- Appels Open-Meteo directement depuis le navigateur (sans clé).
- Couche `provider` : `getForecast(lieu)`, `modelForDay(lieu, jour)`, `sourceUrl(lieu)`, `maxDays`.
- Persistance des lieux : `localStorage` (usage mono-utilisateur).
- Ajout de lieu : API de géocodage Open-Meteo (renvoie pays + altitude ⇒ provider et catégorie déduits automatiquement).

## 2. Modèle de données
```ts
type Lieu = {
  id: string; nom: string; pays: string;          // ISO-3166 alpha-2
  lat: number; lon: number; altitude: number;
  categorie: 'ville' | 'montagne';                 // auto : altitude > 1200 m
  snowForecastResort?: string;                     // id station, si montagne
};
```

## 3. Accueil (F1, F2, F3)
- Sections **Villes** / **Montagne**.
- Carte : nom, icône (Material Symbols, jamais d'emoji), T° min/max, cumul pluie (mm), vent (km/h), badge modèle.
- Unités : °C, km/h, mm. Langue : français.

## 4. Détail (F4, F5, F6)
- J0 : pas **horaire**.
- J+1 → horizon : **demi-journée** (matin / après-midi).
- Badge modèle **par jour** (France : AROME → ARPEGE → ECMWF).
- Lien source : France → page ville meteofrance.com ; hors France → **à décider**.
- Montagne : widget Snow-Forecast (station associée) dans une iframe `sandbox`.

## 5. Sources par zone
| Zone | Endpoint | Modèle | Horizon |
|------|----------|--------|---------|
| France J0–J+1 | `/v1/meteofrance` | `arome_france_hd` (1,5 km) | 2 j |
| France J+2–J+3 | `/v1/meteofrance` | `arpege_europe` (0,1°) | 4 j |
| France J+4 et au-delà | `/v1/forecast` | `ecmwf_ifs` | ~15 j |
| Hors France | `/v1/forecast` | modèle le plus fin par zone — **table à établir** | ≤ 16 j |

Attribution : « Données Open-Meteo (CC BY 4.0) — modèle X ». Cache local (ex. 30 min) pour rester sous 10 000 appels/j.

## 6. Non-fonctionnel
- Responsive : à valider (desktop seul ou mobile aussi).
- Rafraîchissement : à définir.

## 7. Design system (Névé)
- Réutilisable tel quel : `tokens.css`, polices, icônes, couleurs, rayons, `.mono` pour les chiffres.
- À adapter : barre de titre Electron (44 px, `titleBarOverlay`, `trafficLightPosition`) → en-tête web ; thème sombre via `prefers-color-scheme` + `data-theme` au lieu de `nativeTheme`.

## 8. Sécurité
- CSP stricte ; seuls domaines autorisés : `api.open-meteo.com`, `geocoding-api.open-meteo.com`, snow-forecast.com (iframe).
- Liens externes : `rel="noopener noreferrer"`.
- `security-audit` avant chaque merge et chaque mise en production.

## 9. Questions ouvertes
1. Cible du lien source hors France.
2. Table « zone → modèle le plus fin ».
3. Responsive mobile ?
4. Hébergeur, et repo public ou privé.
5. Seuil 1 200 m : automatique seulement, ou modifiable par lieu ?
6. Liste initiale des lieux.

## 10. Historique
| Date | Version | Changement |
|------|---------|-----------|
| 2026-11-12 | 0.1 | Création squelette cadrage + specs |
| 2026-11-12 | 0.2 | Intégration des recommandations de sources |
| 2026-11-12 | 0.3 | Passage en app web, découpage des modèles France, Snow-Forecast, F7 |
