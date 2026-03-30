/* ══════════════════════════════════════════════════
   Search — Moteur de recherche catégorisé FlowMind
   ══════════════════════════════════════════════════ */
const Search = (() => {

  const MODE_KEY = 'fm_search_mode';

  function getMode() {
    return localStorage.getItem(MODE_KEY) || 'float';
  }
  function setMode(m) {
    localStorage.setItem(MODE_KEY, m);
  }

  /* ── Échappement HTML sécurisé ─────────────────── */
  function _esc(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Surlignage de l'occurrence ────────────────── */
  function highlight(text, query) {
    if (!text || !query) return _esc(text || '');
    const escaped = _esc(text);
    const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(escapedQ, 'gi'), m => `<mark>${m}</mark>`);
  }

  /* ── Extrait centré sur l'occurrence (mémos) ───── */
  function _excerpt(text, query, maxLen) {
    maxLen = maxLen || 120;
    if (!text) return '';
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return _esc(text.slice(0, maxLen));
    const start = Math.max(0, idx - 30);
    const end   = Math.min(text.length, idx + query.length + 60);
    const raw = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    return highlight(raw, query);
  }

  /* ── Libellé de statut ─────────────────────────── */
  function _statusLabel(s) {
    return { todo: '○ À faire', inprogress: '◑ En cours', deferred: '◷ Reporté', done: '● Terminé' }[s] || s;
  }
  function _statusCls(s) {
    return `sr-status sr-status-${s || 'todo'}`;
  }

  /* ── Formatage de date courte ──────────────────── */
  function _fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  /* ════════════════════════════════════════════════
     run(query, state)
     Retourne { projects, tasks, subtasks, memos }
     ════════════════════════════════════════════════ */
  function run(query, state) {
    const q = (query || '').trim().toLowerCase();
    const result = { projects: [], tasks: [], subtasks: [], memos: [] };
    if (!q || !state) return result;

    // Projets
    (state.projects || []).forEach(p => {
      if (p.name?.toLowerCase().includes(q)) result.projects.push(p);
    });

    // Tâches et sous-tâches
    (state.tasks || []).forEach(t => {
      const titleMatch = t.title?.toLowerCase().includes(q);
      const descMatch  = t.description?.toLowerCase().includes(q);
      if (titleMatch || descMatch) {
        result.tasks.push(t);
      }
      // Sous-tâches
      (t.subtasks || []).forEach(s => {
        if (s.title?.toLowerCase().includes(q)) {
          result.subtasks.push({ subtask: s, parentTask: t });
        }
      });
    });

    // Mémos
    (state.memos || []).forEach(m => {
      if (m.text?.toLowerCase().includes(q)) result.memos.push(m);
    });

    return result;
  }

  /* ════════════════════════════════════════════════
     renderResults(results, query, container, mode, state)
     mode: 'float' | 'inline'
     ════════════════════════════════════════════════ */
  function renderResults(results, query, container, mode, state) {
    container.innerHTML = '';
    container.className = `search-results sr-visible sr-mode-${mode}`;

    const total = results.projects.length + results.tasks.length +
                  results.subtasks.length + results.memos.length;

    if (!total) {
      container.innerHTML = '<div class="sr-empty">Aucun résultat pour cette recherche.</div>';
      return;
    }

    const getProj = id => (state?.projects || []).find(p => p.id === id);

    // ── Groupe PROJETS ──────────────────────────────
    if (results.projects.length) {
      container.appendChild(_groupSep('Projets', results.projects.length));
      results.projects.forEach(p => {
        container.appendChild(_buildProjectItem(p, query));
      });
    }

    // ── Groupe TÂCHES ───────────────────────────────
    if (results.tasks.length) {
      container.appendChild(_groupSep('Tâches', results.tasks.length));
      results.tasks.forEach(t => {
        container.appendChild(_buildTaskItem(t, query, getProj(t.projectId)));
      });
    }

    // ── Groupe SOUS-TÂCHES ──────────────────────────
    if (results.subtasks.length) {
      container.appendChild(_groupSep('Sous-tâches', results.subtasks.length));
      results.subtasks.forEach(({ subtask, parentTask }) => {
        container.appendChild(_buildSubtaskItem(subtask, parentTask, query, getProj(parentTask.projectId)));
      });
    }

    // ── Groupe MÉMOS ────────────────────────────────
    if (results.memos.length) {
      container.appendChild(_groupSep('Mémos', results.memos.length));
      results.memos.forEach(m => {
        container.appendChild(_buildMemoItem(m, query, getProj(m.projectId)));
      });
    }
  }

  /* ── Séparateur de groupe ──────────────────────── */
  function _groupSep(label, count) {
    const div = document.createElement('div');
    div.className = 'sr-group-sep';
    div.innerHTML = `${label} <span class="sr-count">${count}</span>`;
    return div;
  }

  /* ── Navigation vers un résultat ──────────────── */
  function _navigateToResult(type, id, parentId, projId, closeSearch) {
    closeSearch();

    if (type === 'task') {
      if (typeof Tasks !== 'undefined') Tasks.showEditModal(id);

    } else if (type === 'subtask') {
      if (typeof Tasks !== 'undefined') Tasks.showEditModal(parentId);

    } else if (type === 'project') {
      const navBtn = document.querySelector('.nav-item[data-view="projects"]');
      if (navBtn) navBtn.click();
      // Attendre que la vue se rende
      setTimeout(() => {
        const card = document.querySelector(`[data-project-id="${id}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('sr-flash');
          setTimeout(() => card.classList.remove('sr-flash'), 1200);
        }
      }, 150);

    } else if (type === 'memo') {
      const navBtn = document.querySelector('.nav-item[data-view="projects"]');
      if (navBtn) navBtn.click();
      setTimeout(() => {
        const card = document.querySelector(`[data-project-id="${projId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('sr-flash');
          setTimeout(() => card.classList.remove('sr-flash'), 1200);
          // Ouvrir le panneau mémos s'il est fermé
          const memoBtn = card.querySelector(`.btn-memo-toggle[data-id="${projId}"]`);
          const memoBoard = card.querySelector(`#memos-board-top-${projId}`);
          if (memoBtn && memoBoard && memoBoard.classList.contains('hidden')) {
            memoBtn.click();
          }
        }
      }, 150);
    }
  }

  /* ── Carte projet ──────────────────────────────── */
  function _buildProjectItem(project, query) {
    const item = document.createElement('div');
    item.className = 'sr-item sr-clickable';
    item.dataset.srType = 'project';
    item.dataset.srId = project.id;
    item.innerHTML = `
      <div class="sr-item-bar" style="background:${_esc(project.color || '#4f8eff')}"></div>
      <div class="sr-item-body">
        <span class="sr-badge sr-badge-project">Projet</span>
        <div class="sr-item-title">${highlight(project.name, query)}</div>
        <div class="sr-item-meta">
          <span class="sr-status ${_statusCls(project.status)}">${project.status === 'active' ? 'Actif' : project.status === 'paused' ? 'En pause' : 'Terminé'}</span>
        </div>
      </div>`;
    return item;
  }

  /* ── Carte tâche ───────────────────────────────── */
  function _buildTaskItem(task, query, proj) {
    const item = document.createElement('div');
    item.className = 'sr-item sr-clickable';
    item.dataset.srType = 'task';
    item.dataset.srId = task.id;
    item.dataset.srProject = task.projectId || '';
    const due = task.dueDate ? `<span class="sr-dot">·</span><span class="sr-due">${_fmtDate(task.dueDate)}</span>` : '';
    item.innerHTML = `
      <div class="sr-item-bar" style="background:${_esc(proj?.color || '#4f8eff')}"></div>
      <div class="sr-item-body">
        <span class="sr-badge sr-badge-task">Tâche</span>
        <div class="sr-item-title">${highlight(task.title, query)}</div>
        <div class="sr-item-meta">
          <span class="sr-proj">📁 ${_esc(proj?.name || '—')}</span>
          <span class="sr-dot">·</span>
          <span class="${_statusCls(task.status)}">${_statusLabel(task.status)}</span>
          ${due}
        </div>
      </div>`;
    return item;
  }

  /* ── Carte sous-tâche ──────────────────────────── */
  function _buildSubtaskItem(subtask, parentTask, query, proj) {
    const item = document.createElement('div');
    item.className = 'sr-item sr-clickable';
    item.dataset.srType = 'subtask';
    item.dataset.srId = subtask.id || '';
    item.dataset.srParent = parentTask.id;
    item.dataset.srProject = parentTask.projectId || '';
    item.innerHTML = `
      <div class="sr-item-bar" style="background:${_esc(proj?.color || '#60a5fa')}"></div>
      <div class="sr-item-body">
        <span class="sr-badge sr-badge-subtask">Sous-tâche</span>
        <div class="sr-item-parent">↳ ${_esc(parentTask.title)}</div>
        <div class="sr-item-title">${highlight(subtask.title, query)}</div>
        <div class="sr-item-meta">
          <span class="sr-proj">📁 ${_esc(proj?.name || '—')}</span>
          <span class="sr-dot">·</span>
          <span class="${_statusCls(subtask.status)}">${_statusLabel(subtask.status)}</span>
        </div>
      </div>`;
    return item;
  }

  /* ── Carte mémo ────────────────────────────────── */
  function _buildMemoItem(memo, query, proj) {
    const item = document.createElement('div');
    item.className = 'sr-item sr-clickable';
    item.dataset.srType = 'memo';
    item.dataset.srId = memo.id || '';
    item.dataset.srProject = memo.projectId || '';
    item.innerHTML = `
      <div class="sr-item-bar" style="background:${_esc(proj?.color || '#fbbf24')}"></div>
      <div class="sr-item-body">
        <span class="sr-badge sr-badge-memo">Mémo</span>
        <div class="sr-memo-excerpt">${_excerpt(memo.text, query)}</div>
        <div class="sr-item-meta">
          <span class="sr-proj">📁 ${_esc(proj?.name || '—')}</span>
        </div>
      </div>`;
    return item;
  }

  /* ════════════════════════════════════════════════
     setupSearchInput
     opts: {
       inputId        — champ de saisie
       modeToggleId   — bouton bascule
       floatResultsId — container dans .search-wrap (mode flottant)
       inlineResultsId— container hors .search-wrap (mode inline)
       contentId      — zone de contenu à masquer en mode inline
       getState       — fn() → _state
     }
     ════════════════════════════════════════════════ */
  function setupSearchInput(opts) {
    const input     = document.getElementById(opts.inputId);
    const modeBtn   = document.getElementById(opts.modeToggleId);
    const floatEl   = document.getElementById(opts.floatResultsId);
    const inlineEl  = document.getElementById(opts.inlineResultsId);
    const contentEl = document.getElementById(opts.contentId);
    if (!input) return;

    function _clear(el) {
      if (!el) return;
      el.className = 'search-results';
      el.innerHTML = '';
    }

    function _syncModeBtn() {
      const m = getMode();
      if (modeBtn) {
        modeBtn.title       = m === 'float' ? 'Passer en mode inline' : 'Passer en mode flottant';
        modeBtn.textContent = m === 'float' ? '⊟' : '⊞';
      }
    }

    function _doSearch() {
      const q = input.value.trim().toLowerCase();

      // Vider les deux containers
      _clear(floatEl);
      _clear(inlineEl);

      if (!q) {
        // Restaurer le contenu normal
        if (contentEl) contentEl.style.display = '';
        return;
      }

      const mode    = getMode();
      const state   = opts.getState();
      const results = run(q, state);

      if (mode === 'float') {
        if (contentEl) contentEl.style.display = '';   // garde le contenu visible
        if (floatEl) renderResults(results, q, floatEl, 'float', state);
      } else {
        if (contentEl) contentEl.style.display = 'none'; // masque le contenu
        if (inlineEl) renderResults(results, q, inlineEl, 'inline', state);
      }
    }

    // Listener frappe
    if (!input._searchBound) {
      input._searchBound = true;
      input.addEventListener('input', _doSearch);
      input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { input.value = ''; _doSearch(); input.blur(); }
      });
    }

    // Bascule de mode
    if (modeBtn && !modeBtn._searchBound) {
      modeBtn._searchBound = true;
      modeBtn.addEventListener('click', () => {
        setMode(getMode() === 'float' ? 'inline' : 'float');
        _syncModeBtn();
        if (input.value.trim()) _doSearch();
      });
    }

    // Fermeture panneau flottant au clic extérieur
    if (floatEl && !floatEl._outsideBound) {
      floatEl._outsideBound = true;
      document.addEventListener('click', e => {
        if (getMode() !== 'float') return;
        const wrap = input.closest('.search-wrap');
        if (wrap && wrap.contains(e.target)) return;
        _clear(floatEl);
      });
    }

    // Clic sur un résultat → navigation
    function _bindResultClicks(container) {
      if (!container || container._clickBound) return;
      container._clickBound = true;
      container.addEventListener('click', e => {
        const item = e.target.closest('.sr-clickable');
        if (!item) return;
        const { srType, srId, srParent, srProject } = item.dataset;
        _navigateToResult(srType, srId, srParent, srProject, () => {
          input.value = '';
          _clear(floatEl);
          _clear(inlineEl);
          if (contentEl) contentEl.style.display = '';
        });
      });
    }
    _bindResultClicks(floatEl);
    _bindResultClicks(inlineEl);

    _syncModeBtn();
  }

  return { run, renderResults, setupSearchInput, getMode, setMode };
})();
