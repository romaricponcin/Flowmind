# ⚡ FlowMind — Gestionnaire de tâches adapté TDA
**v1.9.0** · Application web 100 % navigateur, sans serveur, sans installation — Mise à jour : 2026-07-08

> Conçue pour les profils TDA (Trouble du Déficit de l'Attention) : mode focus, décomposition automatique, gamification, minuterie visuelle.

🌐 **Accès en ligne :** [romaricponcin.github.io/Flowmind](https://romaricponcin.github.io/Flowmind/)

---

## ✨ Fonctionnalités

| Domaine | Ce que fait FlowMind |
|---|---|
| 🧠 TDA | Mode focus, décomposition micro-étapes, minuterie Time Timer |
| 📁 Projets | Multi-projets colorés, statuts (Actif/En pause/Terminé), tri et filtre |
| 📌 Mémos | Post-it par projet, épinglage tableau de bord, conversion en tâche |
| 🔍 Recherche | Recherche catégorisée (Tâche / Sous-tâche / Mémo / Projet) avec surlignage |
| 🔁 Récurrence | Tâches hebdo / mensuel / tous les X jours |
| 📅 Agenda & Frais | Calendrier mensuel unifié : événements Zimbra + frais professionnels, catégories, export CSV |
| 🔄 Sync Zimbra | Import URL/fichier/.ics + sync à la demande (bouton, 10-20 s) et automatique (30 min), pause ⏸ vacances |
| 📊 Rapports | Bilan des frais (statuts, mensuel, catégories) + stats tâches, export Markdown |
| 💾 Sauvegarde | Sauvegarde cloud automatique (Gist, ~30 s après modification), export JSON, sync fichier local (Nextcloud) |
| 🎮 Gamification | XP, niveaux, streaks, animations de récompense |

---

## 📖 Guide des fonctionnalités avancées

> Les fonctionnalités simples (créer une tâche, changer de thème, gérer des projets) sont intuitives. Ce guide couvre uniquement ce qui nécessite quelques explications.

---

### 🔍 Recherche catégorisée

La barre de recherche est disponible dans le **Dashboard** et dans la vue **Projets**. Elle cherche simultanément dans toutes les données et regroupe les résultats par catégorie.

#### Lancer une recherche

```
  Dashboard ou Projets → champ "🔍 Rechercher…"
  → Taper au moins 1 caractère
  → Les résultats apparaissent immédiatement, groupés par catégorie
```

#### Ce qui est recherché

| Catégorie | Champs explorés |
|---|---|
| **Projet** | Nom du projet |
| **Tâche** | Titre, description |
| **Sous-tâche** | Titre de la sous-tâche (+ tâche parente affichée) |
| **Mémo** | Texte complet du mémo (extrait centré sur l'occurrence) |

Chaque résultat affiche :
- Un **badge coloré** indiquant la catégorie
- La **barre couleur** du projet auquel il appartient
- Le **terme recherché surligné** dans le titre ou l'extrait
- Une **ligne contextuelle** : nom du projet · statut · échéance (si définie)

#### Deux modes d'affichage

```
  Bouton ⊞ / ⊟  à droite du champ de recherche
```

| Mode | Icône | Comportement |
|---|---|---|
| **Flottant** (défaut) | `⊟` | Panneau dropdown au-dessus du contenu — la liste normale reste visible |
| **Inline** | `⊞` | Les résultats remplacent la liste dans la page |

Le mode choisi est **mémorisé** entre les sessions.

#### Raccourcis

- **Échap** — vide le champ et ferme les résultats
- **Clic extérieur** (mode flottant) — ferme le panneau sans vider le champ

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
  ┃ En cours      fond amber, liseré amber          ←
  ┃ Reporté       fond bleu soutenu, liseré bleu-gris  ←  barres colorées
  ┃ Terminé       fond vert, liseré vert mint        ←
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
     ☑ gist            ← sauvegarde + lecture du calendrier
     ☑ repo, workflow  ← bouton Sync cloud agenda (déclenchement
                          et pause de la GitHub Action)
     Durée : No expiration (ou 1 an)
  → Copier le token  ghp_xxxxxxxxxxxxxxxxxxxx
```

> ⚠ En cas de **régénération** du token (changement de durée…), l'ancienne
> valeur meurt partout : remettre la nouvelle dans Paramètres → Cloud **et**
> dans le secret `GH_GIST_TOKEN` du dépôt (Settings → Secrets → Actions).

**Étape 2 — Configurer FlowMind**

```
  Paramètres → Sauvegarde & Restauration
  → ☁ Synchronisation cloud
  → Coller le token dans le champ
  → Cliquer  ☁ Sauvegarder
  → Message vert "Sauvegarde cloud réussie" ✓
```

**Fonctionnement :**
- **Sauvegarde automatique** : une fois le token enregistré, le Gist est mis à jour ~30 s après chaque modification (et à l'ouverture de l'appli) — la date de la dernière sauvegarde s'affiche dans Paramètres → Cloud
- La 1ère sauvegarde crée un **Gist privé** nommé `flowmind-data.json` sur votre compte ; les suivantes mettent à jour le même Gist (s'il a été supprimé, un nouveau est recréé automatiquement)
- Les boutons **☁ Sauvegarder** / **☁ Charger** restent disponibles pour forcer une sauvegarde ou restaurer sur un autre PC (même token)
- Vérifiable sur [gist.github.com](https://gist.github.com)
- ⚠ Chaque navigateur (ou version locale/en ligne) garde **ses propres données et son propre Gist** — choisissez un contexte de référence pour le travail réel

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

> Si erreur CORS → utiliser la méthode par fichier ou la sync cloud.

#### Via fichier .ics

```
  Zimbra → Fichier → Exporter → Format : iCalendar (.ics)

  FlowMind → Agenda → Importer un fichier .ics → sélectionner le fichier
```

#### Via sync cloud (Gist) — recommandé

La sync cloud contourne les restrictions CORS en utilisant un Gist GitHub comme relais.

**Mise en place :**
1. Créer un Gist secret sur [gist.github.com](https://gist.github.com) (fichier `calendar.ics`, contenu `placeholder`)
2. Configurer les secrets GitHub dans Settings → Secrets → Actions :
   - `ZIMBRA_ICS_URL` : URL iCal Zimbra
   - `ZIMBRA_AUTH` : identifiants `user@ac-academie.fr:motdepasse` (si l'URL n'est pas publique)
   - `GH_GIST_TOKEN` : token GitHub (scope `gist`)
   - `ICS_GIST_ID` : ID du Gist créé
3. Le workflow GitHub Actions synchronise automatiquement toutes les 30 min
4. Dans FlowMind → Agenda & Frais → coller le Gist ID → cliquer **"Sync cloud"** : le bouton **déclenche la synchronisation immédiatement** (10-20 s) puis importe le résultat — pas besoin d'attendre le cron

**Bouton ⏸ (pause)** : suspend la synchronisation automatique (utile pendant les vacances). Le bouton Sync cloud reste utilisable ponctuellement — il réactive le workflow le temps de la sync puis remet en pause. Cliquer ▶ pour reprendre la synchro automatique.

Les tâches Zimbra (VTODO) sont aussi importées automatiquement. Les **rendez-vous privés** apparaissent comme créneaux « 🔒 Privé » : Zimbra masque leur titre dans les exports, seuls les horaires sont transmis.

---

### 💶 Agenda & Frais

L'onglet **Agenda & Frais** unifie le calendrier Zimbra et le suivi des frais professionnels.

- **Calendrier mensuel** : grille avec pastilles colorées par catégorie, clic sur un jour pour voir le détail
- **Vue liste** : chronologique, groupée par date
- **3 catégories prédéfinies** : SOFIA + convocation, Déplacement + OM, Repas → déplacement
- **Catégories personnalisables** : ajouter, modifier, supprimer via le panneau "Gérer les catégories"
- **Conversion bidirectionnelle** : tâche → frais (bouton €) et frais → tâche (bouton ⚡)
- **Événements Zimbra → frais** : convertir un événement du calendrier en frais en un clic
- **Récapitulatif mensuel** : totaux par catégorie et par statut (brouillon / transmis / remboursé)
- **Export CSV** : fichier mensuel au format `;` (compatible Excel), encodage UTF-8
- **Bilan dans les Rapports** : l'onglet Rapports affiche en tête le bilan des frais de la période (tuiles À déclarer / Déclarés / Remboursés, détail mensuel, répartition par catégorie) — inclus dans l'export Markdown

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
├── README.md                ← Ce fichier (aussi chargé dans l'aide intégrée)
├── css/
│   ├── tokens.css           ← Variables design (couleurs, rayons, ombres)
│   ├── base.css             ← Reset, glassmorphism, aurora
│   ├── layout.css           ← Sidebar, topbar, grille principale
│   ├── components.css       ← Boutons, inputs, modals, toggles
│   ├── views.css            ← Styles des vues (focus, rapports…)
│   ├── dashboard.css        ← Tableau de bord et listes de tâches
│   ├── status-badges.css    ← Couleurs et badges par statut
│   ├── focus-overlay.css    ← Panneau Mode Focus
│   ├── memos.css            ← Post-it : styles glassmorphism
│   ├── search.css           ← Résultats de recherche catégorisés
│   └── light-theme.css      ← Surcharges thème clair
└── js/
    ├── storage.js           ← localStorage + sync GitHub Gist
    ├── config.js            ← Configuration & thème
    ├── gamification.js      ← XP, niveaux, streaks
    ├── timer.js             ← Minuterie Time Timer (anneau SVG)
    ├── projects.js          ← CRUD projets, tri, filtre
    ├── tasks.js             ← CRUD tâches, récurrence, décomposition
    ├── memos.js             ← CRUD mémos post-it, épinglage, conversion
    ├── search.js            ← Moteur de recherche catégorisé
    ├── seed-tne-drane.js    ← Données réelles TNE-DRANE (mémos + tâches)
    ├── ical.js              ← Parser iCal, import Zimbra
    ├── expenses.js          ← Agenda & Frais : calendrier, frais, export CSV
    ├── reports.js           ← Rapports, export Markdown
    └── app.js               ← Contrôleur principal, routage, Focus
```

---

## 📝 Changelog

### v1.9.0 — 2026-07-08
- 💾 **Sauvegarde cloud automatique** : Gist mis à jour ~30 s après chaque modification et à l'ouverture de l'appli ; date de dernière sauvegarde affichée dans Paramètres
- 📊 **Bilan des frais dans les Rapports** : tuiles par statut (à déclarer / déclarés / remboursés), détail mensuel, répartition par catégorie — en tête de rapport et dans l'export Markdown
- ☁ **Sync Zimbra à la demande** : le bouton Sync cloud déclenche la GitHub Action et importe le résultat (10-20 s), au lieu d'attendre le cron
- ⏸ **Pause de la synchro automatique** (vacances) : bouton ⏸/▶ ; la sync ponctuelle reste possible pendant la pause (réactivation temporaire automatique)
- 🔒 **Rendez-vous privés Zimbra** importés comme créneaux « Privé » (leur titre est masqué par Zimbra à l'export)
- 🛡 Fiabilisation de la sync : retries côté workflow (IPv4, timeouts courts), détection des échecs de run (fini les faux « ✓ »), attente par id de run (insensible au décalage d'horloge du PC)
- 🐛 Corrections : sauvegardes cloud en double (handlers empilés dans Paramètres), Gist supprimé recréé automatiquement, carte Rapports comprimée par la colonne défilante (fond coupé)
- 🔑 Le bouton Sync cloud nécessite désormais les scopes `repo` + `workflow` sur le token (en plus de `gist`)

### v1.8.0 — 2026-06-25
- 📅 **Agenda & Frais** : onglet unifié calendrier + frais (vue grille, liste, récapitulatif)
- 📋 3 catégories prédéfinies (SOFIA, OM, Repas) + catégories personnalisables
- 🔄 Conversion bidirectionnelle tâches ↔ frais et événements Zimbra → frais
- 📊 Export CSV mensuel (séparateur `;`, UTF-8 BOM, compatible Excel)
- ☁ **Sync Zimbra via Gist** : workflow GitHub Actions toutes les 30 min + bouton Sync cloud
- 📅 Bouton Sync cloud ajouté dans l'onglet Agenda
- ✅ Support VTODO Zimbra : import automatique des tâches depuis les fichiers .ics
- 🔍 Recherche intégrée dans les frais (titre, description, lieu)
- € Bouton "Convertir en frais" sur chaque tâche

### v1.7.0 — 2026-04-09
- 📋 **Modèles de projets** : créer et réutiliser des templates de projets
- ⚡ Créer un projet à partir d'un modèle avec conservation de la structure
- 📝 Gestion des modèles : créer, utiliser, supprimer les templates
- 📊 Compteur d'utilisation pour chaque modèle

### v1.4.1 — 2026-03-30
- 🖱 Résultats de recherche cliquables : navigation directe vers la tâche, sous-tâche, projet ou mémo
- 📝 Bouton ✎ sur les cartes mémo pour modifier le texte d'un mémo existant
- 🐛 Fix scroll : navigation depuis la recherche ouvre et fait défiler jusqu'au tableau de mémos

### v1.4.0 — 2026-03-29
- 🔍 Recherche catégorisée dans le Dashboard et la vue Projets
- Résultats groupés par type : Tâche · Sous-tâche · Mémo · Projet
- Surlignage de l'occurrence dans chaque résultat
- Deux modes au choix : **flottant** (dropdown) ou **inline** (remplace la liste)
- Bascule ⊞/⊟ mémorisée entre les sessions
- Fermeture par Échap ou clic extérieur (mode flottant)

### v1.3.0 — 2026-03-24
- 🏷 Statuts de projets : Actif / En pause / Terminé
- Tri et filtre des projets (par statut, nom, progression, date)
- Séparateur visuel entre projets actifs et terminés

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
