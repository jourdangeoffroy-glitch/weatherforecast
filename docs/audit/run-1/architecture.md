# Architecture — weatherforecast (run-1, profil quick)

**Produit.** SPA statique « Météo des lieux » (React 18.3.1 + TS 5.6.3 + Vite 5.4.11), mono-utilisateur, sans backend, sans compte ni secret. Hébergement prévu : GitHub Pages (`https://jourdangeoffroy-glitch.github.io/weatherforecast/`), déploiement par `.github/workflows/deploy.yml` sur push `main`. Ressources protégées : la liste des lieux de l'utilisateur et le cache de prévisions (localStorage de l'origine `jourdangeoffroy-glitch.github.io`, clés `wf.lieux.v1`, `wf.cache.v1.*`), l'intégrité du DOM/JS de l'app, l'intégrité de l'artefact publié sur Pages.

**Principaux de moindre confiance.** (1) fournisseur d'un fichier JSON importé ; (2) réponses tierces Open-Meteo (prévision `/v1/meteofrance`, géocodage) ; (3) contenu iframe snow-forecast.com ; (4) auteur d'un lien `#/lieu/{id}` ; (5) autres origines (framing de l'app) ; (6) autres sites GitHub Pages du même compte (même origine `*.github.io/<user>`) ; (7) contributeurs / dépendances npm / actions GitHub.

**Comparable.** Pas de comparable source-grounded (seule `docs/sources/api_meteo_gratuites.md` compare des API).

**Chemins source → sink importants.**
- Import : `src/App.tsx:50-64` (100 Ko, `JSON.parse`, `confirm`) → `src/lib/lieux.ts:46-78` `validerLieu/validerListe` (regex id, nom ≤ 80, pays, plages lat/lon/alt, slug SF ∈ allowlist, codePostal `^\d{5}$`, slug MF `^[a-z0-9-]+$`, ≤ 50) → état React → rendu texte, `href` Météo-France (`src/lib/meteofrance.ts:19-26`, `Detail.tsx:110`), iframe (`stations.ts:19-22`, `Detail.tsx:91-98`).
- localStorage : `lieux.ts:80-88` (validé) ; cache `forecast.ts:100-109` (**non validé**, cast `Prevision`) → `ModelBadge.tsx:8` (className), `format.ts`, `heureLocale` (`forecast.ts:134`, peut lever RangeError).
- Open-Meteo prévision : `forecast.ts:11-23` (URL), `:125-128` (`reason` → texte d'erreur rendu en texte React), `parseHourly :31-58` (`num()` nombres finis).
- Géocodage : `geocoding.ts:10-32` `versLieu` **ne passe pas par `validerLieu`** (lon non vérifiée, nom non typé) ; rendu texte `Ajout.tsx:66-67` ; ajout sans plafond `MAX_LIEUX` (`App.tsx:104`).
- Hash : `App.tsx:12-15` regex + `decodeURIComponent` (URIError possible) → `lieux.find`.
- Seul `dangerouslySetInnerHTML` : `Icon.tsx:26`, SVG statiques `?raw` de `@material-symbols/svg-400`, choisis par `switch` (`weathercode.ts:14`).
- Build/CSP : `vite.config.ts:7-26` CSP `<meta>` injectée au build seulement (dev sans CSP) ; `frame-ancestors` impossible via meta. `index.html:5-6`.
- CI : `deploy.yml` déclencheurs push `main` + `workflow_dispatch` (pas de `pull_request`) ; permissions workflow-level `contents: read, pages: write, id-token: write` ; actions épinglées par tag (`@v4`, `@v3`) ; `npm ci` sur lockfile ; `npm test` puis build puis upload.

**Frontières et contrôle le plus fort.** Import/localStorage lieux → `validerLieu`. Iframe → `sandbox="allow-popups allow-popups-to-escape-sandbox"` (pas de scripts, pas de same-origin) + allowlist de slugs + CSP `frame-src`. Réseau → CSP `connect-src` 2 hôtes. HTML → React escaping ; aucun HTML tiers. CI → permissions + absence de trigger PR.

**Non visible en source (needs_validation si décisif).** En-têtes HTTP réels de GitHub Pages (XFO/HSTS), réglage Pages (source Actions), protection de `main` et de l'environnement `github-pages`, politique Actions du dépôt.

**Exécution locale.** Bac à sable `../sbx.sh <scratch> "<cmd>"` : namespaces user+mount+net (aucun réseau externe), `/` et cible en lecture seule, seul le scratch de l'agent est inscriptible, `env -i` allowlisté, prlimit + timeout 90 s. Vite/vitest écrivent à côté de la config (`vite.config.ts.timestamp-*.mjs`, `node_modules/.vite`) ⇒ copier la source (sans node_modules, + symlink `node_modules` en lecture seule) dans le scratch avant toute exécution. Chromium Playwright disponible (`require('playwright')`), utilisable en loopback isolé avec routes réseau simulées. Interdit : `npm ci/install`, push, `gh`, appels réels aux API.

**Couverture antérieure.** Aucun run antérieur (`prior_runs: []`).

**Compagnons.** Sélectionnés : `CLIENT-SIDE.md` (SPA, DOM, stockage navigateur, iframe, hash), `SUPPLY-CHAIN-AND-RELEASE.md` (CI, dépendances, publication Pages). Exclus : WEB-PROTOCOL-AND-AUTH (pas de serveur ni d'authentification), CLOUD-AND-DEPLOYMENT (pas d'IaC ; réglages Pages hors source), DATA-ISOLATION (mono-utilisateur, pas de multi-locataire), RESOURCE-EXHAUSTION (aucun service partagé ; quota Open-Meteo par IP = auto-impact), AI-AND-LLM, MEMORY-SAFETY, PROTOCOLS-RPC, DESKTOP-MOBILE (non applicables).
