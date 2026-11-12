# Document de cadrage — WeatherForecast

> **Statut** : v0.2 — brouillon, en cours de cadrage (aucun code produit)
> **Dernière mise à jour** : 2026-11-12
> **Règle** : ce document reflète en continu l'état réel de l'application. Toute modification de l'app ⇒ mise à jour de ce fichier et de `SPECS.md`.

## 1. Objectif
Application desktop permettant un **aperçu rapide** des prévisions météo de plusieurs lieux, avec **transparence sur le modèle météo source** de chaque lieu.

## 2. Périmètre fonctionnel (MVP)
| # | Fonction | Statut |
|---|----------|--------|
| F1 | Écran d'accueil : météo du jour pour tous les lieux | À spécifier |
| F2 | Lieux classés en 2 catégories : **Villes** / **Montagne** | À spécifier |
| F3 | Affichage, pour chaque lieu, du **modèle/source** utilisé | À spécifier |
| F4 | Clic sur un lieu → page détail (jour + jours suivants, dans la limite du modèle) | À spécifier |
| F5 | Page détail : lien vers la page source de la prévision | À spécifier |

### Hors périmètre (proposé, à valider)
- Comptes utilisateurs, synchronisation cloud
- Alertes / notifications push
- Version mobile ou web

## 3. Sources de données
Référence : `docs/sources/api_meteo_gratuites.md`.

| Zone | Source | Modèle | Horizon | Statut |
|------|--------|--------|---------|--------|
| France | Open-Meteo `/v1/meteofrance` | AROME (1,5 km) / ARPEGE | 168 h annoncé (à vérifier : ARPEGE ≈ 4 j) | Recommandé V1 |
| Hors France | Open-Meteo `/v1/forecast` | `best_match` ou modèle explicite (ECMWF, ICON, GFS…) | jusqu'à 16 j | Recommandé V1 |
| Montagne (option) | Snow-Forecast | GFS | 6 j | **Non retenu V1** : flux sur demande, widget = HTML distant |
| Alertes (option) | Vigilance Météo-France / OpenWeather | — | — | Hors V1 (proposé) |

**Points d'attention**
- `best_match` choisit le modèle automatiquement, mais la réponse **n'indique pas le modèle retenu** (à vérifier). Or F3 exige d'afficher le modèle ⇒ demander un **modèle explicite** par lieu.
- Open-Meteo gratuit = **non commercial**, 10 000 appels/j, licence CC BY 4.0 ⇒ **attribution obligatoire** dans l'UI.
- Le site meteofrance.com (lien source F5) affiche ~15 j via une prévision consolidée : l'utilisateur verra plus de jours sur la source que dans l'app.

## 4. Contraintes techniques
- **Stack** : Electron
- **Design system** : DS Geoffroy (https://claude.ai/artifact/WNQ359bdKwMqxC5fNM1gb7)
- **Repo** : `jourdangeoffroy-glitch/weatherforecast`
- **Sécurité** : contrôle régulier via la skill `security-audit` (cadence à fixer, cf. §7)
- **Hébergement** : une app Electron n'est pas « hébergée » comme un site ; elle est **distribuée** (binaires .dmg/.exe/.AppImage, ex. GitHub Releases). Seul un éventuel backend/proxy API serait hébergé.

## 5. Risques identifiés
| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Clé API embarquée dans le binaire Electron = extractible | Fuite de clé, quota épuisé | Open-Meteo sans clé ⇒ risque écarté en V1 |
| Licence/CGU des sources (usage commercial ?) | Blocage juridique | Valider l'usage (perso vs commercial) |
| Horizon de prévision court côté Météo-France | Détail limité à 2–4 j | Assumer et l'afficher, ou compléter par un autre modèle |
| Surface d'attaque Electron (nodeIntegration, contextIsolation) | RCE | Checklist sécurité Electron + security-audit |

## 6. Questions ouvertes
Voir `SPECS.md` §8.

## 7. Gouvernance
- Mise à jour obligatoire de `CADRAGE.md` + `SPECS.md` à chaque changement.
- `security-audit` : cadence proposée = avant chaque merge sur `main` + avant chaque release (à valider).

## 8. Sources
- Météo-France API : https://portail-api.meteofrance.fr
- Recommandations sources : `docs/sources/api_meteo_gratuites.md`
- Open-Meteo (modèles Météo-France, sans clé) : https://open-meteo.com/en/docs/meteofrance-api
- Sécurité Electron : https://www.electronjs.org/docs/latest/tutorial/security
