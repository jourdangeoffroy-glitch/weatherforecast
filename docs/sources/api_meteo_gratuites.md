# APIs météo gratuites pour une application multi-villes

Pour retrouver les prévisions météo de différentes villes dans le monde, **Open-Meteo** est le meilleur point de départ : gratuit, sans clé pour un usage non commercial, mondial, et il expose plusieurs modèles météo, dont ceux de Météo-France. **Météo-France** est disponible via son portail officiel, tandis que **Snow-Forecast** propose surtout des widgets et des flux XML/JSON sur demande, pas une API publique librement documentée.

## APIs recommandées

| API | Accès gratuit | Modèle(s) météo derrière | Fiabilité / 10 | Usage conseillé |
|---|---|---|---:|---|
| **Open-Meteo** | Oui, sans clé, jusqu’à 10 000 appels/jour en usage non commercial ; licence CC BY 4.0. | **Multi-modèles** : ECMWF IFS/AIFS, NOAA GFS/HRRR, DWD ICON, Météo-France AROME/ARPEGE, JMA, UK Met Office, etc. Le mode `best_match` choisit automatiquement le modèle le plus adapté à la localisation. | **9/10** | Choix principal pour une app mondiale |
| **Météo-France (portail API)** | Oui pour les données publiques AROME/ARPEGE ; certaines données ou usages peuvent nécessiter une clé ou une redevance selon le produit. | **AROME** : modèle français à aire limitée, très haute résolution ; **ARPEGE** : modèle global français ; **PIAF** pour la prévision immédiate des précipitations. | **9/10 en France**, **7/10 hors France** | Référence pour la France et l’outre-mer |
| **Open-Meteo – endpoint Météo-France** | Oui, via Open-Meteo ; pas de clé, JSON simple. | **AROME** et **ARPEGE** de Météo-France ; AROME couvre la France et zones voisines à 1,5 km, ARPEGE sert au reste du monde. | **8,5/10 en France**, **7/10 hors France** | Intégration Météo-France très simple |
| **OpenWeather One Call 4.0** | 1 000 appels/jour inclus gratuitement, mais nécessite un compte, une clé API et l’activation de l’abonnement One Call. | Modèle/chaîne propriétaire OpenWeather ; l’API ne documente pas publiquement un modèle NWP unique sous-jacent. | **7,5/10** | Alternative pratique, alertes officielles incluses |
| **Tomorrow.io** | Offre gratuite avec clé API, mais avec limites de plan et de granularité ; la prévision horaire gratuite est limitée dans la documentation. | Modèles et sources propriétaires agrégés par Tomorrow.io ; le fournisseur ne publie pas une correspondance simple endpoint-modèle. | **7,5/10** | Données enrichies, mais dépendance commerciale |
| **Snow-Forecast** | Widget HTML gratuit ; flux XML/JSON disponibles **sur demande**, donc pas une API ouverte immédiatement exploitable. | **GFS** de NOAA comme données météo d’entrée ; prévisions actualisées 4 fois par jour pour environ 3 300 stations. | **7/10 pour la neige**, **6,5/10 météo générale** | Stations de ski, neige par altitude |

## Choix recommandé

Pour une application qui doit afficher les prévisions de villes dans le monde, construis d’abord autour d’**Open-Meteo** :

- Il couvre le monde entier et permet de demander jusqu’à 16 jours de prévisions horaires et quotidiennes.
- Son paramètre `best_match` sélectionne automatiquement le modèle à plus haute résolution disponible pour le lieu demandé.
- Tu peux aussi proposer à l’utilisateur un choix de modèle : ECMWF, GFS, ICON, AROME/ARPEGE, etc.
- L’API renvoie du JSON via HTTP GET, sans authentification pour l’usage non commercial, ce qui simplifie fortement le développement.

Exemple d’appel :

```text
https://api.open-meteo.com/v1/forecast
  ?latitude=48.8566&longitude=2.3522
  &hourly=temperature_2m,precipitation,wind_speed_10m
  &daily=temperature_2m_max,temperature_2m_min,precipitation_sum
  &timezone=auto
  &forecast_days=7
```

## Intégrer Météo-France

Tu as deux options complémentaires :

1. **Solution simple** : utilise l’endpoint Open-Meteo `/v1/meteofrance`. Il combine ARPEGE et AROME, fournit 168 heures de prévisions et permet de demander `best_match`, `arome_seamless`, `arome_france`, `arpege_seamless`, etc.
2. **Solution officielle** : utilise le portail API de Météo-France et `meteo.data.gouv.fr` pour accéder directement aux grilles AROME, ARPEGE et PIAF. C’est plus puissant, mais les données sont souvent en GRIB2 et demandent plus de traitement côté serveur.

Pour une première version, privilégie l’option 1 : elle donne l’expertise météo de Météo-France sans avoir à décoder des fichiers GRIB ni gérer une infrastructure de données météo.

## Intégrer Snow-Forecast

**Snow-Forecast est intégrable, mais pas comme une API publique “clé en main”.** Le site propose un widget HTML gratuit pour afficher un résumé quotidien, et des flux XML/JSON pour intégrer les prévisions à 6 jours, mais l’accès au flux doit être demandé à leur équipe.

- Leurs prévisions reposent sur le modèle **GFS** de NOAA.
- Elles sont fournies pour le sommet, la mi-pente et le bas de station, avec une mise à jour toutes les 4 heures.
- Pour une app, tu peux donc afficher leur widget pour les stations de ski, mais ne pas bâtir toute l’architecture sur ce fournisseur tant que l’accès programmatique n’est pas confirmé.

## Architecture conseillée

- **Couche principale** : Open-Meteo `best_match`, pour toutes les villes du monde.
- **Couche France** : Open-Meteo endpoint Météo-France, ou portail officiel Météo-France si tu veux les grilles brutes.
- **Couche ski** : widget Snow-Forecast, ou flux XML/JSON après contact avec l’éditeur.
- **Couche alertes** : OpenWeather One Call 4.0 si tu veux les alertes officielles dans une même intégration ; sinon, utilise les vigilances Météo-France pour la France.

## Sources principales

- Open-Meteo — API gratuite et documentation : https://open-meteo.com/
- Open-Meteo — endpoint Météo-France : https://open-meteo.com/en/docs/meteofrance-api
- Météo-France — données publiques : https://donneespubliques.meteofrance.fr/
- Météo-France — API ciblée modèles : https://confluence-meteofrance.atlassian.net/wiki/spaces/OpenDataMeteoFrance/pages/854032416
- OpenWeather — One Call API 4.0 : https://openweathermap.org/api/one-call-4
- Tomorrow.io — Weather API : https://www.tomorrow.io/weather-api/
- Snow-Forecast — Weather Feeds : https://fr.snow-forecast.com/pages/feed

> **Remarque** : les scores de fiabilité sont une évaluation pratique pour ce cas d’usage — qualité perçue des modèles, résolution, transparence des sources et adéquation à une app mondiale — et non une mesure de performance chiffrée publiée par les fournisseurs.
