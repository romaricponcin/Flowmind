/**
 * FlowMind — Project Templates Module
 * Gestion des modèles de projets: création, application, suppression
 */

const Templates = (() => {
  let _state = null;
  let _onUpdate = null;

  function init(state, onUpdate) {
    _state = state;
    _onUpdate = onUpdate;
  }

  /**
   * Crée un modèle à partir d'un projet existant.
   * Le modèle capture: nom, couleur, tags, et la structure des tâches (structure seulement, pas les spécificités).
   */
  function createFromProject(projectId, templateName) {
    if (!_state || !templateName.trim()) return null;

    const project = Projects.getById(projectId);
    if (!project) return null;

    // Récupérer les tâches du projet pour en capturer la structure
    const projectTasks = (_state.tasks || []).filter(t => t.projectId === projectId);

    // Préparer la structure des tâches (sans les champs spécifiques comme dates de création, etc.)
    const taskStructure = projectTasks.map(task => ({
      title: task.title,
      description: task.description || '',
      subtasks: (task.subtasks || []).map(st => ({ title: st.title })),
      recurrence: task.recurrence ? { ...task.recurrence } : null
    }));

    const template = {
      id: Storage.generateId(),
      name: templateName.trim(),
      projectColor: project.color,
      projectTags: project.tags || [],
      taskStructure,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    if (!_state.projectTemplates) _state.projectTemplates = [];
    _state.projectTemplates.push(template);
    if (_onUpdate) _onUpdate();
    return template;
  }

  /**
   * Crée un nouveau projet à partir d'un modèle.
   * Applique la structure des tâches au nouveau projet.
   */
  function createProjectFromTemplate(templateId, newProjectName) {
    if (!_state || !newProjectName.trim()) return null;

    const template = getById(templateId);
    if (!template) return null;

    // Créer le nouveau projet avec le nom et la couleur du template
    const newProject = Projects.create(newProjectName, template.projectColor);
    if (!newProject) return null;

    // Appliquer les tags du template
    if (template.projectTags && template.projectTags.length) {
      Projects.update(newProject.id, { tags: [...template.projectTags] });
    }

    // Créer les tâches selon la structure du template
    (template.taskStructure || []).forEach(taskDef => {
      const task = Tasks.create(newProject.id, taskDef.title);
      if (task && taskDef.description) {
        Tasks.update(task.id, { description: taskDef.description });
      }
      if (task && taskDef.subtasks && taskDef.subtasks.length) {
        taskDef.subtasks.forEach(stDef => {
          if (!task.subtasks) task.subtasks = [];
          task.subtasks.push({
            id: Storage.generateId(),
            title: stDef.title,
            done: false
          });
        });
        Tasks.update(task.id, { subtasks: task.subtasks });
      }
      if (task && taskDef.recurrence) {
        Tasks.update(task.id, { recurrence: taskDef.recurrence });
      }
    });

    // Incrémenter le compteur d'utilisation du template
    _addUsage(templateId);

    if (_onUpdate) _onUpdate();
    return newProject;
  }

  function getAll() {
    return _state ? (_state.projectTemplates || []) : [];
  }

  function getById(id) {
    return (_state?.projectTemplates || []).find(t => t.id === id) || null;
  }

  function remove(id) {
    if (!_state || !_state.projectTemplates) return;
    _state.projectTemplates = _state.projectTemplates.filter(t => t.id !== id);
    if (_onUpdate) _onUpdate();
  }

  function update(id, changes) {
    if (!_state || !_state.projectTemplates) return;
    const idx = _state.projectTemplates.findIndex(t => t.id === id);
    if (idx < 0) return;
    Object.assign(_state.projectTemplates[idx], changes);
    if (_onUpdate) _onUpdate();
  }

  function _addUsage(templateId) {
    const template = getById(templateId);
    if (template) {
      update(templateId, { usageCount: (template.usageCount || 0) + 1 });
    }
  }

  /**
   * Affiche une modal pour créer un nouveau projet à partir d'un template.
   */
  function showUseTemplateModal() {
    const templates = getAll();

    if (!templates.length) {
      App.showAlert('Aucun modèle disponible', 'Créez un modèle en cliquant sur "Créer un modèle" depuis un projet existant.');
      return;
    }

    const templateOptions = templates
      .map(t => `<option value="${t.id}">${_esc(t.name)} ${t.usageCount ? '(' + t.usageCount + '×)' : ''}</option>`)
      .join('');

    App.showModal('Créer un projet à partir d\'un modèle', `
      <div class="form-group">
        <label>Sélectionner un modèle</label>
        <select class="glass-input" id="template-select">
          <option value="">-- Choisir un modèle --</option>
          ${templateOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Nom du nouveau projet</label>
        <input type="text" class="glass-input" id="template-proj-name" placeholder="Ex: Nouveau rapport" />
      </div>
    `, [
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() },
      { label: 'Créer le projet', cls: 'btn-primary', action: () => {
        const templateId = document.getElementById('template-select').value;
        const name = document.getElementById('template-proj-name').value.trim();
        if (!templateId) { alert('Sélectionnez un modèle.'); return; }
        if (!name) { alert('Le nom du projet est requis.'); return; }
        createProjectFromTemplate(templateId, name);
        App.closeModal();
        App.refresh();
      }}
    ]);

    // Auto-focus du select
    setTimeout(() => document.getElementById('template-select')?.focus(), 100);
  }

  /**
   * Affiche une modal pour créer un modèle à partir d'un projet existant.
   */
  function showCreateTemplateModal(projectId) {
    const project = Projects.getById(projectId);
    if (!project) return;

    App.showModal('Créer un modèle à partir de ce projet', `
      <div class="form-group">
        <label>Nom du modèle</label>
        <input type="text" class="glass-input" id="template-name" placeholder="Ex: Modèle rapport TNE" />
      </div>
      <p style="font-size:12px;color:var(--t3);margin-top:8px">
        Ce modèle capturera:<br/>
        • La couleur du projet<br/>
        • Les tags<br/>
        • La structure des tâches et sous-tâches (titres, descriptions, récurrence)<br/>
        <strong>Les contenus spécifiques et les statuts ne seront pas copiés.</strong>
      </p>
    `, [
      { label: 'Annuler', cls: 'btn-secondary', action: () => App.closeModal() },
      { label: 'Créer le modèle', cls: 'btn-primary', action: () => {
        const name = document.getElementById('template-name').value.trim();
        if (!name) { alert('Le nom du modèle est requis.'); return; }
        const template = createFromProject(projectId, name);
        if (template) {
          App.showAlert('Modèle créé ✓', `Le modèle "${name}" a été créé avec succès.`);
        }
        App.closeModal();
      }}
    ]);

    setTimeout(() => document.getElementById('template-name')?.focus(), 100);
  }

  /**
   * Affiche la liste des modèles avec options de gestion.
   */
  function showTemplatesPanel() {
    const templates = getAll();

    const content = templates.length
      ? `
        <div style="max-height:400px;overflow-y:auto">
          ${templates.map(t => `
            <div style="padding:12px;border:1px solid var(--border-glass);border-radius:8px;margin-bottom:8px;background:var(--glass-light)">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="flex:1">
                  <div style="font-weight:500">${_esc(t.name)}</div>
                  <div style="font-size:12px;color:var(--t3);margin-top:4px">
                    <strong style="display:inline-block;width:80px">Couleur:</strong>
                    <span style="display:inline-block;width:20px;height:20px;background:${t.projectColor};border-radius:4px;vertical-align:middle"></span>
                  </div>
                  <div style="font-size:12px;color:var(--t3)">
                    <strong>Tags:</strong> ${t.projectTags.length ? t.projectTags.join(', ') : '—'}
                  </div>
                  <div style="font-size:12px;color:var(--t3)">
                    <strong>Tâches:</strong> ${t.taskStructure ? t.taskStructure.length : 0} tâches
                  </div>
                  <div style="font-size:11px;color:var(--t4);margin-top:4px">
                    Créé: ${new Date(t.createdAt).toLocaleDateString('fr-FR')} · Utilisé ${t.usageCount || 0}×
                  </div>
                </div>
                <div style="display:flex;gap:4px">
                  <button class="glass-btn-icon btn-use-template" data-id="${t.id}" title="Utiliser ce modèle">→</button>
                  <button class="glass-btn-icon btn-delete-template" data-id="${t.id}" title="Supprimer le modèle">🗑</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `
      : '<div class="empty-state">Aucun modèle créé. Créez un modèle depuis un projet existant.</div>';

    App.showModal('Gérer les modèles de projets', content, [
      { label: 'Fermer', cls: 'btn-secondary', action: () => App.closeModal() }
    ]);

    // Bind events après le rendu
    setTimeout(() => {
      document.querySelectorAll('.btn-use-template').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          App.closeModal();
          setTimeout(() => showUseTemplateModal(), 200);
        });
      });

      document.querySelectorAll('.btn-delete-template').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const tmpl = getById(id);
          App.showConfirm(
            `Supprimer le modèle "${tmpl.name}" ?`,
            () => { remove(id); App.closeModal(); showTemplatesPanel(); }
          );
        });
      });
    }, 50);
  }

  function _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    init,
    createFromProject,
    createProjectFromTemplate,
    getAll,
    getById,
    remove,
    update,
    showUseTemplateModal,
    showCreateTemplateModal,
    showTemplatesPanel
  };
})();
