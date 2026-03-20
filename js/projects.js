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

  function renderProjectsView() {
    const container = document.getElementById('projects-list');
    if (!container || !_state) return;
    container.innerHTML = '';

    if (!_state.projects.length) {
      container.innerHTML = '<div class="empty-state">Aucun projet. Créez votre premier projet !</div>';
      return;
    }

    _state.projects.forEach(project => {
      const card = _buildProjectCard(project);
      container.appendChild(card);
    });
  }

  function _buildProjectCard(project) {
    const tasks = _state.tasks.filter(t => t.projectId === project.id && !t.completedAt);
    const stats = getStats(project.id);

    const card = document.createElement('div');
    card.className = 'project-card fade-in';
    card.dataset.projectId = project.id;

    const memoCount = typeof Memos !== 'undefined' ? Memos.getByProject(project.id).length : 0;

    card.innerHTML = `
      <div class="project-card-header">
        <div class="project-color-strip" style="background:${project.color}"></div>
        <div class="project-info">
          <div class="project-name">${_esc(project.name)}</div>
          <div class="project-stats">${stats.done}/${stats.total} tâches · ${stats.pct}%</div>
        </div>
        <div class="project-card-actions">
          <button class="glass-btn-icon btn-edit-project" data-id="${project.id}" title="Modifier">✎</button>
          <button class="glass-btn-icon btn-delete-project" data-id="${project.id}" title="Supprimer">🗑</button>
          <button class="glass-btn-icon btn-memo-toggle" data-id="${project.id}" title="Mémos du projet">
            <span class="memo-icon-shape"></span><span class="memo-toggle-badge${memoCount ? '' : ' badge-hidden'}" id="memo-badge-${project.id}">${memoCount || ''}</span>
          </button>
          <button class="glass-btn-icon btn-toggle-project" data-id="${project.id}" title="Réduire/Développer">▾</button>
        </div>
      </div>
      <div class="project-progress-wrap">
        <div class="progress-track">
          <div class="progress-fill" style="width:${stats.pct}%; background:${project.color}"></div>
        </div>
      </div>
      <div class="project-memos-board project-memos-board--top hidden" id="memos-board-top-${project.id}"></div>
      <div class="project-task-list" id="tasks-${project.id}"></div>
      <div class="add-task-row">
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
    `, [
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() },
      { label: 'Créer le projet', cls: 'btn-primary', action: () => {
        const name  = document.getElementById('new-proj-name').value.trim();
        const color = document.getElementById('new-proj-color').value;
        if (!name) { alert('Le nom est requis.'); return; }
        create(name, color);
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
    `, [
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() },
      { label: 'Sauvegarder', cls: 'btn-primary', action: () => {
        const name  = document.getElementById('edit-proj-name').value.trim();
        const color = document.getElementById('edit-proj-color').value;
        if (!name) return;
        update(id, { name, color });
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
    renderProjectsView, showCreateModal, populateSelects
  };
})();
