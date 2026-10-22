/**
 * Operator console behaviour — one script for every /admin/ page.
 * Faithful vanilla-JS port of the original inline Astro scripts:
 *   - sign-in card        [data-login-form]
 *   - shell sign-out      [data-logout]
 *   - games CRUD + table  [data-game-form] … (AdminGames.astro)
 *   - analytics charts    [data-analytics]  (admin/analytics.astro)
 *   - SEO audit           [data-seo]        (admin/seo.astro)
 * Each block only runs when its markup is present on the page.
 */
(function () {
  'use strict';

  var escapeHtml = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  var toast = function (message, kind) {
    var host = document.querySelector('[data-toasts]');
    if (!host) return;
    var item = document.createElement('div');
    item.className = 'toast toast--' + (kind || 'ok');
    item.textContent = message;
    host.append(item);
    window.setTimeout(function () { item.remove(); }, 4200);
  };

  var showError = function (selector, message) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || '';
  };

  /* ---------------- sign-in (AdminLogin.astro) ---------------- */
  var loginForm = document.querySelector('[data-login-form]');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(loginForm);
      fetch('/api/admin/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: fd.get('user'), password: fd.get('password') }),
      }).then(function (res) {
        if (res.ok) location.reload();
        else {
          var err = document.querySelector('[data-login-error]');
          if (err) {
            err.hidden = false;
            err.textContent = 'Wrong username or password.';
          }
        }
      });
    });
  }

  /* ---------------- shell sign-out (AdminLayout.astro) ---------------- */
  var logoutBtn = document.querySelector('[data-logout]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      fetch('/api/admin/logout/', { method: 'POST' }).then(function () {
        location.href = '/admin/';
      });
    });
  }

  /* ---------------- games library (AdminGames.astro) ---------------- */
  var dataEl = document.getElementById('games-data');
  var games = [];
  try {
    games = dataEl ? JSON.parse(dataEl.textContent || '[]') : [];
  } catch (e) {
    games = [];
  }
  var byId = function (id) {
    for (var i = 0; i < games.length; i++) if (games[i].id === id) return games[i];
    return undefined;
  };

  var form = document.querySelector('[data-game-form]');
  if (form) {
    var el = function (name) { return form.elements.namedItem(name); };
    var titleInput = el('title');
    var descInput = el('description');
    var catInput = el('category');
    var tagsInput = el('tags');
    var controlsInput = el('controls');
    var specsInput = el('specs');
    var coverFile = el('coverFile');
    var coverUrl = el('coverUrl');
    var embedInput = el('embedUrl');
    var statusSelect = el('status');
    var featuredInput = el('featured');
    var idInput = el('id');
    var coverPreview = document.querySelector('[data-cover-preview]');
    var coverPreviewWrap = document.querySelector('[data-cover-preview-wrap]');
    var formTitle = document.querySelector('[data-form-title]');
    var saveBtn = document.querySelector('[data-save-label]');
    var tbody = document.querySelector('.admin-table tbody');
    var countEl = document.querySelector('[data-admin-count]');
    var noMatch = document.querySelector('[data-admin-no-match]');
    var searchInput = document.querySelector('[data-admin-search]');
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-admin-filter]'));
    var statusFilter = 'all';

    var refreshPreview = function () {
      if (!coverPreview || !coverPreviewWrap) return;
      var url = coverUrl.value;
      coverPreviewWrap.hidden = !url;
      if (url) coverPreview.src = url;
    };

    var setForm = function (g) {
      idInput.value = (g && g.id) || '';
      titleInput.value = (g && g.title) || '';
      descInput.value = (g && g.description) || '';
      catInput.value = (g && g.category) || '';
      tagsInput.value = (g && g.tags) ? g.tags.join(', ') : '';
      controlsInput.value = (g && g.controls) || '';
      specsInput.value = (g && g.specs) ? g.specs.map(function (s) { return s.label + ' | ' + s.value; }).join('\n') : '';
      coverUrl.value = (g && g.cover) || '';
      coverFile.value = '';
      embedInput.value = (g && g.embedUrl) || '';
      statusSelect.value = (g && g.status) || 'published';
      featuredInput.checked = !!(g && g.featured);
      if (formTitle) formTitle.textContent = g ? 'Edit “' + g.title + '”' : 'Add a game';
      if (saveBtn) saveBtn.textContent = g ? 'Save changes' : 'Publish game';
      showError('[data-form-error]', null);
      showError('[data-upload-error]', null);
      refreshPreview();
    };

    coverFile.addEventListener('change', function () {
      var file = coverFile.files && coverFile.files[0];
      if (file) {
        coverUrl.value = '';
        if (coverPreview) {
          coverPreview.src = URL.createObjectURL(file);
          if (coverPreviewWrap) coverPreviewWrap.hidden = false;
        }
      }
    });

    var coverClear = document.querySelector('[data-cover-clear]');
    if (coverClear) {
      coverClear.addEventListener('click', function () {
        coverFile.value = '';
        coverUrl.value = '';
        refreshPreview();
      });
    }

    /* drag & drop cover */
    var dropZone = document.querySelector('[data-drop-zone]');
    if (dropZone) {
      dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropZone.classList.add('file-drop--over');
      });
      dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('file-drop--over'); });
      dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropZone.classList.remove('file-drop--over');
        var files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          var dt = new DataTransfer();
          dt.items.add(files[0]);
          coverFile.files = dt.files;
          coverFile.dispatchEvent(new Event('change'));
        }
      });
    }

    var uploadCover = function () {
      var file = coverFile.files && coverFile.files[0];
      if (!file) return Promise.resolve(coverUrl.value || null);
      var fd = new FormData();
      fd.append('file', file);
      return fetch('/api/admin/upload/', { method: 'POST', body: fd }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || !data.url) throw new Error(data.error || 'Cover upload failed.');
          return data.url;
        });
      });
    };

    var sendGame = function (body, id) {
      return fetch(id ? '/api/admin/games/' + id + '/' : '/api/admin/games/', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Saving the game failed.');
          return data.game;
        });
      });
    };

    /* Keep the array in the same order the server sorts: featured first,
       then most recently updated. */
    var sortGames = function () {
      games.sort(function (a, b) {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return String(b.updatedAt).localeCompare(String(a.updatedAt));
      });
    };

    var rowHTML = function (g) {
      var search = (g.title + ' ' + g.slug + ' ' + g.category + ' ' + g.tags.join(' ')).toLowerCase();
      var cover = g.cover
        ? '<img src="' + escapeHtml(g.cover) + '" alt="" width="84" height="47" loading="lazy" />'
        : '<span class="admin-table__noimg" aria-hidden="true">no cover</span>';
      var badgeClass = g.status === 'published' ? 'badge badge--live' : 'badge badge--draft';
      var featured = g.featured
        ? '<span class="admin-star" aria-label="Featured">★</span>'
        : '<span class="muted">—</span>';
      return '<tr data-row="' + escapeHtml(g.id) + '" data-status="' + g.status + '" data-search="' + escapeHtml(search) + '">' +
        '<td class="admin-table__cover">' + cover + '</td>' +
        '<td class="admin-table__game">' +
        '<strong>' + escapeHtml(g.title) + '</strong><br />' +
        '<a class="small muted" href="/games/' + encodeURIComponent(g.slug) + '/" target="_blank" rel="noopener noreferrer">/games/' + escapeHtml(g.slug) + '/</a>' +
        '</td>' +
        '<td><span class="chip chip--sm">' + escapeHtml(g.category) + '</span></td>' +
        '<td><span class="' + badgeClass + '"><span class="badge__dot" aria-hidden="true"></span>' + g.status + '</span></td>' +
        '<td>' + featured + '</td>' +
        '<td class="small muted">' + String(g.updatedAt).slice(0, 10) + '</td>' +
        '<td class="admin-actions">' +
        '<button class="btn btn--ghost btn--xs" type="button" data-edit="' + escapeHtml(g.id) + '">Edit</button>' +
        '<button class="btn btn--secondary btn--xs" type="button" data-toggle="' + escapeHtml(g.id) + '">' + (g.status === 'published' ? 'Unpublish' : 'Publish') + '</button>' +
        '<button class="btn btn--ghost btn--xs admin-actions__danger" type="button" data-delete="' + escapeHtml(g.id) + '">Delete</button>' +
        '</td>' +
        '</tr>';
    };

    var applyFilters = function () {
      if (!tbody) return;
      var q = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
      var visible = 0;
      var rows = Array.prototype.slice.call(tbody.rows);
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var ds = row.dataset;
        var okQuery = !q || (ds.search || '').indexOf(q) !== -1;
        var okStatus = statusFilter === 'all' || ds.status === statusFilter;
        var show = okQuery && okStatus;
        row.hidden = !show;
        if (show) visible += 1;
      }
      if (countEl) {
        countEl.textContent = visible === games.length
          ? games.length + ' game' + (games.length === 1 ? '' : 's')
          : visible + ' of ' + games.length + ' games shown';
      }
      if (noMatch) noMatch.hidden = !(visible === 0 && games.length > 0);
    };

    var updateStats = function () {
      var set = function (key, value) {
        var node = document.querySelector('[data-stat="' + key + '"]');
        if (node) node.textContent = String(value);
      };
      var published = games.filter(function (g) { return g.status === 'published'; }).length;
      set('total', games.length);
      set('published', published);
      set('drafts', games.length - published);
      set('featured', games.filter(function (g) { return g.featured; }).length);
    };

    var renderRows = function () {
      if (!tbody) return false;
      tbody.innerHTML = games.map(rowHTML).join('');
      applyFilters();
      return true;
    };

    var refreshAll = function () {
      sortGames();
      updateStats();
      if (!renderRows() || games.length === 0) location.reload(); // table was server-rendered empty, or is now
    };

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        statusFilter = btn.getAttribute('data-admin-filter') || 'all';
        filterButtons.forEach(function (other) {
          var active = other === btn;
          other.classList.toggle('chip--active', active);
          other.setAttribute('aria-pressed', String(active));
        });
        applyFilters();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showError('[data-form-error]', null);
      var editing = idInput.value || undefined;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';
      }
      uploadCover()
        .then(function (cover) {
          return sendGame({
            title: titleInput.value,
            description: descInput.value,
            category: catInput.value,
            tags: tagsInput.value,
            controls: controlsInput.value,
            specs: specsInput.value,
            cover: cover,
            embedUrl: embedInput.value,
            status: statusSelect.value,
            featured: featuredInput.checked,
          }, editing);
        })
        .then(function (saved) {
          if (saved) {
            var existing = byId(saved.id);
            if (existing) {
              for (var k in saved) existing[k] = saved[k];
            } else {
              games.push(saved);
            }
            refreshAll();
            toast(saved.status === 'published'
              ? '“' + saved.title + '” is live on /games/'
              : '“' + saved.title + '” saved as a draft');
            setForm();
          } else {
            location.reload();
          }
        })
        .catch(function (err) {
          showError('[data-form-error]', err && err.message ? err.message : 'Save failed.');
          toast(err && err.message ? err.message : 'Save failed.', 'err');
        })
        .then(function () {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = idInput.value ? 'Save changes' : 'Publish game';
          }
        });
    });

    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!btn) return;

      if (btn.hasAttribute('data-new-game')) {
        setForm();
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        titleInput.focus();
        return;
      }
      if (btn.hasAttribute('data-edit')) {
        setForm(byId(btn.getAttribute('data-edit')));
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        titleInput.focus();
        return;
      }
      if (btn.hasAttribute('data-reset')) {
        setForm();
        return;
      }
      if (btn.hasAttribute('data-toggle')) {
        var g = byId(btn.getAttribute('data-toggle'));
        if (!g) return;
        var next = g.status === 'published' ? 'draft' : 'published';
        sendGame({
          title: g.title,
          description: g.description,
          category: g.category,
          tags: g.tags,
          controls: g.controls,
          specs: g.specs,
          cover: g.cover,
          embedUrl: g.embedUrl,
          status: next,
          featured: g.featured,
        }, g.id)
          .then(function (saved) {
            if (saved) {
              for (var k in saved) g[k] = saved[k];
            } else {
              g.status = next;
            }
            refreshAll();
            toast(next === 'published' ? '“' + g.title + '” is live on /games/' : '“' + g.title + '” moved to drafts');
          })
          .catch(function (err) {
            showError('[data-form-error]', err && err.message ? err.message : 'Update failed.');
            toast(err && err.message ? err.message : 'Update failed.', 'err');
          });
        return;
      }
      if (btn.hasAttribute('data-delete')) {
        var gd = byId(btn.getAttribute('data-delete'));
        if (!gd) return;
        if (!confirm('Delete “' + gd.title + '”? It disappears from the site immediately.')) return;
        fetch('/api/admin/games/' + gd.id + '/', { method: 'DELETE' }).then(function (res) {
          if (res.ok) {
            var i = games.indexOf(gd);
            if (i >= 0) games.splice(i, 1);
            refreshAll();
            toast('“' + gd.title + '” deleted');
          } else {
            showError('[data-form-error]', 'Delete failed.');
            toast('Delete failed.', 'err');
          }
        });
      }
    });
  }

  /* ---------------- analytics controller (admin/analytics.astro) ---------------- */
  var root = document.querySelector('[data-analytics]');
  if (root) {
    var period = root.getAttribute('data-period') || 'week';
    var since = root.getAttribute('data-since') || '';
    var currentChartType = 'bar';
    var cachedSeries = [];

    var periodBtns = Array.prototype.slice.call(root.querySelectorAll('[data-period-btn]'));
    var rangeBtns = Array.prototype.slice.call(root.querySelectorAll('[data-range-btn]'));
    var chartTypeBtns = Array.prototype.slice.call(root.querySelectorAll('[data-chart-type]'));

    var setKpi = function (key, value) {
      var elK = root.querySelector('[data-kpi="' + key + '"]');
      if (elK) elK.textContent = value;
    };

    var renderChart = function (series) {
      cachedSeries = series;
      var host = root.querySelector('[data-chart]');
      var empty = root.querySelector('[data-chart-empty]');
      if (!host) return;
      if (series.length === 0) {
        host.innerHTML = '';
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;

      var W = 1000;
      var H = 280;
      var padL = 50;
      var padB = 32;
      var padT = 20;
      var maxVal = 1;
      for (var i = 0; i < series.length; i++) {
        maxVal = Math.max(maxVal, series[i].views, series[i].plays);
      }
      var innerW = W - padL - 20;
      var innerH = H - padB - padT;
      var slot = innerW / series.length;

      var yTicks = [0, Math.round(maxVal / 3), Math.round((maxVal * 2) / 3), maxVal];
      var grid = yTicks.map(function (t) {
        var y = padT + innerH - (t / maxVal) * innerH;
        return '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - 20) + '" y2="' + y + '" class="chart__grid" />' +
          '<text x="' + (padL - 10) + '" y="' + (y + 4) + '" class="chart__tick" text-anchor="end">' + t + '</text>';
      }).join('');

      var chartContent = '';

      if (currentChartType === 'bar') {
        var groupW = Math.max(4, Math.min(slot * 0.72, 48));
        var barW = groupW / 2 - 1.5;
        chartContent = series.map(function (b, idx) {
          var hViews = (b.views / maxVal) * innerH;
          var hPlays = (b.plays / maxVal) * innerH;
          var groupX = padL + idx * slot + (slot - groupW) / 2;
          var xViews = groupX;
          var xPlays = groupX + barW + 3;
          var yViews = padT + innerH - hViews;
          var yPlays = padT + innerH - hPlays;
          return '<rect x="' + xViews + '" y="' + yViews + '" width="' + barW + '" height="' + Math.max(hViews, b.views > 0 ? 2 : 0) + '" rx="2" class="chart__bar">' +
            '<title>' + escapeHtml(b.key) + ': ' + b.views + ' views</title>' +
            '</rect>' +
            '<rect x="' + xPlays + '" y="' + yPlays + '" width="' + barW + '" height="' + Math.max(hPlays, b.plays > 0 ? 2 : 0) + '" rx="2" class="chart__bar chart__bar--plays">' +
            '<title>' + escapeHtml(b.key) + ': ' + b.plays + ' game plays</title>' +
            '</rect>';
        }).join('');
      } else {
        var pointsFor = function (kind) {
          return series.map(function (b, idx) {
            return {
              x: padL + idx * slot + slot / 2,
              y: padT + innerH - (b[kind] / maxVal) * innerH,
              val: b[kind],
              key: b.key,
            };
          });
        };
        var pointsViews = pointsFor('views');
        var pointsPlays = pointsFor('plays');

        var makePath = function (pts) {
          if (pts.length === 1) return 'M ' + pts[0].x + ' ' + pts[0].y + ' L ' + (pts[0].x + 1) + ' ' + pts[0].y;
          return pts.reduce(function (acc, p, idx2) {
            return idx2 === 0 ? 'M ' + p.x + ' ' + p.y : acc + ' L ' + p.x + ' ' + p.y;
          }, '');
        };

        var pathViews = makePath(pointsViews);
        var pathPlays = makePath(pointsPlays);

        var areaSvg = '';
        if (currentChartType === 'area') {
          var firstX = pointsViews[0].x;
          var lastX = pointsViews[pointsViews.length - 1].x;
          var bottomY = padT + innerH;
          areaSvg = '<path d="' + pathViews + ' L ' + lastX + ' ' + bottomY + ' L ' + firstX + ' ' + bottomY + ' Z" class="chart__area" />' +
            '<path d="' + pathPlays + ' L ' + lastX + ' ' + bottomY + ' L ' + firstX + ' ' + bottomY + ' Z" class="chart__area chart__area--plays" />';
        }

        var dots = function (pts, suffix) {
          return pts.map(function (p) {
            return '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" class="chart__dot' + suffix + '">' +
              '<title>' + escapeHtml(p.key) + ': ' + p.val + (suffix ? ' plays' : ' views') + '</title></circle>';
          }).join('');
        };

        chartContent = areaSvg +
          '<path d="' + pathViews + '" class="chart__line" />' +
          '<path d="' + pathPlays + '" class="chart__line chart__line--plays" />' +
          dots(pointsViews, '') +
          dots(pointsPlays, ' chart__dot--plays');
      }

      var labelIdx = series.length <= 4
        ? series.map(function (_, idx) { return idx; })
        : [0, Math.floor(series.length / 3), Math.floor((series.length * 2) / 3), series.length - 1];
      var xLabels = labelIdx.map(function (i) {
        var x = padL + i * slot + slot / 2;
        return '<text x="' + x + '" y="' + (H - 8) + '" class="chart__tick" text-anchor="middle">' + escapeHtml(series[i].key) + '</text>';
      }).join('');

      host.innerHTML =
        '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart__svg" role="img" aria-label="Chart of page views and game plays">' +
        '<defs>' +
        '<linearGradient id="areaGradViews" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#f5c518" stop-opacity="0.5" />' +
        '<stop offset="100%" stop-color="#f5c518" stop-opacity="0.0" />' +
        '</linearGradient>' +
        '<linearGradient id="areaGradPlays" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45" />' +
        '<stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />' +
        '</linearGradient>' +
        '</defs>' +
        grid + chartContent + xLabels +
        '</svg>';
    };

    var renderRowsAnalytics = function (bodySel, emptySel, rows, total, isPlays) {
      var body = root.querySelector(bodySel);
      var empty = root.querySelector(emptySel);
      if (!body) return;
      if (rows.length === 0) {
        body.innerHTML = '';
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;
      body.innerHTML = rows.map(function (r) {
        var pct = total > 0 ? Math.round((r.b / total) * 100) : 0;
        return '<tr>' +
          '<td class="admin-table__game"><strong>' + escapeHtml(r.a) + '</strong></td>' +
          '<td class="small">' + r.b + '</td>' +
          '<td class="small muted">' +
          '<div style="display:flex; align-items:center; gap:0.5rem">' +
          '<span>' + pct + '%</span>' +
          '<div class="meter-track" style="flex:1">' +
          '<div class="meter-fill ' + (isPlays ? 'meter-fill--plays' : '') + '" style="width:' + pct + '%"></div>' +
          '</div>' +
          '</div>' +
          '</td>' +
          '</tr>';
      }).join('');
    };

    var periodWord = function (p) {
      return p === 'day' ? 'daily' : p === 'week' ? 'weekly' : p === 'month' ? 'monthly' : 'yearly';
    };

    var apply = function () {
      var params = new URLSearchParams({ period: period });
      if (since) params.set('since', since);
      return fetch('/api/admin/analytics/?' + params.toString()).then(function (res) {
        if (!res.ok) return;
        return res.json().then(function (data) {
          if (!data || !Array.isArray(data.series)) return;

          setKpi('views', String(data.totals.views));
          setKpi('plays', String(data.totals.plays));
          setKpi('days', String(data.activeDays));
          setKpi('avg', data.activeDays ? String(Math.round(data.totals.views / data.activeDays)) : '0');
          setKpi('conv', data.totals.views ? ((data.totals.plays / data.totals.views) * 100).toFixed(1) + '%' : '0.0%');

          var note = root.querySelector('[data-chart-note]');
          if (note) note.textContent = 'grouped ' + periodWord(data.period) + ' · ' + (since ? since + ' → today' : 'all time');
          var rangeLabel = root.querySelector('[data-range-label]');
          if (rangeLabel) rangeLabel.textContent = since ? since + ' → today' : 'All recorded history';
          var logNote = root.querySelector('[data-log-note]');
          if (logNote) logNote.textContent = data.daily.length + ' day' + (data.daily.length === 1 ? '' : 's') + ' recorded';

          renderChart(data.series);
          renderRowsAnalytics('[data-pages-body]', '[data-pages-empty]',
            data.topPages.slice(0, 10).map(function (p) { return { a: p.path, b: p.views }; }), data.totals.views, false);
          renderRowsAnalytics('[data-games-body]', '[data-games-empty]',
            data.topGames.slice(0, 10).map(function (g) { return { a: g.slug, b: g.plays }; }), data.totals.plays, true);

          var dailyBody = root.querySelector('[data-daily-body]');
          var dailyEmpty = root.querySelector('[data-daily-empty]');
          var recent = data.daily.slice(-60).reverse();
          if (dailyBody) {
            if (recent.length === 0) {
              dailyBody.innerHTML = '';
              if (dailyEmpty) dailyEmpty.hidden = false;
            } else {
              if (dailyEmpty) dailyEmpty.hidden = true;
              dailyBody.innerHTML = recent.map(function (d) {
                return '<tr>' +
                  '<td class="admin-table__game"><strong>' + escapeHtml(d.day) + '</strong></td>' +
                  '<td class="small">' + d.views + '</td>' +
                  '<td class="small">' + d.plays + '</td>' +
                  '</tr>';
              }).join('');
            }
          }
        });
      }).catch(function () { /* transient network error — keep the last good render */ });
    };

    periodBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        period = btn.getAttribute('data-period-btn') || 'week';
        periodBtns.forEach(function (other) {
          var active = other === btn;
          other.classList.toggle('chip--active', active);
          other.setAttribute('aria-pressed', String(active));
        });
        apply();
      });
    });

    rangeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var days = btn.getAttribute('data-days');
        since = !days
          ? ''
          : new Date(Date.now() - (Number(days) - 1) * 864e5).toISOString().slice(0, 10);
        rangeBtns.forEach(function (other) {
          var active = other === btn;
          other.classList.toggle('chip--active', active);
          other.setAttribute('aria-pressed', String(active));
        });
        apply();
      });
    });

    chartTypeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentChartType = btn.getAttribute('data-chart-type') || 'bar';
        chartTypeBtns.forEach(function (other) {
          other.classList.toggle('chip--active', other === btn);
        });
        if (cachedSeries.length > 0) renderChart(cachedSeries);
      });
    });

    var resetBtn = root.querySelector('[data-reset-analytics]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        alert('Analytics reset is permanently locked to preserve your historical traffic data.');
      });
    }

    // Initial chart render from the server-provided series (inline payload).
    var initialEl = document.getElementById('analytics-initial');
    if (initialEl) {
      try {
        var initialData = JSON.parse(initialEl.textContent || '{}');
        if (initialData && Array.isArray(initialData.series)) renderChart(initialData.series);
      } catch (e) { /* no inline series — chart fills in on first apply() */ }
    }
  }

  /* ---------------- SEO audit (admin/seo.astro) ---------------- */
  var seoRoot = document.querySelector('[data-seo]');
  if (seoRoot) {
    var setSeo = function (key, value) {
      var elS = seoRoot.querySelector('[data-seo-stat="' + key + '"]');
      if (elS) elS.textContent = String(value);
    };

    fetch('/api/admin/seo/').then(function (res) {
      if (!res.ok) return;
      return res.json().then(function (data) {
        if (!data || !data.counts) return;

        setSeo('editorial', data.counts.editorial);
        setSeo('games', data.counts.games);
        setSeo('indexable', data.counts.indexable);
        setSeo('excluded', data.counts.excluded);

        var countsEl = seoRoot.querySelector('[data-seo-counts]');
        if (countsEl) countsEl.textContent = data.counts.indexable + ' indexable · ' + data.counts.excluded + ' excluded';

        var originEl = seoRoot.querySelector('[data-seo-origin]');
        if (originEl) originEl.textContent = 'origin: ' + data.origin;

        var sm = seoRoot.querySelector('[data-seo-sitemap]');
        if (sm) sm.href = data.sitemapUrl;
        var rb = seoRoot.querySelector('[data-seo-robots]');
        if (rb) rb.href = data.robotsUrl;

        var body = seoRoot.querySelector('[data-seo-body]');
        var loading = seoRoot.querySelector('[data-seo-loading]');
        if (loading) loading.hidden = true;
        if (body) {
          var rows = data.editorial.concat(data.games);
          body.innerHTML = rows.map(function (r) {
            return '<tr>' +
              '<td class="admin-table__game"><strong>' + escapeHtml(r.path) + '</strong></td>' +
              '<td class="small muted">' + escapeHtml(r.title) + '</td>' +
              '<td><span class="badge badge--live"><span class="badge__dot" aria-hidden="true"></span>index</span></td>' +
              '</tr>';
          }).join('');
        }
      });
    }).catch(function () { /* keep the server-rendered baseline on failure */ });
  }
})();
