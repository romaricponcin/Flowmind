/**
 * FlowMind — App Controller
 * Routage, tableau de bord, mode focus, modals globales
 */

const App = (() => {
  let _state = null;
  let _focusTaskId = null;
  let _activeFocusSubtaskId = null;

  // ─── INIT ──────────────────────────────────────────────────────────────

  function init() {
    _state = Storage.load();

    // Init modules
    Config.init(_state);
    Gamification.init(_state, saveState);
    Timer.init(_onTimerEnd, null);
    Projects.init(_state, saveState);
    Tasks.init(_state, saveState);
    Memos.init(_state, saveState);
    ICal.init(_state, saveState);
    Reports.init(_state);

    // UI
    _bindNav();
    _bindGlobalActions();
    _bindFocusOverlay();

    // Default project si aucun
    if (!_state.projects.length) {
      Projects.create('Mon premier projet');
    }

    refresh();
    _showView('dashboard');
  }

  // ─── NAVIGATION ────────────────────────────────────────────────────────

  function _bindNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        _showView(view);
      });
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('collapsed');
    });

    // Data-view buttons (ex: "Voir tout →")
    document.querySelectorAll('[data-view]:not(.nav-item)').forEach(btn => {
      btn.addEventListener('click', () => _showView(btn.dataset.view));
    });
  }

  function _showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const viewEl = document.getElementById(`view-${viewName}`);
    if (viewEl) viewEl.classList.add('active');

    const navBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navBtn) navBtn.classList.add('active');

    const titles = {
      dashboard: 'Tableau de bord',
      focus: 'Mode Focus',
      projects: 'Projets',
      calendar: 'Agenda',
      reports: 'Rapports d\'activité',
      settings: 'Paramètres'
    };

    document.getElementById('topbar-title').textContent = titles[viewName] || viewName;

    // Actions spécifiques à la vue
    if (viewName === 'dashboard') _renderDashboard();
    if (viewName === 'projects') Projects.renderProjectsView();
    if (viewName === 'focus') _renderFocusLauncher();
    if (viewName === 'calendar') ICal.renderEvents();
    if (viewName === 'settings') { Config.loadSettingsUI(); _bindSettingsActions(); }
    if (viewName === 'reports') _populateReportSelects();
  }

  // ─── GLOBAL ACTIONS ────────────────────────────────────────────────────

  function _bindGlobalActions() {
    // Quick add task
    document.getElementById('quick-add-btn')?.addEventListener('click', () => {
      const projects = Projects.getAll();
      Tasks.showCreateModal(projects[0]?.id);
    });

    // Launch focus btn in topbar
    document.getElementById('launch-focus-btn')?.addEventListener('click', () => {
      const next = Tasks.getNextPriority();
      if (next) launchFocusMode(next.id);
      else _showView('focus');
    });

    // New project btn
    document.getElementById('new-project-btn')?.addEventListener('click', () => {
      Projects.showCreateModal();
    });

    // Help button — affiche le README.md rendu en HTML
    document.getElementById('help-btn')?.addEventListener('click', _showHelp);
    document.getElementById('help-close')?.addEventListener('click', () => {
      document.getElementById('help-overlay')?.classList.add('hidden');
    });
    document.getElementById('help-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
    });

    // Feedback button
    document.getElementById('feedback-btn')?.addEventListener('click', _showFeedbackModal);

    // Settings save
    document.getElementById('save-settings-btn')?.addEventListener('click', _saveSettings);

    // Reset all
    document.getElementById('reset-all-btn')?.addEventListener('click', () => {
      showConfirm('⚠ Supprimer TOUTES les données FlowMind ? Cette action est irréversible.', () => {
        _state = Storage.reset();
        Storage.save(_state);
        Config.init(_state);
        Gamification.init(_state, saveState);
        Projects.init(_state, saveState);
        Tasks.init(_state, saveState);
        Memos.init(_state, saveState);
        ICal.init(_state, saveState);
        Reports.init(_state);
        Projects.populateSelects();
        Gamification.renderSidebar();
        closeModal();
        setTimeout(() => { _showView('dashboard'); }, 50);
      });
    });

    // Reload demo data
    document.getElementById('load-demo-btn')?.addEventListener('click', () => {
      showConfirm('Remplacer toutes vos données par les données de démonstration ?', () => {
        _state = Storage.reset();
        _state = Demo.seed(_state);
        Storage.save(_state);
        // Réinitialiser les modules avec le nouvel état
        Config.init(_state);
        Gamification.init(_state, saveState);
        Projects.init(_state, saveState);
        Tasks.init(_state, saveState);
        Memos.init(_state, saveState);
        ICal.init(_state, saveState);
        Reports.init(_state);
        Projects.populateSelects();
        Gamification.renderSidebar();
        closeModal();
        // Petit délai pour laisser le DOM se stabiliser
        setTimeout(() => {
          _showView('dashboard');
        }, 50);
      });
    });

    // Load TNE project
    document.getElementById('load-tne-btn')?.addEventListener('click', () => {
      const doSeed = () => {
        // Supprimer les données TNE existantes
        const tneIds = ['seed_tne_drane', 'seed_pmb', 'seed_gar_dne'];
        _state.projects = (_state.projects || []).filter(p => !tneIds.includes(p.id));
        _state.tasks    = (_state.tasks    || []).filter(t => !tneIds.includes(t.projectId));
        _state.memos    = (_state.memos    || []).filter(m => !tneIds.includes(m.projectId));
        _state = SeedTNEDrane.seed(_state);
        Storage.save(_state);
        Projects.init(_state, saveState);
        Tasks.init(_state, saveState);
        Memos.init(_state, saveState);
        Projects.populateSelects();
        Gamification.renderSidebar();
        closeModal();
        setTimeout(() => { _showView('dashboard'); }, 50);
        _setBackupStatus('✓ Projet TNE-DRANE chargé (mémos + tâches réels)', 'var(--mint)');
      };
      if (!SeedTNEDrane.shouldSeed(_state)) {
        showConfirm('Le projet TNE-DRANE existe déjà. Voulez-vous le recréer ?', doSeed);
      } else {
        doSeed();
      }
    });

    // Export backup
    document.getElementById('export-backup-btn')?.addEventListener('click', () => {
      _exportBackup();
    });

    // Import backup
    document.getElementById('import-backup-input')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      _importBackup(file);
      e.target.value = ''; // reset input
    });
  }

  function _saveSettings() {
    const cfg = Config.readSettingsUI();
    Config.setAll(cfg);
    Object.assign(_state.config, cfg);
    saveState();
    const btn = document.getElementById('save-settings-btn');
    if (btn) { btn.textContent = '✓ Sauvegardé !'; setTimeout(() => btn.textContent = '💾 Sauvegarder', 1500); }
  }

  function _bindSettingsActions() {
    // Live preview of colors
    ['cfg-accent-color', 'cfg-success-color'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', (e) => {
        if (id === 'cfg-accent-color') Config.applyAccentColor ? Config.applyAccentColor(e.target.value) : null;
      });
    });

    // Pré-remplir le token s'il existe déjà
    const tokenInput = document.getElementById('cloud-token-input');
    if (tokenInput) tokenInput.value = Storage.getCloudToken();

    // Sauvegarder dans le cloud
    document.getElementById('cloud-save-btn')?.addEventListener('click', async () => {
      const t = document.getElementById('cloud-token-input')?.value.trim();
      if (t) Storage.setCloudToken(t);
      _setCloudStatus('⏳ Sauvegarde en cours…', 'var(--t3)');
      try {
        await Storage.saveToCloud(_state);
        _setCloudStatus('✓ Sauvegarde cloud réussie', 'var(--mint)');
      } catch (e) {
        _setCloudStatus('✗ Erreur : ' + e.message, 'var(--danger)');
      }
    });

    // Charger depuis le cloud
    document.getElementById('cloud-load-btn')?.addEventListener('click', async () => {
      const t = document.getElementById('cloud-token-input')?.value.trim();
      if (t) Storage.setCloudToken(t);
      _setCloudStatus('⏳ Chargement en cours…', 'var(--t3)');
      try {
        const backup = await Storage.loadFromCloud();
        _applyBackupData(backup);
        _setCloudStatus('✓ Données restaurées depuis le cloud', 'var(--mint)');
      } catch (e) {
        _setCloudStatus('✗ Erreur : ' + e.message, 'var(--danger)');
      }
    });

    // ── Sync fichier local (File System Access API) ──
    document.getElementById('nc-save-btn')?.addEventListener('click', async () => {
      if (!window.showSaveFilePicker) {
        _setNcStatus('✗ Non supporté par ce navigateur (utilisez Chrome ou Edge).', 'var(--danger)');
        return;
      }
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: 'flowmind-data.json',
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const content = JSON.stringify({ version: 'flowmind-backup-v1', exportedAt: new Date().toISOString(), data: _state }, null, 2);
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        _setNcStatus('✓ Fichier sauvegardé — Nextcloud le synchronisera automatiquement', 'var(--mint)');
      } catch (e) {
        if (e.name !== 'AbortError') _setNcStatus('✗ Erreur : ' + e.message, 'var(--danger)');
      }
    });

    document.getElementById('nc-load-btn')?.addEventListener('click', async () => {
      if (!window.showOpenFilePicker) {
        _setNcStatus('✗ Non supporté par ce navigateur (utilisez Chrome ou Edge).', 'var(--danger)');
        return;
      }
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        _applyBackupData(parsed);
        _setNcStatus('✓ Données restaurées depuis le fichier Nextcloud', 'var(--mint)');
      } catch (e) {
        if (e.name !== 'AbortError') _setNcStatus('✗ Erreur : ' + e.message, 'var(--danger)');
      }
    });
  }

  // ─── DASHBOARD ─────────────────────────────────────────────────────────

  function _renderDashboard() {
    // Date
    const today = new Date();
    const dateEl = document.getElementById('today-date');
    if (dateEl) dateEl.textContent = today.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    // Stats
    const allTasks = _state.tasks || [];
    const todayStr = today.toISOString().slice(0, 10);
    const doneTodayCount = (_state.completedHistory || [])
      .filter(h => h.completedAt?.slice(0, 10) === todayStr).length;
    const pendingCount = allTasks.filter(t => t.status === 'todo').length;
    const inprogressCount = allTasks.filter(t => t.status === 'inprogress').length;

    document.getElementById('stat-done').textContent = doneTodayCount;
    document.getElementById('stat-pending').textContent = pendingCount;
    const inprogressEl = document.getElementById('stat-inprogress');
    if (inprogressEl) inprogressEl.textContent = inprogressCount;

    // Barre quotidienne
    const totalToday = doneTodayCount + pendingCount;
    const pct = totalToday ? Math.round((doneTodayCount / totalToday) * 100) : 0;
    const dailyProg = document.getElementById('daily-progress');
    if (dailyProg) dailyProg.style.width = `${pct}%`;

    // Liste des tâches dashboard
    const nextDisplay = document.getElementById('next-task-display');
    if (nextDisplay) {
      _bindDashControls();
      _refreshDashList();
    }

    // Aperçu projets
    const ovList = document.getElementById('projects-overview-list');
    if (ovList) {
      ovList.innerHTML = '';
      const projects = Projects.getAll().filter(p => p.status !== 'done');
      if (!projects.length) {
        ovList.innerHTML = '<div class="empty-state">Créez votre premier projet.</div>';
      }
      projects.slice(0, 5).forEach(p => {
        const stats = Projects.getStats(p.id);
        const div = document.createElement('div');
        div.className = 'project-overview-item';
        div.innerHTML = `
          <div class="project-dot" style="background:${p.color}"></div>
          <div class="project-ov-name">${_esc(p.name)}</div>
          <div class="project-ov-count">${stats.done}/${stats.total}</div>
          <div class="project-ov-bar">
            <div class="progress-track" style="height:3px">
              <div class="progress-fill" style="width:${stats.pct}%;background:${p.color}"></div>
            </div>
          </div>`;
        ovList.appendChild(div);
      });
    }

    // Mémos épinglés
    const pinnedMemosEl = document.getElementById('dash-pinned-memos');
    if (pinnedMemosEl) Memos.renderPinnedMemos(pinnedMemosEl);

    // Récents accomplis
    const recentList = document.getElementById('recent-done-list');
    if (recentList) {
      recentList.innerHTML = '';
      const recent = (_state.completedHistory || []).slice(0, 6);
      if (!recent.length) {
        recentList.innerHTML = '<div class="empty-state">Aucune tâche accomplie encore.</div>';
      }
      recent.forEach(h => {
        const div = document.createElement('div');
        div.className = 'recent-done-item';
        div.innerHTML = `
          <span class="done-check">✓</span>
          <span>${_esc(h.title)}</span>
          <span class="done-time">${_formatRelativeTime(h.completedAt)}</span>`;
        recentList.appendChild(div);
      });
    }
  }

  // ─── FOCUS LAUNCHER ────────────────────────────────────────────────────

  function _renderFocusLauncher() {
    const filter = document.getElementById('focus-project-filter')?.value || 'all';
    const list = document.getElementById('focus-task-list');
    if (!list) return;
    list.innerHTML = '';

    Projects.populateSelects();

    let tasks = Tasks.getPending();
    if (filter !== 'all') tasks = tasks.filter(t => t.projectId === filter);

    // Trier par priorité
    const order = { high: 0, medium: 1, low: 2, none: 3 };
    tasks.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));

    if (!tasks.length) {
      list.innerHTML = '<div class="empty-state">Aucune tâche en attente 🎉</div>';
      return;
    }

    tasks.slice(0, 15).forEach(t => {
      const project = Projects.getById(t.projectId);
      const opt = document.createElement('div');
      opt.className = 'focus-task-option fade-in';
      opt.innerHTML = `
        <div class="fto-icon" style="color:${project?.color || 'var(--text-muted)'}">◈</div>
        <div class="fto-info">
          <div class="fto-title">${_esc(t.title)}</div>
          <div class="fto-sub">${project ? _esc(project.name) : ''} · ~${t.timeEstimate || 25}min ${t.subtasks?.length ? `· ${t.subtasks.filter(s=>!s.completedAt).length} étapes` : ''}</div>
        </div>
        <div class="fto-start">▶</div>`;
      opt.addEventListener('click', () => launchFocusMode(t.id));
      list.appendChild(opt);
    });

    // Bind filter change
    document.getElementById('focus-project-filter')?.addEventListener('change', _renderFocusLauncher);
  }

  // ─── FOCUS OVERLAY ─────────────────────────────────────────────────────

  function _bindFocusOverlay() {
    document.getElementById('exit-focus-btn')?.addEventListener('click', _exitFocus);
    document.getElementById('focus-skip-btn')?.addEventListener('click', _focusSkip);

  // Status buttons are now built dynamically in launchFocusMode
  }

  function launchFocusMode(taskId) {
    const task = Tasks.getById(taskId);
    if (!task) return;

    _focusTaskId = taskId;
    const project = Projects.getById(task.projectId);

    // Populate overlay
    document.getElementById('focus-project-tag').textContent = project?.name || 'Projet';
    document.getElementById('focus-task-title').textContent = task.title;

    // Subtasks
    const subArea = document.getElementById('focus-subtask-area');
    subArea.innerHTML = '';
    if (task.subtasks?.length) {
      // Déterminer la sous-tâche active : conserver la sélection précédente si elle existe encore et n'est pas terminée
      const existingSub = task.subtasks.find(s => s.id === _activeFocusSubtaskId && !s.completedAt);
      if (!existingSub) {
        const firstPending = task.subtasks.find(s => !s.completedAt);
        _activeFocusSubtaskId = firstPending ? firstPending.id : null;
      }

      task.subtasks.forEach((sub) => {
        const isActive = sub.id === _activeFocusSubtaskId;
        const item = document.createElement('div');
        item.className = `focus-subtask-item ${sub.completedAt ? 'done-sub' : ''} ${isActive ? 'active-sub' : ''}`;
        item.innerHTML = `
          <div class="subtask-check ${sub.completedAt ? 'checked' : ''}" data-sub="${sub.id}" title="Marquer comme terminé"></div>
          <span class="focus-sub-title">${_esc(sub.title)}</span>
          <span style="font-size:10px;color:var(--text-muted);margin-left:auto;font-family:var(--font-mono)">${sub.estimateMin}min</span>`;

        // Clic sur la checkbox → compléter la sous-tâche
        item.querySelector('[data-sub]').addEventListener('click', (e) => {
          e.stopPropagation();
          Tasks.completeSubtask(taskId, sub.id);
          saveState();
          launchFocusMode(taskId);
        });

        // Clic sur le titre ou la ligne → définir comme sous-tâche active (sauf si déjà terminée)
        if (!sub.completedAt) {
          item.querySelector('.focus-sub-title').addEventListener('click', (e) => {
            e.stopPropagation();
            _activeFocusSubtaskId = sub.id;
            launchFocusMode(taskId);
          });
          item.style.cursor = 'pointer';
        }

        subArea.appendChild(item);
      });
    }

    // Timer duration — ne pas réinitialiser si le timer tourne déjà
    if (!Timer.isRunning()) {
      const defaultMin = Config.get('pomodoroMin') || 25;
      Timer.setDuration(defaultMin);
    }

    // Project progress
    const stats = Projects.getStats(task.projectId);
    const progEl = document.getElementById('focus-project-progress');
    if (progEl) progEl.style.width = `${stats.pct}%`;

    // Show overlay
    document.getElementById('focus-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Boutons statut focus
    _rebuildFocusStatusBtns(task.status || 'todo');
  }

  function _rebuildFocusStatusBtns(currentStatus) {
    const wrap = document.querySelector('.focus-status-btns');
    if (!wrap) return;
    wrap.innerHTML = '';
    wrap.appendChild(
      Tasks.buildStatusButtons(currentStatus, (newStatus) => {
        Tasks.setStatus(_focusTaskId, newStatus);
        App.saveState();
        _rebuildFocusStatusBtns(newStatus);
        if (newStatus === 'done') setTimeout(_exitFocus, 700);
      }, 'focus')
    );
  }

  function _exitFocus() {
    document.getElementById('focus-overlay').classList.add('hidden');
    document.body.style.overflow = '';
    Timer.stop();
    _focusTaskId = null;
    _activeFocusSubtaskId = null;
    refresh();
  }

  function _focusSkip() {
    _exitFocus();
    // Trouver la tâche suivante
    const next = Tasks.getPending().find(t => t.id !== _focusTaskId);
    if (next) {
      setTimeout(() => launchFocusMode(next.id), 300);
    }
  }

  function _onTimerEnd() {
    Gamification.showReward('⏰', 'Session terminée !', 'Faites une pause méritée.');
    const notifEnabled = Config.get('notifications');
    if (notifEnabled && 'Notification' in window) {
      Notification.requestPermission().then(p => {
        if (p === 'granted') {
          new Notification('FlowMind — Session terminée !', {
            body: 'Excellent travail. Prenez une courte pause.',
            icon: ''
          });
        }
      });
    }
  }

  // ─── FEEDBACK ──────────────────────────────────────────────────────────

  function _showFeedbackModal() {
    showModal('💬 Feedback d\'usage', `
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">
        Partagez ce qui a fonctionné ou non. Ce feedback sera utilisé pour améliorer l'application lors de la prochaine session.
      </p>
      <div class="form-group">
        <label>Ce qui a bien fonctionné ✅</label>
        <textarea class="glass-input" id="fb-good" rows="3" placeholder="Ex: Le mode focus m'aide vraiment à démarrer…" style="resize:vertical"></textarea>
      </div>
      <div class="form-group">
        <label>Ce qui peut être amélioré ⚠</label>
        <textarea class="glass-input" id="fb-improve" rows="3" placeholder="Ex: La décomposition automatique ne couvre pas mon domaine…" style="resize:vertical"></textarea>
      </div>
      <div class="form-group">
        <label>Suggestions ou idées 💡</label>
        <textarea class="glass-input" id="fb-ideas" rows="2" placeholder="Ex: Ajouter une intégration avec Notion…" style="resize:vertical"></textarea>
      </div>
    `, [
      { label: 'Fermer', cls: 'btn-secondary', action: closeModal },
      { label: '💾 Enregistrer & Exporter', cls: 'btn-primary', action: () => {
        const entry = {
          date: new Date().toISOString(),
          good: document.getElementById('fb-good').value,
          improve: document.getElementById('fb-improve').value,
          ideas: document.getElementById('fb-ideas').value
        };
        _state.feedbacks = _state.feedbacks || [];
        _state.feedbacks.push(entry);
        saveState();

        // Export
        const md = `# Feedback FlowMind — ${new Date().toLocaleDateString('fr-FR')}\n\n`
          + `## ✅ Ce qui fonctionne bien\n${entry.good}\n\n`
          + `## ⚠ Points à améliorer\n${entry.improve}\n\n`
          + `## 💡 Suggestions\n${entry.ideas}\n`;

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `feedback-flowmind-${new Date().toISOString().slice(0,10)}.md`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);

        closeModal();
        alert('Feedback enregistré. Partagez ce fichier lors de votre prochaine session !');
      }}
    ]);
  }

  // ─── MODAL SYSTEM ──────────────────────────────────────────────────────

  function showModal(title, bodyHTML, buttons = []) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;

    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';
    buttons.forEach(btn => {
      const el = document.createElement('button');
      el.className = btn.cls || 'btn-secondary';
      el.textContent = btn.label;
      el.addEventListener('click', btn.action);
      footer.appendChild(el);
    });

    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal-overlay').onclick = (e) => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    };
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  function showConfirm(message, onConfirm) {
    showModal('⚠ Confirmation', `<p style="font-size:14px;color:var(--text-secondary)">${message}</p>`, [
      { label: 'Annuler', cls: 'btn-secondary', action: closeModal },
      { label: 'Confirmer', cls: 'btn-danger', action: () => { closeModal(); onConfirm(); } }
    ]);
  }

  // ─── REPORTS SELECT ────────────────────────────────────────────────────

  function _populateReportSelects() {
    const sel = document.getElementById('report-project-filter');
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    Projects.getAll().forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────

  function refresh() {
    Projects.populateSelects();
    Gamification.renderSidebar();
    const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
    if (currentView) _showView(currentView);
  }

  function saveState() {
    Storage.save(_state);
  }

  function _formatRelativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const min  = Math.floor(diff / 60000);
    const h    = Math.floor(min / 60);
    const d    = Math.floor(h / 24);
    if (d > 0)  return `il y a ${d}j`;
    if (h > 0)  return `il y a ${h}h`;
    if (min > 0) return `il y a ${min}min`;
    return 'à l\'instant';
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }



  /* ═══════════════════════════════════════════════
     FlowMind v5 — Dashboard Task List
  ═══════════════════════════════════════════════ */

  function _bindDashControls() {
    const ids = ['dash-task-sort', 'dash-task-filter', 'dash-task-count'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el && !el._bound) {
        el._bound = true;
        el.addEventListener('change', _refreshDashList);
      }
    });

    // Recherche enrichie via Search module
    if (typeof Search !== 'undefined') {
      Search.setupSearchInput({
        inputId:         'dash-search',
        modeToggleId:    'dash-search-mode-btn',
        floatResultsId:  'dash-search-results',
        inlineResultsId: 'dash-search-results-inline',
        contentId:       'next-task-display',
        getState:        () => _state,
      });
    }
  }

  function _refreshDashList() {
    const container = document.getElementById('next-task-display');
    if (!container) return;
    const maxCount = parseInt(document.getElementById('dash-task-count')?.value || '10');
    const sortBy   = document.getElementById('dash-task-sort')?.value || 'status';
    const filterBy = document.getElementById('dash-task-filter')?.value || 'all';
    _renderDashTaskList(container, maxCount, sortBy, filterBy);
  }

  function _renderDashTaskList(container, maxCount, sortBy, filterBy) {
    container.innerHTML = '';
    maxCount  = maxCount  || 10;
    sortBy    = sortBy    || 'status';
    filterBy  = filterBy  || 'all';

    let tasks = [...(_state.tasks || [])];

    // Filtre statut
    if (filterBy !== 'all') {
      tasks = tasks.filter(t => t.status === filterBy);
    }

    // Tri
    const prioOrder   = { high:0, medium:1, low:2, none:3 };
    const statusOrder = { inprogress:0, todo:1, deferred:2, done:3 };

    tasks.sort((a, b) => {
      if (sortBy === 'status') {
        const s = (statusOrder[a.status]??1) - (statusOrder[b.status]??1);
        if (s !== 0) return s;
        return (prioOrder[a.priority]??3) - (prioOrder[b.priority]??3);
      }
      if (sortBy === 'priority') {
        const p = (prioOrder[a.priority]??3) - (prioOrder[b.priority]??3);
        if (p !== 0) return p;
        return (statusOrder[a.status]??1) - (statusOrder[b.status]??1);
      }
      if (sortBy === 'due') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'project') {
        const pa = Projects.getById(a.projectId)?.name || '';
        const pb = Projects.getById(b.projectId)?.name || '';
        return pa.localeCompare(pb, 'fr');
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt||0) - new Date(a.createdAt||0);
      }
      return 0;
    });

    const toShow = tasks.slice(0, maxCount);

    if (!toShow.length) {
      container.innerHTML = '<div class="dash-empty">Aucune tâche à afficher pour ce filtre.</div>';
      return;
    }

    // Grouper par statut si tri=status
    if (sortBy === 'status') {
      const groups = { inprogress:[], todo:[], deferred:[], done:[] };
      toShow.forEach(t => { (groups[t.status] || groups.todo).push(t); });
      const groupLabels = { inprogress:'◑ En cours', todo:'○ À faire', deferred:'◷ Reporté', done:'● Terminé' };
      ['inprogress','todo','deferred','done'].forEach(status => {
        if (!groups[status].length) return;
        const sep = document.createElement('div');
        sep.className = 'dash-group-sep';
        sep.textContent = groupLabels[status] + ' (' + groups[status].length + ')';
        container.appendChild(sep);
        groups[status].forEach(t => container.appendChild(_buildDashTaskRow(t)));
      });
    } else {
      toShow.forEach(t => container.appendChild(_buildDashTaskRow(t)));
    }

    // Compteur en bas
    if (tasks.length > maxCount) {
      const more = document.createElement('div');
      more.className = 'dash-empty';
      more.textContent = (tasks.length - maxCount) + ' tâche(s) supplémentaire(s) — augmentez le nombre affiché';
      container.appendChild(more);
    }
  }

  function _buildDashTaskRow(task) {
    const project = Projects.getById(task.projectId);
    const row = document.createElement('div');
    row.className = 'dash-task-row row-' + task.status + ' fade-in';
    row.dataset.taskId = task.id;

    const prioColors = { high:'var(--danger)', medium:'var(--amber)', low:'var(--mint)', none:'transparent' };
    const prioColor  = prioColors[task.priority] || 'transparent';
    const dueStr     = task.dueDate ? _formatDate(task.dueDate) : '';

    row.innerHTML =
      '<div class="dash-task-info">' +
        '<div class="dash-task-title">' + _esc(task.title) + '</div>' +
        '<div class="dash-task-meta">' +
          (project ? '<span class="dash-task-project" style="color:' + project.color + '">' + _esc(project.name) + '</span>' : '') +
          (task.priority !== 'none' ? '<span style="width:6px;height:6px;border-radius:50%;background:' + prioColor + ';display:inline-block;flex-shrink:0"></span>' : '') +
          (dueStr ? '<span style="font-size:10px;color:var(--t3);font-family:monospace">' + dueStr + '</span>' : '') +
        '</div>' +
      '</div>' +
      '';

    // Clic titre → focus
    row.querySelector('.dash-task-info').style.cursor = 'pointer';
    row.querySelector('.dash-task-info').addEventListener('click', () => App.launchFocusMode(task.id));

    // Boutons statut via module unifié
    const statusContainer = document.createElement('div');
    statusContainer.className = 'dash-status-btns';
    statusContainer.appendChild(
      Tasks.buildStatusButtons(task.status, (newStatus) => {
        row.classList.add('status-changing');
        setTimeout(() => row.classList.remove('status-changing'), 400);
        Tasks.setStatus(task.id, newStatus);
        App.saveState();
        App.refresh();
      }, 'normal')
    );
    row.appendChild(statusContainer);

    return row;
  }

  function _formatDate(iso) {
    if (!iso) return '';
    const d   = new Date(iso);
    const now = new Date();
    const diff = Math.ceil((d - now) / 86400000);
    if (diff < 0)  return '⚠ ' + d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ═══════════════════════════════════════════════
     FlowMind v8 — Sauvegarde & Restauration
  ═══════════════════════════════════════════════ */

  function _exportBackup() {
    try {
      const backup = {
        version:     'flowmind-backup-v1',
        exportedAt:  new Date().toISOString(),
        exportedBy:  'FlowMind',
        data:        _state
      };

      const json     = JSON.stringify(backup, null, 2);
      const blob     = new Blob([json], { type: 'application/json' });
      const url      = URL.createObjectURL(blob);
      const dateStr  = new Date().toISOString().slice(0, 10);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = 'flowmind-backup-' + dateStr + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      _setBackupStatus('✓ Sauvegarde exportée avec succès', 'var(--mint)');
    } catch (e) {
      _setBackupStatus('✗ Erreur lors de l\'export : ' + e.message, 'var(--danger)');
    }
  }

  function _applyBackupData(parsed) {
    if (!parsed.version || !parsed.version.startsWith('flowmind-backup')) {
      throw new Error('Format de sauvegarde non reconnu.');
    }
    if (!parsed.data || !Array.isArray(parsed.data.projects)) {
      throw new Error('Données manquantes ou corrompues.');
    }

    const exportDate = parsed.exportedAt
      ? new Date(parsed.exportedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'date inconnue';

    const nbProjects = parsed.data.projects?.length || 0;
    const nbTasks    = parsed.data.tasks?.length || 0;

    showConfirm(
      'Restaurer la sauvegarde du ' + exportDate + ' ?\n(' + nbProjects + ' projets, ' + nbTasks + ' tâches)\n\nVos données actuelles seront remplacées.',
      () => {
        const defaults = Storage.DEFAULT_STATE;
        _state = Object.assign({}, defaults, parsed.data);
        _state.config = Object.assign({}, defaults.config, parsed.data.config || {});

        Storage.save(_state);

        Config.init(_state);
        Gamification.init(_state, saveState);
        Projects.init(_state, saveState);
        Tasks.init(_state, saveState);
        Memos.init(_state, saveState);
        ICal.init(_state, saveState);
        Reports.init(_state);
        Projects.populateSelects();
        Gamification.renderSidebar();
        setTimeout(() => { _showView('dashboard'); }, 50);
      }
    );
  }

  function _importBackup(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        _applyBackupData(parsed);
        _setBackupStatus('✓ Sauvegarde restaurée', 'var(--mint)');
      } catch (e) {
        _setBackupStatus('✗ Fichier invalide : ' + e.message, 'var(--danger)');
      }
    };
    reader.onerror = () => _setBackupStatus('✗ Impossible de lire le fichier.', 'var(--danger)');
    reader.readAsText(file);
  }

  function _setBackupStatus(msg, color) {
    const el = document.getElementById('backup-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = color || 'var(--mint)';
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 5000);
  }

  function _setCloudStatus(msg, color) {
    const el = document.getElementById('cloud-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = color || 'var(--mint)';
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 6000);
  }

  function _setNcStatus(msg, color) {
    const el = document.getElementById('nc-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = color || 'var(--mint)';
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 6000);
  }

  async function _showHelp() {
    const overlay = document.getElementById('help-overlay');
    const body    = document.getElementById('help-body');
    if (!overlay || !body) return;
    overlay.classList.remove('hidden');
    if (body.dataset.loaded) return; // déjà chargé
    body.innerHTML = '<p style="color:var(--t3);padding:20px 0">Chargement…</p>';
    try {
      const resp = await fetch('./README.md');
      if (!resp.ok) throw new Error('README introuvable');
      const md = await resp.text();
      body.innerHTML = window.marked ? marked.parse(md) : '<pre style="white-space:pre-wrap">' + md + '</pre>';
      body.dataset.loaded = '1';
      _styleHelpBody(body);
    } catch (e) {
      body.innerHTML = '<p style="color:var(--danger)">Impossible de charger la documentation : ' + e.message + '</p>';
    }
  }

  function _styleHelpBody(el) {
    // Titres
    el.querySelectorAll('h1').forEach(h => { h.style.cssText = 'font-size:20px;font-weight:700;margin:0 0 12px;color:var(--t1)'; });
    el.querySelectorAll('h2').forEach(h => { h.style.cssText = 'font-size:15px;font-weight:700;margin:20px 0 8px;color:var(--accent);border-bottom:1px solid var(--glass-border);padding-bottom:4px'; });
    el.querySelectorAll('h3').forEach(h => { h.style.cssText = 'font-size:13px;font-weight:600;margin:14px 0 6px;color:var(--t1)'; });
    el.querySelectorAll('h4').forEach(h => { h.style.cssText = 'font-size:12px;font-weight:600;margin:10px 0 4px;color:var(--t2)'; });
    // Paragraphes & listes
    el.querySelectorAll('p').forEach(p => { p.style.cssText = 'font-size:13px;color:var(--t2);margin:0 0 8px'; });
    el.querySelectorAll('li').forEach(li => { li.style.cssText = 'font-size:13px;color:var(--t2);margin:3px 0'; });
    el.querySelectorAll('ul,ol').forEach(l => { l.style.cssText = 'padding-left:18px;margin:4px 0 10px'; });
    // Blocs de code
    el.querySelectorAll('pre').forEach(pre => { pre.style.cssText = 'background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:8px;padding:12px;font-size:11px;overflow-x:auto;margin:8px 0'; });
    el.querySelectorAll('code:not(pre code)').forEach(c => { c.style.cssText = 'background:rgba(79,142,255,0.12);border-radius:4px;padding:1px 5px;font-size:11px;font-family:"JetBrains Mono",monospace;color:var(--accent)'; });
    // Tableaux
    el.querySelectorAll('table').forEach(t => { t.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;margin:8px 0 14px'; });
    el.querySelectorAll('th').forEach(th => { th.style.cssText = 'text-align:left;padding:6px 10px;background:rgba(255,255,255,0.05);color:var(--t3);font-weight:600;border-bottom:1px solid var(--glass-border)'; });
    el.querySelectorAll('td').forEach(td => { td.style.cssText = 'padding:6px 10px;border-bottom:1px solid rgba(255,255,255,0.04);color:var(--t2)'; });
    // Liens
    el.querySelectorAll('a').forEach(a => { a.style.cssText = 'color:var(--accent);text-decoration:none'; a.target = '_blank'; });
    // Séparateurs
    el.querySelectorAll('hr').forEach(hr => { hr.style.cssText = 'border:none;border-top:1px solid var(--glass-border);margin:16px 0'; });
    // Blockquotes
    el.querySelectorAll('blockquote').forEach(bq => { bq.style.cssText = 'border-left:3px solid var(--accent-border);padding:6px 12px;margin:8px 0;background:rgba(79,142,255,0.05);border-radius:0 6px 6px 0'; });
  }

  return { init, refresh, saveState, showModal, closeModal, showConfirm, launchFocusMode };
})();

// ── BOOTSTRAP ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', App.init);