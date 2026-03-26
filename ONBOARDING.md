# ONBOARDING — Rejoindre le projet FlowMind

Bienvenue sur le projet **FlowMind** ! Ce guide te permet de démarrer en 5 minutes sans toucher aux données de production.

---

## 1. Prérequis

- Git installé sur ta machine
- Un navigateur moderne (Chrome, Firefox, Edge)
- Accès en lecture au dépôt : `https://github.com/romaricponcin/Flowmind`

---

## 2. Cloner le projet

```bash
git clone https://github.com/romaricponcin/Flowmind.git
cd Flowmind
```

---

## 3. Créer ta branche individuelle

Chaque développeur travaille sur sa propre branche. Remplace `prenom` par ton prénom ou identifiant :

```bash
git checkout -b dev-prenom origin/master
git push -u origin dev-prenom
```

**Branches existantes :**
| Développeur | Branche |
|---|---|
| Romaric (propriétaire) | `dev-utilisateur-A` |
| _(prochain)_ | `dev-utilisateur-B` |
| _(suivant)_ | `dev-prenom` |

---

## 4. Lancer l'application

Pas de serveur requis. Deux options :

**Option A — Ouverture directe**
Double-cliquer sur `index.html` dans ton explorateur de fichiers.

**Option B — Serveur local** (recommandé pour éviter les restrictions navigateur)
```bash
# Python 3
python -m http.server 8080
```
Puis ouvrir `http://localhost:8080` dans ton navigateur.

---

## 5. Profil navigateur dédié (fortement recommandé)

Pour ne jamais mélanger tes données de développement avec celles de production :

- **Chrome** : Menu (⋮) → Profils → Ajouter un profil → nommer "FlowMind Dev"
- **Firefox** : taper `about:profiles` → Créer un nouveau profil → "FlowMind Dev"

Le `localStorage` est isolé par profil : zéro risque de collision.

---

## 6. Workflow quotidien

```bash
# Avant de commencer — toujours synchroniser avec master
git fetch origin
git merge origin/master

# Coder, tester...

# Vérifier ce qu'on va commiter
git status
git diff --staged

# Stager uniquement les fichiers de CODE (jamais de *.json)
git add js/mon-fichier.js css/style.css index.html

# Commiter avec un message clair
git commit -m "feat: description de la fonctionnalité"

# Pousser vers sa branche
git push origin dev-prenom
```

---

## 7. Proposer une modification vers master (Pull Request)

Quand une fonctionnalité est prête :

1. S'assurer que sa branche est à jour avec `master` :
   ```bash
   git fetch origin
   git merge origin/master
   git push origin dev-prenom
   ```
2. Aller sur GitHub → **Compare & pull request**
3. Décrire le changement et assigner Romaric en reviewer
4. Attendre la validation avant le merge

**Ne jamais merger directement en ligne de commande vers `master`.**

---

## 8. Ce qu'il ne faut JAMAIS commiter

| Fichier | Raison |
|---|---|
| `flowmind-backup-*.json` | Données personnelles réelles |
| `flowmind-data*.json` | Idem |
| `js/seed-tne-drane.js` | Noms de personnes et d'établissements réels |

Le `.gitignore` bloque automatiquement les JSON de données — vérifier quand même `git status` avant chaque commit.

---

## 9. Règles complètes

Toutes les règles de workflow sont dans **`CLAUDE.md`** à la racine du projet. À lire avant de commencer.

---

## 10. Questions / Problèmes

Ouvrir une **Issue** sur GitHub avec le label approprié, ou contacter Romaric directement.
