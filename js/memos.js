/**
 * FlowMind — Memos (Post-it) Module
 * Création, épinglage, conversion de mémos en tâches
 */

const Memos = (() => {
  let _state   = null;
  let _onUpdate = null;

  // Palette pastel compatible dark mode (glassmorphism)
  const MEMO_COLORS = [
    { id: 'yellow',   bg: 'rgba(255,230,80,0.10)',  border: 'rgba(255,230,80,0.30)',  accent: '#ffe84a' },
    { id: 'pink',     bg: 'rgba(255,130,170,0.10)', border: 'rgba(255,130,170,0.30)', accent: '#ff82aa' },
    { id: 'blue',     bg: 'rgba(80,170,255,0.10)',  border: 'rgba(80,170,255,0.30)',  accent: '#50aaff' },
    { id: 'green',    bg: 'rgba(60,220,150,0.10)',  border: 'rgba(60,220,150,0.30)',  accent: '#3cdc96' },
    { id: 'lavender', bg: 'rgba(170,140,255,0.10)', border: 'rgba(170,140,255,0.30)', accent: '#aa8cff' },
    { id: 'peach',    bg: 'rgba(255,170,80,0.10)',  border: 'rgba(255,170,80,0.30)',  accent: '#ffaa50' },
  ];

  // ── Init ────────────────────────────────────────────────────────────────

  function init(state, onUpdate) {
    _state    = state;
    _onUpdate = onUpdate;
    if (!Array.isArray(_state.memos)) _state.memos = [];
  }

  // ── Getters ─────────────────────────────────────────────────────────────

  function getAll()           { return _state?.memos || []; }
  function getByProject(pid)  { return (_state?.memos || []).filter(m => m.projectId === pid); }
  function getPinned()        { return (_state?.memos || []).filter(m => m.pinned); }
  function getColorById(id)   { return MEMO_COLORS.find(c => c.id === id) || MEMO_COLORS[0]; }

  // ── CRUD ────────────────────────────────────────────────────────────────

  function create(projectId, text, colorId) {
    if (!_state || !text?.trim()) return null;
    const colorIdx = MEMO_COLORS.findIndex(c => c.id === colorId);
    const color    = MEMO_COLORS[colorIdx >= 0 ? colorIdx : Math.floor(Math.random() * MEMO_COLORS.length)];
    const rotation = parseFloat((Math.random() * 8 - 4).toFixed(2)); // -4° à +4°
    const memo = {
      id:         Storage.generateId(),
      projectId,
      text:       text.trim(),
      colorId:    color.id,
      rotation,
      pinned:     false,
      createdAt:  new Date().toISOString()
    };
    _state.memos.push(memo);
    if (_onUpdate) _onUpdate();
    return memo;
  }

  function update(id, changes) {
    if (!_state) return;
    const memo = (_state.memos || []).find(m => m.id === id);
    if (!memo) return;
    Object.assign(memo, changes);
    if (_onUpdate) _onUpdate();
  }

  function remove(id) {
    if (!_state) return;
    _state.memos = _state.memos.filter(m => m.id !== id);
    if (_onUpdate) _onUpdate();
  }

  function togglePin(id) {
    if (!_state) return false;
    const memo = _state.memos.find(m => m.id === id);
    if (!memo) return false;
    memo.pinned = !memo.pinned;
    if (_onUpdate) _onUpdate();
    return memo.pinned;
  }

  /**
   * Ouvre la modal de création de tâche pré-remplie avec le texte du mémo.
   * Le mémo est supprimé uniquement après confirmation de la création.
   */
  function convertToTask(memoId, onAction) {
    if (!_state) return;
    const memo = _state.memos.find(m => m.id === memoId);
    if (!memo) return;
    Tasks.showCreateModal(memo.projectId, {
      title: memo.text,
      onCreated: () => {
        // Supprimer le mémo source après validation
        remove(memoId);
        if (onAction) onAction();
        _refreshDashPinned();
      }
    });
  }

  // ── Rendu — tableau de mémos d'un projet ───────────────────────────────

  function renderMemosBoard(projectId, container) {
    if (!container) return;
    container.innerHTML = '';

    // ── Zone de saisie rapide ──
    const addRow = document.createElement('div');
    addRow.className = 'memo-add-row';
    addRow.innerHTML = `
      <textarea class="glass-input memo-add-input" placeholder="Note rapide… (Entrée pour ajouter)" rows="2"></textarea>
      <div class="memo-color-picker">
        ${MEMO_COLORS.map((c, i) => `
          <button class="memo-color-dot${i === 0 ? ' active' : ''}"
            data-color="${c.id}"
            style="background:${c.border}"
            title="${c.id}"></button>
        `).join('')}
      </div>
      <button class="btn-primary btn-sm memo-add-btn">+ Ajouter</button>
    `;
    container.appendChild(addRow);

    // Sélecteur de couleur
    let selectedColor = MEMO_COLORS[0].id;
    addRow.querySelectorAll('.memo-color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        addRow.querySelectorAll('.memo-color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        selectedColor = dot.dataset.color;
      });
    });

    // Ajout
    const textarea = addRow.querySelector('.memo-add-input');
    const doAdd = () => {
      const text = textarea.value.trim();
      if (!text) return;
      create(projectId, text, selectedColor);
      textarea.value = '';
      renderMemosBoard(projectId, container);
      _refreshDashPinned();
    };
    addRow.querySelector('.memo-add-btn').addEventListener('click', doAdd);
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doAdd(); }
    });

    // ── Grille de mémos ──
    const memos = getByProject(projectId);
    if (!memos.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state memo-empty';
      empty.innerHTML = '<div class="empty-icon">📝</div>Aucune note pour ce projet.';
      container.appendChild(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'memos-grid';
    memos.forEach(memo => {
      grid.appendChild(_buildMemoCard(memo, () => renderMemosBoard(projectId, container)));
    });
    container.appendChild(grid);
  }

  // ── Rendu — mémos épinglés (dashboard) ─────────────────────────────────

  function renderPinnedMemos(container) {
    if (!container) return;
    container.innerHTML = '';
    const pinned = getPinned();

    if (!pinned.length) {
      container.innerHTML = '<div class="empty-state" style="font-size:12px;padding:8px 0">Épinglez des mémos 📌 pour les retrouver ici.</div>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'memos-grid memos-grid-compact';
    pinned.forEach(memo => {
      const project = Projects.getById(memo.projectId);
      grid.appendChild(_buildMemoCard(memo, () => renderPinnedMemos(container), project?.name));
    });
    container.appendChild(grid);
  }

  // ── Construction d'une carte mémo ──────────────────────────────────────

  function _buildMemoCard(memo, onAction, projectLabel) {
    const color = getColorById(memo.colorId);
    const project = Projects.getById(memo.projectId);

    const card = document.createElement('div');
    card.className = 'memo-card' + (memo.pinned ? ' memo-pinned' : '');
    card.style.cssText = [
      `background:${color.bg}`,
      `border:1px solid ${color.border}`,
      `transform:rotate(${memo.rotation}deg)`,
      `--memo-accent:${color.accent}`
    ].join(';');
    card.dataset.memoId = memo.id;

    card.innerHTML = `
      <div class="memo-card-body">
        <p class="memo-text">${_esc(memo.text)}</p>
        ${projectLabel
          ? `<div class="memo-project-tag" style="color:${project?.color || 'var(--t3)'}">◈ ${_esc(projectLabel)}</div>`
          : ''}
      </div>
      <div class="memo-card-footer">
        <button class="memo-btn memo-pin-btn${memo.pinned ? ' active' : ''}"
          title="${memo.pinned ? 'Désépingler' : 'Épingler'}">
          ${memo.pinned ? '📌' : '📍'}
        </button>
        <button class="memo-btn memo-edit-btn" title="Modifier ce mémo">✎</button>
        <button class="memo-btn memo-convert-btn" title="Convertir en tâche dans le projet">⚡→ Tâche</button>
        <button class="memo-btn memo-delete-btn" title="Supprimer ce mémo">✕</button>
      </div>
    `;

    // Épingler / désépingler
    card.querySelector('.memo-pin-btn').addEventListener('click', e => {
      e.stopPropagation();
      togglePin(memo.id);
      onAction();
      _refreshDashPinned();
    });

    // Modifier le texte du mémo
    card.querySelector('.memo-edit-btn').addEventListener('click', e => {
      e.stopPropagation();
      App.showModal('Modifier le mémo', `
        <div class="form-group">
          <label>Texte du mémo</label>
          <textarea class="glass-input" id="edit-memo-text" rows="4" style="width:100%;resize:vertical">${_esc(memo.text)}</textarea>
        </div>
      `, [
        { label: 'Annuler',      cls: 'btn-secondary', action: () => App.closeModal() },
        { label: 'Sauvegarder', cls: 'btn-primary',   action: () => {
          const newText = document.getElementById('edit-memo-text').value.trim();
          if (!newText) return;
          update(memo.id, { text: newText });
          App.closeModal();
          onAction();
          _refreshDashPinned();
        }}
      ]);
      setTimeout(() => document.getElementById('edit-memo-text')?.focus(), 100);
    });

    // Convertir en tâche (ouvre la modal de création pré-remplie)
    card.querySelector('.memo-convert-btn').addEventListener('click', e => {
      e.stopPropagation();
      convertToTask(memo.id, onAction);
    });

    // Supprimer
    card.querySelector('.memo-delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      remove(memo.id);
      onAction();
      _refreshDashPinned();
    });

    return card;
  }

  // ── Rafraîchir la section épinglés du dashboard ─────────────────────────

  function _refreshDashPinned() {
    const el = document.getElementById('dash-pinned-memos');
    if (el) renderPinnedMemos(el);
  }

  // ── Utilitaire ─────────────────────────────────────────────────────────

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── API publique ────────────────────────────────────────────────────────

  return {
    init,
    getAll, getByProject, getPinned, getColorById,
    create, update, remove, togglePin, convertToTask,
    renderMemosBoard, renderPinnedMemos,
    MEMO_COLORS
  };
})();
