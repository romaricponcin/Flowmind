/**
 * FlowMind v6 — Tasks Module
 * Statuts directs partout : todo | inprogress | deferred | done
 */

const Tasks = (() => {
  let _state = null;
  let _onUpdate = null;
  // Callback exécuté après création (utilisé par la conversion de mémo)
  let _pendingCreateCallback = null;

  const STATUSES = {
    todo:       { label: 'À faire',  short: 'À faire',  cls: 'status-todo',       dot: '#4e6080' },
    inprogress: { label: 'En cours', short: 'En cours', cls: 'status-inprogress', dot: '#f59e0b' },
    deferred:   { label: 'Reporté',  short: 'Reporté',  cls: 'status-deferred',   dot: '#7c8db5' },
    done:       { label: 'Terminé',  short: 'Terminé',  cls: 'status-done',       dot: '#00d9a6' },
  };

  function getStatusConfig(status) {
    return STATUSES[status] || STATUSES.todo;
  }

  function init(state, onUpdate) {
    _state = state;
    _onUpdate = onUpdate;
    _migrateData();
  }

  function _migrateData() {
    if (!_state) return;
    let changed = false;
    (_state.tasks || []).forEach(t => {
      if (!t.status) { t.status = t.completedAt ? 'done' : 'todo'; changed = true; }
      (t.subtasks || []).forEach(s => {
        if (!s.status) { s.status = s.completedAt ? 'done' : 'todo'; changed = true; }
      });
    });
    if (changed && _onUpdate) _onUpdate();
  }

  function create(projectId, title, options = {}) {
    if (!_state || !title.trim()) return null;
    const task = {
      id: Storage.generateId(), projectId,
      title: title.trim(),
      description: options.description || '',
      subtasks: options.subtasks || [],
      priority: options.priority || 'none',
      dueDate: options.dueDate || null,
      status: options.status || 'todo',
      completedAt: null,
      timeEstimate: options.timeEstimate || 25,
      createdAt: new Date().toISOString(),
      tags: options.tags || [],
      recurrence: options.recurrence || null,
    };
    _state.tasks.push(task);
    if (_onUpdate) _onUpdate();
    return task;
  }

  function update(id, changes) {
    if (!_state) return;
    const idx = _state.tasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    Object.assign(_state.tasks[idx], changes);
    if (_onUpdate) _onUpdate();
  }

  function remove(id) {
    if (!_state) return;
    _state.tasks = _state.tasks.filter(t => t.id !== id);
    if (_onUpdate) _onUpdate();
  }

  function setStatus(id, newStatus) {
    if (!_state) return;
    const task = _state.tasks.find(t => t.id === id);
    if (!task) return;
    task.status = newStatus;
    if (newStatus === 'done') {
      if (!task.completedAt) task.completedAt = new Date().toISOString();
      _state.completedHistory = _state.completedHistory || [];
      _state.completedHistory.unshift({ taskId: id, title: task.title, projectId: task.projectId, completedAt: task.completedAt });
      if (_state.completedHistory.length > 500) _state.completedHistory.splice(500);
      Gamification.awardTask(false);
    } else {
      task.completedAt = null;
    }
    // Auto-update project status (avant _onUpdate pour que le re-rendu soit correct)
    if (task.projectId && _state.projects) {
      const project = _state.projects.find(p => p.id === task.projectId);
      if (project) {
        const projectTasks = _state.tasks.filter(t => t.projectId === task.projectId);
        const allDone = projectTasks.length > 0 && projectTasks.every(t => t.status === 'done');
        if (allDone && project.status !== 'done') {
          project.status = 'done';
        } else if (!allDone && project.status === 'done') {
          project.status = 'active';
        }
      }
    }
    if (_onUpdate) _onUpdate();
    return task;
  }

  function cycleStatus(id) {
    const task = _state?.tasks.find(t => t.id === id);
    if (!task) return;
    const order = ['todo','inprogress','deferred','done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    return setStatus(id, next);
  }

  function complete(id) { return setStatus(id, 'done'); }

  function setSubtaskStatus(taskId, subtaskId, newStatus) {
    if (!_state) return;
    const task = _state.tasks.find(t => t.id === taskId);
    if (!task) return;
    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (!sub) return;
    sub.status = newStatus;
    sub.completedAt = newStatus === 'done' ? new Date().toISOString() : null;
    if (newStatus === 'done') Gamification.awardTask(true);
    const allSubDone = task.subtasks.length > 0 && task.subtasks.every(s => s.status === 'done');
    if (allSubDone) {
      setStatus(taskId, 'done');         // cascade : tâche done → projet done
    } else if (newStatus !== 'done' && task.status === 'done') {
      setStatus(taskId, 'inprogress');   // retour arrière : tâche → inprogress → projet → active
    } else {
      if (_onUpdate) _onUpdate();
    }
  }

  function completeSubtask(taskId, subtaskId) {
    const task = _state?.tasks.find(t => t.id === taskId);
    const sub  = task?.subtasks.find(s => s.id === subtaskId);
    if (!sub) return;
    const order = ['todo','inprogress','deferred','done'];
    const next  = order[(order.indexOf(sub.status||'todo') + 1) % order.length];
    setSubtaskStatus(taskId, subtaskId, next);
  }

  function getById(id) { return _state?.tasks.find(t => t.id === id) || null; }
  function getForProject(projectId) { return _state?.tasks.filter(t => t.projectId === projectId) || []; }
  function getPending() { return (_state?.tasks || []).filter(t => t.status !== 'done'); }

  function getNextPriority() {
    const pending = getPending().filter(t => t.status !== 'deferred');
    const order = { high:0, medium:1, low:2, none:3 };
    const sOrder = { inprogress:0, todo:1 };
    return pending.sort((a,b) => {
      const sa = sOrder[a.status]??2, sb = sOrder[b.status]??2;
      if (sa !== sb) return sa - sb;
      const pa = order[a.priority]??3, pb = order[b.priority]??3;
      if (pa !== pb) return pa - pb;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1; if (b.dueDate) return 1;
      return 0;
    })[0] || null;
  }

  function decomposeTask(title, existingSubtasks = []) {
    const maxMin = Config.get('microstepMaxMin') || 15;
    const patterns = [
      { re: /recherch|analys|étudi|lire|revoir/i, steps: ['Délimiter le périmètre','Collecter les sources','Lire et annoter','Synthétiser les points clés','Rédiger un résumé'] },
      { re: /rédig|écrire|rédaction|document|rapport/i, steps: ["Définir le plan","Rédiger l'introduction","Développer le corps","Rédiger la conclusion","Relire et corriger"] },
      { re: /réunion|préparer|présent/i, steps: ["Définir l'objectif","Préparer l'ordre du jour","Rassembler les documents","Préparer les points clés","Anticiper les questions"] },
      { re: /cod|développ|programm|implement/i, steps: ['Définir les spécifications','Concevoir','Implémenter','Tester et déboguer','Documenter'] },
      { re: /email|mail|contacter|répondre/i, steps: ["Définir l'objectif","Rassembler les infos","Rédiger le brouillon","Relire le ton","Envoyer et archiver"] },
    ];
    let steps = null;
    for (const p of patterns) { if (p.re.test(title)) { steps = p.steps; break; } }
    if (!steps) steps = ["Clarifier l'objectif",'Identifier les ressources','Première étape concrète',"Vérifier l'avancement",'Finaliser et valider'];
    return steps.filter(s => !existingSubtasks.some(e => e.title === s)).map(s => ({
      id: Storage.generateId(), title: s, estimateMin: maxMin, status: 'todo', completedAt: null
    }));
  }

  // ── RENDU ─────────────────────────────────────────

  function renderTaskList(projectId, container) {
    if (!container || !_state) return;
    container.innerHTML = '';
    const tasks = getForProject(projectId);
    if (!tasks.length) {
      container.innerHTML = '<div class="empty-state" style="padding:12px">Aucune tâche pour ce projet.</div>';
      return;
    }
    const order = { inprogress:0, todo:1, deferred:2, done:3 };
    [...tasks].sort((a,b) => (order[a.status]??1) - (order[b.status]??1))
              .forEach(t => container.appendChild(_buildTaskItem(t)));
  }

  // ── 3 BOUTONS STATUT RÉUTILISABLES ────────────────

  /**
   * Crée un groupe de 3 boutons statut directs.
   * @param {string} currentStatus - statut actuel
   * @param {function} onSet - callback(newStatus)
   * @param {string} size - 'normal' | 'small' | 'focus'
   */
  function buildStatusButtons(currentStatus, onSet, size) {
    size = size || 'normal';
    const wrap = document.createElement('div');
    wrap.className = 'sb-group sb-group-' + size;

    // Bouton de réinitialisation "À faire" — visible uniquement quand un statut est actif
    if (currentStatus !== 'todo') {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'sb-reset-btn';
      resetBtn.title = 'Remettre à "À faire"';
      resetBtn.innerHTML = '↩';
      resetBtn.addEventListener('click', e => {
        e.stopPropagation();
        onSet('todo');
      });
      wrap.appendChild(resetBtn);
    }

    [
      { status: 'inprogress', label: 'En cours', cls: 'sb-inprogress' },
      { status: 'deferred',   label: 'Reporté',  cls: 'sb-deferred'   },
      { status: 'done',       label: 'Terminé',  cls: 'sb-done'        },
    ].forEach(({ status, label, cls }) => {
      const btn = document.createElement('button');
      const isActive = currentStatus === status;
      btn.className = 'sb-btn ' + cls + (isActive ? ' sb-active' : '');
      btn.dataset.setstatus = status;
      btn.title = isActive ? 'Cliquer pour revenir à "À faire"' : 'Définir : ' + label;
      btn.innerHTML = '<span class="sb-dot"></span>' + (isActive ? '<span class="sb-check">✓</span> ' : '') + label;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const target = currentStatus === status ? 'todo' : status;
        onSet(target);
      });
      wrap.appendChild(btn);
    });

    return wrap;
  }

  function _buildTaskItem(task) {
    const isCompleted = task.status === 'done';
    const isOverdue   = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();
    const item = document.createElement('div');
    item.className = 'task-item task-status-' + task.status + ' fade-in';
    item.dataset.taskId = task.id;

    const pLabels = { high:'🔴 Haute', medium:'🟡 Moyenne', low:'🟢 Faible', none:'' };
    const pCls    = { high:'priority-high', medium:'priority-medium', low:'priority-low', none:'priority-none' };

    item.innerHTML =
      '<div class="task-body">' +
        '<div class="task-title-row">' +
          '<div class="task-title' + (isCompleted ? ' task-title-done' : '') + '">' + _esc(task.title) + (task.recurrence ? ' <span class="task-recur-icon" title="Tâche récurrente">↺</span>' : '') + '</div>' +
          '<div class="task-inline-status"></div>' +
        '</div>' +
        '<div class="task-meta">' +
          (task.priority && task.priority !== 'none' ? '<span class="task-tag ' + pCls[task.priority] + '">' + pLabels[task.priority] + '</span>' : '') +
          (task.dueDate ? '<span class="task-due' + (isOverdue ? ' overdue':'') + '">' + (isOverdue?'⚠ ':'') + _formatDate(task.dueDate) + '</span>' : '') +
          (task.timeEstimate ? '<span class="task-tag" style="background:var(--glass-bg);color:var(--t3)">~' + task.timeEstimate + 'min</span>' : '') +
        '</div>' +
        (task.subtasks?.length ? '<div class="subtask-list" id="subtasks-' + task.id + '"></div>' : '') +
      '</div>' +
      '<div class="task-actions">' +
        '<button class="btn-task-action" data-action="edit"   data-id="' + task.id + '" title="Modifier">✎</button>' +
        '<button class="btn-task-action" data-action="focus"  data-id="' + task.id + '" title="Mode focus">◎</button>' +
        '<button class="btn-task-action" data-action="delete" data-id="' + task.id + '" title="Supprimer">🗑</button>' +
      '</div>';

    // Boutons statut inline
    const statusWrap = item.querySelector('.task-inline-status');
    statusWrap.appendChild(buildStatusButtons(task.status, (newStatus) => {
      item.classList.add('status-changing');
      setTimeout(() => item.classList.remove('status-changing'), 400);
      setStatus(task.id, newStatus);
      App.refresh();
    }, 'small'));

    // Sous-tâches
    if (task.subtasks?.length) {
      const subList = item.querySelector('#subtasks-' + task.id);
      task.subtasks.forEach(sub => {
        const subItem = document.createElement('div');
        subItem.className = 'subtask-item subtask-status-' + (sub.status||'todo');
        subItem.innerHTML =
          '<div class="subtask-status-btns"></div>' +
          '<span class="subtask-title' + (sub.status==='done' ? ' subtask-done-text':'') + '">' + _esc(sub.title) + '</span>' +
          '<span class="subtask-min">' + (sub.estimateMin||15) + 'min</span>';

        // Boutons statut sous-tâche
        subItem.querySelector('.subtask-status-btns').appendChild(
          buildStatusButtons(sub.status||'todo', (newStatus) => {
            setSubtaskStatus(task.id, sub.id, newStatus);
            App.refresh();
          }, 'tiny')
        );

        subList.appendChild(subItem);
      });
    }

    // Actions
    item.addEventListener('click', e => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action, id = el.dataset.id;
      if      (action === 'edit')   showEditModal(id);
      else if (action === 'focus')  App.launchFocusMode(id);
      else if (action === 'delete') App.showConfirm('Supprimer cette tâche ?', () => { remove(id); App.refresh(); });
    });

    return item;
  }

  // ── MODALS ────────────────────────────────────────

  /**
   * @param {string} defaultProjectId
   * @param {object} prefill - { title?: string, onCreated?: function(task) }
   */
  function showCreateModal(defaultProjectId, prefill = {}) {
    const projects = Projects.getAll();
    if (!projects.length) { alert('Créez d\'abord un projet !'); return; }
    _pendingCreateCallback = prefill.onCreated || null;
    const modalTitle = prefill.title ? '⚡ Mémo → Tâche' : 'Nouvelle tâche';
    App.showModal(modalTitle, `
      <div class="form-group"><label>Titre de la tâche</label><input type="text" class="glass-input" id="new-task-title" placeholder="Ex: Préparer la réunion du lundi" /></div>
      <div class="form-row">
        <div class="form-group"><label>Projet</label><select class="glass-select" id="new-task-project">${projects.map(p=>`<option value="${p.id}" ${p.id===defaultProjectId?'selected':''}>${_esc(p.name)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Statut initial</label><select class="glass-select" id="new-task-status"><option value="todo">○ À faire</option><option value="inprogress">◑ En cours</option><option value="deferred">◷ Reporté</option><option value="done">● Terminé</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Priorité</label><select class="glass-select" id="new-task-priority"><option value="none">— Aucune —</option><option value="high">🔴 Haute</option><option value="medium">🟡 Moyenne</option><option value="low">🟢 Faible</option></select></div>
        <div class="form-group"><label>Échéance</label><input type="date" class="glass-input" id="new-task-due" /></div>
      </div>
      <div class="form-row"><div class="form-group"><label>Durée estimée (min)</label><input type="number" class="glass-input" id="new-task-time" value="25" min="5" max="480" /></div></div>
      <div class="form-group"><label>Description (optionnel)</label><textarea class="glass-input" id="new-task-desc" rows="2" style="resize:vertical"></textarea></div>
      <div class="form-group">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><label>Micro-étapes</label><button class="btn-text" id="auto-decompose-btn">⚡ Décomposer automatiquement</button></div>
        <div class="decompose-area" id="decompose-area"></div>
        <div class="decompose-add"><input type="text" class="glass-input" id="subtask-new-input" placeholder="Ajouter une étape…" /><button class="btn-secondary" id="subtask-add-btn">+</button></div>
      </div>
      <div class="form-group recurrence-section">
        <label class="recurrence-toggle-label">
          <input type="checkbox" id="new-task-recurring" />
          <span>↺ Tâche récurrente</span>
        </label>
        <div class="recurrence-options hidden" id="new-recurrence-options">
          <div class="form-row">
            <div class="form-group"><label>Date de début</label><input type="date" class="glass-input" id="new-recur-start" /></div>
            <div class="form-group"><label>Date de fin</label><input type="date" class="glass-input" id="new-recur-end" /></div>
          </div>
          <div class="form-group"><label>Fréquence</label>
            <div class="recurrence-freq-row">
              <label class="recur-radio"><input type="radio" name="new-recur-type" value="weekly" checked /> Hebdomadaire</label>
              <label class="recur-radio"><input type="radio" name="new-recur-type" value="monthly" /> Mensuel</label>
              <label class="recur-radio"><input type="radio" name="new-recur-type" value="custom" /> Tous les
                <input type="number" class="glass-input recur-interval-input" id="new-recur-interval" value="7" min="1" max="365" />
                jours
              </label>
            </div>
          </div>
        </div>
      </div>`, [
      { label:'Annuler', cls:'btn-secondary', action:()=>App.closeModal() },
      { label:'+ Créer la tâche', cls:'btn-primary', action:_submitCreate }
    ]);
    setTimeout(()=>{
      const titleEl = document.getElementById('new-task-title');
      if (titleEl) {
        // Pré-remplir si conversion depuis un mémo
        if (prefill.title) {
          titleEl.value = prefill.title;
          titleEl.select();
        } else {
          titleEl.focus();
        }
      }
      _bindDecomposeUI([]);
      document.getElementById('auto-decompose-btn').addEventListener('click',()=>{
        const title=document.getElementById('new-task-title').value.trim();
        if(!title){alert('Entrez d\'abord un titre.');return;}
        _renderDecomposeList(decomposeTask(title,[]));
      });
      _bindRecurrenceToggle('new-task-recurring','new-recurrence-options');
    },100);
  }

  function showEditModal(id) {
    const task=getById(id); if(!task) return;
    const projects=Projects.getAll();
    App.showModal('Modifier la tâche', `
      <div class="form-group"><label>Titre</label><input type="text" class="glass-input" id="edit-task-title" value="${_esc(task.title)}" /></div>
      <div class="form-row">
        <div class="form-group"><label>Projet</label><select class="glass-select" id="edit-task-project">${projects.map(p=>`<option value="${p.id}" ${p.id===task.projectId?'selected':''}>${_esc(p.name)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Statut</label><select class="glass-select" id="edit-task-status">
          <option value="todo" ${task.status==='todo'?'selected':''}>○ À faire</option>
          <option value="inprogress" ${task.status==='inprogress'?'selected':''}>◑ En cours</option>
          <option value="deferred" ${task.status==='deferred'?'selected':''}>◷ Reporté</option>
          <option value="done" ${task.status==='done'?'selected':''}>● Terminé</option>
        </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Priorité</label><select class="glass-select" id="edit-task-priority">
          <option value="none" ${task.priority==='none'?'selected':''}>— Aucune —</option>
          <option value="high" ${task.priority==='high'?'selected':''}>🔴 Haute</option>
          <option value="medium" ${task.priority==='medium'?'selected':''}>🟡 Moyenne</option>
          <option value="low" ${task.priority==='low'?'selected':''}>🟢 Faible</option>
        </select></div>
        <div class="form-group"><label>Échéance</label><input type="date" class="glass-input" id="edit-task-due" value="${task.dueDate||''}" /></div>
      </div>
      <div class="form-group"><label>Durée estimée (min)</label><input type="number" class="glass-input glass-input-sm" id="edit-task-time" value="${task.timeEstimate||25}" min="5" /></div>
      <div class="form-group"><label>Description</label><textarea class="glass-input" id="edit-task-desc" rows="2" style="resize:vertical">${_esc(task.description||'')}</textarea></div>
      <div class="form-group">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><label>Micro-étapes</label><button class="btn-text" id="edit-auto-decompose">⚡ Décomposer</button></div>
        <div class="decompose-area" id="decompose-area"></div>
        <div class="decompose-add"><input type="text" class="glass-input" id="subtask-new-input" placeholder="Ajouter une étape…" /><button class="btn-secondary" id="subtask-add-btn">+</button></div>
      </div>
      <div class="form-group recurrence-section">
        <label class="recurrence-toggle-label">
          <input type="checkbox" id="edit-task-recurring" ${task.recurrence ? 'checked' : ''} />
          <span>↺ Tâche récurrente</span>
        </label>
        <div class="recurrence-options ${task.recurrence ? '' : 'hidden'}" id="edit-recurrence-options">
          <div class="form-row">
            <div class="form-group"><label>Date de début</label><input type="date" class="glass-input" id="edit-recur-start" value="${task.recurrence?.startDate||''}" /></div>
            <div class="form-group"><label>Date de fin</label><input type="date" class="glass-input" id="edit-recur-end" value="${task.recurrence?.endDate||''}" /></div>
          </div>
          <div class="form-group"><label>Fréquence</label>
            <div class="recurrence-freq-row">
              <label class="recur-radio"><input type="radio" name="edit-recur-type" value="weekly" ${(!task.recurrence||task.recurrence.type==='weekly')?'checked':''} /> Hebdomadaire</label>
              <label class="recur-radio"><input type="radio" name="edit-recur-type" value="monthly" ${task.recurrence?.type==='monthly'?'checked':''} /> Mensuel</label>
              <label class="recur-radio"><input type="radio" name="edit-recur-type" value="custom" ${task.recurrence?.type==='custom'?'checked':''} /> Tous les
                <input type="number" class="glass-input recur-interval-input" id="edit-recur-interval" value="${task.recurrence?.interval||7}" min="1" max="365" />
                jours
              </label>
            </div>
          </div>
        </div>
      </div>`, [
      { label:'Annuler', cls:'btn-secondary', action:()=>App.closeModal() },
      { label:'Sauvegarder', cls:'btn-primary', action:()=>{
        const title=document.getElementById('edit-task-title').value.trim();
        const projId=document.getElementById('edit-task-project').value;
        const status=document.getElementById('edit-task-status').value;
        const priority=document.getElementById('edit-task-priority').value;
        const dueDate=document.getElementById('edit-task-due').value||null;
        const time=parseInt(document.getElementById('edit-task-time').value)||25;
        const desc=document.getElementById('edit-task-desc').value.trim();
        const subtasks=_readSubtasks();
        if(!title) return;
        const recurrence=_readRecurrence('edit');
        const changes={title,projectId:projId,status,priority,dueDate,timeEstimate:time,description:desc,subtasks,recurrence};
        if(status==='done' && !task.completedAt) changes.completedAt=new Date().toISOString();
        if(status!=='done') changes.completedAt=null;
        update(id,changes); App.closeModal(); App.refresh();
      }}
    ]);
    setTimeout(()=>{
      _bindDecomposeUI(task.subtasks||[]);
      _renderDecomposeList(task.subtasks||[]);
      document.getElementById('edit-auto-decompose').addEventListener('click',()=>{
        const title=document.getElementById('edit-task-title').value.trim();
        const current=_readSubtasks();
        _renderDecomposeList([...current,...decomposeTask(title,current)]);
      });
      _bindRecurrenceToggle('edit-task-recurring','edit-recurrence-options');
    },100);
  }

  function _bindDecomposeUI(initialSubs) {
    _renderDecomposeList(initialSubs);
    const addBtn=document.getElementById('subtask-add-btn');
    const addInput=document.getElementById('subtask-new-input');
    const doAdd=()=>{ const val=addInput.value.trim(); if(!val) return; const ex=_readSubtasks(); ex.push({id:Storage.generateId(),title:val,estimateMin:Config.get('microstepMaxMin')||15,status:'todo',completedAt:null}); _renderDecomposeList(ex); addInput.value=''; };
    addBtn.addEventListener('click',doAdd);
    addInput.addEventListener('keydown',e=>{ if(e.key==='Enter') doAdd(); });
  }

  function _renderDecomposeList(subs) {
    const area=document.getElementById('decompose-area'); if(!area) return;
    area.innerHTML='';
    subs.forEach((sub,idx)=>{
      const row=document.createElement('div'); row.className='decompose-item';
      row.innerHTML='<span style="color:var(--t3);font-family:monospace;font-size:11px">'+(idx+1)+'.</span><input type="text" value="'+_esc(sub.title)+'" data-sub-id="'+sub.id+'" /><input type="number" value="'+(sub.estimateMin||15)+'" min="1" max="120" data-sub-min="'+sub.id+'" style="width:50px;background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:4px;color:var(--t1);padding:2px 4px;font-size:11px" /><span style="font-size:10px;color:var(--t3)">min</span><button class="glass-btn-icon" data-remove="'+sub.id+'" style="width:22px;height:22px;font-size:11px">✕</button>';
      row.querySelector('[data-remove="'+sub.id+'"]').addEventListener('click',()=>_renderDecomposeList(_readSubtasks().filter(s=>s.id!==sub.id)));
      area.appendChild(row);
    });
  }

  function _readSubtasks() {
    const area=document.getElementById('decompose-area'); if(!area) return [];
    const items=[];
    area.querySelectorAll('.decompose-item').forEach(row=>{
      const ti=row.querySelector('input[type="text"]'); const mi=row.querySelector('input[type="number"]');
      const title=ti?.value.trim(); if(title) items.push({id:ti?.dataset.subId||Storage.generateId(),title,estimateMin:parseInt(mi?.value)||15,status:'todo',completedAt:null});
    });
    return items;
  }

  function _bindRecurrenceToggle(checkboxId, optionsId) {
    const chk = document.getElementById(checkboxId);
    const opts = document.getElementById(optionsId);
    if (!chk || !opts) return;
    chk.addEventListener('change', () => {
      opts.classList.toggle('hidden', !chk.checked);
    });
  }

  function _readRecurrence(prefix) {
    const chk = document.getElementById(prefix + '-task-recurring');
    if (!chk?.checked) return null;
    const startDate = document.getElementById(prefix + '-recur-start')?.value || null;
    const endDate   = document.getElementById(prefix + '-recur-end')?.value || null;
    const typeEl    = document.querySelector(`input[name="${prefix}-recur-type"]:checked`);
    const type      = typeEl?.value || 'weekly';
    const interval  = parseInt(document.getElementById(prefix + '-recur-interval')?.value) || 7;
    return { startDate, endDate, type, interval };
  }

  function _submitCreate() {
    const title=document.getElementById('new-task-title').value.trim();
    const projId=document.getElementById('new-task-project').value;
    const status=document.getElementById('new-task-status').value;
    const priority=document.getElementById('new-task-priority').value;
    const dueDate=document.getElementById('new-task-due').value||null;
    const time=parseInt(document.getElementById('new-task-time').value)||25;
    const desc=document.getElementById('new-task-desc').value.trim();
    const subtasks=_readSubtasks();
    const recurrence=_readRecurrence('new');
    if(!title){alert('Le titre est requis.');return;}
    const task = create(projId,title,{status,priority,dueDate,timeEstimate:time,description:desc,subtasks,recurrence});
    // Exécuter le callback post-création (ex: supprimer le mémo source)
    if (_pendingCreateCallback && task) {
      _pendingCreateCallback(task);
      _pendingCreateCallback = null;
    }
    App.closeModal(); App.refresh();
  }

  function _formatDate(iso) {
    if(!iso) return '';
    const d=new Date(iso), now=new Date();
    const diff=Math.ceil((d-now)/86400000);
    if(diff<0) return '⚠ '+d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    if(diff===0) return "Aujourd'hui";
    if(diff===1) return 'Demain';
    return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
  }

  function _esc(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, create, update, remove, setStatus, cycleStatus, complete, setSubtaskStatus, completeSubtask, getById, getForProject, getPending, getNextPriority, decomposeTask, renderTaskList, buildStatusButtons, showCreateModal, showEditModal, STATUSES, getStatusConfig };
})();
