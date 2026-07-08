/**
 * FlowMind — Reports Module
 * Génération de rapports d'activité par projet et période
 */

const Reports = (() => {
  let _state = null;

  function init(state) {
    _state = state;
    _bindUI();
  }

  function _bindUI() {
    document.getElementById('generate-report-btn')?.addEventListener('click', generate);
    document.getElementById('export-report-btn')?.addEventListener('click', exportMarkdown);
  }

  function generate() {
    if (!_state) return;

    const projectFilter = document.getElementById('report-project-filter')?.value || 'all';
    const period = document.getElementById('report-period')?.value || 'week';
    const container = document.getElementById('report-output');
    if (!container) return;

    const history = _filterHistory(projectFilter, period);
    const stats   = _computeStats(history, projectFilter);

    container.innerHTML = '';

    // Frais en tête de rapport (plus lisibles), tâches ensuite
    if (typeof Expenses !== 'undefined') {
      const expenses   = _filterExpenses(period);
      const categories = Expenses.getCategories();
      const expDiv = document.createElement('div');
      expDiv.className = 'expense-report-block';
      expDiv.innerHTML = _buildExpenseReportHTML(expenses, categories, period);
      container.appendChild(expDiv);
    }

    if (!history.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Aucune tâche accomplie sur cette période. Continuez, vous y êtes presque !';
      container.appendChild(empty);
    } else {
      container.appendChild(_buildReportDOM(history, stats, projectFilter, period));
    }
  }

  function _filterHistory(projectFilter, period) {
    const history = _state.completedHistory || [];
    const now = new Date();
    let since;

    if (period === 'week') {
      since = new Date(now);
      since.setDate(since.getDate() - 7);
    } else if (period === 'month') {
      since = new Date(now);
      since.setMonth(since.getMonth() - 1);
    } else {
      since = null;
    }

    return history.filter(h => {
      if (since && new Date(h.completedAt) < since) return false;
      if (projectFilter !== 'all' && h.projectId !== projectFilter) return false;
      return true;
    });
  }

  function _filterExpenses(period) {
    const all = Expenses.getAll();
    const now = new Date();
    let since = null;

    if (period === 'week') {
      since = new Date(now);
      since.setDate(since.getDate() - 7);
    } else if (period === 'month') {
      since = new Date(now);
      since.setMonth(since.getMonth() - 1);
    }

    if (!since) return all;
    const sinceStr = since.toISOString().slice(0, 10);
    return all.filter(e => e.date >= sinceStr);
  }

  function _computeStats(history, projectFilter) {
    const byProject = {};
    history.forEach(h => {
      if (!byProject[h.projectId]) byProject[h.projectId] = [];
      byProject[h.projectId].push(h);
    });
    return { total: history.length, byProject };
  }

  function _buildReportDOM(history, stats, projectFilter, period) {
    const frag = document.createDocumentFragment();
    const periodLabels = { week: '7 derniers jours', month: '30 derniers jours', all: 'Tout l\'historique' };

    // Header
    const header = document.createElement('div');
    header.className = 'report-section';
    header.innerHTML = `
      <h2>📊 Rapport d'activité — ${periodLabels[period]}</h2>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
        <div class="stat-report-pill">
          <div style="font-size:28px;font-weight:700;color:var(--success);font-family:var(--font-mono)">${stats.total}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">tâches accomplies</div>
        </div>
        <div class="stat-report-pill">
          <div style="font-size:28px;font-weight:700;color:var(--accent);font-family:var(--font-mono)">${Object.keys(stats.byProject).length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">projets actifs</div>
        </div>
        <div class="stat-report-pill">
          <div style="font-size:28px;font-weight:700;color:var(--amber);font-family:var(--font-mono)">${_state.streak || 0}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">jours consécutifs</div>
        </div>
      </div>
    `;
    frag.appendChild(header);

    // Par projet
    for (const [projectId, tasks] of Object.entries(stats.byProject)) {
      const project = Projects.getById(projectId);
      const projectName = project?.name || 'Projet supprimé';
      const color = project?.color || 'var(--text-muted)';

      const section = document.createElement('div');
      section.className = 'report-section';

      const grouped = _groupByDate(tasks);
      let html = `<h3 style="border-left:3px solid ${color};padding-left:10px">${_esc(projectName)} (${tasks.length})</h3>`;

      for (const [date, dateTasks] of Object.entries(grouped)) {
        html += `<div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);margin:8px 0 4px">${date}</div>`;
        dateTasks.forEach(t => {
          html += `
            <div class="report-task-row">
              <span class="report-done-mark">✓</span>
              <span class="report-task-name">${_esc(t.title)}</span>
              <span class="report-task-time">${_formatTime(t.completedAt)}</span>
            </div>`;
        });
      }

      section.innerHTML = html;
      frag.appendChild(section);
    }

    return frag;
  }

  function _buildExpenseReportHTML(expenses, categories, period) {
    const periodLabels = { week: '7 derniers jours', month: '30 derniers jours', all: 'Tout l\'historique' };

    if (!expenses.length) {
      return `
        <div class="expense-report-header">
          <h2>💶 Frais professionnels — ${periodLabels[period]}</h2>
        </div>
        <div class="empty-state">Aucun frais enregistré pour cette période.</div>
      `;
    }

    const STATUS_CONFIG = {
      draft:      { label: 'À déclarer', icon: '○', color: 'var(--text-3, #888)' },
      submitted:  { label: 'Déclarés',   icon: '◑', color: 'var(--warning, #f59e0b)' },
      reimbursed: { label: 'Remboursés', icon: '●', color: 'var(--success, #00d9a6)' }
    };

    // KPI par statut
    const byStatus = {
      draft:      { count: 0, total: 0 },
      submitted:  { count: 0, total: 0 },
      reimbursed: { count: 0, total: 0 }
    };
    expenses.forEach(e => {
      const s = byStatus[e.status] || byStatus.draft;
      s.count++;
      s.total += e.amount || 0;
    });

    let html = `
      <div class="expense-report-header">
        <h2>💶 Frais professionnels — ${periodLabels[period]}</h2>
      </div>
      <div class="expense-report-kpi">
    `;
    for (const [key, cfg] of Object.entries(STATUS_CONFIG)) {
      const s = byStatus[key];
      html += `
        <div class="expense-report-kpi-tile">
          <span class="expense-kpi-icon" style="color:${cfg.color}">${cfg.icon}</span>
          <span class="expense-kpi-label">${cfg.label}</span>
          <span class="expense-kpi-count" style="color:${cfg.color}">${s.count} frais</span>
          <span class="expense-kpi-amount">${_fmtAmt(s.total)}</span>
        </div>
      `;
    }
    html += `</div>`;

    // Tableau mensuel
    const byMonth = {};
    expenses.forEach(e => {
      const key = e.date ? e.date.slice(0, 7) : 'inconnu';
      if (!byMonth[key]) byMonth[key] = {
        draft:      { count: 0, total: 0 },
        submitted:  { count: 0, total: 0 },
        reimbursed: { count: 0, total: 0 }
      };
      const s = byMonth[key][e.status] || byMonth[key].draft;
      s.count++;
      s.total += e.amount || 0;
    });

    const sortedMonths = Object.keys(byMonth).sort().reverse();
    if (sortedMonths.length) {
      html += `
        <h3 class="expense-report-subtitle">Détail mensuel</h3>
        <table class="expense-report-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th><span style="color:var(--text-3,#888)">○</span> À déclarer</th>
              <th><span style="color:var(--warning,#f59e0b)">◑</span> Déclarés</th>
              <th><span style="color:var(--success,#00d9a6)">●</span> Remboursés</th>
            </tr>
          </thead>
          <tbody>
      `;
      sortedMonths.forEach(m => {
        const [y, mo] = m.split('-');
        const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
          .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const d = byMonth[m];
        html += `
          <tr>
            <td>${label}</td>
            <td>${d.draft.count      ? `${d.draft.count} × ${_fmtAmt(d.draft.total)}`           : '<span style="color:var(--text-3)">—</span>'}</td>
            <td>${d.submitted.count  ? `${d.submitted.count} × ${_fmtAmt(d.submitted.total)}`   : '<span style="color:var(--text-3)">—</span>'}</td>
            <td>${d.reimbursed.count ? `${d.reimbursed.count} × ${_fmtAmt(d.reimbursed.total)}` : '<span style="color:var(--text-3)">—</span>'}</td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
    }

    // Par catégorie
    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c.name; });
    const byCat = {};
    expenses.forEach(e => {
      const name = catMap[e.categoryId] || 'Sans catégorie';
      if (!byCat[name]) byCat[name] = { count: 0, total: 0 };
      byCat[name].count++;
      byCat[name].total += e.amount || 0;
    });

    const grandTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const catEntries = Object.entries(byCat).sort((a, b) => b[1].total - a[1].total);

    if (catEntries.length) {
      html += `<h3 class="expense-report-subtitle">Par catégorie</h3><div class="expense-cat-list">`;
      catEntries.forEach(([name, data]) => {
        const pct = grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0;
        html += `
          <div class="expense-cat-bar">
            <span class="expense-cat-name">${_esc(name)}</span>
            <span class="expense-cat-meta">${data.count} frais · ${_fmtAmt(data.total)}</span>
            <div class="expense-cat-track"><div class="expense-cat-fill" style="width:${pct}%"></div></div>
            <span class="expense-cat-pct">${pct}%</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    return html;
  }

  function _groupByDate(tasks) {
    const groups = {};
    tasks.forEach(t => {
      const dateKey = new Date(t.completedAt).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }

  function exportMarkdown() {
    if (!_state) return;
    const projectFilter = document.getElementById('report-project-filter')?.value || 'all';
    const period = document.getElementById('report-period')?.value || 'week';
    const history = _filterHistory(projectFilter, period);
    const stats   = _computeStats(history, projectFilter);

    const periodLabels = { week: '7 derniers jours', month: '30 derniers jours', all: 'Tout l\'historique' };
    const now = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });

    let md = `# Rapport d'activité FlowMind\n\n`;
    md += `**Généré le :** ${now}  \n`;
    md += `**Période :** ${periodLabels[period]}  \n`;
    md += `**Tâches accomplies :** ${stats.total}  \n`;
    md += `**Jours consécutifs :** ${_state.streak || 0} 🔥\n\n`;
    md += `---\n\n`;

    for (const [projectId, tasks] of Object.entries(stats.byProject)) {
      const project = Projects.getById(projectId);
      const projectName = project?.name || 'Projet supprimé';

      md += `## ${projectName} (${tasks.length} tâche${tasks.length > 1 ? 's' : ''})\n\n`;

      const grouped = _groupByDate(tasks);
      for (const [date, dateTasks] of Object.entries(grouped)) {
        md += `### ${date}\n\n`;
        dateTasks.forEach(t => {
          md += `- [x] ${t.title} *(${_formatTime(t.completedAt)})*\n`;
        });
        md += '\n';
      }
    }

    if (typeof Expenses !== 'undefined') {
      const expenses   = _filterExpenses(period);
      const categories = Expenses.getCategories();
      const catMap     = {};
      categories.forEach(c => { catMap[c.id] = c.name; });

      md += `---\n\n## 💶 Frais professionnels\n\n`;

      if (!expenses.length) {
        md += `_Aucun frais sur cette période._\n\n`;
      } else {
        const byStatus = { draft: { count: 0, total: 0 }, submitted: { count: 0, total: 0 }, reimbursed: { count: 0, total: 0 } };
        expenses.forEach(e => {
          const s = byStatus[e.status] || byStatus.draft;
          s.count++;
          s.total += e.amount || 0;
        });

        md += `| Statut | Frais | Montant |\n|---|---|---|\n`;
        md += `| ○ À déclarer | ${byStatus.draft.count} | ${_fmtAmt(byStatus.draft.total)} |\n`;
        md += `| ◑ Déclarés | ${byStatus.submitted.count} | ${_fmtAmt(byStatus.submitted.total)} |\n`;
        md += `| ● Remboursés | ${byStatus.reimbursed.count} | ${_fmtAmt(byStatus.reimbursed.total)} |\n\n`;

        const byMonth = {};
        expenses.forEach(e => {
          const key = e.date ? e.date.slice(0, 7) : 'inconnu';
          if (!byMonth[key]) byMonth[key] = [];
          byMonth[key].push(e);
        });

        Object.keys(byMonth).sort().reverse().forEach(m => {
          const [y, mo] = m.split('-');
          const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
            .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          md += `### ${label}\n\n`;
          byMonth[m].forEach(e => {
            const cat = catMap[e.categoryId] || 'Sans catégorie';
            const statusLabel = { draft: 'À déclarer', submitted: 'Déclaré', reimbursed: 'Remboursé' }[e.status] || e.status;
            md += `- ${e.date} · ${_esc(e.title)} · ${_fmtAmt(e.amount)} · ${cat} · *${statusLabel}*\n`;
          });
          md += '\n';
        });
      }
    }

    _downloadFile(`rapport-activite-${new Date().toISOString().slice(0,10)}.md`, md, 'text/markdown');
  }

  function _downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _fmtAmt(n) {
    return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  function _formatTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, generate, exportMarkdown };
})();
