/**
 * FlowMind — Storage Module
 * Abstraction localStorage avec schéma structuré
 */

const Storage = (() => {
  const KEY = 'flowmind_data';

  const DEFAULT_STATE = {
    version: 1,
    projects: [],
    projectTemplates: [],
    tasks: [],
    memos: [],
    completedHistory: [],
    calendarEvents: [],
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    feedbacks: [],
    expenses: [],
    expenseCategories: [
      { id: 'sofia_convoc', label: 'Frais transmis via SOFIA avec convocation', shortLabel: 'SOFIA + convocation', icon: '\u{1F4CB}', color: '#4f8eff' },
      { id: 'deplacement_om', label: 'Frais de déplacements sans convocation avec OM', shortLabel: 'Déplacement + OM', icon: '\u{1F697}', color: '#f59e0b' },
      { id: 'repas_converti', label: 'Repas sans convocations transformés en déplacements', shortLabel: 'Repas → déplacement', icon: '\u{1F37D}', color: '#00d9a6' }
    ],
    config: {
      accentColor: '#00d4ff',
      successColor: '#10b981',
      theme: 'light',
      pomodoroMin: 25,
      breakShortMin: 5,
      sound: 'bell',
      oneTaskFocus: true,
      microstepMaxMin: 15,
      notifications: true,
      xpPerTask: 10,
      xpPerSubtask: 5,
      animations: true
    }
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      let state;
      if (!raw) {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      } else {
        const data = JSON.parse(raw);
        state = deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), data);
      }
      // Injecter les données TNE-DRANE (données réelles) en priorité
      if (typeof SeedTNEDrane !== 'undefined' && SeedTNEDrane.shouldSeed(state)) {
        state = SeedTNEDrane.seed(state);
        save(state);
      }
      // Injecter les données de démo si l'app est vide
      if (typeof Demo !== 'undefined' && Demo.shouldSeed(state)) {
        state = Demo.seed(state);
        save(state);
      }
      // Injecter les données TNE si le projet n'existe pas encore
      if (typeof DemoTNE !== 'undefined' && DemoTNE.shouldSeed(state)) {
        state = DemoTNE.seed(state);
        save(state);
      }
      // Sauvegarde cloud de session : couvre les modifications de la veille
      // faites moins de 30 s avant la fermeture de l'onglet
      _scheduleAutoBackup(state);
      return state;
    } catch (e) {
      console.error('[Storage] Load error:', e);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      _scheduleAutoBackup(data);
      return true;
    } catch (e) {
      console.error('[Storage] Save error:', e);
      return false;
    }
  }

  // ── SAUVEGARDE CLOUD AUTOMATIQUE ──────────────────────────────────────
  // Déclenchée ~30 s après la dernière modification : les changements en
  // rafale sont regroupés en une seule mise à jour du Gist.
  const AUTO_BACKUP_DELAY_MS = 30000;
  let _backupTimer = null;
  let _onAutoBackup = null; // callback UI optionnel, reçoit (err|null)

  function setAutoBackupCallback(cb) { _onAutoBackup = cb; }

  function _scheduleAutoBackup(data) {
    if (!getCloudToken()) return; // pas de token configuré → pas d'auto-backup
    clearTimeout(_backupTimer);
    _backupTimer = setTimeout(() => {
      saveToCloud(data)
        .then(() => { if (_onAutoBackup) _onAutoBackup(null); })
        .catch(e => {
          console.warn('[Storage] Sauvegarde cloud auto échouée :', e.message);
          if (_onAutoBackup) _onAutoBackup(e);
        });
    }, AUTO_BACKUP_DELAY_MS);
  }

  function reset() {
    localStorage.removeItem(KEY);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // ── CLOUD SYNC (GitHub Gist) ────────────────────────────────────────────
  const CLOUD_TOKEN_KEY = 'flowmind_gist_token';
  const CLOUD_GIST_KEY  = 'flowmind_gist_id';
  const LAST_BACKUP_KEY = 'flowmind_last_backup';

  function getCloudToken() { return localStorage.getItem(CLOUD_TOKEN_KEY) || ''; }
  function getLastBackupAt() { return localStorage.getItem(LAST_BACKUP_KEY) || ''; }
  function setCloudToken(t) { localStorage.setItem(CLOUD_TOKEN_KEY, t); }
  function getGistId()      { return localStorage.getItem(CLOUD_GIST_KEY) || ''; }
  function setGistId(id)    { localStorage.setItem(CLOUD_GIST_KEY, id); }

  async function saveToCloud(data) {
    const token = getCloudToken();
    if (!token) throw new Error('Token GitHub manquant.');
    const content = JSON.stringify({ version: 'flowmind-backup-v1', exportedAt: new Date().toISOString(), data }, null, 2);
    const payload = { description: 'FlowMind — sauvegarde automatique', public: false, files: { 'flowmind-data.json': { content } } };
    const gistId = getGistId();
    const url    = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
    const method = gistId ? 'PATCH' : 'POST';
    let resp = await fetch(url, { method, headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    // Gist mémorisé supprimé côté GitHub → on en recrée un proprement
    if (resp.status === 404 && gistId) {
      resp = await fetch('https://api.github.com/gists', { method: 'POST', headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    if (!resp.ok) { const err = await resp.json(); throw new Error(err.message || `HTTP ${resp.status}`); }
    const json = await resp.json();
    setGistId(json.id);
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    return json;
  }

  async function loadFromCloud() {
    const token = getCloudToken();
    if (!token) throw new Error('Token GitHub manquant.');
    const gistId = getGistId();
    if (!gistId) throw new Error('Aucune sauvegarde cloud trouvée. Sauvegardez d\'abord.');
    const resp = await fetch(`https://api.github.com/gists/${gistId}`, { headers: { Authorization: `token ${token}` } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const raw  = json.files['flowmind-data.json']?.content;
    if (!raw) throw new Error('Fichier introuvable dans le Gist.');
    return JSON.parse(raw);
  }

  // ── ICS GIST (Zimbra calendar sync) ──────────────────────────────────
  const ICS_GIST_KEY    = 'flowmind_ics_gist_id';
  const GITHUB_REPO     = 'romaricponcin/Flowmind';
  const ICS_WORKFLOW    = 'sync-zimbra.yml';

  function getIcsGistId() { return localStorage.getItem(ICS_GIST_KEY) || ''; }
  function setIcsGistId(id) { localStorage.setItem(ICS_GIST_KEY, id); }

  async function loadIcsFromCloud() {
    const token = getCloudToken();
    if (!token) throw new Error('Token GitHub manquant. Configurez-le dans Paramètres → Cloud.');
    const gistId = getIcsGistId();
    if (!gistId) throw new Error('Aucun Gist calendrier configuré.');
    const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const raw = json.files['calendar.ics']?.content;
    if (!raw) throw new Error('Fichier calendar.ics introuvable dans le Gist.');
    return { icsText: raw, updatedAt: json.updated_at };
  }

  async function triggerIcsWorkflow() {
    const token = getCloudToken();
    if (!token) throw new Error('Token GitHub manquant.');
    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${ICS_WORKFLOW}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ref: 'master' })
      }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(`Erreur déclenchement workflow : ${resp.status} ${err.message || ''}`);
    }
  }

  // Id du run le plus récent — sert de repère avant un déclenchement.
  // On repère par id (croissant) et non par date : l'horloge du PC peut
  // être décalée de celle de GitHub, ce qui faisait rater le run.
  async function getLatestIcsRunId() {
    const token = getCloudToken();
    if (!token) throw new Error('Token GitHub manquant.');
    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${ICS_WORKFLOW}/runs?per_page=1`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
    );
    if (!resp.ok) return 0;
    const data = await resp.json();
    return (data.workflow_runs && data.workflow_runs[0]) ? data.workflow_runs[0].id : 0;
  }

  async function waitForIcsWorkflow(sinceRunId, timeoutMs = 90000) {
    const token = getCloudToken();
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    };
    const deadline = Date.now() + timeoutMs;
    await new Promise(r => setTimeout(r, 4000)); // laisse le run apparaître

    while (Date.now() < deadline) {
      const resp = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${ICS_WORKFLOW}/runs?per_page=3`,
        { headers }
      );
      if (resp.ok) {
        const data = await resp.json();
        const done = (data.workflow_runs || []).find(r =>
          r.id > sinceRunId && r.status === 'completed'
        );
        if (done) {
          if (done.conclusion === 'success') return;
          throw new Error(`Le workflow Zimbra a échoué (${done.conclusion}). Le serveur du ministère est peut-être injoignable — réessayez dans quelques minutes.`);
        }
      }
      await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error('Timeout : le workflow Zimbra n\'a pas répondu dans les temps.');
  }

  // État du workflow : 'active' ou 'disabled_manually' (= synchro en pause)
  async function getIcsWorkflowState() {
    const token = getCloudToken();
    if (!token) throw new Error('Token GitHub manquant.');
    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${ICS_WORKFLOW}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
    );
    if (!resp.ok) throw new Error(`Erreur lecture état workflow : HTTP ${resp.status}`);
    const json = await resp.json();
    return json.state;
  }

  async function setIcsWorkflowEnabled(enabled) {
    const token = getCloudToken();
    if (!token) throw new Error('Token GitHub manquant.');
    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${ICS_WORKFLOW}/${enabled ? 'enable' : 'disable'}`,
      { method: 'PUT', headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(`Erreur ${enabled ? 'reprise' : 'pause'} de la synchro : ${resp.status} ${err.message || ''}`);
    }
  }

  return { load, save, reset, generateId, DEFAULT_STATE,
    setAutoBackupCallback, getLastBackupAt,
    getCloudToken, setCloudToken, getGistId, saveToCloud, loadFromCloud,
    getIcsGistId, setIcsGistId, loadIcsFromCloud,
    triggerIcsWorkflow, waitForIcsWorkflow, getLatestIcsRunId,
    getIcsWorkflowState, setIcsWorkflowEnabled };
})();
