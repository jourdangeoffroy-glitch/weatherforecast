# Spécifications — WeatherForecast

> **Statut** : v0.1 — squelette, à compléter avec le PO
> **Dernière mise à jour** : 2026-11-12
> **Règle** : reflète en continu l'état réel de l'application (synchronisé avec `CADRAGE.md`).

## 1. Architecture (proposition, non validée)
- Electron : process `main` (appels réseau, cache) + `renderer` (UI DS Geoffroy) via `preload` + `contextBridge`.
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, CSP stricte.
- Couche « provider » par source météo (interface commune : `getToday(lieu)`, `getForecast(lieu)`, `sourceUrl(lieu)`, `modelName`, `maxDays`).

## 2. Modèle de données (proposition)
```ts
type Lieu = {
  id: string; nom: string; pays: string;          // ISO-3166 alpha-2
  categorie: 'ville' | 'montagne';
  lat: number; lon: number; altitude?: number;     // altitude utile pour la montagne
  provider: 'meteofrance' | string;               // déterminé par pays
};
```

## 3. Écran Accueil (F1, F2, F3)
- Deux sections : **Villes**, **Montagne**.
- Carte par lieu : nom, icône météo, T° min/max du jour, **badge modèle** (ex. « Météo-France AROME »).
- À définir : autres indicateurs (vent, précipitations, neige/iso 0 °C pour la montagne ?).

## 4. Écran Détail (F4, F5)
- Jour J détaillé (pas horaire ? 3 h ?).
- Jours suivants jusqu'à `provider.maxDays`.
- Lien « Voir sur la source » → ouverture dans le navigateur système (`shell.openExternal`, URL whitelistée).

## 5. Sources par zone
| Zone | Provider | Modèle | Horizon | Accès |
|------|----------|--------|---------|-------|
| France | Météo-France | AROME / ARPEGE | 2–4 j (à vérifier) | À décider |
| Hors France | — | — | — | **En attente du fichier .md** |

## 6. Non-fonctionnel
- Rafraîchissement / cache : à définir.
- Hors ligne : à définir.
- OS cibles : à définir.

## 7. Sécurité
- Audit `security-audit` : cadence à valider.
- Aucune clé API en clair dans le renderer ni dans le repo.

## 8. Questions ouvertes
Voir conversation en cours — à reporter ici une fois tranchées.

## 9. Historique
| Date | Version | Changement |
|------|---------|-----------|
| 2026-11-12 | 0.1 | Création squelette cadrage + specs |
