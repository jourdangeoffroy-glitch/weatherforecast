# Névé · intégration web (responsive)

## Fichiers
- `tokens.css` : variables, base, en-tête web, conteneur responsive, scrollbars, icônes. À importer en premier (ex. `import './neve/tokens.css'` dans `main.tsx`).
- `fonts/` : `HankenGrotesk-Variable.woff2`, `JetBrainsMono-Variable.woff2` (variables, sous-ensemble latin : couvre le français, °, €, −), issus de `@fontsource-variable/*` 5.3.0. Licence SIL OFL 1.1 (`OFL-*.txt`). Servies en local (pas de Google Fonts, compatible CSP stricte).

## Page HTML
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#EEF3F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1A26" media="(prefers-color-scheme: dark)">
```
`viewport-fit=cover` est requis pour que les zones sûres (`env(safe-area-inset-*)`) fonctionnent sur iPhone.

## Mise en page
- `.app-header` : en-tête collant, 56 px min (remplace la barre de titre Electron de 44 px).
- `.container` : largeur max 1 200 px, marges 16 px (< 600 px), 24 px (600–1023 px), 32 px (≥ 1 024 px).
- Points de rupture : **600 px** (tablette), **1 024 px** (desktop). Mobile d'abord : styles de base = mobile, `min-width` pour élargir.
- Grille de cartes conseillée : 1 colonne < 600 px, 2 colonnes 600–1023 px, 3–4 colonnes ≥ 1 024 px.
- Cibles tactiles ≥ 44 px (`--touch-min`).
- Typo réduite sous 600 px : display 48 px, h1 26 px, h2 20 px.

## Icônes
Utiliser les SVG plutôt que la police d'icônes : `npm i @material-symbols/svg-400`, puis importer `rounded/<nom>.svg`. Ne jamais utiliser d'emoji pour la météo.
Correspondances météo : sunny, partly_cloudy_day, cloud, rainy, weather_snowy, ac_unit, thunderstorm, foggy, air, water_drop.

## Thème sombre
- Les valeurs sombres sont dans `tokens.css`. Par défaut, l'app suit le réglage du navigateur / de l'OS (`prefers-color-scheme`). `<html data-theme="dark">` ou `data-theme="light"` force un thème (choix utilisateur à mémoriser en `localStorage`).
- Texte sur bouton plein : toujours `--on-primary` ou `--on-accent`, jamais `#fff` en dur (en sombre, les boutons sont clairs et le texte foncé).
- Grands blocs colorés (carte « ville sélectionnée », élément de navigation actif) : gardent le fond Crépuscule 700 et le texte blanc dans les deux thèmes.

## Règles
- Couleur principale : `--primary` (Crépuscule 700 en clair, Crépuscule 400 en sombre). Le rouge `--accent` est réservé aux alertes et aux actions destructrices.
- Les chiffres (températures, vent, altitudes) s'affichent en `.mono`.
- Rayons : 14 px pour les contrôles et champs, 20 px pour les cartes, pill pour les boutons.

## Historique
- v0.3 : passage Electron → web responsive (en-tête web, zones sûres, points de rupture, cibles tactiles, typo mobile, sélection de texte réactivée).
