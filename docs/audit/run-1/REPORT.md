# Audit de sécurité — weatherforecast (run-1)

## 1. Cadre
- **Profil** : `quick` (passe partielle : 1 vague de chasse + 1 critique final, pas de 2e vague). Budget 12 agents, **7 utilisés** (4 reconnaissance, 2 chasseurs, 1 critique ; 0 vérificateur car 0 candidat).
- **Source** : commit `3b3f9af` (branche `claude/affectionate-ritchie-f5g02p`, arbre propre). Périmètre : `src/`, `index.html`, `vite.config.ts`, `.github/workflows/deploy.yml`, `data/stations.json`, `package*.json`.
- **Exécution** : source + local uniquement, dans un bac à sable (namespaces user/mount/net sans réseau externe, `/` et cible en lecture seule, écriture limitée au scratch, env vide, prlimit + timeout). Aucun appel aux API, aucun push, aucune installation.
- **Runs antérieurs** : aucun.
- **Non couvert (deferred)** : serveur de dev / preview Vite (voir §6).

## 2. Posture
Aucune vulnérabilité confirmée ni piste à valider. Les frontières de moindre confiance (fichier importé, réponses Open-Meteo, localStorage, iframe Snow-Forecast, fragment d'URL, workflow CI) aboutissent toutes à des sinks sûrs : texte React échappé, URL à préfixe fixe et composants restreints par regex/allowlist, iframe sans scripts.

## 3. Findings confirmés
Aucun.

## 4. NEEDS VALIDATION
Aucun.

## 5. Durcissement (pas des vulnérabilités ; aucun franchissement de frontière démontré)
| # | Fichier | Constat | Correctif minimal |
|---|---|---|---|
| H1 | `src/App.tsx:14` | `decodeURIComponent` sans try/catch : `#/lieu/%E0` lève `URIError` au rendu initial → page blanche (vérifié localement) | `try { … } catch { return null }` + error boundary React |
| H2 | `src/App.tsx:104`, `src/lib/geocoding.ts:18-32` | L'ajout par recherche n'applique ni `validerLieu` ni `MAX_LIEUX` ; au 51e lieu, le rechargement fait lever `validerListe` → retour à la liste initiale qui **écrase** la liste sauvegardée (perte de données utilisateur) | Passer `versLieu` par `validerLieu` ; bloquer l'ajout à 50 ; dans `charger`, tronquer au lieu de rejeter |
| H3 | `src/lib/forecast.ts:100-109` | Cache localStorage casté sans validation (`RangeError` possible dans `heureLocale` si `decalageS` aberrant) | Valider la forme (nombres finis, `|decalageS| ≤ 50 400`, modèles ∈ `MODELES`) |
| H4 | `src/App.tsx:18-39`, `src/lib/lieux.ts:49` | `etats` est un objet simple ; un id `__proto__` (admis par la regex) n'a jamais de prévision. Pas de pollution de prototype (vérifié localement) | `Map` ou regex `^gn-\d+$` |
| H5 | `vite.config.ts:7-25` | App encadrable (`frame-ancestors` impossible en `<meta>`, GitHub Pages n'envoie pas d'en-tête). Pas d'action sensible → risque faible | Accepté, ou hébergeur permettant les en-têtes |
| H6 | `.github/workflows/deploy.yml:6-9` | `pages: write` + `id-token: write` au niveau workflow : le job build (qui exécute `npm ci` et les scripts d'installation tiers) les reçoit aussi | Permissions par job : build `contents: read`, deploy `pages: write` + `id-token: write` |
| H7 | `.github/workflows/deploy.yml` | Actions épinglées par tag majeur (`@v4`, `@v3`), Node `22` flottant | Épingler par SHA de commit (+ Dependabot) |
| H8 | Réglages GitHub (hors source) | Protection de `main` et de l'environnement `github-pages` non visibles | Activer : revue requise, pas de force-push, environnement limité à `main` |

**Points positifs** : validation champ par champ reconstruisant l'objet (`lieux.ts:46-65`) ; allowlist de slugs pour l'iframe (`stations.ts:19-22`) ; iframe `sandbox` sans `allow-scripts`/`allow-same-origin` ; CSP `script-src 'self'`, `connect-src` 2 hôtes, `object-src 'none'` injectée juste après `<meta charset>` (vérifié par build local) ; `rel="noopener noreferrer"` ; seul `dangerouslySetInnerHTML` alimenté par des SVG statiques ; lockfile v3 : 205 paquets tous sur `registry.npmjs.org` avec intégrité sha512 ; aucun déclencheur `pull_request` dans le workflow ; aucun secret.

## 6. Couverture
- 9 unités : **8 couvertes**, 0 candidat, 0 bloquée, **1 deferred**.
- Compagnons exclus : WEB-PROTOCOL-AND-AUTH, CLOUD-AND-DEPLOYMENT, DATA-ISOLATION, RESOURCE-EXHAUSTION (justifications dans le registre).
- **Critique final** : `stop: false`, 1 unité manquante acceptée → `deferred` (règle du profil quick) : **serveur de dev Vite**. `vite 5.4.11` et `esbuild 0.21.5` (lockfile) précèdent des correctifs publiés concernant le serveur de dev (vérification d'origine CORS/WebSocket corrigée en vite 5.4.12 ; contournements `server.fs.deny` corrigés dans des 5.4.x ultérieurs ; CORS permissif du serveur esbuild ≤ 0.24.2). Impact limité au poste du développeur pendant `npm run dev` (aucun secret dans le repo), **sans effet sur le site publié**. Non vérifié dans ce run. Action recommandée : passer `vite` à la dernière 5.4.x (ou 6.x) et relancer un audit ciblé.
- Ce run quick n'épuise pas la cible.
