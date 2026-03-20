/**
 * FlowMind — Seed TNE-DRANE
 * Données initiales réelles : projets TNE-DRANE / PMB / GAR-DNE
 * Mémos depuis MEMO.docx, tâches depuis A faire TNE.docx
 */

const SeedTNEDrane = (() => {

  const P_TNE = 'seed_tne_drane';
  const P_PMB = 'seed_pmb';
  const P_GAR = 'seed_gar_dne';

  function shouldSeed(state) {
    return !(state.projects || []).some(p => p.name === 'TNE - DRANE');
  }

  const PROJECTS = [
    {
      id: P_TNE,
      name: 'TNE - DRANE',
      color: '#00d4ff',
      createdAt: '2025-09-01T08:00:00.000Z'
    },
    {
      id: P_PMB,
      name: 'PMB',
      color: '#f59e0b',
      createdAt: '2025-09-01T08:01:00.000Z'
    },
    {
      id: P_GAR,
      name: 'GAR - DNE',
      color: '#a78bfa',
      createdAt: '2025-09-01T08:02:00.000Z'
    }
  ];

  // ── MÉMOS (tous dans TNE-DRANE) ────────────────────────────────────────

  const MEMOS = [
    // ── 6 épinglés ──
    {
      id: 'smemo_01',
      projectId: P_TNE,
      text: 'Procédure paiement formateurs\n• CAS 1 – Benoit Leroux : vacations via SOFIA\n• CAS 2 / CAS 3 – Sandrine : devis + défrayé\nVacations → devis → défrayé selon profil formateur',
      colorId: 'yellow',
      rotation: -1.2,
      pinned: true,
      createdAt: '2025-09-01T09:00:00.000Z'
    },
    {
      id: 'smemo_02',
      projectId: P_TNE,
      text: 'Outil élaboration PAF 2026\n• Mdp : elabpraf26\n• Phase dialogue fermée 27/04\n• Champs jaunes obligatoires avant 27/04\n• Calcul JSA après saisie',
      colorId: 'peach',
      rotation: 1.8,
      pinned: true,
      createdAt: '2025-09-01T09:01:00.000Z'
    },
    {
      id: 'smemo_03',
      projectId: P_TNE,
      text: 'Réunion DANE/DNE 11/03\n• Bascule Worldline → DOCAPOSTE 18-20/03\n• Nouveau module stats mi-avril\n• Suivi migration à anticiper',
      colorId: 'pink',
      rotation: -2.5,
      pinned: true,
      createdAt: '2025-09-01T09:02:00.000Z'
    },
    {
      id: 'smemo_04',
      projectId: P_TNE,
      text: 'Circuit PFE\nCE demande → CIF réseau → Sophie Loudières (création SOFIA) → Sandrine C → DRANE\nValidation étape par étape',
      colorId: 'lavender',
      rotation: 0.9,
      pinned: true,
      createdAt: '2025-09-01T09:03:00.000Z'
    },
    {
      id: 'smemo_05',
      projectId: P_TNE,
      text: 'Contacts clés\n• Benoit Leroux – CAS1\n• Sandrine – EAFC\n• Romaric – TNE 13\n• Philippe – autres dép\n• Sophie Loudières – CIF PFE\n• Laurent Prevaut Uptale : laurent@uptale.io',
      colorId: 'blue',
      rotation: -0.7,
      pinned: true,
      createdAt: '2025-09-01T09:04:00.000Z'
    },
    {
      id: 'smemo_06',
      projectId: P_TNE,
      text: '19/03 Sandrine EAFC\n• Arbitrage historique antérieur\n• Prévoir 2 outils : enveloppe validée + saisie\n• À coordonner avec Sandrine avant fin mars',
      colorId: 'yellow',
      rotation: 2.1,
      pinned: true,
      createdAt: '2025-09-01T09:05:00.000Z'
    },
    // ── 6 non épinglés ──
    {
      id: 'smemo_07',
      projectId: P_TNE,
      text: 'TNE volet formation / LIEN\n• 14 sessions → 7 mises en place\n• Rétro planning niv1 avant fév / niv2 après\n• Comm lettre hebdo à prévoir',
      colorId: 'green',
      rotation: -1.6,
      pinned: false,
      createdAt: '2025-09-01T09:06:00.000Z'
    },
    {
      id: 'smemo_08',
      projectId: P_TNE,
      text: 'PFE organisation\n• Romaric : TNE13\n• Philippe : autres dép\n• SOFIA : supervision\n• Chefs de projets + suivi Sandrine',
      colorId: 'blue',
      rotation: 1.3,
      pinned: false,
      createdAt: '2025-09-01T09:07:00.000Z'
    },
    {
      id: 'smemo_09',
      projectId: P_TNE,
      text: 'NIVEAU 2 ENT/LIEN\n• 4 réseaux : Aix / Miramas / La Ciotat / Marseille\n• + Pertuis\n• Prendre dates tardives + rétro planning obligatoire',
      colorId: 'lavender',
      rotation: -3.0,
      pinned: false,
      createdAt: '2025-09-01T09:08:00.000Z'
    },
    {
      id: 'smemo_10',
      projectId: P_TNE,
      text: 'VR collectif\n• Créer module "Réalité virtuelle"\n• Décliner LIEN / SYMSPRAY / autres thèmes\n• Selon demandes établissements',
      colorId: 'peach',
      rotation: 0.4,
      pinned: false,
      createdAt: '2025-09-01T09:09:00.000Z'
    },
    {
      id: 'smemo_11',
      projectId: P_TNE,
      text: 'Formation 1D\n• Yves Notin (4 formateurs TNE)\n• 369 + 104 écoles Marseille\n• ERUNs hors-Marseille : Noelle Bulteel, Vanessa Fanciello',
      colorId: 'pink',
      rotation: -0.8,
      pinned: false,
      createdAt: '2025-09-01T09:10:00.000Z'
    },
    {
      id: 'smemo_12',
      projectId: P_TNE,
      text: 'Individuelle UPTALE\n• Mettre nom en pilote ET intervenant\n• Sélectionner stagiaires dans SOFIA\n• Envoyer liste BDR13 à Laurent Prevaut',
      colorId: 'green',
      rotation: 2.7,
      pinned: false,
      createdAt: '2025-09-01T09:11:00.000Z'
    }
  ];

  // ── TÂCHES (toutes dans TNE-DRANE) ────────────────────────────────────

  const TASKS = [
    // ── DONE ──
    {
      id: 'stask_d01',
      projectId: P_TNE,
      title: 'Voir avec Joel — Formation Olivier Baron 27/11',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-27T10:00:00.000Z',
      createdAt: '2025-11-01T08:00:00.000Z'
    },
    {
      id: 'stask_d02',
      projectId: P_TNE,
      title: 'Contacter collège Fraissinet — annulation 06/11',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-06T10:00:00.000Z',
      createdAt: '2025-11-01T08:01:00.000Z'
    },
    {
      id: 'stask_d03',
      projectId: P_TNE,
      title: 'Groupe 16 AM — demander basculement sur matin (fiche accord CE)',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-10T10:00:00.000Z',
      createdAt: '2025-11-01T08:02:00.000Z'
    },
    {
      id: 'stask_d04',
      projectId: P_TNE,
      title: 'Groupe 4 annulé (Réseau Colline) — groupe supprimé',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-10T10:00:00.000Z',
      createdAt: '2025-11-01T08:03:00.000Z'
    },
    {
      id: 'stask_d05',
      projectId: P_TNE,
      title: 'Groupe 70679 — Grp 1 → Grp 2, stagiaires hors-périmètre',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-12T10:00:00.000Z',
      createdAt: '2025-11-01T08:04:00.000Z'
    },
    {
      id: 'stask_d06',
      projectId: P_TNE,
      title: 'Chercher Chassaignon Ginette — positionner en 04 (OK trouvé)',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-14T10:00:00.000Z',
      createdAt: '2025-11-01T08:05:00.000Z'
    },
    {
      id: 'stask_d07',
      projectId: P_TNE,
      title: 'Chercher EPLE sur Avignon pour formation du 06/11',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-05T10:00:00.000Z',
      createdAt: '2025-11-01T08:06:00.000Z'
    },
    {
      id: 'stask_d08',
      projectId: P_TNE,
      title: 'Vérifier formations 70678/70679/70777 — CE préinscrits OK',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-15T10:00:00.000Z',
      createdAt: '2025-11-01T08:07:00.000Z'
    },
    {
      id: 'stask_d09',
      projectId: P_TNE,
      title: 'Trouver fichier Philippe (Teams) — pilotes/responsables modules',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-11-18T10:00:00.000Z',
      createdAt: '2025-11-01T08:08:00.000Z'
    },
    {
      id: 'stask_d10',
      projectId: P_TNE,
      title: 'LIEN — rétro planning niveau 1 avant vacances de février',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2026-01-31T10:00:00.000Z',
      createdAt: '2025-11-01T08:09:00.000Z'
    },
    {
      id: 'stask_d11',
      projectId: P_TNE,
      title: 'Passer groupes 70777/70679 en statut 2 + ajouter CE + enlever Alexandra + envoyer à IVY',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-12-01T10:00:00.000Z',
      createdAt: '2025-11-01T08:10:00.000Z'
    },
    {
      id: 'stask_d12',
      projectId: P_TNE,
      title: 'Gestion groupes régionaux (Haut-Vaucluse, Garlaban, La Crau, Luberon, Portes des Alpes)',
      status: 'done',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: '2025-12-15T10:00:00.000Z',
      createdAt: '2025-11-01T08:11:00.000Z'
    },

    // ── IN PROGRESS ──
    {
      id: 'stask_p01',
      projectId: P_TNE,
      title: 'Vitrolles — Préparation événement 26 mai-2 juin',
      status: 'inprogress',
      priority: 'high',
      dueDate: '2026-05-26',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T08:00:00.000Z'
    },
    {
      id: 'stask_p02',
      projectId: P_TNE,
      title: 'École-collège / Café IA — Ligue enseignement, projets et ateliers, élèves 6ème',
      status: 'inprogress',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T08:01:00.000Z'
    },
    {
      id: 'stask_p03',
      projectId: P_TNE,
      title: 'Communication séminaire IA — Florence / Isabelle / Romaric / Caroline',
      status: 'inprogress',
      priority: 'high',
      dueDate: '2026-03-25',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T08:02:00.000Z'
    },
    {
      id: 'stask_p04',
      projectId: P_TNE,
      title: 'Séminaire 04/02 — formateurs, ateliers, organisation, programme',
      status: 'inprogress',
      priority: 'high',
      dueDate: '2026-02-04',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T08:03:00.000Z'
    },

    // ── TODO ──
    {
      id: 'stask_t01',
      projectId: P_TNE,
      title: 'Trouver numéros modules LIEN (70681-70684, 70778-70779)',
      status: 'todo',
      priority: 'high',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [
        { id: 'ss_t01a', title: 'Vérifier 70681 niv1 Vaucluse DEP', done: false },
        { id: 'ss_t01b', title: 'Vérifier 70682 niv1 04-05 Acad', done: false },
        { id: 'ss_t01c', title: 'Vérifier 70683 niv2 Vaucluse', done: false },
        { id: 'ss_t01d', title: 'Vérifier 70684 niv2 04-05 Acad', done: false },
        { id: 'ss_t01e', title: 'Vérifier 70778 RV LIEN niv1', done: false },
        { id: 'ss_t01f', title: 'Vérifier 70779 RV LIEN niv2', done: false }
      ],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:00:00.000Z'
    },
    {
      id: 'stask_t02',
      projectId: P_TNE,
      title: 'VR niveau 0 — Transmettre listes stagiaires aux établissements',
      status: 'todo',
      priority: 'medium',
      dueDate: '2025-11-03',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:01:00.000Z'
    },
    {
      id: 'stask_t03',
      projectId: P_TNE,
      title: 'VR niveau 0 — Mail annulation stagiaires via SOFIA',
      status: 'todo',
      priority: 'medium',
      dueDate: '2025-11-04',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:02:00.000Z'
    },
    {
      id: 'stask_t04',
      projectId: P_TNE,
      title: 'VR LIEN — Trouver emails stagiaires niveau 0 par dates',
      status: 'todo',
      priority: 'medium',
      dueDate: '2025-11-07',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:03:00.000Z'
    },
    {
      id: 'stask_t05',
      projectId: P_TNE,
      title: 'Retrouver volume vacations PAF 2024-2025 pour budget T2',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:04:00.000Z'
    },
    {
      id: 'stask_t06',
      projectId: P_TNE,
      title: 'COPIL SEMINAIRE TNE — Trouver emails mairies',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:05:00.000Z'
    },
    {
      id: 'stask_t07',
      projectId: P_TNE,
      title: 'LP René Caillé (70782 Grp07 / 74028 Grp02) — programme janvier/février',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-01-30',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:06:00.000Z'
    },
    {
      id: 'stask_t08',
      projectId: P_TNE,
      title: 'NIVEAU 2 LIEN — 4 formations régionales',
      status: 'todo',
      priority: 'high',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [
        { id: 'ss_t08a', title: 'Aix', done: false },
        { id: 'ss_t08b', title: 'Miramas', done: false },
        { id: 'ss_t08c', title: 'La Ciotat', done: false },
        { id: 'ss_t08d', title: 'Marseille', done: false },
        { id: 'ss_t08e', title: 'Pertuis (autres dép)', done: false }
      ],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:07:00.000Z'
    },
    {
      id: 'stask_t09',
      projectId: P_TNE,
      title: 'Niveau 1 LIEN — Supprimer Etoile/Salon, regrouper Camargues à Salon',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [
        { id: 'ss_t09a', title: 'Supprimer Etoile', done: false },
        { id: 'ss_t09b', title: 'Supprimer Salon', done: false },
        { id: 'ss_t09c', title: 'Regrouper Camargues à Salon', done: false },
        { id: 'ss_t09d', title: 'Contacter Sandrine sur périmètre DEP', done: false }
      ],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:08:00.000Z'
    },
    {
      id: 'stask_t10',
      projectId: P_TNE,
      title: 'Basculer niveau 1 fermés en dates niveau 2 (70778 — fermer sauf grp 5,6,12,13)',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [
        { id: 'ss_t10a', title: 'Fermer groupes non retenus', done: false },
        { id: 'ss_t10b', title: 'Récupérer stagiaires', done: false },
        { id: 'ss_t10c', title: 'Prévenir établissements accueil', done: false }
      ],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:09:00.000Z'
    },
    {
      id: 'stask_t11',
      projectId: P_TNE,
      title: 'CSI Jacques Chirac PFE — Créer module LIEN 04/05 et 84 (voir Philippe)',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:10:00.000Z'
    },
    {
      id: 'stask_t12',
      projectId: P_TNE,
      title: 'Modifications modules email Sandrine (3 actions)',
      status: 'todo',
      priority: 'high',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [
        { id: 'ss_t12a', title: 'Supprimer "raison hiérarchique" sur 70683', done: false },
        { id: 'ss_t12b', title: 'Modifier 70778 : 13 → 4 groupes réseau', done: false },
        { id: 'ss_t12c', title: 'Modifier 70779 : 13 → 4 groupes DEP', done: false },
        { id: 'ss_t12d', title: 'Créer 74416 LIEN Niv1 DEP13 4 grp', done: false },
        { id: 'ss_t12e', title: 'Créer module LIEN langues immersives DEP13', done: false },
        { id: 'ss_t12f', title: 'Créer module LIEN langues 84-04-05 Acad', done: false }
      ],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:11:00.000Z'
    },
    {
      id: 'stask_t13',
      projectId: P_TNE,
      title: 'GT Perdir IA — Créer groupe + 2 sessions (25/11 + 02/04/2026) + ajouter stagiaires',
      status: 'todo',
      priority: 'medium',
      dueDate: '2025-11-25',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:12:00.000Z'
    },
    {
      id: 'stask_t14',
      projectId: P_TNE,
      title: 'Écrire aux intervenants Séminaire IA 04/02 — modalités déplacement',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-01-20',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:13:00.000Z'
    },
    {
      id: 'stask_t15',
      projectId: P_TNE,
      title: 'PMB services — Déposer les factures',
      status: 'todo',
      priority: 'high',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:14:00.000Z'
    },
    {
      id: 'stask_t16',
      projectId: P_TNE,
      title: 'Séminaire 04/02 (70752) — Créer module + 105 stagiaires + préinscription',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-02-04',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:15:00.000Z'
    },
    {
      id: 'stask_t17',
      projectId: P_TNE,
      title: 'COSTRAT 12/02 — Sortir chiffres individuelle/PFE',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-02-12',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:16:00.000Z'
    },
    {
      id: 'stask_t18',
      projectId: P_TNE,
      title: 'Séminaire IA 25/03 — Retirer préinscrits (Covello, Delattre, Levêque, Buffard)',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-03-20',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:17:00.000Z'
    },
    {
      id: 'stask_t19',
      projectId: P_TNE,
      title: 'Envoyer tous liens de préinscriptions après création modules',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:18:00.000Z'
    },
    {
      id: 'stask_t20',
      projectId: P_TNE,
      title: 'Modules Aix points cardinaux (11/03, 12/03, 25/03, 26/03) — identifier modules',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-03-11',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:19:00.000Z'
    },
    {
      id: 'stask_t21',
      projectId: P_TNE,
      title: 'NIVEAU 2 — Créer 4 groupes points cardinaux (01-04) dans modules DEP',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:20:00.000Z'
    },
    {
      id: 'stask_t22',
      projectId: P_TNE,
      title: '70757 VR Métiers — Créer 2ème session 29 janvier',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-01-29',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:21:00.000Z'
    },
    {
      id: 'stask_t23',
      projectId: P_TNE,
      title: 'LIEN Grp 13 (11/02) + Grp 12 (05/02) — formateurs et établissements',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-02-05',
      timeEstimate: null,
      description: '',
      subtasks: [
        { id: 'ss_t23a', title: 'Grp 13 : Geoffroy – Clg Sophie Germain', done: false },
        { id: 'ss_t23b', title: 'Grp 12 : Laura Miousset + établissement', done: false }
      ],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:22:00.000Z'
    },
    {
      id: 'stask_t24',
      projectId: P_TNE,
      title: 'Niveau 2 (74417) — 27/04 Benedicte Faury Lycée Vauvenargues',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-04-27',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:23:00.000Z'
    },
    {
      id: 'stask_t25',
      projectId: P_TNE,
      title: 'Niveau 2 (74418) — 28/04 Benedicte Faury — chercher étab Pertuis/Meyragues',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-04-28',
      timeEstimate: null,
      description: '',
      subtasks: [],
      recurrence: null,
      completedAt: null,
      createdAt: '2026-01-01T09:24:00.000Z'
    }
  ];

  // ── Seed ──────────────────────────────────────────────────────────────

  function seed(state) {
    state.projects = [...(state.projects || []), ...PROJECTS];
    state.tasks    = [...(state.tasks    || []), ...TASKS];
    state.memos    = [...(state.memos    || []), ...MEMOS];
    return state;
  }

  return { shouldSeed, seed };

})();
