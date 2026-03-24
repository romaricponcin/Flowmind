# CLAUDE.md — Règles de workflow collaboratif FlowMind

## Architecture des branches

```
master                  ← Référence stable (production)
├── dev-utilisateur-A   ← Branche individuelle Utilisateur A
└── dev-utilisateur-B   ← Branche individuelle Utilisateur B
```

- **`master`** : branche de production. Aucun commit direct. Seuls les merges validés y arrivent.
- **`dev-utilisateur-A` / `dev-utilisateur-B`** : branches de travail individuelles. Toute nouvelle fonctionnalité se développe ici.

---

## Règles absolues

### Isolation des données
- Ne **jamais** commiter vers `master` : `*-backup-*.json`, `flowmind-backup-*.json`, `flowmind-data*.json`
- Les fichiers de configuration personnelle, mocks et données de test restent sur la branche individuelle
- Tester toute nouvelle fonctionnalité avec des données fictives (`js/dev-seed.js`) avant tout merge

### Fichiers sensibles — NE PAS toucher
| Fichier | Raison |
|---|---|
| `js/seed-tne-drane.js` | Contient des données personnelles réelles |
| `js/demo-tne.js` | Idem |
| `flowmind-backup-*.json` | Exports localStorage — données utilisateur |
| `flowmind-data*.json` | Idem |

---

## Commandes Git du workflow quotidien

### Avant de commencer à coder
```bash
# 1. Vérifier les nouveautés sur master
git fetch origin

# 2. Voir s'il y a des changements à intégrer
git log HEAD..origin/master --oneline

# 3. Intégrer les changements de master dans sa branche individuelle
git merge origin/master
```

### Créer sa branche individuelle (première fois)
```bash
# Utilisateur A
git checkout -b dev-utilisateur-A origin/master
git push -u origin dev-utilisateur-A

# Utilisateur B
git checkout -b dev-utilisateur-B origin/master
git push -u origin dev-utilisateur-B
```

### Travailler au quotidien
```bash
# Vérifier l'état avant tout commit
git status

# Stager uniquement les fichiers de code (jamais de *.json sauf config.json)
git add js/mon-fichier.js css/mon-fichier.css index.html

# Commiter
git commit -m "feat: description du changement"

# Pousser vers sa branche individuelle
git push origin dev-utilisateur-A
```

### Merge vers master (après validation)
```bash
# Se mettre à jour avec master avant de merger
git fetch origin
git merge origin/master

# Résoudre les conflits si nécessaire, puis :
git push origin dev-utilisateur-A

# Créer une Pull Request sur GitHub pour merger dans master
# → Ne jamais merger directement en ligne de commande vers master
```

---

## Confirmation de sécurité avant chaque commit

Avant tout `git commit`, confirmer :

> "Ce changement modifie **[LISTE DES FICHIERS]**.
> Il **n'altère pas** les données réelles (seed-tne-drane.js / fichiers JSON).
> Les fichiers de données utilisateur sont **absents** du staging."

---

## Rôle de Claude dans ce workflow

1. **Avant de coder** : vérifier `git fetch` et signaler tout changement sur `master`
2. **Proposer régulièrement** d'intégrer `master` dans la branche individuelle
3. **Bloquer** tout commit vers `master` qui contiendrait des fichiers de données
4. **Tester** uniquement avec `js/dev-seed.js` (données fictives), jamais `seed-tne-drane.js`
5. **Confirmer** systématiquement avant chaque commit que les données réelles ne sont pas impactées
