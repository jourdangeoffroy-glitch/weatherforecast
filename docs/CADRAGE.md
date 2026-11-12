# Document de cadrage — WeatherForecast

> **Statut** : v0.1 — brouillon, en cours de cadrage (aucun code produit)
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
| Zone | Source | Statut |
|------|--------|--------|
| France | Météo-France (AROME / ARPEGE) | Validé (brief) — mode d'accès à décider |
| Hors France | Selon fichier `.md` de recommandations | **Bloquant : fichier non reçu** |

**Point d'attention** : les modèles Météo-France ont un horizon court (ordre de grandeur, à vérifier : AROME ≈ 2 j, ARPEGE ≈ 4 j). Le site meteofrance.com affiche jusqu'à ~15 j via une prévision consolidée qui n'est pas un modèle brut exposé tel quel. « Jours suivants autorisés par le modèle » = donc **2 à 4 j** pour la France si on reste sur les modèles bruts.

## 4. Contraintes techniques
- **Stack** : Electron
- **Design system** : DS Geoffroy (https://claude.ai/artifact/WNQ359bdKwMqxC5fNM1gb7)
- **Repo** : `jourdangeoffroy-glitch/weatherforecast`
- **Sécurité** : contrôle régulier via la skill `security-audit` (cadence à fixer, cf. §7)
- **Hébergement** : une app Electron n'est pas « hébergée » comme un site ; elle est **distribuée** (binaires .dmg/.exe/.AppImage, ex. GitHub Releases). Seul un éventuel backend/proxy API serait hébergé.

## 5. Risques identifiés
| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Clé API embarquée dans le binaire Electron = extractible | Fuite de clé, quota épuisé | Source sans clé, ou proxy backend |
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
- Open-Meteo (modèles Météo-France, sans clé) : https://open-meteo.com/en/docs/meteofrance-api
- Sécurité Electron : https://www.electronjs.org/docs/latest/tutorial/security
