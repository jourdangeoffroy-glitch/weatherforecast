# Document de cadrage — WeatherForecast

> **Statut** : v0.6 — cadrage finalisé (sous réserve CGU Snow-Forecast) (aucun code produit)
> **Dernière mise à jour** : 2026-11-12
> **Règle** : ce document reflète en continu l'état réel de l'application. Toute modification de l'app ⇒ mise à jour de ce fichier et de `SPECS.md`.

## 1. Objectif
Application **web responsive (mobile → desktop)** d'aperçu rapide des prévisions météo de plusieurs lieux, avec **transparence sur le modèle météo** utilisé pour chaque lieu. Usage **personnel** (1 utilisateur).

## 2. Périmètre fonctionnel (MVP)
| # | Fonction | Statut |
|---|----------|--------|
| F1 | Accueil : météo du jour pour tous les lieux (T° min/max, icône, pluie, vent) | Validé |
| F2 | 2 catégories : **Villes** / **Montagne** — attribution auto (altitude > 1 200 m), modifiable manuellement | Validé |
| F3 | Badge du **modèle** utilisé, par lieu et par jour | Validé |
| F4 | Détail : J0 heure par heure ; J+1… par demi-journée | Validé |
| F5 | Détail : lien vers la page de la ville sur **meteofrance.com** (ex. monde : `meteofrance.com/meteo-monde/toronto/6167865`) | Validé |
| F6 | Détail Montagne : widget Snow-Forecast ; à l'ajout, vérification auto que le lieu est une station Snow-Forecast | Validé — méthode technique à valider |
| F7 | Ajout / suppression de lieux. Liste initiale : Lyon, Winnipeg, Rovaniemi, Lappeenranta, Le Grand-Bornand, Les Deux Alpes | Validé |
| F8 | Export / import JSON des lieux (pas de synchro entre appareils en V1 ; Turso envisagé plus tard) | Validé |

**Hors périmètre** : comptes utilisateurs, alertes, usage commercial.

## 3. Sources de données
**V1 : uniquement les modèles Météo-France**, via Open-Meteo `/v1/meteofrance`, pour tous les lieux.

| Zone | Modèle | Résolution | Horizon |
|------|--------|-----------|---------|
| France et voisins | AROME France HD | 1,5 km | 2 j |
| Europe (ex. Finlande) | ARPEGE Europe | ~11 km | 4 j |
| Reste du monde (ex. Winnipeg) | ARPEGE World | ~25 km | 4 j |
| Montagne (détail) | Snow-Forecast (widget) — GFS | — | 6 j |

⇒ **Horizon de l'app : 4 jours (J0 → J+3) pour tous les lieux.** Le complément ECMWF et les modèles nationaux sont abandonnés en V1.

**Points établis**
- Le fichier de recommandations annonçait 168 h pour `/v1/meteofrance` : **c'est faux** d'après la doc actuelle d'Open-Meteo (4 j max, AROME HD = 2 j).
- `best_match` ne garantit pas de savoir quel modèle a été utilisé ⇒ on interroge un **modèle explicite** par zone pour pouvoir l'afficher (F3).
- Le widget Snow-Forecast existe **par station de ski** ⇒ chaque lieu Montagne doit être associé à une station Snow-Forecast. Le lien vers snow-forecast.com doit rester affiché (condition d'utilisation).
- Open-Meteo : gratuit en non commercial, 10 000 appels/j, CC BY 4.0 ⇒ attribution affichée.

## 4. Contraintes techniques
- **Stack** : application web (Electron abandonné). Proposition : TypeScript + React + Vite, site statique (cf. SPECS §1).
- **Design system** : DS Geoffroy / Névé v0.3 (https://claude.ai/artifact/WNQ359bdKwMqxC5fNM1gb7), adapté au web responsive le 2026-11-12.
- **Repo** : `jourdangeoffroy-glitch/weatherforecast` (**public**)
- **Sécurité** : skill `security-audit` avant chaque merge sur `main` et chaque mise en production.
- **Hébergement** : en ligne, URL publique. Proposé : **GitHub Pages** (gratuit car repo public), déploiement auto via GitHub Actions → `https://jourdangeoffroy-glitch.github.io/weatherforecast/`. Pas de backend (Open-Meteo sans clé).

## 5. Risques
| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Horizon 4 j alors que meteofrance.com affiche 15 j | L'utilisateur voit plus de jours sur le lien | Assumé en V1, mentionné dans l'UI |
| Widget Snow-Forecast = script/HTML tiers | Injection de contenu tiers | Iframe isolée (`sandbox`), CSP restreinte |
| Lieu Montagne sans station Snow-Forecast | Widget absent | Afficher la météo Open-Meteo seule |
| Seuil 1 200 m | Ex. Chamonix (≈ 1 035 m) classé « Ville » | Catégorie modifiable à la main par lieu |
| Chiffres app ≠ meteofrance.com (le site publie une prévision retravaillée, pas le modèle brut) | Écarts de quelques °C possibles | Libellé « Voir sur Météo-France » |
| Vérification Snow-Forecast depuis le navigateur bloquée (CORS, pas d'API publique) | Ajout montagne non vérifiable côté client | Liste de stations générée depuis le sitemap Snow-Forecast (cf. SPECS §4) |
| CGU Snow-Forecast : collecte automatisée non vérifiée (pages `/pages/terms` et `/pages/acceptable_use` non lues) | **Bloquant pour F6-vérif** si interdit | Lire les CGU + `robots.txt` avant d'implémenter ; repli : liste manuelle |
| Le Grand-Bornand (village ≈ 950 m) classé « Ville » par la règle 1 200 m | Mauvaise catégorie | Forcé « Montagne » dans la liste initiale |
| Lieux stockés en `localStorage` | Listes **différentes entre téléphone et ordinateur**, perte si cache vidé | À trancher (cf. SPECS §9) |

## 6. Gouvernance
- Mise à jour obligatoire de `CADRAGE.md` + `SPECS.md` à chaque changement.
- `security-audit` avant chaque merge et chaque mise en production.

## 7. Sources
- Recommandations : `docs/sources/api_meteo_gratuites.md`
- Open-Meteo, modèles Météo-France : https://open-meteo.com/en/docs/meteofrance-api
- Widget Snow-Forecast : https://www.snow-forecast.com/pages/configure_feed1 — https://snow-forecast.com/pages/feed
