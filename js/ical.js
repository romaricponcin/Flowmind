/**
 * FlowMind — iCal Module
 * Import et parsing de calendriers Zimbra/iCal (.ics)
 */

const ICal = (() => {
  let _state = null;
  let _onUpdate = null;

  function init(state, onUpdate) {
    _state = state;
    _onUpdate = onUpdate;
    _bindUI();
    renderEvents();
  }

  function _bindUI() {
    const importBtn  = document.getElementById('ical-import-btn');
    const fileInput  = document.getElementById('ical-file-input');

    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const url = document.getElementById('ical-url-input')?.value.trim();
        if (!url) { alert('Entrez une URL .ics valide.'); return; }
        importFromUrl(url);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = parseICS(ev.target.result);
          _mergeEvents(result.events);
          const taskCount = importTasks(result.todos);
          renderEvents();
          const parts = [`${result.events.length} événement(s)`];
          if (taskCount) parts.push(`${taskCount} tâche(s)`);
          alert(`✅ ${parts.join(' et ')} importé(s).`);
        };
        reader.readAsText(file);
      });
    }
  }

  async function importFromUrl(url) {
    const btn = document.getElementById('ical-import-btn');
    if (btn) { btn.textContent = '⏳ Import…'; btn.disabled = true; }

    try {
      // Tentative directe (CORS peut bloquer)
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const resp = await fetch(proxyUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const result = parseICS(text);
      _mergeEvents(result.events);
      const taskCount = importTasks(result.todos);
      renderEvents();
      const parts = [`${result.events.length} événement(s)`];
      if (taskCount) parts.push(`${taskCount} tâche(s)`);
      alert(`✅ ${parts.join(' et ')} importé(s) depuis Zimbra.`);
    } catch (e) {
      alert(`⚠ Impossible d'importer directement (restrictions CORS).\n\nSolution : Téléchargez votre calendrier depuis Zimbra (Fichier → Exporter) et importez le fichier .ics.\n\nErreur : ${e.message}`);
    } finally {
      if (btn) { btn.textContent = 'Importer'; btn.disabled = false; }
    }
  }

  function parseICS(icsText) {
    const events = [];
    const todos = [];
    const lines  = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    let current = null;
    let currentType = null;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      while (i + 1 < lines.length && (lines[i+1].startsWith(' ') || lines[i+1].startsWith('\t'))) {
        i++;
        line += lines[i].substring(1);
      }

      if (line === 'BEGIN:VEVENT') {
        current = {};
        currentType = 'event';
      } else if (line === 'BEGIN:VTODO') {
        current = {};
        currentType = 'todo';
      } else if ((line === 'END:VEVENT' || line === 'END:VTODO') && current) {
        if (current.title) {
          if (currentType === 'event') events.push(current);
          else todos.push(current);
        }
        current = null;
        currentType = null;
      } else if (current) {
        const colonIdx = line.indexOf(':');
        if (colonIdx < 0) continue;
        const key = line.substring(0, colonIdx).split(';')[0].toUpperCase();
        const val = line.substring(colonIdx + 1);

        switch (key) {
          case 'SUMMARY':
            current.title = _unescapeICS(val);
            break;
          case 'DESCRIPTION':
            current.description = _unescapeICS(val).substring(0, 200);
            break;
          case 'DTSTART':
            current.start = _parseICSDate(val);
            break;
          case 'DTEND':
            current.end = _parseICSDate(val);
            break;
          case 'DUE':
            current.due = _parseICSDate(val);
            break;
          case 'LOCATION':
            current.location = _unescapeICS(val);
            break;
          case 'UID':
            current.uid = val;
            break;
          case 'STATUS':
            current.icsStatus = val.trim().toUpperCase();
            break;
          case 'PRIORITY':
            current.icsPriority = parseInt(val, 10) || 0;
            break;
          case 'PERCENT-COMPLETE':
            current.percentComplete = parseInt(val, 10) || 0;
            break;
        }
      }
    }

    return { events, todos };
  }

  function _parseICSDate(val) {
    // Format: 20240115T093000Z ou 20240115
    const clean = val.replace('Z', '').replace(/-/g, '');
    const year  = clean.substring(0, 4);
    const month = clean.substring(4, 6);
    const day   = clean.substring(6, 8);
    const hour  = clean.substring(9, 11) || '00';
    const min   = clean.substring(11, 13) || '00';
    return new Date(`${year}-${month}-${day}T${hour}:${min}:00`).toISOString();
  }

  function _unescapeICS(str) {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  function _mergeEvents(newEvents) {
    if (!_state) return;
    const existingUids = new Set((_state.calendarEvents || []).map(e => e.uid));
    const toAdd = newEvents.filter(e => !e.uid || !existingUids.has(e.uid)).map(e => ({
      ...e,
      id: Storage.generateId()
    }));
    if (!_state.calendarEvents) _state.calendarEvents = [];
    _state.calendarEvents.push(...toAdd);
    if (_onUpdate) _onUpdate();
  }

  function renderEvents() {
    const container = document.getElementById('calendar-events-list');
    if (!container || !_state) return;
    container.innerHTML = '';

    const events = (_state.calendarEvents || []).filter(e => e.start);
    if (!events.length) {
      container.innerHTML = '<div class="empty-state">Aucun agenda synchronisé. Utilisez les options ci-dessus.</div>';
      return;
    }

    // Trier par date, afficher les prochains 30 jours en priorité
    const now = new Date();
    const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
    const upcoming = sorted.filter(e => new Date(e.start) >= now).slice(0, 50);
    const past = sorted.filter(e => new Date(e.start) < now).slice(-10).reverse();

    if (upcoming.length) {
      const h = document.createElement('h3');
      h.style.cssText = 'font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-secondary);margin-bottom:8px';
      h.textContent = 'Prochains événements';
      container.appendChild(h);
      upcoming.forEach(e => container.appendChild(_buildEventCard(e)));
    }

    if (past.length) {
      const h = document.createElement('h3');
      h.style.cssText = 'font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:16px 0 8px';
      h.textContent = 'Événements passés récents';
      container.appendChild(h);
      past.forEach(e => {
        const card = _buildEventCard(e);
        card.style.opacity = '0.5';
        container.appendChild(card);
      });
    }
  }

  function _buildEventCard(event) {
    const card = document.createElement('div');
    card.className = 'calendar-event fade-in';

    const startDate = event.start ? new Date(event.start) : null;
    const endDate   = event.end ? new Date(event.end) : null;

    const dateStr = startDate
      ? startDate.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })
      : '—';
    const timeStr = startDate?.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) || '';
    const endStr  = endDate?.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) || '';

    card.innerHTML = `
      <div class="cal-event-date">
        <div>${dateStr}</div>
        <div style="margin-top:2px">${timeStr}${endStr ? '→'+endStr : ''}</div>
      </div>
      <div>
        <div class="cal-event-title">${_esc(event.title)}</div>
        ${event.location ? `<div class="cal-event-desc">📍 ${_esc(event.location)}</div>` : ''}
        ${event.description ? `<div class="cal-event-desc">${_esc(event.description.substring(0, 100))}</div>` : ''}
      </div>
    `;
    return card;
  }

  function _mapVtodoStatus(icsStatus) {
    switch (icsStatus) {
      case 'IN-PROCESS': return 'inprogress';
      case 'COMPLETED': return 'done';
      case 'CANCELLED': return 'deferred';
      default: return 'todo';
    }
  }

  function _mapVtodoPriority(icsPrio) {
    if (icsPrio >= 1 && icsPrio <= 4) return 'high';
    if (icsPrio === 5) return 'medium';
    if (icsPrio >= 6 && icsPrio <= 9) return 'low';
    return 'none';
  }

  function importTasks(vtodos) {
    if (!vtodos || !vtodos.length || typeof Tasks === 'undefined') return 0;
    const projects = typeof Projects !== 'undefined' ? Projects.getAll() : [];
    const defaultProjectId = projects[0]?.id || null;
    let count = 0;
    vtodos.forEach(todo => {
      const status = _mapVtodoStatus(todo.icsStatus);
      const task = Tasks.create(defaultProjectId, todo.title, {
        description: todo.description || '',
        status: status,
        priority: _mapVtodoPriority(todo.icsPriority || 0),
        dueDate: todo.due || todo.start || null
      });
      if (task && status === 'done') {
        Tasks.setStatus(task.id, 'done');
      }
      count++;
    });
    return count;
  }

  function getEvents() {
    return (_state?.calendarEvents || []).filter(e => e.start);
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, parseICS, importFromUrl, importTasks, renderEvents, getEvents };
})();
