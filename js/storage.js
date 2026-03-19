/**
 * FlowMind — Storage Module
 * Abstraction localStorage avec schéma structuré
 */

const Storage = (() => {
  const KEY = 'flowmind_data';

  const DEFAULT_STATE = {
    version: 1,
    projects: [],
    tasks: [],
    completedHistory: [],
    calendarEvents: [],
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    feedbacks: [],
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
      return state;
    } catch (e) {
      console.error('[Storage] Load error:', e);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[Storage] Save error:', e);
      return false;
    }
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

  function getCloudToken() { return localStorage.getItem(CLOUD_TOKEN_KEY) || ''; }
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
    const resp = await fetch(url, { method, headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) { const err = await resp.json(); throw new Error(err.message || `HTTP ${resp.status}`); }
    const json = await resp.json();
    setGistId(json.id);
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

  return { load, save, reset, generateId, DEFAULT_STATE,
    getCloudToken, setCloudToken, getGistId, saveToCloud, loadFromCloud };
})();
