# Prompt — re-audit de sécurité ciblé (run-2)

> À coller tel quel dans une **nouvelle conversation** Claude Code sur le repo `jourdangeoffroy-glitch/weatherforecast`, branche `main`.

---

Lance la skill `security-audit` en **mode audit complet, profil `quick`, run ciblé (scoped)** sur ce dépôt. Budget strict : **10 agents**. Réponses courtes, en français.

## Contexte
- App web statique (React + TypeScript + Vite), mono-utilisateur, sans backend ni secret, publiée sur GitHub Pages par `.github/workflows/deploy.yml`.
- Run précédent : `docs/audit/run-1/` (commit `3b3f9af`, profil quick) → 0 finding confirmé, 0 `needs_validation`, 8 durcissements, 1 unité `deferred` (serveur de dev Vite). Lis `REPORT.md`, `coverage-ledger.json`, `findings.json` et `architecture.md` de ce dossier comme **run antérieur** (règles « prior runs » de la skill).
- Changements depuis `3b3f9af` à couvrir (voir `git diff 3b3f9af..HEAD -- src .github package.json package-lock.json vite.config.ts`) :
  1. H1 — `src/App.tsx` `routeId` : `decodeURIComponent` protégé par try/catch.
  2. H2 — `src/App.tsx` `ajouterLieu` (ajout validé par `validerLieu`, plafond 50) ; `src/lib/lieux.ts` `validerListe(..., { tronquer })` et `charger`.
  3. H6 — `.github/workflows/deploy.yml` : `contents: read` au niveau workflow, `pages: write` + `id-token: write` seulement sur le job `deploy`.
  4. Outillage : vite 8.3.5, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, versions exactes ; lockfile régénéré avec `npm install --before=2026-10-29` ; `vite.config.ts` référence `vitest/config`.

## Périmètre (scope_paths)
`src/App.tsx`, `src/lib/lieux.ts`, `src/lib/geocoding.ts`, `src/components/Ajout.tsx`, `.github/workflows/deploy.yml`, `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`. Tout le reste = `out_of_scope` (couvert en run-1, source inchangée — vérifie-le avec `git diff`).

## Unités attendues au minimum
1. Revalidation des unités run-1 dont la source a changé (`prior_covered_changed_source`) : import JSON / `validerLieu`, géocodage / `versLieu`, hash `routeId`, workflow CI (déclencheurs + permissions), lockfile (entrées de build mutables).
2. L'unité `deferred` du run-1 : **serveur de dev / preview Vite** (`package.json#scripts.dev` × `vite.config.ts#server`) — vérifier hors ligne les versions installées contre les avis connus et l'absence d'élargissement `server.host/cors/fs`.
3. Le build de production : la CSP `<meta>` est toujours injectée avec Vite 8 (rolldown) et l'ordre des balises est correct.

## Contraintes d'exécution
- Aucun appel réseau vers des services tiers ou déployés (Open-Meteo, Snow-Forecast, meteofrance.com, GitHub Pages), aucun `npm install`, aucun push, aucun déclenchement de workflow.
- Exécution de code du dépôt uniquement dans un bac à sable OS : `unshare -r -m -n` (pas de réseau), `/` et le repo remontés en lecture seule, seul le dossier scratch de l'agent inscriptible (`mount --bind` + `remount,rw`), `env -i` avec PATH/HOME/TMPDIR allowlistés, `prlimit` + `timeout`. Vite/vitest écrivent à côté de la config : copier la source dans le scratch (symlink `node_modules` en lecture seule). Si le bac à sable ne peut pas être garanti : source seule, et toute conclusion qui dépend d'une exécution passe en `needs_validation`.
- Sortie dans le scratchpad de la session ; à la fin, copier `REPORT.md`, `findings.json`, `coverage-ledger.json`, `architecture.md`, `run-metadata.json` dans `docs/audit/run-2/` et mettre à jour `docs/CADRAGE.md` + `docs/SPECS.md` (statut, date, historique) conformément à `CLAUDE.md`.

## Livrable attendu dans la réponse finale
- Tableau des findings confirmés (sévérité, fichier:ligne, correctif minimal) ou « aucun ».
- Pistes `needs_validation` avec blocage exact.
- Durcissements restants (dont H3, H4, H5, H7, H8 du run-1 : toujours ouverts ou non).
- Couverture : unités couvertes / deferred / out_of_scope, résultat du critique final.
- Verdict : merge/production OK ou non, avec la raison.
