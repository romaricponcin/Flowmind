/**
 * FlowMind — Expenses Module
 * Suivi des frais professionnels avec calendrier, catégories et intégration Zimbra
 */

const Expenses = (() => {
  let _state = null;
  let _onUpdate = null;

  let _viewMonth = new Date().getMonth();
  let _viewYear = new Date().getFullYear();
  let _viewMode = 'calendar';
  let _selectedDay = null;
  let _filterCategory = 'all';
  let _filterStatus = 'all';

  const STATUS_CONFIG = {
    draft:      { label: 'Brouillon',  icon: '○', color: 'var(--text-3)' },
    submitted:  { label: 'Transmis',   icon: '◑', color: 'var(--warning, #f59e0b)' },
    reimbursed: { label: 'Remboursé',  icon: '●', color: 'var(--success, #00d9a6)' }
  };

  function init(state, onUpdate) {
    _state = state;
    _onUpdate = onUpdate;
    if (!_state.expenses) _state.expenses = [];
    if (!_state.expenseCategories || !_state.expenseCategories.length) {
      _state.expenseCategories = Storage.DEFAULT_STATE.expenseCategories;
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────

  function create(data) {
    const expense = {
      id: Storage.generateId(),
      date: data.date || new Date().toISOString().slice(0, 10),
      categoryId: data.categoryId || getCategories()[0]?.id || '',
      title: data.title || '',
      description: data.description || '',
      amount: parseFloat(data.amount) || 0,
      status: data.status || 'draft',
      linkedTaskId: data.linkedTaskId || null,
      linkedEventUid: data.linkedEventUid || null,
      projectId: data.projectId || null,
      location: data.location || '',
      createdAt: new Date().toISOString(),
      submittedAt: null,
      reimbursedAt: null
    };
    _state.expenses.push(expense);
    if (_onUpdate) _onUpdate();
    return expense;
  }

  function update(id, changes) {
    const exp = getById(id);
    if (!exp) return;
    Object.assign(exp, changes);
    if (_onUpdate) _onUpdate();
  }

  function remove(id) {
    const idx = _state.expenses.findIndex(e => e.id === id);
    if (idx >= 0) {
      _state.expenses.splice(idx, 1);
      if (_onUpdate) _onUpdate();
    }
  }

  // ── GETTERS ───────────────────────────────────────────────────────────

  function getAll() { return _state.expenses || []; }

  function getById(id) { return (_state.expenses || []).find(e => e.id === id); }

  function getByMonth(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return getAll().filter(e => e.date && e.date.startsWith(prefix));
  }

  function getCategories() {
    return _state.expenseCategories || [];
  }

  function getCategoryById(id) {
    return getCategories().find(c => c.id === id);
  }

  // ── STATUS ────────────────────────────────────────────────────────────

  function setStatus(id, newStatus) {
    const exp = getById(id);
    if (!exp) return;
    exp.status = newStatus;
    if (newStatus === 'submitted') exp.submittedAt = new Date().toISOString();
    if (newStatus === 'reimbursed') exp.reimbursedAt = new Date().toISOString();
    if (_onUpdate) _onUpdate();
  }

  // ── MONTHLY SUMMARY ──────────────────────────────────────────────────

  function getMonthSummary(year, month) {
    const expenses = _filteredExpenses(getByMonth(year, month));
    const byCategory = {};
    const byStatus = { draft: 0, submitted: 0, reimbursed: 0 };
    let total = 0;

    expenses.forEach(e => {
      total += e.amount || 0;
      if (!byCategory[e.categoryId]) byCategory[e.categoryId] = { count: 0, total: 0 };
      byCategory[e.categoryId].count++;
      byCategory[e.categoryId].total += e.amount || 0;
      byStatus[e.status]++;
    });

    return { total, count: expenses.length, byCategory, byStatus };
  }

  // ── CONVERSION ────────────────────────────────────────────────────────

  function convertFromTask(taskId) {
    if (typeof Tasks === 'undefined') return;
    const task = Tasks.getById(taskId);
    if (!task) return;
    showCreateModal(task.dueDate || null, {
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      linkedTaskId: task.id
    });
  }

  function convertToTask(expenseId) {
    const expense = getById(expenseId);
    if (!expense || typeof Tasks === 'undefined') return;
    Tasks.showCreateModal(expense.projectId || null, {
      title: '[Frais] ' + expense.title,
      onCreated: (task) => {
        update(expenseId, { linkedTaskId: task.id });
      }
    });
  }

  function convertFromEvent(event) {
    if (!event) return;
    const startDate = event.start ? new Date(event.start).toISOString().slice(0, 10) : null;
    showCreateModal(startDate, {
      title: event.title || '',
      location: event.location || '',
      linkedEventUid: event.uid || null
    });
  }

  // ── ZIMBRA ────────────────────────────────────────────────────────────

  function _getEventsForMonth(year, month) {
    if (typeof ICal === 'undefined') return [];
    const events = ICal.getEvents();
    return events.filter(e => {
      const d = new Date(e.start);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  function _isEventConverted(uid) {
    if (!uid) return false;
    return getAll().some(e => e.linkedEventUid === uid);
  }

  function _bindZimbraImport() {
    const importBtn = document.getElementById('expenses-ical-import-btn');
    const fileInput = document.getElementById('expenses-ical-file');

    if (importBtn) {
      importBtn.addEventListener('click', async () => {
        const url = document.getElementById('expenses-ical-url')?.value.trim();
        if (!url) { alert('Entrez une URL .ics valide.'); return; }
        importBtn.textContent = '⏳ Import…';
        importBtn.disabled = true;
        try {
          await ICal.importFromUrl(url);
          renderExpensesView();
        } finally {
          importBtn.textContent = 'Importer';
          importBtn.disabled = false;
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ICal.parseICS(ev.target.result);
          if (result.events) {
            const existingUids = new Set((_state.calendarEvents || []).map(ce => ce.uid));
            const toAdd = result.events.filter(ce => !ce.uid || !existingUids.has(ce.uid))
              .map(ce => ({ ...ce, id: Storage.generateId() }));
            if (!_state.calendarEvents) _state.calendarEvents = [];
            _state.calendarEvents.push(...toAdd);
          }
          if (result.todos && result.todos.length) {
            ICal.importTasks(result.todos);
          }
          if (_onUpdate) _onUpdate();
          renderExpensesView();
          alert(`✅ ${result.events.length} événement(s) importé(s).`);
        };
        reader.readAsText(file);
      });
    }
  }

  // ── CLOUD SYNC (Gist ICS) ──────────────────────────────────────────

  function _bindCloudSync() {
    const gistInput = document.getElementById('expenses-ics-gist-id');
    const syncBtn = document.getElementById('expenses-cloud-sync-btn');
    const statusEl = document.getElementById('expenses-cloud-status');

    if (gistInput) {
      gistInput.value = Storage.getIcsGistId();
    }

    if (syncBtn) {
      syncBtn.onclick = async () => {
        const gistId = gistInput?.value.trim();
        if (!gistId) { alert('Saisissez l\'ID du Gist calendrier.'); return; }
        Storage.setIcsGistId(gistId);

        syncBtn.textContent = '⏳ Sync…';
        syncBtn.disabled = true;
        if (statusEl) { statusEl.textContent = 'Synchronisation en cours…'; statusEl.style.color = 'var(--text-2)'; }

        try {
          const { icsText, updatedAt } = await Storage.loadIcsFromCloud();
          const result = ICal.parseICS(icsText);

          // Merge events
          const existingUids = new Set((_state.calendarEvents || []).map(ce => ce.uid));
          const toAdd = (result.events || []).filter(e => !e.uid || !existingUids.has(e.uid))
            .map(e => ({ ...e, id: Storage.generateId() }));
          if (!_state.calendarEvents) _state.calendarEvents = [];
          _state.calendarEvents.push(...toAdd);

          // Import VTODO
          let taskCount = 0;
          if (result.todos && result.todos.length) {
            taskCount = ICal.importTasks(result.todos);
          }

          if (_onUpdate) _onUpdate();
          renderExpensesView();

          const dateStr = updatedAt ? new Date(updatedAt).toLocaleString('fr-FR') : '';
          const parts = [`${toAdd.length} nouvel événement(s)`];
          if (taskCount) parts.push(`${taskCount} tâche(s)`);
          if (statusEl) {
            statusEl.textContent = `✓ ${parts.join(', ')} — MàJ : ${dateStr}`;
            statusEl.style.color = 'var(--success, #00d9a6)';
          }
        } catch (err) {
          if (statusEl) {
            statusEl.textContent = `✗ ${err.message}`;
            statusEl.style.color = 'var(--danger, #f43f5e)';
          }
        } finally {
          syncBtn.textContent = 'Sync cloud';
          syncBtn.disabled = false;
        }
      };
    }
  }

  // ── FILTERS ───────────────────────────────────────────────────────────

  function _filteredExpenses(expenses) {
    return expenses.filter(e => {
      if (_filterCategory !== 'all' && e.categoryId !== _filterCategory) return false;
      if (_filterStatus !== 'all' && e.status !== _filterStatus) return false;
      return true;
    });
  }

  // ── RENDERING ─────────────────────────────────────────────────────────

  function renderExpensesView() {
    _bindControls();
    _bindZimbraImport();
    _bindCloudSync();
    _populateCategoryFilter();

    if (_viewMode === 'calendar') {
      _renderCalendarGrid();
      const listArea = document.getElementById('expenses-list-area');
      if (listArea) listArea.innerHTML = '';
    } else {
      _renderListView();
      const calArea = document.getElementById('expenses-calendar-area');
      if (calArea) calArea.innerHTML = '';
      const dayDetail = document.getElementById('expenses-day-detail');
      if (dayDetail) dayDetail.innerHTML = '';
    }

    _renderMonthlySummary();
    _renderCategoryManager();
  }

  function _bindControls() {
    document.querySelectorAll('.expenses-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === _viewMode);
      btn.onclick = () => {
        _viewMode = btn.dataset.mode;
        document.querySelectorAll('.expenses-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderExpensesView();
      };
    });

    const catFilter = document.getElementById('expenses-category-filter');
    if (catFilter) {
      catFilter.value = _filterCategory;
      catFilter.onchange = () => { _filterCategory = catFilter.value; renderExpensesView(); };
    }

    const statusFilter = document.getElementById('expenses-status-filter');
    if (statusFilter) {
      statusFilter.value = _filterStatus;
      statusFilter.onchange = () => { _filterStatus = statusFilter.value; renderExpensesView(); };
    }

    const newBtn = document.getElementById('new-expense-btn');
    if (newBtn) newBtn.onclick = () => showCreateModal();

    const exportBtn = document.getElementById('export-expenses-btn');
    if (exportBtn) exportBtn.onclick = () => exportMonthCSV(_viewYear, _viewMonth);
  }

  function _populateCategoryFilter() {
    const sel = document.getElementById('expenses-category-filter');
    if (!sel) return;
    const val = sel.value;
    sel.innerHTML = '<option value="all">Toutes catégories</option>';
    getCategories().forEach(cat => {
      sel.innerHTML += `<option value="${_esc(cat.id)}">${_esc(cat.icon)} ${_esc(cat.shortLabel)}</option>`;
    });
    sel.value = val;
  }

  // ── CALENDAR GRID ─────────────────────────────────────────────────────

  function _renderCalendarGrid() {
    const container = document.getElementById('expenses-calendar-area');
    if (!container) return;
    container.innerHTML = '';

    const monthExpenses = _filteredExpenses(getByMonth(_viewYear, _viewMonth));
    const monthEvents = _getEventsForMonth(_viewYear, _viewMonth);

    // Navigation mois
    const nav = document.createElement('div');
    nav.className = 'expenses-cal-nav';
    const monthLabel = new Date(_viewYear, _viewMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    nav.innerHTML = `
      <button class="glass-btn-icon expenses-cal-prev" title="Mois précédent">‹</button>
      <span class="expenses-cal-month">${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</span>
      <button class="glass-btn-icon expenses-cal-next" title="Mois suivant">›</button>
    `;
    nav.querySelector('.expenses-cal-prev').onclick = () => { _navMonth(-1); };
    nav.querySelector('.expenses-cal-next').onclick = () => { _navMonth(1); };
    container.appendChild(nav);

    // En-tête jours
    const grid = document.createElement('div');
    grid.className = 'expenses-cal-grid';
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayNames.forEach(d => {
      const hd = document.createElement('div');
      hd.className = 'expenses-cal-header';
      hd.textContent = d;
      grid.appendChild(hd);
    });

    // Calcul des jours
    const firstDay = new Date(_viewYear, _viewMonth, 1);
    const lastDay = new Date(_viewYear, _viewMonth + 1, 0);
    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Index des frais et événements par jour
    const expByDay = {};
    monthExpenses.forEach(e => {
      const day = parseInt(e.date.slice(-2), 10);
      if (!expByDay[day]) expByDay[day] = [];
      expByDay[day].push(e);
    });
    const evtByDay = {};
    monthEvents.forEach(e => {
      const day = new Date(e.start).getDate();
      if (!evtByDay[day]) evtByDay[day] = [];
      evtByDay[day].push(e);
    });

    // Cellules vides avant le 1er
    for (let i = 1; i < startDow; i++) {
      const empty = document.createElement('div');
      empty.className = 'expenses-cal-day expenses-cal-day--outside';
      grid.appendChild(empty);
    }

    // Jours du mois
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const cell = document.createElement('div');
      const dateStr = `${_viewYear}-${String(_viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cell.className = 'expenses-cal-day';
      if (dateStr === todayStr) cell.classList.add('expenses-cal-day--today');
      if (_selectedDay === d) cell.classList.add('expenses-cal-day--selected');

      const dayNum = document.createElement('span');
      dayNum.className = 'expenses-cal-day-num';
      dayNum.textContent = d;
      cell.appendChild(dayNum);

      // Pastilles frais
      const dots = document.createElement('div');
      dots.className = 'expenses-cal-dots';
      const dayExpenses = expByDay[d] || [];
      const dayEvents = evtByDay[d] || [];

      const seenCats = new Set();
      dayExpenses.forEach(e => {
        if (seenCats.has(e.categoryId)) return;
        seenCats.add(e.categoryId);
        const cat = getCategoryById(e.categoryId);
        const dot = document.createElement('span');
        dot.className = 'expenses-cal-dot';
        dot.style.background = cat?.color || 'var(--accent)';
        dot.title = cat?.shortLabel || '';
        dots.appendChild(dot);
      });

      // Pastilles événements Zimbra
      dayEvents.forEach(ev => {
        const dot = document.createElement('span');
        dot.className = 'expenses-cal-dot expenses-cal-dot--event';
        if (_isEventConverted(ev.uid)) dot.classList.add('expenses-cal-dot--converted');
        dot.title = ev.title || 'Événement Zimbra';
        dots.appendChild(dot);
      });

      cell.appendChild(dots);

      // Badge compteur
      const totalItems = dayExpenses.length + dayEvents.length;
      if (totalItems > 0) {
        const badge = document.createElement('span');
        badge.className = 'expenses-cal-badge';
        badge.textContent = totalItems;
        cell.appendChild(badge);
      }

      cell.onclick = () => {
        _selectedDay = (_selectedDay === d) ? null : d;
        renderExpensesView();
      };

      grid.appendChild(cell);
    }

    container.appendChild(grid);

    // Détail du jour sélectionné
    if (_selectedDay) {
      _renderDayDetail(_selectedDay, expByDay[_selectedDay] || [], evtByDay[_selectedDay] || []);
    } else {
      const dayDetail = document.getElementById('expenses-day-detail');
      if (dayDetail) dayDetail.innerHTML = '';
    }
  }

  function _navMonth(delta) {
    _viewMonth += delta;
    if (_viewMonth > 11) { _viewMonth = 0; _viewYear++; }
    if (_viewMonth < 0) { _viewMonth = 11; _viewYear--; }
    _selectedDay = null;
    renderExpensesView();
  }

  function _renderDayDetail(day, expenses, events) {
    const container = document.getElementById('expenses-day-detail');
    if (!container) return;
    container.innerHTML = '';

    const dateStr = `${_viewYear}-${String(_viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateLabel = new Date(_viewYear, _viewMonth, day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    let html = `<div class="expenses-day-detail-header">
      <h3>${dateLabel}</h3>
      <button class="btn-primary btn-sm" id="add-expense-day-btn">+ Frais</button>
    </div>`;

    if (!expenses.length && !events.length) {
      html += '<div class="expenses-day-empty">Aucun frais ni événement ce jour.</div>';
    }

    // Frais du jour
    expenses.forEach(e => {
      const cat = getCategoryById(e.categoryId);
      const sc = STATUS_CONFIG[e.status] || STATUS_CONFIG.draft;
      html += `<div class="expense-row">
        <span class="expense-category-badge" style="background:${cat?.color || 'var(--accent)'}20;color:${cat?.color || 'var(--accent)'}">
          ${_esc(cat?.icon || '')} ${_esc(cat?.shortLabel || '')}
        </span>
        <span class="expense-row-title">${_esc(e.title)}</span>
        <span class="expense-amount">${_formatAmount(e.amount)}</span>
        <span class="expense-status" style="color:${sc.color}" title="${sc.label}">${sc.icon}</span>
        <div class="expense-row-actions">
          <button class="btn-task-action" data-expense-edit="${e.id}" title="Modifier">✎</button>
          <button class="btn-task-action" data-expense-task="${e.id}" title="Convertir en tâche">⚡</button>
          <button class="btn-task-action" data-expense-delete="${e.id}" title="Supprimer">✕</button>
        </div>
      </div>`;
    });

    // Événements Zimbra du jour
    if (events.length) {
      html += '<div class="expenses-day-events-header">Événements Zimbra</div>';
      events.forEach(ev => {
        const converted = _isEventConverted(ev.uid);
        const timeStr = ev.start ? new Date(ev.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
        html += `<div class="expense-row expense-row--event${converted ? ' expense-row--converted' : ''}">
          <span class="expense-category-badge" style="background:var(--accent)20;color:var(--accent)">📅 Zimbra</span>
          <span class="expense-row-title">${_esc(ev.title)}${timeStr ? ' <small>' + timeStr + '</small>' : ''}</span>
          ${ev.location ? '<span class="expense-row-location">📍 ' + _esc(ev.location) + '</span>' : ''}
          <div class="expense-row-actions">
            ${converted
              ? '<span class="expense-converted-badge">✓ Converti</span>'
              : '<button class="btn-primary btn-sm" data-event-convert="' + _esc(ev.uid || ev.id) + '" title="Convertir en frais">→ Frais</button>'
            }
          </div>
        </div>`;
      });
    }

    container.innerHTML = html;

    // Bind actions
    container.querySelector('#add-expense-day-btn')?.addEventListener('click', () => showCreateModal(dateStr));

    container.querySelectorAll('[data-expense-edit]').forEach(btn => {
      btn.addEventListener('click', () => showEditModal(btn.dataset.expenseEdit));
    });
    container.querySelectorAll('[data-expense-task]').forEach(btn => {
      btn.addEventListener('click', () => convertToTask(btn.dataset.expenseTask));
    });
    container.querySelectorAll('[data-expense-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Supprimer ce frais ?')) { remove(btn.dataset.expenseDelete); renderExpensesView(); }
      });
    });
    container.querySelectorAll('[data-event-convert]').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.eventConvert;
        const events = ICal.getEvents();
        const ev = events.find(e => (e.uid || e.id) === uid);
        if (ev) convertFromEvent(ev);
      });
    });
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────

  function _renderListView() {
    const container = document.getElementById('expenses-list-area');
    if (!container) return;
    container.innerHTML = '';

    const monthExpenses = _filteredExpenses(getByMonth(_viewYear, _viewMonth));
    const monthEvents = _getEventsForMonth(_viewYear, _viewMonth);

    // Navigation mois
    const nav = document.createElement('div');
    nav.className = 'expenses-cal-nav';
    const monthLabel = new Date(_viewYear, _viewMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    nav.innerHTML = `
      <button class="glass-btn-icon expenses-cal-prev" title="Mois précédent">‹</button>
      <span class="expenses-cal-month">${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</span>
      <button class="glass-btn-icon expenses-cal-next" title="Mois suivant">›</button>
    `;
    nav.querySelector('.expenses-cal-prev').onclick = () => { _navMonth(-1); };
    nav.querySelector('.expenses-cal-next').onclick = () => { _navMonth(1); };
    container.appendChild(nav);

    if (!monthExpenses.length && !monthEvents.length) {
      container.innerHTML += '<div class="empty-state"><div class="empty-icon">€</div>Aucun frais ce mois.</div>';
      return;
    }

    // Grouper par date
    const allItems = [];
    monthExpenses.forEach(e => allItems.push({ type: 'expense', date: e.date, item: e }));
    monthEvents.forEach(e => allItems.push({ type: 'event', date: new Date(e.start).toISOString().slice(0, 10), item: e }));
    allItems.sort((a, b) => a.date.localeCompare(b.date));

    let currentDate = '';
    allItems.forEach(({ type, date, item }) => {
      if (date !== currentDate) {
        currentDate = date;
        const dateHeader = document.createElement('div');
        dateHeader.className = 'expenses-list-date-header';
        dateHeader.textContent = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        container.appendChild(dateHeader);
      }

      const row = document.createElement('div');
      if (type === 'expense') {
        const cat = getCategoryById(item.categoryId);
        const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
        row.className = 'expense-row';
        row.innerHTML = `
          <span class="expense-category-badge" style="background:${cat?.color || 'var(--accent)'}20;color:${cat?.color || 'var(--accent)'}">
            ${_esc(cat?.icon || '')} ${_esc(cat?.shortLabel || '')}
          </span>
          <span class="expense-row-title">${_esc(item.title)}</span>
          ${item.location ? '<span class="expense-row-location">📍 ' + _esc(item.location) + '</span>' : ''}
          <span class="expense-amount">${_formatAmount(item.amount)}</span>
          <span class="expense-status" style="color:${sc.color}" title="${sc.label}">${sc.icon}</span>
          <div class="expense-row-actions">
            <button class="btn-task-action" data-expense-edit="${item.id}" title="Modifier">✎</button>
            <button class="btn-task-action" data-expense-task="${item.id}" title="Convertir en tâche">⚡</button>
            <button class="btn-task-action" data-expense-delete="${item.id}" title="Supprimer">✕</button>
          </div>
        `;
      } else {
        const converted = _isEventConverted(item.uid);
        row.className = 'expense-row expense-row--event' + (converted ? ' expense-row--converted' : '');
        row.innerHTML = `
          <span class="expense-category-badge" style="background:var(--accent)20;color:var(--accent)">📅 Zimbra</span>
          <span class="expense-row-title">${_esc(item.title)}</span>
          ${item.location ? '<span class="expense-row-location">📍 ' + _esc(item.location) + '</span>' : ''}
          <div class="expense-row-actions">
            ${converted
              ? '<span class="expense-converted-badge">✓ Converti</span>'
              : '<button class="btn-primary btn-sm" data-event-convert="' + _esc(item.uid || item.id) + '">→ Frais</button>'
            }
          </div>
        `;
      }
      container.appendChild(row);
    });

    // Bind list actions
    container.querySelectorAll('[data-expense-edit]').forEach(btn => {
      btn.addEventListener('click', () => showEditModal(btn.dataset.expenseEdit));
    });
    container.querySelectorAll('[data-expense-task]').forEach(btn => {
      btn.addEventListener('click', () => convertToTask(btn.dataset.expenseTask));
    });
    container.querySelectorAll('[data-expense-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Supprimer ce frais ?')) { remove(btn.dataset.expenseDelete); renderExpensesView(); }
      });
    });
    container.querySelectorAll('[data-event-convert]').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.eventConvert;
        const events = ICal.getEvents();
        const ev = events.find(e => (e.uid || e.id) === uid);
        if (ev) convertFromEvent(ev);
      });
    });
  }

  // ── MONTHLY SUMMARY ──────────────────────────────────────────────────

  function _renderMonthlySummary() {
    const container = document.getElementById('expenses-summary-area');
    if (!container) return;

    const summary = getMonthSummary(_viewYear, _viewMonth);
    const monthLabel = new Date(_viewYear, _viewMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    let html = `<div class="expenses-summary-title">Récapitulatif — ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</div>`;
    html += '<div class="expenses-summary-pills">';

    // Total
    html += `<div class="stat-report-pill">
      <div style="font-size:24px;font-weight:700;color:var(--accent);font-family:var(--font-mono)">${_formatAmount(summary.total)}</div>
      <div style="font-size:11px;color:var(--text-3);margin-top:2px">${summary.count} frais</div>
    </div>`;

    // Par catégorie
    getCategories().forEach(cat => {
      const data = summary.byCategory[cat.id];
      if (!data) return;
      html += `<div class="stat-report-pill" style="border-left:3px solid ${cat.color}">
        <div style="font-size:20px;font-weight:700;color:${cat.color};font-family:var(--font-mono)">${_formatAmount(data.total)}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:2px">${cat.icon} ${_esc(cat.shortLabel)} (${data.count})</div>
      </div>`;
    });

    html += '</div>';

    // Statuts
    html += '<div class="expenses-summary-statuses">';
    Object.entries(STATUS_CONFIG).forEach(([key, cfg]) => {
      html += `<span class="expenses-status-pill" style="color:${cfg.color}">${cfg.icon} ${summary.byStatus[key] || 0} ${cfg.label.toLowerCase()}</span>`;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  // ── CATEGORY MANAGER ──────────────────────────────────────────────────

  function _renderCategoryManager() {
    const list = document.getElementById('expenses-cat-list');
    if (!list) return;
    list.innerHTML = '';

    getCategories().forEach(cat => {
      const usedCount = getAll().filter(e => e.categoryId === cat.id).length;
      const item = document.createElement('div');
      item.className = 'expense-cat-item';
      item.innerHTML = `
        <span class="expense-cat-color" style="background:${cat.color}"></span>
        <span class="expense-cat-icon">${_esc(cat.icon)}</span>
        <span class="expense-cat-label">${_esc(cat.label)}</span>
        <span class="expense-cat-count">(${usedCount})</span>
        <div class="expense-cat-actions">
          <button class="btn-task-action" data-cat-edit="${cat.id}" title="Modifier">✎</button>
          <button class="btn-task-action" data-cat-delete="${cat.id}" title="Supprimer"${usedCount ? ' disabled' : ''}>✕</button>
        </div>
      `;
      list.appendChild(item);
    });

    // Bind
    list.querySelectorAll('[data-cat-edit]').forEach(btn => {
      btn.addEventListener('click', () => _showCategoryModal(btn.dataset.catEdit));
    });
    list.querySelectorAll('[data-cat-delete]').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        if (confirm('Supprimer cette catégorie ?')) {
          _state.expenseCategories = _state.expenseCategories.filter(c => c.id !== btn.dataset.catDelete);
          if (_onUpdate) _onUpdate();
          renderExpensesView();
        }
      });
    });

    const addBtn = document.getElementById('add-expense-cat-btn');
    if (addBtn) addBtn.onclick = () => _showCategoryModal(null);
  }

  function _showCategoryModal(editId) {
    const existing = editId ? getCategoryById(editId) : null;
    const title = existing ? 'Modifier la catégorie' : 'Nouvelle catégorie';
    const defaultColors = ['#4f8eff', '#f59e0b', '#00d9a6', '#f472b6', '#a78bfa', '#60a5fa', '#fb923c', '#10b981'];

    App.showModal(title, `
      <div class="form-group"><label>Libellé complet</label><input type="text" class="glass-input" id="cat-label" value="${_esc(existing?.label || '')}" placeholder="Ex: Frais de mission avec ordre de route"/></div>
      <div class="form-row">
        <div class="form-group"><label>Libellé court</label><input type="text" class="glass-input" id="cat-short" value="${_esc(existing?.shortLabel || '')}" placeholder="Ex: Mission + OR"/></div>
        <div class="form-group"><label>Icône (emoji)</label><input type="text" class="glass-input" id="cat-icon" value="${existing?.icon || '📋'}" style="width:60px;text-align:center"/></div>
      </div>
      <div class="form-group"><label>Couleur</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
          ${defaultColors.map(c => `<span class="color-swatch${existing?.color === c ? ' active' : ''}" data-color="${c}" style="background:${c};width:28px;height:28px;border-radius:6px;cursor:pointer;border:2px solid transparent"></span>`).join('')}
        </div>
        <input type="color" class="glass-input" id="cat-color" value="${existing?.color || '#4f8eff'}" style="margin-top:6px;width:60px;height:32px"/>
      </div>
    `, [
      { label: existing ? 'Enregistrer' : 'Créer', cls: 'btn-primary', action: () => {
        const label = document.getElementById('cat-label')?.value.trim();
        const shortLabel = document.getElementById('cat-short')?.value.trim();
        const icon = document.getElementById('cat-icon')?.value.trim() || '📋';
        const color = document.getElementById('cat-color')?.value || '#4f8eff';
        if (!label || !shortLabel) { alert('Remplissez le libellé et le libellé court.'); return; }
        if (existing) {
          Object.assign(existing, { label, shortLabel, icon, color });
        } else {
          const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30);
          _state.expenseCategories.push({ id, label, shortLabel, icon, color });
        }
        if (_onUpdate) _onUpdate();
        App.closeModal();
        renderExpensesView();
      }},
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() }
    ]);

    // Color swatch binding
    setTimeout(() => {
      document.querySelectorAll('.color-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
          document.querySelectorAll('.color-swatch').forEach(s => s.style.border = '2px solid transparent');
          sw.style.border = '2px solid var(--text-1)';
          const colorInput = document.getElementById('cat-color');
          if (colorInput) colorInput.value = sw.dataset.color;
        });
      });
    }, 50);
  }

  // ── MODALS ────────────────────────────────────────────────────────────

  function showCreateModal(prefillDate, prefill) {
    prefill = prefill || {};
    const categories = getCategories();
    const projects = typeof Projects !== 'undefined' ? Projects.getAll() : [];
    const dateVal = prefillDate || new Date().toISOString().slice(0, 10);

    App.showModal('Nouveau frais professionnel', `
      <div class="form-row">
        <div class="form-group"><label>Date</label><input type="date" class="glass-input" id="new-exp-date" value="${dateVal}"/></div>
        <div class="form-group"><label>Catégorie</label><select class="glass-select" id="new-exp-cat">
          ${categories.map(c => `<option value="${_esc(c.id)}">${_esc(c.icon)} ${_esc(c.shortLabel)}</option>`).join('')}
        </select></div>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex:2"><label>Libellé</label><input type="text" class="glass-input" id="new-exp-title" value="${_esc(prefill.title || '')}" placeholder="Ex: Déplacement Montpellier"/></div>
        <div class="form-group" style="flex:1"><label>Montant (€)</label><input type="number" class="glass-input" id="new-exp-amount" step="0.01" min="0" value="${prefill.amount || ''}" placeholder="17.50"/></div>
      </div>
      <div class="form-group"><label>Lieu / destination</label><input type="text" class="glass-input" id="new-exp-location" value="${_esc(prefill.location || '')}" placeholder="Ex: Lyon, DRANE AuRA"/></div>
      <div class="form-group"><label>Notes</label><textarea class="glass-input" id="new-exp-desc" rows="2" placeholder="Détails optionnels…">${_esc(prefill.description || '')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Projet associé</label><select class="glass-select" id="new-exp-project">
          <option value="">— Aucun —</option>
          ${projects.map(p => `<option value="${p.id}"${p.id === prefill.projectId ? ' selected' : ''}>${_esc(p.name)}</option>`).join('')}
        </select></div>
        <div class="form-group"><label>Statut</label><select class="glass-select" id="new-exp-status">
          <option value="draft">○ Brouillon</option>
          <option value="submitted">◑ Transmis</option>
          <option value="reimbursed">● Remboursé</option>
        </select></div>
      </div>
    `, [
      { label: 'Créer le frais', cls: 'btn-primary', action: () => {
        const title = document.getElementById('new-exp-title')?.value.trim();
        if (!title) { alert('Saisissez un libellé.'); return; }
        const expense = create({
          date: document.getElementById('new-exp-date')?.value || dateVal,
          categoryId: document.getElementById('new-exp-cat')?.value,
          title: title,
          amount: document.getElementById('new-exp-amount')?.value,
          location: document.getElementById('new-exp-location')?.value.trim(),
          description: document.getElementById('new-exp-desc')?.value.trim(),
          projectId: document.getElementById('new-exp-project')?.value || null,
          status: document.getElementById('new-exp-status')?.value || 'draft',
          linkedTaskId: prefill.linkedTaskId || null,
          linkedEventUid: prefill.linkedEventUid || null
        });
        App.closeModal();
        // Naviguer vers le mois du frais créé
        const d = new Date(expense.date);
        _viewYear = d.getFullYear();
        _viewMonth = d.getMonth();
        _selectedDay = d.getDate();
        renderExpensesView();
      }},
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() }
    ]);

    setTimeout(() => document.getElementById('new-exp-title')?.focus(), 100);
  }

  function showEditModal(id) {
    const exp = getById(id);
    if (!exp) return;
    const categories = getCategories();
    const projects = typeof Projects !== 'undefined' ? Projects.getAll() : [];

    App.showModal('Modifier le frais', `
      <div class="form-row">
        <div class="form-group"><label>Date</label><input type="date" class="glass-input" id="edit-exp-date" value="${exp.date}"/></div>
        <div class="form-group"><label>Catégorie</label><select class="glass-select" id="edit-exp-cat">
          ${categories.map(c => `<option value="${_esc(c.id)}"${c.id === exp.categoryId ? ' selected' : ''}>${_esc(c.icon)} ${_esc(c.shortLabel)}</option>`).join('')}
        </select></div>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex:2"><label>Libellé</label><input type="text" class="glass-input" id="edit-exp-title" value="${_esc(exp.title)}"/></div>
        <div class="form-group" style="flex:1"><label>Montant (€)</label><input type="number" class="glass-input" id="edit-exp-amount" step="0.01" min="0" value="${exp.amount || ''}"/></div>
      </div>
      <div class="form-group"><label>Lieu / destination</label><input type="text" class="glass-input" id="edit-exp-location" value="${_esc(exp.location || '')}"/></div>
      <div class="form-group"><label>Notes</label><textarea class="glass-input" id="edit-exp-desc" rows="2">${_esc(exp.description || '')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Projet associé</label><select class="glass-select" id="edit-exp-project">
          <option value="">— Aucun —</option>
          ${projects.map(p => `<option value="${p.id}"${p.id === exp.projectId ? ' selected' : ''}>${_esc(p.name)}</option>`).join('')}
        </select></div>
        <div class="form-group"><label>Statut</label><select class="glass-select" id="edit-exp-status">
          ${Object.entries(STATUS_CONFIG).map(([k, v]) => `<option value="${k}"${k === exp.status ? ' selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
        </select></div>
      </div>
    `, [
      { label: 'Enregistrer', cls: 'btn-primary', action: () => {
        const title = document.getElementById('edit-exp-title')?.value.trim();
        if (!title) { alert('Saisissez un libellé.'); return; }
        const newStatus = document.getElementById('edit-exp-status')?.value || exp.status;
        update(id, {
          date: document.getElementById('edit-exp-date')?.value || exp.date,
          categoryId: document.getElementById('edit-exp-cat')?.value || exp.categoryId,
          title: title,
          amount: parseFloat(document.getElementById('edit-exp-amount')?.value) || 0,
          location: document.getElementById('edit-exp-location')?.value.trim(),
          description: document.getElementById('edit-exp-desc')?.value.trim(),
          projectId: document.getElementById('edit-exp-project')?.value || null,
          status: newStatus
        });
        if (newStatus !== exp.status) setStatus(id, newStatus);
        App.closeModal();
        renderExpensesView();
      }},
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() }
    ]);
  }

  // ── EXPORT CSV ────────────────────────────────────────────────────────

  function exportMonthCSV(year, month) {
    const expenses = getByMonth(year, month);
    if (!expenses.length) { alert('Aucun frais à exporter ce mois.'); return; }

    const monthLabel = new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const BOM = '﻿';
    let csv = BOM + 'Date;Catégorie;Libellé;Montant;Statut;Lieu;Projet;Notes\n';

    expenses
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(e => {
        const cat = getCategoryById(e.categoryId);
        const project = e.projectId && typeof Projects !== 'undefined' ? Projects.getById(e.projectId) : null;
        const sc = STATUS_CONFIG[e.status] || STATUS_CONFIG.draft;
        csv += [
          e.date,
          cat?.shortLabel || '',
          _csvEscape(e.title),
          (e.amount || 0).toFixed(2).replace('.', ','),
          sc.label,
          _csvEscape(e.location || ''),
          _csvEscape(project?.name || ''),
          _csvEscape(e.description || '')
        ].join(';') + '\n';
      });

    const filename = `frais-pro-${year}-${String(month + 1).padStart(2, '0')}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── UTILITIES ─────────────────────────────────────────────────────────

  function _formatAmount(amount) {
    return (amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  function _csvEscape(str) {
    if (!str) return '';
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function _esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── API PUBLIQUE ──────────────────────────────────────────────────────

  return {
    init, create, update, remove,
    getAll, getById, getByMonth, getCategories, getCategoryById,
    setStatus, getMonthSummary,
    convertFromTask, convertToTask, convertFromEvent,
    renderExpensesView, showCreateModal, showEditModal,
    exportMonthCSV
  };
})();
