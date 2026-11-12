# Document de cadrage — WeatherForecast

> **Statut** : v0.3 — cadrage en cours (aucun code produit)
> **Dernière mise à jour** : 2026-11-12
> **Règle** : ce document reflète en continu l'état réel de l'application. Toute modification de l'app ⇒ mise à jour de ce fichier et de `SPECS.md`.

## 1. Objectif
Application **web** d'aperçu rapide des prévisions météo de plusieurs lieux, avec **transparence sur le modèle météo** utilisé pour chaque lieu. Usage **personnel** (1 utilisateur).

## 2. Périmètre fonctionnel (MVP)
| # | Fonction | Statut |
|---|----------|--------|
| F1 | Accueil : météo du jour pour tous les lieux (T° min/max, icône, pluie, vent) | Validé |
| F2 | 2 catégories : **Villes** / **Montagne** (montagne = altitude > 1 200 m) | Validé |
| F3 | Badge du **modèle** utilisé, par lieu et par jour | Validé |
| F4 | Détail : J0 heure par heure ; J+1… par demi-journée | Validé |
| F5 | Détail : lien vers la page source | Cible du lien hors France à décider |
| F6 | Détail Montagne : widget Snow-Forecast | Validé |
| F7 | Ajout / suppression de lieux (liste initiale fixe) | Validé |

**Hors périmètre** : comptes utilisateurs, alertes, usage commercial.

## 3. Sources de données
Référence : `docs/sources/api_meteo_gratuites.md`.

| Zone | Source | Modèle | Horizon |
|------|--------|--------|---------|
| France | Météo-France via Open-Meteo `/v1/meteofrance` | AROME HD 1,5 km (J0–J+1) puis ARPEGE (≤ J+3) | **4 j max** |
| France, au-delà de J+3 | Open-Meteo | ECMWF IFS (complément) | jusqu'à ~15 j |
| Hors France | Open-Meteo `/v1/forecast` | Modèle le plus fin de la zone (table à établir) | ≤ 16 j |
| Montagne (détail) | Snow-Forecast (widget HTML gratuit) | GFS | 6 j |

**Points établis**
- Le fichier de recommandations annonçait 168 h pour `/v1/meteofrance` : **c'est faux** d'après la doc actuelle d'Open-Meteo (4 j max, AROME HD = 2 j).
- `best_match` ne garantit pas de savoir quel modèle a été utilisé ⇒ on interroge un **modèle explicite** par zone pour pouvoir l'afficher (F3).
- Le widget Snow-Forecast existe **par station de ski** ⇒ chaque lieu Montagne doit être associé à une station Snow-Forecast. Le lien vers snow-forecast.com doit rester affiché (condition d'utilisation).
- Open-Meteo : gratuit en non commercial, 10 000 appels/j, CC BY 4.0 ⇒ attribution affichée.

## 4. Contraintes techniques
- **Stack** : application web (Electron abandonné). Proposition : TypeScript + React + Vite, site statique (cf. SPECS §1).
- **Design system** : DS Geoffroy / Névé (https://claude.ai/artifact/WNQ359bdKwMqxC5fNM1gb7). Pensé pour Electron : partie fenêtre à adapter (cf. SPECS §7).
- **Repo** : `jourdangeoffroy-glitch/weatherforecast`
- **Sécurité** : skill `security-audit` avant chaque merge sur `main` et chaque mise en production.
- **Hébergement** : site statique (GitHub Pages / Cloudflare Pages / Netlify), sans backend car Open-Meteo ne demande pas de clé.

## 5. Risques
| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Horizon Météo-France court (4 j) | Détail France limité | Complément ECMWF + badge par jour |
| Widget Snow-Forecast = script/HTML tiers | Injection de contenu tiers | Iframe isolée (`sandbox`), CSP restreinte |
| Lieu Montagne sans station Snow-Forecast | Widget absent | Afficher la météo Open-Meteo seule |
| Seuil 1 200 m | Ex. Chamonix (≈ 1 035 m) classé « Ville » | Seuil modifiable à la main par lieu (à valider) |
| Lieux stockés en `localStorage` | Perte si cache vidé / autre appareil | Export/import JSON (à valider) |

## 6. Gouvernance
- Mise à jour obligatoire de `CADRAGE.md` + `SPECS.md` à chaque changement.
- `security-audit` avant chaque merge et chaque mise en production.

## 7. Sources
- Recommandations : `docs/sources/api_meteo_gratuites.md`
- Open-Meteo, modèles Météo-France : https://open-meteo.com/en/docs/meteofrance-api
- Widget Snow-Forecast : https://www.snow-forecast.com/pages/configure_feed1 — https://snow-forecast.com/pages/feed
