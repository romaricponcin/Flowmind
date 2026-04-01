/**
 * FlowMind — Projects Module
 * CRUD projets, rendu, couleurs
 */

const Projects = (() => {
  let _state = null;
  let _onUpdate = null;

  const PROJECT_COLORS = [
    '#00d4ff', '#a78bfa', '#f59e0b', '#10b981',
    '#f472b6', '#60a5fa', '#34d399', '#fb923c'
  ];

  function init(state, onUpdate) {
    _state = state;
    _onUpdate = onUpdate;
    _migrateData();
  }

  function _migrateData() {
    if (!_state) return;
    let changed = false;
    (_state.projects || []).forEach(p => {
      if (!p.status) { p.status = 'active'; changed = true; }
      if (!p.tags)   { p.tags   = [];       changed = true; }
    });
    if (changed && _onUpdate) _onUpdate();
  }

  function getAll() {
    return _state ? _state.projects : [];
  }

  function getById(id) {
    return _state?.projects.find(p => p.id === id) || null;
  }

  function create(name, color) {
    if (!_state || !name.trim()) return null;
    const project = {
      id: Storage.generateId(),
      name: name.trim(),
      color: color || PROJECT_COLORS[_state.projects.length % PROJECT_COLORS.length],
      status: 'active',
      tags: [],
      createdAt: new Date().toISOString()
    };
    _state.projects.push(project);
    if (_onUpdate) _onUpdate();
    return project;
  }

  function update(id, changes) {
    if (!_state) return;
    const idx = _state.projects.findIndex(p => p.id === id);
    if (idx < 0) return;
    Object.assign(_state.projects[idx], changes);
    if (_onUpdate) _onUpdate();
  }

  function remove(id) {
    if (!_state) return;
    _state.projects = _state.projects.filter(p => p.id !== id);
    // Supprimer les tâches associées
    _state.tasks = _state.tasks.filter(t => t.projectId !== id);
    if (_onUpdate) _onUpdate();
  }

  function getStats(projectId) {
    if (!_state) return { total: 0, done: 0, pct: 0 };
    const tasks = _state.tasks.filter(t => t.projectId === projectId);
    const done  = tasks.filter(t => t.status === 'done').length;
    return {
      total: tasks.length,
      done,
      pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0
    };
  }

  function _bindProjectControls() {
    ['projects-sort', 'projects-filter', 'projects-tag-filter'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el._bound) {
        el._bound = true;
        el.addEventListener('change', renderProjectsView);
      }
    });

    // Recherche enrichie via Search module
    if (typeof Search !== 'undefined') {
      Search.setupSearchInput({
        inputId:         'projects-search',
        modeToggleId:    'projects-search-mode-btn',
        floatResultsId:  'projects-search-results-float',
        inlineResultsId: 'projects-search-results-inline',
        contentId:       'projects-list',
        getState:        () => _state,
      });
    }
  }

  function _populateTagFilter(currentTag) {
    const sel = document.getElementById('projects-tag-filter');
    if (!sel) return;
    // Collecter tous les tags uniques triés
    const allTags = [...new Set(
      (_state?.projects || []).flatMap(p => p.tags || [])
    )].sort((a, b) => a.localeCompare(b));
    // Reconstruire les options
    sel.innerHTML = '<option value="">🏷 Tous les tags</option>';
    allTags.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === currentTag) opt.selected = true;
      sel.appendChild(opt);
    });
    // Masquer le select s'il n'y a aucun tag
    sel.style.display = allTags.length ? '' : 'none';
  }

  function renderProjectsView() {
    const container = document.getElementById('projects-list');
    if (!container || !_state) return;
    _bindProjectControls();
    container.innerHTML = '';

    const sortBy   = document.getElementById('projects-sort')?.value       || 'status';
    const filterBy = document.getElementById('projects-filter')?.value     || 'all';
    const tagFilter= document.getElementById('projects-tag-filter')?.value || '';

    // Peupler le select de tags avec tous les tags existants
    _populateTagFilter(tagFilter);

    let projects = filterBy === 'all'
      ? [..._state.projects]
      : _state.projects.filter(p => (p.status || 'active') === filterBy);

    if (tagFilter) {
      projects = projects.filter(p => (p.tags || []).includes(tagFilter));
    }

    if (!projects.length) {
      container.innerHTML = '<div class="empty-state">Aucun projet correspondant.</div>';
      return;
    }

    const statusOrder = { active: 0, paused: 1, done: 2 };
    if (sortBy === 'status') {
      projects.sort((a, b) => (statusOrder[a.status || 'active'] - statusOrder[b.status || 'active']) || a.name.localeCompare(b.name));
    } else if (sortBy === 'name') {
      projects.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'progress') {
      projects.sort((a, b) => getStats(b.id).pct - getStats(a.id).pct);
    } else if (sortBy === 'created') {
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (sortBy === 'status' && filterBy === 'all') {
      const active = projects.filter(p => (p.status || 'active') !== 'done');
      const done   = projects.filter(p => p.status === 'done');
      active.forEach(p => container.appendChild(_buildProjectCard(p)));
      if (done.length) {
        const sep = document.createElement('div');
        sep.className = 'projects-group-sep';
        sep.innerHTML = `<span>Terminés (${done.length})</span>`;
        container.appendChild(sep);
        done.forEach(p => container.appendChild(_buildProjectCard(p)));
      }
    } else {
      projects.forEach(p => container.appendChild(_buildProjectCard(p)));
    }
  }

  const _STATUS_CFG = {
    active: { badge: null,                                                                                     btnIcon: '⏸', btnTitle: 'Mettre en pause', next: 'paused' },
    paused: { badge: '<span class="project-status-badge badge-paused">En pause</span>',                       btnIcon: '▶', btnTitle: 'Remettre en actif', next: 'active' },
    done:   { badge: '<span class="project-status-badge badge-done">Terminé ✓</span>',                        btnIcon: '↩', btnTitle: 'Remettre en actif', next: 'active' },
  };

  function _buildProjectCard(project) {
    const tasks = _state.tasks.filter(t => t.projectId === project.id && !t.completedAt);
    const stats = getStats(project.id);
    const status = project.status || 'active';
    const scfg = _STATUS_CFG[status] || _STATUS_CFG.active;
    const isDone = status === 'done';

    const card = document.createElement('div');
    card.className = 'project-card fade-in';
    card.dataset.projectId = project.id;
    card.dataset.status = status;

    const memoCount = typeof Memos !== 'undefined' ? Memos.getByProject(project.id).length : 0;

    card.innerHTML = `
      <div class="project-card-header">
        <div class="project-color-strip" style="background:${project.color}"></div>
        <div class="project-info">
          <div class="project-name">${_esc(project.name)}</div>
          <div class="project-stats">${stats.done}/${stats.total} tâches · ${stats.pct}%${scfg.badge ? ' ' + scfg.badge : ''}</div>
          ${(project.tags || []).length ? `<div class="project-tags">${(project.tags).map(t => `<span class="tag-pill" data-tag="${_esc(t)}">${_esc(t)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="project-card-actions">
          <button class="glass-btn-icon btn-project-status" data-id="${project.id}" data-next="${scfg.next}" title="${scfg.btnTitle}">${scfg.btnIcon}</button>
          <button class="glass-btn-icon btn-edit-project" data-id="${project.id}" title="Modifier">✎</button>
          <button class="glass-btn-icon btn-delete-project" data-id="${project.id}" title="Supprimer">🗑</button>
          <button class="glass-btn-icon btn-memo-toggle" data-id="${project.id}" title="Mémos du projet">
            <span class="memo-icon-shape"></span><span class="memo-toggle-badge${memoCount ? '' : ' badge-hidden'}" id="memo-badge-${project.id}">${memoCount || ''}</span>
          </button>
          <button class="glass-btn-icon btn-toggle-project" data-id="${project.id}" title="Réduire/Développer">${isDone ? '▸' : '▾'}</button>
        </div>
      </div>
      <div class="project-progress-wrap">
        <div class="progress-track">
          <div class="progress-fill" style="width:${stats.pct}%; background:${project.color}"></div>
        </div>
      </div>
      <div class="project-memos-board project-memos-board--top hidden" id="memos-board-top-${project.id}"></div>
      <div class="project-task-list" id="tasks-${project.id}"${isDone ? ' style="display:none"' : ''}></div>
      <div class="add-task-row"${isDone ? ' style="display:none"' : ''}>
        <input type="text" class="glass-input new-task-input" data-project="${project.id}" placeholder="+ Nouvelle tâche dans ce projet…" />
        <button class="btn-secondary btn-add-task-quick" data-project="${project.id}">Ajouter</button>
      </div>
      <div class="project-memos-section">
        <button class="project-memos-toggle" data-proj="${project.id}">
          📝 Mémos
          <span class="memo-count-badge" id="memo-badge-bottom-${project.id}">${memoCount}</span>
          <span class="toggle-arrow">▾</span>
        </button>
        <div class="project-memos-board hidden" id="memos-board-${project.id}"></div>
      </div>
    `;

    // Render tasks
    const taskList = card.querySelector(`#tasks-${project.id}`);
    Tasks.renderTaskList(project.id, taskList);

    // Event: change project status
    card.querySelector('.btn-project-status').addEventListener('click', (e) => {
      e.stopPropagation();
      const nextStatus = e.currentTarget.dataset.next;
      update(project.id, { status: nextStatus });
      App.refresh();
    });

    // Event: toggle collapse
    card.querySelector('.btn-toggle-project').addEventListener('click', (e) => {
      e.stopPropagation();
      const tl = card.querySelector('.project-task-list');
      const ar = card.querySelector('.add-task-row');
      const btn = e.currentTarget;
      const hidden = tl.style.display === 'none';
      tl.style.display = hidden ? '' : 'none';
      ar.style.display = hidden ? '' : 'none';
      btn.textContent = hidden ? '▾' : '▸';
    });

    // Event: edit
    card.querySelector('.btn-edit-project').addEventListener('click', (e) => {
      e.stopPropagation();
      showEditModal(project.id);
    });

    // Event: delete
    card.querySelector('.btn-delete-project').addEventListener('click', (e) => {
      e.stopPropagation();
      App.showConfirm(
        `Supprimer le projet "${project.name}" et toutes ses tâches ?`,
        () => { remove(project.id); App.refresh(); }
      );
    });

    // Event: quick add task
    const newInput = card.querySelector('.new-task-input');
    const addBtn   = card.querySelector('.btn-add-task-quick');

    const doAdd = () => {
      const title = newInput.value.trim();
      if (!title) return;
      Tasks.create(project.id, title);
      newInput.value = '';
      App.refresh();
    };

    addBtn.addEventListener('click', doAdd);
    newInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });

    // Event: icône sticky-note (en-tête) → board du HAUT
    const memoToggleBtn = card.querySelector('.btn-memo-toggle');
    const memosBoardTop = card.querySelector(`#memos-board-top-${project.id}`);
    if (memoToggleBtn && memosBoardTop && typeof Memos !== 'undefined') {
      memoToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = memosBoardTop.classList.contains('hidden');
        memosBoardTop.classList.toggle('hidden', !isHidden);
        memoToggleBtn.classList.toggle('memo-toggle-active', isHidden);
        if (isHidden) Memos.renderMemosBoard(project.id, memosBoardTop);
      });
    }

    // Event: bouton bas → board du BAS
    const memoToggleBottom = card.querySelector('.project-memos-toggle');
    const memosBoardBottom = card.querySelector(`#memos-board-${project.id}`);
    if (memoToggleBottom && memosBoardBottom && typeof Memos !== 'undefined') {
      memoToggleBottom.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = memosBoardBottom.classList.contains('hidden');
        memosBoardBottom.classList.toggle('hidden', !isHidden);
        memoToggleBottom.classList.toggle('open', isHidden);
        if (isHidden) Memos.renderMemosBoard(project.id, memosBoardBottom);
      });
    }

    // Clic sur un tag-pill → filtre la vue sur ce tag
    card.querySelectorAll('.tag-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const sel = document.getElementById('projects-tag-filter');
        if (sel) {
          sel.value = pill.dataset.tag;
          renderProjectsView();
        }
      });
    });

    return card;
  }

  function showCreateModal() {
    const colors = PROJECT_COLORS;
    App.showModal('Nouveau projet', `
      <div class="form-group">
        <label>Nom du projet</label>
        <input type="text" class="glass-input" id="new-proj-name" placeholder="Ex: Rapport annuel 2025" />
      </div>
      <div class="form-group">
        <label>Couleur</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${colors.map(c => `
            <div class="color-swatch" data-color="${c}"
              style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:2px solid transparent;transition:all 0.2s"
              onclick="this.parentNode.querySelectorAll('.color-swatch').forEach(s=>s.style.borderColor='transparent');this.style.borderColor='white';document.getElementById('new-proj-color').value='${c}'"
            ></div>
          `).join('')}
        </div>
        <input type="hidden" id="new-proj-color" value="${colors[0]}" />
      </div>
      <div class="form-group">
        <label>Tags <span style="font-size:11px;color:var(--t3)">(séparés par des virgules)</span></label>
        <input type="text" class="glass-input" id="new-proj-tags" placeholder="ex: PMB, TNE, DRANE" />
      </div>
    `, [
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() },
      { label: 'Créer le projet', cls: 'btn-primary', action: () => {
        const name  = document.getElementById('new-proj-name').value.trim();
        const color = document.getElementById('new-proj-color').value;
        const tags  = document.getElementById('new-proj-tags').value
          .split(',').map(t => t.trim()).filter(Boolean);
        if (!name) { alert('Le nom est requis.'); return; }
        const proj = create(name, color);
        if (proj && tags.length) update(proj.id, { tags });
        App.closeModal();
        App.refresh();
      }}
    ]);
    setTimeout(() => document.getElementById('new-proj-name')?.focus(), 100);
  }

  function showEditModal(id) {
    const project = getById(id);
    if (!project) return;
    App.showModal('Modifier le projet', `
      <div class="form-group">
        <label>Nom du projet</label>
        <input type="text" class="glass-input" id="edit-proj-name" value="${_esc(project.name)}" />
      </div>
      <div class="form-group">
        <label>Couleur</label>
        <input type="color" class="glass-color" id="edit-proj-color" value="${project.color}" />
      </div>
      <div class="form-group">
        <label>Tags <span style="font-size:11px;color:var(--t3)">(séparés par des virgules)</span></label>
        <input type="text" class="glass-input" id="edit-proj-tags" placeholder="ex: PMB, TNE, DRANE"
          value="${_esc((project.tags || []).join(', '))}" />
      </div>
    `, [
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() },
      { label: 'Sauvegarder', cls: 'btn-primary', action: () => {
        const name  = document.getElementById('edit-proj-name').value.trim();
        const color = document.getElementById('edit-proj-color').value;
        const tags  = document.getElementById('edit-proj-tags').value
          .split(',').map(t => t.trim()).filter(Boolean);
        if (!name) return;
        update(id, { name, color, tags });
        App.closeModal();
        App.refresh();
      }}
    ]);
  }

  function populateSelects() {
    const selects = document.querySelectorAll('[id*="project-filter"], [id*="project-select"]');
    selects.forEach(sel => {
      const current = sel.value;
      // Garde l'option "Tous"
      while (sel.options.length > 1) sel.remove(1);
      (_state?.projects || []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
      });
      sel.value = current;
    });
  }

  function _esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return {
    init, getAll, getById, create, update, remove, getStats,
    renderProjectsView, showCreateModal, populateSelects, bindProjectControls: _bindProjectControls
  };
})();
