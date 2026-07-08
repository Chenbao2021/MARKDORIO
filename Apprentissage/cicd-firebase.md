# Comprendre ton pipeline CI/CD Firebase

*Notes techniques — Markdorio · juillet 2026*
Repo `Chenbao2021/markdorio` · Projet Firebase `markdorio-a2a05` · Trigger `push → main`

---

## 1. Le pipeline en un coup d'œil

**build ≠ deploy — deux étapes, deux besoins différents**

Chaque `git push` sur `main` déclenche deux opérations bien distinctes, qui ne lisent pas les mêmes secrets :

| Étape | Ce qu'elle fait | Secrets nécessaires |
|---|---|---|
| **1. `npm run build`** | Compile le code React/TS → `dist/`. Vite injecte les `VITE_FIREBASE_*` **en dur** dans le JS final. | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc. |
| **2. `firebase deploy`** | Upload `dist/` déjà compilé vers Firebase Hosting + pousse `firestore.rules`. Ne lit jamais le code source. | `GCP_SA_KEY` uniquement |

> **Pourquoi ça compte** — Vite fait un remplacement statique : `import.meta.env.VITE_FIREBASE_API_KEY` est remplacé par sa valeur au moment du build, puis figé dans le bundle. Une variable absente au build devient `undefined` pour toujours — impossible à corriger après coup côté deploy, puisque le site est statique (pas de serveur qui lirait un `.env` au runtime).

---

## 2. Secrets vs Variables (GitHub Actions)

*Settings → Secrets and variables → Actions*

| Secrets | Variables |
|---|---|
| Chiffrés, masqués dans les logs (`***`) | Stockées en clair, visibles dans l'UI |
| Illisibles après création (write-only) | Relisibles à tout moment |
| Référencées `secrets.NOM` | Référencées `vars.NOM` |
| Fait pour : clés API, tokens, credentials | Fait pour : config non sensible (URL, project id, flags) |

Dans ton repo : `GCP_SA_KEY` doit être un **Secret** (accès admin réel). Les `VITE_FIREBASE_*` pourraient techniquement être des **Variables** (voir §4).

---

## 3. Repository secrets vs Environment secrets

Le workflow de Markdorio n'utilise pas d'Environment → donc **Repository secrets**.

- **Repository secrets** — disponibles pour tous les workflows du repo, accessibles directement via `secrets.NOM`, aucune config supplémentaire.
- **Environment secrets** — rattachés à un environnement nommé (`production`, `staging`…) créé dans *Settings → Environments*. Le job doit déclarer `environment: production` pour y accéder. Permet d'ajouter des règles de protection : approbation manuelle avant déploiement, restriction de branche, délai d'attente.

**Repository secrets** convient à ton cas — un seul environnement (prod), pas besoin d'approbation humaine bloquante pour un projet solo.

---

## 4. Ce qui est vraiment public vs secret

Tout ce qui commence par `VITE_` finit dans le navigateur, en clair.

| Valeur | Statut | Pourquoi |
|---|---|---|
| `VITE_FIREBASE_API_KEY` et les 5 autres | 🟢 Public | Simple identifiant "à quel projet Firebase je parle" — visible par quiconque ouvre les DevTools du site déployé. Google le documente comme public par design. |
| `GCP_SA_KEY` | 🟠 Secret | Clé d'un compte de service GCP — droits admin réels sur le projet. Ne doit jamais être préfixée `VITE_` ni passer par `npm run build`. |
| Code source, `firestore.rules`, workflow YAML | 🟢 Public | Le repo est public — tout ça est déjà visible par n'importe qui. Sans danger, rien de sensible n'y est écrit. |

Règle générale, valable au-delà de Vite : tout préfixe "expose au client" (`VITE_`, `NEXT_PUBLIC_`, `REACT_APP_`…) doit être traité comme public dès le départ — jamais comme un secret.

---

## 5. La vraie barrière de sécurité : Firestore Rules

L'`apiKey` n'a jamais protégé tes données — les règles, si.

```
match /users/{userId}/notes/{noteId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
match /{document=**} {
  allow read, write: if false;
}
```

Même en connaissant ton `apiKey` public, un attaquant ne peut lire ou écrire une note que s'il est authentifié **et** que c'est son propre `uid` — vérifié côté serveur Firestore à chaque requête, indépendamment de ce que prétend le client. Le `match /{document=**} allow: if false` final ferme tout le reste par défaut.

---

## 6. Rôles IAM ajoutés au compte de service

Chaque `403` rencontré correspondait à une permission manquante et précise :

- **Service Usage Consumer** — débloque la vérification "l'API firestore.googleapis.com est-elle activée ?" faite par firebase-tools avant tout déploiement.
- **Firebase Rules Admin** — autorise le test de compilation de `firestore.rules` (`firebaserules.googleapis.com :test`) avant publication.

> **À retenir** — Le compte de service généré depuis Firebase Console n'a **pas** tous les droits par défaut. Chaque opération de `firebase deploy` (Firestore, Hosting, Rules…) appelle une API Google différente, qui exige son propre rôle IAM. D'où l'approche "un 403 → un rôle ajouté" plutôt qu'une seule config magique.

---

## 7. Repo public ≠ accès en écriture ouvert

`Chenbao2021/markdorio` est public — ce que ça permet, et ce que ça ne permet pas :

| N'importe qui peut | Seul un collaborateur Write peut |
|---|---|
| Lire le code | Pousser une branche sur le repo |
| Forker le repo | Merger une Pull Request |
| Ouvrir une PR depuis son fork | Déclencher le workflow de déploiement |

Vérifiable dans `Settings → Collaborators and teams` — tant que seul ton compte y figure, personne d'autre ne peut merger quoi que ce soit, même s'il propose une PR depuis son propre fork.

---

## 8. Branch protection & Pull Requests

Le garde-fou contre un push direct qui casse la prod.

### Config recommandée (solo, sans collaborateur)

- `Settings → Branches → Add rule` sur `main`
- ✓ *Require a pull request before merging*, seuil d'approbations à **0**
- ✗ *Do not allow bypassing* laissé décoché — tu gardes ta capacité d'admin à passer outre en urgence

> **Piège** — mettre le seuil à 1 alors que tu es seul te bloque toi-même : GitHub interdit l'auto-approbation de sa propre PR.

### Le flux de travail que ça impose

1. **Créer une branche**
   ```bash
   git checkout -b nom-du-changement
   ```
2. **Committer et pousser la branche**
   ```bash
   git push origin nom-du-changement
   ```
3. **Ouvrir la Pull Request** — sur GitHub, `nom-du-changement` → `main`, relire le diff proposé.
4. **Merger** — bouton *Merge pull request* ; c'est ce commit-là, sur `main`, qui déclenche `firebase-deploy.yml`.

Un `git push origin main` direct sera désormais refusé (`protected branch update failed`).

### Trois façons de merger

| Méthode | Effet |
|---|---|
| `Create a merge commit` | Garde tout l'historique des commits de la branche |
| `Squash and merge` | Regroupe la branche en un seul commit propre — recommandé en solo |
| `Rebase and merge` | Rejoue les commits un par un, sans commit de merge |

---

*Notes compilées à partir de la mise en place du pipeline CI/CD de Markdorio — juillet 2026.*
