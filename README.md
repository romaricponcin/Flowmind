# ⚡ FlowMind — Gestionnaire de tâches adapté TDA
**v1.3.0** · Application web 100 % navigateur, sans serveur, sans installation.

> Conçue pour les profils TDA (Trouble du Déficit de l'Attention) : mode focus, décomposition automatique, gamification, minuterie visuelle.

🌐 **Accès en ligne :** [romaricponcin.github.io/Flowmind](https://romaricponcin.github.io/Flowmind/)

---

## ✨ Fonctionnalités

| Domaine | Ce que fait FlowMind |
|---|---|
| 🧠 TDA | Mode focus, décomposition micro-étapes, minuterie Time Timer |
| 📁 Projets | Multi-projets colorés, statuts, priorités, échéances |
| 📌 Mémos | Post-it par projet, épinglage tableau de bord, conversion en tâche |
| 🔁 Récurrence | Tâches hebdo / mensuel / tous les X jours |
| 📅 Agenda | Import Zimbra via URL iCal ou fichier `.ics` |
| 📊 Rapports | Stats filtrées, export Markdown |
| 💾 Sauvegarde | Export JSON, GitHub Gist, sync fichier local (Nextcloud) |
| 🎮 Gamification | XP, niveaux, streaks, animations de récompense |

---

## 📖 Guide des fonctionnalités avancées

> Les fonctionnalités simples (créer une tâche, changer de thème, gérer des projets) sont intuitives. Ce guide couvre uniquement ce qui nécessite quelques explications.

---

### 📌 Mémos post-it

Chaque projet dispose d'un tableau de mémos (post-it colorés) accessible depuis la carte projet.

#### Créer un mémo

```
  Vue Projets → clic sur l'icône 📝 (coin haut-droit de la carte)
             → ou flèche "▼ X mémos" en bas de la carte
  → Saisir le texte dans la zone de note rapide
  → Choisir une couleur (pastille colorée)
  → Entrée ou bouton "+ Ajouter"
```

#### Épingler un mémo sur le tableau de bord

```
  Sur la carte mémo → clic sur 📍  →  le mémo apparaît sur le Dashboard
  Pour désépingler  → clic sur 📌
```

Les mémos épinglés s'affichent dans la section **"📌 Mémos épinglés"** du tableau de bord, avec le nom du projet source.

#### Convertir un mémo en tâche

```
  Sur la carte mémo → clic sur "⚡→ Tâche"
  → La modal de création de tâche s'ouvre, pré-remplie avec le texte du mémo
  → Valider → le mémo est automatiquement supprimé
```

---

### 🔁 Tâches récurrentes

Lors de la création ou de la modification d'une tâche, activez le toggle **"Tâche récurrente"** pour faire apparaître les options.

```
┌─────────────────────────────────────────┐
│  ☑ Tâche récurrente                     │
│                                         │
│  Du  [19/03/2026]  au  [19/06/2026]    │
│                                         │
│  Fréquence :                            │
│  ○ Hebdomadaire  ○ Mensuel              │
│  ○ Tous les  [7]  jours                 │
└─────────────────────────────────────────┘
```

- **Hebdomadaire** : se régénère chaque lundi
- **Mensuel** : même date chaque mois
- **Tous les X jours** : intervalle libre (ex : tous les 3 jours)
- Une icône ↺ apparaît dans le titre de la tâche pour signaler la récurrence
- À la validation (statut "Terminé"), la tâche se recrée automatiquement pour la prochaine occurrence

---

### 🎯 Mode Focus

Le mode Focus n'affiche qu'une tâche à la fois pour éviter la dispersion.

#### Lancer le mode Focus

1. Vue **Focus** dans la barre latérale
2. Cliquer sur **▶ Démarrer** sur la tâche souhaitée

#### Dans le panneau Focus

```
┌──────────────────────────────────────────────┐
│              🎯 Mode Focus                   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Préparer la réunion du vendredi     │   │
│  │  Projet Pédagogie  ·  ⬤ En cours    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│         ╭─────────────────╮                 │
│         │   ⬤  24:37      │  ← anneau SVG  │
│         │   Time Timer    │                 │
│         ╰─────────────────╯                 │
│                                             │
│  [25 min] [50 min] [15 min] [Perso]         │
│                    ↑ saisir une durée libre  │
│                                             │
│  Sous-tâches :                              │
│  ☐ Définir l'ordre du jour     ← cliquer   │
│  ☑ Prévenir les participants   ← pour      │
│  ☐ Préparer le support         ← activer   │
└──────────────────────────────────────────────┘
```

**Points clés :**
- **Cliquer sur le titre d'une sous-tâche** la met en surbrillance comme tâche active courante
- **Pilule "Perso"** : saisir une durée en minutes puis Entrée pour lancer la minuterie
- **Changer le statut** depuis le panneau Focus fonctionne sans fermer/rouvrir (boutons ↩ Reporté / Terminé directement actifs)
- La minuterie ne se remet **pas** à zéro quand on coche une sous-tâche

---

### 🎨 Code couleur des statuts

Les lignes de tâches sont colorées selon leur statut, visible dans le tableau de bord et les listes :

```
  ┃ À faire       fond neutre, liseré gris
  ┃ En cours      fond bleu,  liseré bleu accent         ←
  ┃ Reporté       fond bleu soutenu, liseré bleu-gris    ←  barres colorées
  ┃ Terminé       fond vert, liseré vert mint            ←
```

- Le bouton de statut **actif** est renforcé (bordure, gras, halo lumineux)
- Le bouton **↩** à gauche des statuts remet la tâche à "À faire"

---

### 💾 Sauvegarde des données

Les données sont stockées dans le `localStorage` du navigateur — elles restent sur le PC où vous travaillez. Pour les sauvegarder ou les transférer, trois options sont disponibles dans **Paramètres → Sauvegarde & Restauration**.

---

#### Option 1 — Export / Import JSON (local)

```
  Exporter ──► télécharge  flowmind-backup-XXXX.json  sur votre PC
  Importer ──► sélectionner ce fichier pour restaurer
```

Simple, sans compte. Utile pour faire une sauvegarde ponctuelle ou migrer vers un autre navigateur.

---

#### Option 2 — GitHub Gist (cloud personnel)

Sauvegarde dans votre compte GitHub, sans serveur, sans abonnement.

**Étape 1 — Créer un token GitHub**

```
  github.com → avatar → Settings
  → Developer settings → Personal access tokens → Tokens (classic)
  → Generate new token
     ☑ gist          ← seule case à cocher
     Durée : No expiration (ou 1 an)
  → Copier le token  ghp_xxxxxxxxxxxxxxxxxxxx
```

**Étape 2 — Configurer FlowMind**

```
  Paramètres → Sauvegarde & Restauration
  → ☁ Synchronisation cloud
  → Coller le token dans le champ
  → Cliquer  ☁ Sauvegarder
  → Message vert "Sauvegarde cloud réussie" ✓
```

**Fonctionnement :**
- La 1ère sauvegarde crée un **Gist privé** nommé `flowmind-data.json` sur votre compte
- Les suivantes mettent à jour le même Gist (pas de doublon)
- Pour charger sur un autre PC : coller le même token → **☁ Charger**
- Vérifiable sur [gist.github.com](https://gist.github.com)

> ⚠ Le token est stocké dans le `localStorage` de votre navigateur — ne l'enregistrez pas dans les paramètres sur un PC partagé.

---

#### Option 3 — Fichier local synchronisé Nextcloud

Si votre dossier est synchronisé par le client Nextcloud (nuage EN ou Nextcloud personnel), cette option écrit un fichier JSON directement dans ce dossier — Nextcloud le synchronise ensuite automatiquement dans le cloud.

> Fonctionne uniquement sur **Chrome** et **Edge** (API File System Access).

**Sauvegarder :**

```
  Paramètres → 📁 Sync fichier local
  → Cliquer  📁 Sauvegarder dans un fichier
  → Sélecteur de fichier s'ouvre
  → Naviguer jusqu'au dossier Nextcloud synchronisé
  → Nommer le fichier  flowmind-data.json  → Enregistrer
  → Le client Nextcloud le synchronise dans le cloud ✓
```

**Charger sur un autre PC :**

```
  1. S'assurer que le client Nextcloud a synchronisé le fichier
  2. Paramètres → 📁 Charger depuis un fichier
  3. Sélectionner  flowmind-data.json  dans le dossier Nextcloud local
  4. Confirmer la restauration
```

---

### 📅 Import Zimbra / iCal

#### Via URL (automatique)

```
  Zimbra → Préférences → Calendriers
  → clic sur un calendrier → Partager → copier l'URL iCal (.ics)

  FlowMind → Agenda → coller l'URL → Importer
```

> Si erreur CORS → utiliser la méthode par fichier.

#### Via fichier .ics

```
  Zimbra → Fichier → Exporter → Format : iCalendar (.ics)

  FlowMind → Agenda → Importer un fichier .ics → sélectionner le fichier
```

---

## 🚀 Déploiement GitHub Pages

```bash
git add .
git commit -m "feat: mise à jour FlowMind"
git push origin master
```

Pages → branche `master` / `/ (root)` → accessible à :
`https://romaricponcin.github.io/Flowmind/`

---

## 📦 Structure des fichiers

```
flowmind/
├── index.html               ← Structure HTML, toutes les vues
├── README.md                ← Ce fichier
├── css/
│   ├── main.css             ← Variables, layout, thèmes de base
│   ├── components.css       ← Boutons, inputs, modals, toggles
│   ├── dashboard.css        ← Tableau de bord et listes de tâches
│   ├── status-badges.css    ← Couleurs et badges par statut
│   ├── focus-overlay.css    ← Panneau Mode Focus
│   ├── memos.css            ← Post-it : styles glassmorphism
│   └── light-theme.css      ← Surcharges thème clair
└── js/
    ├── storage.js           ← localStorage + sync GitHub Gist
    ├── config.js            ← Configuration & thème
    ├── gamification.js      ← XP, niveaux, streaks
    ├── timer.js             ← Minuterie Time Timer (anneau SVG)
    ├── projects.js          ← CRUD projets
    ├── tasks.js             ← CRUD tâches, récurrence, décomposition
    ├── memos.js             ← CRUD mémos post-it, épinglage, conversion
    ├── seed-tne-drane.js    ← Données réelles TNE-DRANE (mémos + tâches)
    ├── ical.js              ← Parser iCal, import Zimbra
    ├── reports.js           ← Rapports, export Markdown
    └── app.js               ← Contrôleur principal, routage, Focus
```

---

## 📝 Changelog

### v1.2.0 — 2026-03-20
- 📌 Module Mémos post-it par projet (création, couleur, rotation organique)
- 🏠 Mémos épinglés visibles sur le tableau de bord
- ⚡ Conversion mémo → tâche en un clic
- 🎓 Données réelles TNE-DRANE pré-chargées au 1er lancement
- 🔄 Bouton "Charger le projet TNE-DRANE" dans les paramètres
- 🐛 Correction affichage badge "En cours" sur le dashboard

### v1.1.0 — 2026-03-19
- Synchronisation cloud GitHub Gist + sync fichier local
- Aide intégrée (README)
- Surlignage coloré par statut, boutons de statut renforcés
- Mode Focus amélioré : panneau agrandi, durée personnalisée
- Tâches récurrentes (hebdo / mensuel / tous les X jours)

---

## 📝 Licence

Projet personnel — libre d'usage et de modification.
