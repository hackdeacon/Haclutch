const API = '/v2';
const VLR_API = '';
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
function getTheme() { return matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'; }
function updateThemeIcons() {
  const dark = getTheme() === 'dark';
  const color = dark ? 'ffffff' : '000000';
  const url = `https://cdn.simpleicons.org/valorant/${color}`;
  const favicon = $('#favicon');
  if (favicon) favicon.href = url;
  const logo = $('#logoIcon');
  if (logo) { logo.src = url; logo.style.filter = ''; }
}
matchMedia('(prefers-color-scheme:dark)').addEventListener('change', updateThemeIcons);
updateThemeIcons();
function vlrThemePath(path) {
  const sep = path.includes('?') ? '&' : '?';
  return path + sep + 'theme=' + getTheme();
}

// --- Utils ---
function fixImg(url) {
  if (!url) return '';
  if (url.startsWith('//')) return 'https:' + url;
  return url;
}

function agentIconUrl(agent) {
  const name = String(agent || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return name ? `https://www.vlr.gg/img/vlr/game/agents/${name}.png` : '';
}

function agentBadge(agent) {
  const src = agentIconUrl(agent);
  return `<span class="agent-badge">${src ? `<img src="${src}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span>${esc(agent)}</span></span>`;
}

function flagToEmoji(flag) {
  if (!flag) return '';
  const code = flag.replace('flag_', '').toLowerCase();
  const nameMap = {
    'united states':'us','brazil':'br','south korea':'kr','korea':'kr',
    'japan':'jp','china':'cn','united kingdom':'gb','great britain':'gb',
    'germany':'de','france':'fr','turkey':'turkiye','argentina':'ar',
    'chile':'cl','mexico':'mx','colombia':'co','venezuela':'ve',
    'peru':'pe','russia':'ru','ukraine':'ua','poland':'pl','sweden':'se',
    'denmark':'dk','finland':'fi','norway':'no','netherlands':'nl',
    'spain':'es','italy':'it','portugal':'pt','indonesia':'id',
    'thailand':'th','philippines':'ph','malaysia':'my','singapore':'sg',
    'australia':'au','new zealand':'nz','canada':'ca','taiwan':'tw',
    'hong kong':'hk','mongolia':'mn','kazakhstan':'kz','israel':'il',
    'saudi arabia':'sa','united arab emirates':'ae','egypt':'eg',
    'south africa':'za','nigeria':'ng','kenya':'ke','pakistan':'pk',
    'vietnam':'vn','cambodia':'kh','laos':'la','bangladesh':'bd',
    'sri lanka':'lk','nepal':'np','myanmar':'mm',
  };
  const resolved = nameMap[code] || code;
  const map = {
    us:'🇺🇸',eu:'🇪🇺',br:'🇧🇷',kr:'🇰🇷',jp:'🇯🇵',cn:'🇨🇳',
    gb:'🇬🇧',de:'🇩🇪',fr:'🇫🇷',tr:'🇹🇷',ar:'🇦🇷',cl:'🇨🇱',
    mx:'🇲🇽',co:'🇨🇴',ve:'🇻🇪',pe:'🇵🇪',ru:'🇷🇺',ua:'🇺🇦',
    pl:'🇵🇱',se:'🇸🇪',dk:'🇩🇰',fi:'🇫🇮',no:'🇳🇴',nl:'🇳🇱',
    es:'🇪🇸',it:'🇮🇹',pt:'🇵🇹',in:'🇮🇩',id:'🇮🇩',th:'🇹🇭',
    ph:'🇵🇭',my:'🇲🇾',sg:'🇸🇬',au:'🇦🇺',nz:'🇳🇿',ca:'🇨🇦',
    tw:'🇹🇼',hk:'🇭🇰',mn:'🇲🇳',kz:'🇰🇿',il:'🇮🇱',sa:'🇸🇦',
    ae:'🇦🇪',eg:'🇪🇬',za:'🇿🇦',ng:'🇳🇬',ke:'🇰🇪',pk:'🇵🇰',
    vn:'🇻🇳',kh:'🇰🇭',la:'🇱🇦',bd:'🇧🇩',lk:'🇱🇰',np:'🇳🇵',
    mm:'🇲🇲',un:'🌍',turkiye:'🇹🇷',
  };
  return map[resolved] || '🏳️';
}

function setLoading(el) { el.innerHTML = '<div class="loading">Loading</div>'; }
function setError(el, msg, retryFn) {
  el.innerHTML = `<div class="error-msg"><p>${msg}</p>${retryFn ? '<button onclick="(' + retryFn.toString() + ')()">Retry</button>' : ''}</div>`;
}
function setEmpty(el, msg = 'No data available') {
  el.innerHTML = `<div class="empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg><p>${msg}</p></div>`;
}

async function apiFetch(path, useCache = true) {
  // Check cache first
  if (useCache) {
    const cached = CacheManager.get(path);
    if (cached && !cached.isStale) {
      console.log(`[Cache] Hit: ${path} (age: ${Math.round(cached.age/1000)}s)`);
      return cached.data;
    }
    if (cached && cached.isStale) {
      console.log(`[Cache] Stale: ${path}, refreshing in background`);
      // Return stale data immediately, refresh in background
      const promise = fetch(API + path)
        .then(res => {
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          return res.json();
        })
        .then(json => {
          if (json.status === 'success') {
            CacheManager.set(path, json.data);
            return json.data;
          }
          throw new Error(json.message || 'Unknown error');
        });
      // Store promise for potential use
      cached._refreshPromise = promise;
      return cached.data;
    }
  }
  
  console.log(`[Cache] Miss: ${path}`);
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (json.status === 'success') {
    if (useCache) CacheManager.set(path, json.data);
    return json.data;
  }
  throw new Error(json.message || 'Unknown error');
}

async function vlrFetch(path, useCache = true) {
  const cacheKey = 'vlr:' + path;
  
  // Check cache first
  if (useCache) {
    const cached = CacheManager.get(cacheKey);
    if (cached && !cached.isStale) {
      console.log(`[Cache] VLR Hit: ${path} (age: ${Math.round(cached.age/1000)}s)`);
      return cached.data;
    }
    if (cached && cached.isStale) {
      console.log(`[Cache] VLR Stale: ${path}, refreshing in background`);
      const promise = fetch(VLR_API + path)
        .then(res => {
          if (!res.ok) throw new Error(`VLR API error: ${res.status}`);
          return res.json();
        })
        .then(json => {
          if (json.status && json.status !== 'OK' && json.status !== 'success') {
            throw new Error(json.message || 'VLR API error');
          }
          const data = json.data !== undefined ? json.data : json;
          CacheManager.set(cacheKey, data);
          return data;
        });
      cached._refreshPromise = promise;
      return cached.data;
    }
  }
  
  console.log(`[Cache] VLR Miss: ${path}`);
  const res = await fetch(VLR_API + path);
  if (!res.ok) throw new Error(`VLR API error: ${res.status}`);
  const json = await res.json();
  if (json.status && json.status !== 'OK' && json.status !== 'success') {
    throw new Error(json.message || 'VLR API error');
  }
  const data = json.data !== undefined ? json.data : json;
  if (useCache) CacheManager.set(cacheKey, data);
  return data;
}

async function safeFetch(promise, fallback = null) {
  try {
    return await promise;
  } catch (e) {
    console.warn(e);
    return fallback;
  }
}

function asSegments(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.segments)) return data.segments;
  if (data.segments && typeof data.segments === 'object') return [data.segments];
  return [];
}

function firstSegment(data) {
  const segments = asSegments(data);
  return segments[0] || {};
}

function pickFirst(...values) {
  return values.find(v => v != null && v !== '') || '';
}

function byId(items) {
  const map = new Map();
  items.forEach(item => {
    if (!item || !item.id) return;
    map.set(item.id, { ...(map.get(item.id) || {}), ...item });
  });
  return [...map.values()];
}

// --- Router ---
let currentRoute = '';
let liveInterval = null;
function navigate(path) { history.pushState(null, '', path); router(); }
function getRoute() { return location.pathname || '/'; }
function clearLiveInterval() { if (liveInterval) { clearInterval(liveInterval); liveInterval = null; } }

async function router() {
  clearLiveInterval();
  const route = getRoute();
  currentRoute = route;
  const app = $('#app');
  $$('.nav a').forEach(a => {
    const r = a.dataset.route;
    if (r === '/rankings' && (route === '/' || route === '/rankings')) a.classList.add('active');
    else if (route.startsWith(r) && r !== '/') a.classList.add('active');
    else a.classList.remove('active');
  });
  if (route === '/' || route === '/rankings') return renderRankings(app);
  if (route === '/news') return renderNews(app);
  if (route === '/matches') return renderMatches(app);
  if (route === '/rankings') return renderRankings(app);
  if (route === '/stats') return renderStats(app);
  if (route === '/players') return renderPlayers(app);
  if (route.startsWith('/player/')) return renderPlayerDetail(app, route.split('/')[2]);
  if (route === '/teams') return renderTeams(app);
  if (route === '/events') return renderEvents(app);
  if (route.startsWith('/event/')) return renderEventDetail(app, route.split('/')[2]);
  if (route.startsWith('/team/')) return renderTeamDetail(app, route.split('/')[2]);
  if (route.startsWith('/search')) return renderSearch(app);
  app.innerHTML = '<div class="empty"><p>Page not found</p></div>';
}
window.addEventListener('popstate', router);
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href && href.startsWith('/') && !href.startsWith('//')) {
    e.preventDefault();
    navigate(href);
  }
});

// --- Search ---
let searchTimer = null;
$('#searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (q.length < 2) return;
  searchTimer = setTimeout(() => navigate('/search?q=' + encodeURIComponent(q)), 400);
});
$('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
function doSearch() {
  const q = $('#searchInput').value.trim();
  if (q) navigate('/search?q=' + encodeURIComponent(q));
}

// --- Modal ---
function openModal(html) {
  $('#modalBody').innerHTML = html;
  $('#modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  $('#modal').classList.remove('show');
  document.body.style.overflow = '';
}
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal(); });


// ========== Cache Layer ==========
const CacheManager = {
  // Cache TTL settings (in milliseconds)
  TTL: {
    '/news': 5 * 60 * 1000,           // 5 minutes
    '/match': 30 * 1000,              // 30 seconds (for live)
    '/match/details': 5 * 60 * 1000,  // 5 minutes
    '/rankings': 10 * 60 * 1000,      // 10 minutes
    '/stats': 10 * 60 * 1000,         // 10 minutes
    '/events': 10 * 60 * 1000,        // 10 minutes
    '/event/': 10 * 60 * 1000,        // 10 minutes
    '/events/matches': 5 * 60 * 1000, // 5 minutes
    '/team': 5 * 60 * 1000,           // 5 minutes
    '/player': 5 * 60 * 1000,         // 5 minutes
    '/search': 2 * 60 * 1000,         // 2 minutes
    'vlr:/api/v1/events': 10 * 60 * 1000,
    'vlr:/api/v1/players': 5 * 60 * 1000,
    'vlr:/api/v1/teams': 5 * 60 * 1000,
  },
  
  getTTL(path) {
    // Check for exact match first
    if (this.TTL[path]) return this.TTL[path];
    // Check for prefix match
    for (const [key, ttl] of Object.entries(this.TTL)) {
      if (path.startsWith(key)) return ttl;
    }
    return 5 * 60 * 1000; // Default 5 minutes
  },
  
  getKey(path) {
    return 'cache:' + path;
  },
  
  get(path) {
    try {
      const key = this.getKey(path);
      const item = localStorage.getItem(key);
      if (!item) return null;
      const { data, timestamp } = JSON.parse(item);
      const ttl = this.getTTL(path);
      const age = Date.now() - timestamp;
      return { data, isStale: age > ttl, age };
    } catch (e) {
      return null;
    }
  },
  
  set(path, data) {
    try {
      const key = this.getKey(path);
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Storage full, clear old items
      this.cleanup();
    }
  },
  
  cleanup() {
    const now = Date.now();
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'));
    for (const key of keys) {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        const path = key.slice(6); // remove 'cache:' prefix
        const ttl = this.getTTL(path);
        if (now - item.timestamp > ttl) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
  },
  
  clearAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'));
    keys.forEach(k => localStorage.removeItem(k));
  }
};

// Cleanup old cache on load
CacheManager.cleanup();

// Clear VLR cache on theme change
matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:vlr:'));
  keys.forEach(k => localStorage.removeItem(k));
});

// --- Page: News ---
async function renderNews(app) {
  app.innerHTML = '<h1 class="page-title">News</h1><div class="loading">Loading</div>';
  try {
    const data = await apiFetch('/news');
    const items = data.segments || [];
    if (!items.length) return setEmpty(app, 'No news found');
    app.innerHTML = '<h1 class="page-title">News</h1><div class="cards">' +
      items.map(n => `
        <a class="card news-card" href="${n.url_path}" target="_blank" rel="noopener">
          <div class="news-date">${esc(n.date || '')}</div>
          <div class="news-title">${esc(n.title)}</div>
          <div class="news-desc">${esc(n.description)}</div>
          <div class="news-meta">${esc(n.author || '')}</div>
        </a>
      `).join('') + '</div>';
  } catch (e) {
    setError(app, 'Failed to load news', () => renderNews(app));
  }
}

// --- Page: Matches ---
let matchTab = 'live', _matchFilterSeries = '', _matchFilterRegion = '';
function _extractMatchRegion(tournament) {
  if (!tournament) return '';
  const colon = tournament.indexOf(':');
  if (colon >= 0) {
    const after = tournament.substring(colon + 1).trim();
    const regionMatch = after.match(/^([\w\s]+?)(?:\s+(?:Stage|Split|Qualifier|Act|Cup|Playoffs?|Finals?|Group|Week|Open|Main|Cash)\b)/i);
    if (regionMatch) return regionMatch[1].trim();
    const first2 = after.split(/\s+/).slice(0, 2).join(' ').trim();
    if (first2 && !/^(Act|Stage|Split|Game)\b/i.test(first2)) return first2;
  }
  // Fallback: extract region from before year (e.g. "China Evolution Series 2026")
  const yearMatch = tournament.match(/^([\w\s]+?)\s+\d{4}\b/);
  return yearMatch ? yearMatch[1].replace(/\b(Evolution|Series|League|Cup|Open|Championship)\b/gi, '').trim() : '';
}
async function renderMatches(app) {
  _matchFilterSeries = '';
  _matchFilterRegion = '';
  app.innerHTML = `
    <h1 class="page-title">Matches</h1>
    <div class="tabs">
      <button class="tab ${matchTab==='live'?'active':''}" onclick="switchMatchTab('live')">Live</button>
      <button class="tab ${matchTab==='upcoming'?'active':''}" onclick="switchMatchTab('upcoming')">Upcoming</button>
      <button class="tab ${matchTab==='results'?'active':''}" onclick="switchMatchTab('results')">Results</button>
    </div>
    <div class="filters">
      <select class="filter-select" id="matchFilterSeries" onchange="_matchFilterSeries=this.value;_applyMatchFilters()">
        <option value="">All Series</option>
      </select>
      <select class="filter-select" id="matchFilterRegion" onchange="_matchFilterRegion=this.value;_applyMatchFilters()">
        <option value="">All Regions</option>
      </select>
    </div>
    <div id="matchContent"><div class="loading">Loading</div></div>
  `;
  loadMatches();
}
window.switchMatchTab = function(tab) {
  matchTab = tab;
  $$('.tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase() === tab));
  loadMatches();
};
let _matchRawItems = [];
window._applyMatchFilters = function() {
  const el = $('#matchContent');
  if (!el) return;
  let items = _matchRawItems;
  if (_matchFilterSeries) items = items.filter(m => _extractEventSeries(m.tournament_name || m.match_event) === _matchFilterSeries);
  if (_matchFilterRegion) items = items.filter(m => _extractMatchRegion(m.tournament_name || m.match_event) === _matchFilterRegion);
  if (!items.length) return setEmpty(el, 'No matches found');
  el.innerHTML = '<div class="cards">' + items.map(m => matchCard(m, matchTab)).join('') + '</div>';
};
function _populateMatchFilters(items) {
  const series = [...new Set(items.map(m => _extractEventSeries(m.tournament_name || m.match_event)).filter(Boolean))].sort();
  const regions = [...new Set(items.map(m => _extractMatchRegion(m.tournament_name || m.match_event)).filter(Boolean))].sort();
  const seriesSel = document.getElementById('matchFilterSeries');
  const regionSel = document.getElementById('matchFilterRegion');
  if (seriesSel) seriesSel.innerHTML = '<option value="">All Series</option>' + series.map(s => `<option value="${esc(s)}" ${s===_matchFilterSeries?'selected':''}>${esc(s)}</option>`).join('');
  if (regionSel) regionSel.innerHTML = '<option value="">All Regions</option>' + regions.map(r => `<option value="${esc(r)}" ${r===_matchFilterRegion?'selected':''}>${esc(r)}</option>`).join('');
}
async function loadMatches() {
  const el = $('#matchContent');
  if (!el) return;
  setLoading(el);
  clearLiveInterval();
  try {
    const qMap = { live: 'live_score', upcoming: 'upcoming', results: 'results' };
    const data = await apiFetch('/match?q=' + qMap[matchTab]);
    _matchRawItems = data.segments || [];
    _populateMatchFilters(_matchRawItems);
    if (!_matchRawItems.length) return setEmpty(el, matchTab === 'live' ? 'No live matches right now' : 'No matches found');
    _applyMatchFilters();
    if (matchTab === 'live') liveInterval = setInterval(loadMatches, 30000);
  } catch (e) {
    setError(el, 'Failed to load matches', loadMatches);
  }
}
function matchCard(m, type) {
  const isLive = type === 'live' || m.time_until_match === 'LIVE';
  const logo1 = fixImg(m.team1_logo);
  const logo2 = fixImg(m.team2_logo);
  const score = m.score1 !== undefined ? `<div class="score">${m.score1} : ${m.score2}</div>` : `<div class="score">vs</div>`;
  const info = isLive ? `<div class="match-info">${m.current_map && m.current_map !== 'Unknown' ? 'Map: ' + esc(m.current_map) : 'LIVE'}</div>`
    : type === 'upcoming' ? `<div class="match-info">${esc(m.time_until_match || '')}</div>`
    : `<div class="match-info">${esc(m.time_completed || '')}</div>`;
  const matchId = m.match_id || (m.match_page ? m.match_page.replace(/^\//, '').split('/')[0] : '');
  const clickHandler = matchId ? `onclick="showMatchDetail('${matchId}')"` : '';
  return `
    <div class="card match-card ${isLive ? 'live' : ''}" ${clickHandler}>
      <div class="match-event">${esc(m.match_event || m.tournament_name || '')}${isLive ? '<span class="live-badge">LIVE</span>' : ''}</div>
      <div class="match-teams">
        <div class="team">
          ${logo1 ? `<img class="team-logo" src="${logo1}" alt="" onerror="this.style.display='none'">` : ''}
          <span class="team-flag">${flagToEmoji(m.flag1)}</span>
          <span class="team-name">${esc(m.team1)}</span>
        </div>
        ${score}
        <div class="team right">
          ${logo2 ? `<img class="team-logo" src="${logo2}" alt="" onerror="this.style.display='none'">` : ''}
          <span class="team-flag">${flagToEmoji(m.flag2)}</span>
          <span class="team-name">${esc(m.team2)}</span>
        </div>
      </div>
      ${info}
    </div>`;
}
window.showMatchDetail = async function(id) {
  openModal('<div class="loading">Loading match details</div>');
  try {
    const data = await apiFetch('/match/details?match_id=' + id);
    const seg = Array.isArray(data.segments) ? data.segments[0] : (data.segments || data);
    let html = '';
    if (seg.event) {
      html += `<div style="text-align:center;margin-bottom:var(--s-md);font-size:14px;color:var(--muted)">${esc(seg.event.name || '')}</div>`;
    }
    if (seg.teams && seg.teams.length >= 2) {
      const [t1, t2] = seg.teams;
      html += `<div class="match-detail-score">
        <div class="team"><img src="${fixImg(t1.logo)}" alt="" onerror="this.style.display='none'"><div class="name">${esc(t1.name)}</div><div style="font-size:28px;font-weight:700;letter-spacing:-1px">${t1.score || '0'}</div></div>
        <div class="vs">VS</div>
        <div class="team"><img src="${fixImg(t2.logo)}" alt="" onerror="this.style.display='none'"><div class="name">${esc(t2.name)}</div><div style="font-size:28px;font-weight:700;letter-spacing:-1px">${t2.score || '0'}</div></div>
      </div>`;
    }
    if (seg.date) {
      html += `<div style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:var(--s-lg)">${esc(seg.date)}</div>`;
    }
    if (seg.maps && seg.maps.length) {
      seg.maps.forEach((mp, mi) => {
        const sc = mp.score || {};
        html += `<div style="margin-top:${mi ? 20 : 0}px">
          <div style="display:flex;align-items:center;gap:var(--s-md);padding:var(--s-md) var(--s-base);background:var(--surface-soft);border-radius:var(--r-sm);margin-bottom:var(--s-sm)">
            <strong style="font-size:14px;font-weight:600">${esc(mp.map_name || 'Map ' + (mi+1))}</strong>
            <span style="margin-left:auto;font-weight:700;font-size:16px">${sc.team1 || 0} : ${sc.team2 || 0}</span>
            ${mp.duration ? `<span style="font-size:13px;color:var(--muted);margin-left:var(--s-md)">${esc(mp.duration)}</span>` : ''}
          </div>`;
        ['team1','team2'].forEach((tk, ti) => {
          const players = mp.players?.[tk] || [];
          if (!players.length) return;
          const teamName = seg.teams?.[ti]?.name || (ti === 0 ? 'Team 1' : 'Team 2');
          html += `<div style="font-size:12px;font-weight:600;color:var(--muted);margin:var(--s-sm) 0 var(--s-xs)">${esc(teamName)}</div>`;
          html += '<div class="table-wrap" style="margin-bottom:var(--s-sm)"><table style="font-size:13px"><thead><tr><th>Player</th><th>Agent</th><th>Rating</th><th>ACS</th><th>K/D/A</th><th>ADR</th><th>HS%</th><th>KAST</th></tr></thead><tbody>';
          players.forEach(p => {
            html += `<tr>
              <td style="font-weight:600">${esc(p.name)}</td>
              <td>${agentBadge(p.agent)}</td>
              <td class="stat-highlight">${esc(p.rating)}</td>
              <td>${esc(p.acs)}</td>
              <td>${esc(p.kills)}/${esc(p.deaths)}/${esc(p.assists)}</td>
              <td>${esc(p.adr)}</td>
              <td>${esc(p.hs_pct)}</td>
              <td>${esc(p.kast)}</td>
            </tr>`;
          });
          html += '</tbody></table></div>';
        });
        html += '</div>';
      });
    }
    if (seg.streams && seg.streams.length) {
      const liveStreams = seg.streams.filter(s => s.url);
      if (liveStreams.length) {
        html += '<h3 style="margin-top:var(--s-lg)">Streams</h3><div style="display:flex;gap:var(--s-sm);flex-wrap:wrap">';
        liveStreams.forEach(s => {
          html += `<a href="${s.url}" target="_blank" rel="noopener" style="font-size:13px;padding:8px 16px;background:var(--surface-soft);border-radius:var(--r-full);border:1px solid var(--hairline-soft);color:var(--body)">${esc(s.name)}</a>`;
        });
        html += '</div>';
      }
    }
    if (!html) html = '<p>No detailed data available for this match.</p>';
    $('#modalBody').innerHTML = html;
  } catch (e) {
    $('#modalBody').innerHTML = '<div class="error-msg"><p>Failed to load match details</p></div>';
  }
};

// --- Page: Rankings ---
let rankingRegion = 'cn', _rankData = [], _rankSort = 'rank';
async function renderRankings(app) {
  app.innerHTML = `
    <h1 class="page-title">Rankings</h1>
    <div class="filters">
      <select class="filter-select" id="rankRegion" onchange="rankingRegion=this.value;loadRankings()">
        ${regionOptions(rankingRegion)}
      </select>
      <select class="filter-select" id="rankSort" onchange="_rankSort=this.value;_renderRankTable()">
        <option value="rank" ${_rankSort==='rank'?'selected':''}>Sort by Rank</option>
        <option value="earnings" ${_rankSort==='earnings'?'selected':''}>Sort by Earnings</option>
      </select>
    </div>
    <div id="rankContent"><div class="loading">Loading</div></div>
  `;
  loadRankings();
}
window.loadRankings = async function() {
  const el = $('#rankContent');
  if (!el) return;
  setLoading(el);
  try {
    const data = await apiFetch('/rankings?region=' + rankingRegion);
    _rankData = data.segments || [];
    if (!_rankData.length) return setEmpty(el, 'No rankings for this region');
    _renderRankTable();
  } catch (e) {
    setError(el, 'Failed to load rankings', loadRankings);
  }
};
function _parseEarnings(s) {
  if (!s) return 0;
  return Number(s.replace(/[^0-9.]/g, '')) || 0;
}
function _renderRankTable() {
  const el = $('#rankContent');
  if (!el) return;
  let items = _rankData;
  if (_rankSort === 'earnings') {
    items = [..._rankData].sort((a, b) => _parseEarnings(b.earnings) - _parseEarnings(a.earnings));
  }
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Team</th><th>Country</th><th>Record</th><th>Earnings</th><th>Last Played</th></tr></thead>
    <tbody>${items.map((r, i) => `
      <tr>
        <td class="rank-cell">${_rankSort === 'earnings' ? i + 1 : esc(r.rank)}</td>
        <td><div class="team-cell"><img src="${fixImg(r.logo)}" alt="" onerror="this.style.display='none'"><span style="font-weight:600">${esc(r.team)}</span></div></td>
        <td>${flagToEmoji(r.country)} ${esc(r.country || '')}</td>
        <td>${esc(r.record || '')}</td>
        <td>${esc(r.earnings || '')}</td>
        <td style="font-size:13px;color:var(--muted)">${esc(r.last_played || '')} ${r.last_played_team ? `<span style="display:inline-flex;align-items:center;gap:4px">· ${esc(r.last_played_team)} ${r.last_played_team_logo ? `<img src="${fixImg(r.last_played_team_logo)}" alt="" style="width:16px;height:16px;border-radius:2px;object-fit:contain" onerror="this.style.display='none'">` : ''}</span>` : ''}</td>
      </tr>
    `).join('')}</tbody>
  </table></div>`;
}

// --- Page: Stats ---
let statsRegion = 'cn', statsTimespan = '30', statsPage = 1, _statsData = [], _statsSort = [];
let _statsFilterOrg = '', _statsFilterAgent = '';
const _statsSortCols = [
  { key: 'rating', label: 'Rating', field: 'rating' },
  { key: 'acs', label: 'ACS', field: 'average_combat_score' },
  { key: 'kd', label: 'K/D', field: 'kill_deaths' },
  { key: 'adr', label: 'ADR', field: 'average_damage_per_round' },
  { key: 'kpr', label: 'KPR', field: 'kills_per_round' },
  { key: 'hs', label: 'HS%', field: 'headshot_percentage' },
];
function _parseStatNum(v) { return Number(String(v || '').replace(/[^0-9.\-]/g, '')) || 0; }
window._statsSortBy = function(key) {
  const existing = _statsSort.findIndex(s => s.key === key);
  if (existing >= 0) {
    if (_statsSort[existing].dir === 'desc') _statsSort[existing].dir = 'asc';
    else _statsSort.splice(existing, 1);
  } else {
    _statsSort.push({ key, dir: 'desc' });
  }
  statsPage = 1;
  _refreshStats();
};
window._statsClearSort = function() {
  _statsSort = [];
  statsPage = 1;
  _refreshStats();
};
function _refreshStats() {
  _renderStatsPage($('#statsContent'));
  const chipsEl = document.getElementById('statsSortChips');
  if (!chipsEl) return;
  if (!_statsSort.length) { chipsEl.innerHTML = ''; return; }
  chipsEl.innerHTML = _statsSort.map((s, i) => {
    const col = _statsSortCols.find(c => c.key === s.key);
    const arrow = s.dir === 'desc' ? '↓' : '↑';
    const num = _statsSort.length > 1 ? (i + 1) : '';
    return `<span class="sort-chip sort-active" onclick="_statsSortBy('${s.key}')">${col.label} ${arrow}${num ? ' <span class="sort-badge">' + num + '</span>' : ''}</span>`;
  }).join('') + '<span class="sort-chip sort-clear" onclick="_statsClearSort()">✕</span>';
}
function _sortStatsData(data) {
  if (!_statsSort.length) return data;
  const sorted = [...data];
  sorted.sort((a, b) => {
    for (const { key, dir } of _statsSort) {
      const col = _statsSortCols.find(c => c.key === key);
      if (!col) continue;
      const va = _parseStatNum(a[col.field]);
      const vb = _parseStatNum(b[col.field]);
      if (va !== vb) return dir === 'desc' ? vb - va : va - vb;
    }
    return 0;
  });
  return sorted;
}
async function renderStats(app) {
  _statsFilterOrg = '';
  _statsFilterAgent = '';
  app.innerHTML = `
    <h1 class="page-title">Player Stats</h1>
    <div class="filters">
      <select class="filter-select" id="statsRegion" onchange="statsRegion=this.value;loadStats()">
        ${regionOptions(statsRegion)}
      </select>
      <select class="filter-select" id="statsTimespan" onchange="statsTimespan=this.value;loadStats()">
        <option value="30" ${statsTimespan==='30'?'selected':''}>Last 30 days</option>
        <option value="60" ${statsTimespan==='60'?'selected':''}>Last 60 days</option>
        <option value="90" ${statsTimespan==='90'?'selected':''}>Last 90 days</option>
        <option value="all" ${statsTimespan==='all'?'selected':''}>All time</option>
      </select>
      <select class="filter-select" id="statsFilterOrg" onchange="_statsFilterOrg=this.value;statsPage=1;_renderStatsPage($('#statsContent'))">
        <option value="">All Orgs</option>
      </select>
      <select class="filter-select" id="statsFilterAgent" onchange="_statsFilterAgent=this.value;statsPage=1;_renderStatsPage($('#statsContent'))">
        <option value="">All Agents</option>
      </select>
      <span id="statsSortChips" class="sort-chips"></span>
    </div>
    <div id="statsContent"><div class="loading">Loading</div></div>
  `;
  loadStats();
}

const STATS_PER_PAGE = 50;
window.loadStats = async function() {
  const el = $('#statsContent');
  if (!el) return;
  setLoading(el);
  try {
    const data = await apiFetch('/stats?region=' + statsRegion + '&timespan=' + statsTimespan);
    _statsData = data.segments || [];
    if (!_statsData.length) return setEmpty(el, 'No stats available');
    statsPage = 1;
    _populateStatsFilters();
    _renderStatsPage(el);
  } catch (e) {
    setError(el, 'Failed to load stats', loadStats);
  }
};


function _populateStatsFilters() {
  const orgs = [...new Set(_statsData.map(p => p.org).filter(Boolean))].sort();
  const agents = [...new Set(_statsData.flatMap(p => p.agents || []).filter(Boolean))].sort();
  const orgSel = document.getElementById('statsFilterOrg');
  const agentSel = document.getElementById('statsFilterAgent');
  if (orgSel) orgSel.innerHTML = '<option value="">All Orgs</option>' + orgs.map(o => `<option value="${esc(o)}" ${o===_statsFilterOrg?'selected':''}>${esc(o)}</option>`).join('');
  if (agentSel) agentSel.innerHTML = '<option value="">All Agents</option>' + agents.map(a => `<option value="${esc(a)}" ${a===_statsFilterAgent?'selected':''}>${esc(a)}</option>`).join('');
}
function _filterStatsData(data) {
  let result = data;
  if (_statsFilterOrg) result = result.filter(p => p.org === _statsFilterOrg);
  if (_statsFilterAgent) result = result.filter(p => (p.agents || []).includes(_statsFilterAgent));
  return result;
}
const _statsAvatarCache = {};
const _statsPlayerIdCache = {};
async function _fetchStatsPlayer(name) {
  const key = name.toLowerCase();
  if (_statsPlayerIdCache[key]) return _statsPlayerIdCache[key];
  try {
    const data = await apiFetch('/search?q=' + encodeURIComponent(name));
    const players = data.segments?.results?.players || [];
    const match = players.find(p => p.name.toLowerCase() === key) || players[0] || null;
    if (match) {
      _statsPlayerIdCache[key] = match;
      _statsAvatarCache[key] = match.img || '';
    }
    return match;
  } catch { return null; }
}

function _statsTh(col) {
  const active = _statsSort.find(s => s.key === col.key);
  const idx = _statsSort.findIndex(s => s.key === col.key);
  const arrow = active ? (active.dir === 'desc' ? ' ↓' : ' ↑') : '';
  const badge = active && _statsSort.length > 1 ? ` <span class="sort-badge">${idx + 1}</span>` : '';
  const cls = active ? ' class="sort-active"' : '';
  return `<th${cls} onclick="_statsSortBy('${col.key}')" style="cursor:pointer;user-select:none">${col.label}${arrow}${badge}</th>`;
}
function _renderStatsPage(el) {
  const filtered = _filterStatsData(_statsData);
  const sorted = _sortStatsData(filtered);
  const totalPages = Math.ceil(sorted.length / STATS_PER_PAGE);
  const start = (statsPage - 1) * STATS_PER_PAGE;
  const items = sorted.slice(start, start + STATS_PER_PAGE);
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Player</th><th>Org</th><th>Agents</th>${_statsSortCols.map(c => _statsTh(c)).join('')}</tr></thead>
    <tbody>${items.map((p, i) => {
      const key = p.player.toLowerCase();
      const cached = _statsPlayerIdCache[key];
      const href = cached ? `/player/${cached.id}` : '';
      const avSrc = _statsAvatarCache[key];
      return `<tr>
        <td class="rank-cell">${start + i + 1}</td>
        <td style="font-weight:600">
          <span class="stats-player-cell" data-name="${esc(p.player)}">
            <span class="stats-av-placeholder" ${avSrc ? `data-src="${fixImg(avSrc)}"` : ''}></span>
            ${href ? `<a href="${href}">${esc(p.player)}</a>` : `<span class="stats-player-name">${esc(p.player)}</span>`}
          </span>
        </td>
        <td>${esc(p.org || 'N/A')}</td>
        <td><div class="agents">${(p.agents||[]).map(a => agentBadge(a)).join('')}</div></td>
        <td class="stat-highlight">${esc(p.rating)}</td>
        <td>${esc(p.average_combat_score)}</td>
        <td>${esc(p.kill_deaths)}</td>
        <td>${esc(p.average_damage_per_round)}</td>
        <td>${esc(p.kills_per_round)}</td>
        <td>${esc(p.headshot_percentage)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>
  <div style="font-size:12px;color:var(--muted-soft);margin-top:var(--s-xs)">${sorted.length} players · Click column headers to add sort conditions</div>`;
  if (totalPages > 1) el.innerHTML += renderPagination(statsPage, totalPages, 'statsPage', '_statsGoPage');
  _observeStatsAvatars();
}

function _replaceAvatar(ph, imgUrl, playerId, playerName) {
  if (!imgUrl) return;
  const img = new Image();
  img.className = 'stats-av';
  img.onload = () => { ph.replaceWith(img); };
  img.src = fixImg(imgUrl);
  if (playerId) {
    const cell = ph.closest('.stats-player-cell');
    if (cell) {
      const nameSpan = cell.querySelector('.stats-player-name');
      if (nameSpan) nameSpan.outerHTML = `<a href="/player/${playerId}">${esc(playerName)}</a>`;
    }
  }
}
let _statsObserver = null;
function _observeStatsAvatars() {
  if (_statsObserver) _statsObserver.disconnect();
  const placeholders = document.querySelectorAll('.stats-av-placeholder');
  if (!placeholders.length) return;
  _statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const ph = entry.target;
      _statsObserver.unobserve(ph);
      const cachedSrc = ph.dataset.src;
      if (cachedSrc) {
        _replaceAvatar(ph, cachedSrc);
        return;
      }
      const cell = ph.closest('.stats-player-cell');
      if (!cell) return;
      const name = cell.dataset.name;
      _fetchStatsPlayer(name).then(match => {
        if (!match) return;
        _replaceAvatar(ph, match.img, match.id, name);
      });
    });
  }, { rootMargin: '200px' });
  placeholders.forEach(ph => _statsObserver.observe(ph));
}

window._statsGoPage = function() {
  const el = $('#statsContent');
  if (el) _renderStatsPage(el);
};

// --- Page: Events ---
let eventsTab = 'live', _eventsFilterSeries = '', _eventsFilterRegion = '';
function _extractEventSeries(title) {
  if (!title) return '';
  const t = title.trim();
  if (/^VCT\s+LOCK\s*IN/i.test(t)) return 'VCT LOCK//IN';
  if (/^VCT\b/i.test(t)) return 'VCT';
  if (/^Challengers\b/i.test(t)) return 'Challengers';
  if (/^Game Changers\b/i.test(t)) return 'Game Changers';
  if (/^Esports World Cup\b/i.test(t)) return 'Esports World Cup';
  if (/^Masters\b/i.test(t)) return 'Masters';
  if (/^Champions\b/i.test(t)) return 'Champions';
  const colon = t.indexOf(':');
  const raw = colon > 0 ? t.substring(0, colon).trim() : t;
  return raw.replace(/\s*\d{4}\s*$/, '').trim() || raw;
}
function _countryToRegion(code) {
  if (!code) return '';
  const c = code.toLowerCase();
  if (c === 'cn') return 'CN';
  if (['eu','de','fr','es','it','lt','tr','sa','pt'].includes(c)) return 'EMEA';
  if (['us','ca','br','ar','mx','cl','co','pe'].includes(c)) return 'Americas';
  if (['kr','jp','vn','id','ph','th','au','nz','sg','my','in','tw'].includes(c)) return 'APAC';
  return c.toUpperCase();
}
async function renderEvents(app) {
  _eventsFilterSeries = '';
  _eventsFilterRegion = '';
  app.innerHTML = `
    <h1 class="page-title">Events</h1>
    <div class="tabs">
      <button class="tab ${eventsTab==='live'?'active':''}" onclick="switchEventsTab('live')">Ongoing</button>
      <button class="tab ${eventsTab==='upcoming'?'active':''}" onclick="switchEventsTab('upcoming')">Upcoming</button>
      <button class="tab ${eventsTab==='completed'?'active':''}" onclick="switchEventsTab('completed')">Completed</button>
    </div>
    <div class="filters">
      <select class="filter-select" id="eventsFilterSeries" onchange="_eventsFilterSeries=this.value;loadEvents()">
        <option value="">All Series</option>
      </select>
      <select class="filter-select" id="eventsFilterRegion" onchange="_eventsFilterRegion=this.value;loadEvents()">
        <option value="">All Regions</option>
      </select>
    </div>
    <div id="eventsContent"><div class="loading">Loading</div></div>
  `;
  loadEvents();
}
window.switchEventsTab = function(tab) {
  eventsTab = tab;
  $$('.tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase() === (tab === 'live' ? 'ongoing' : tab)));
  loadEvents();
};
function normalizeEventFromV(ev) {
  return {
    id: ev.event_id || ev.id,
    title: ev.title || ev.name,
    status: ev.status === 'live' ? 'ongoing' : ev.status,
    prize: ev.prize || ev.prizepool,
    dates: ev.dates,
    region: ev.region || ev.country,
    thumb: ev.thumb || ev.img,
    url_path: ev.url_path || ev.url,
  };
}
function normalizeEventFromVlr(ev) {
  return {
    id: ev.id,
    title: ev.name,
    status: ev.status === 'ongoing' ? 'ongoing' : ev.status,
    prize: ev.prizepool,
    dates: ev.dates,
    region: ev.country,
    thumb: ev.img,
    url_path: ev.url,
  };
}
async function getCombinedEvents(tab) {
  const vQ = { live: 'live', upcoming: 'upcoming', completed: 'completed' }[tab];
  const vlrStatus = { live: 'ongoing', upcoming: 'upcoming', completed: 'completed' }[tab];
  const [vData, vlrData] = await Promise.all([
    safeFetch(apiFetch('/events?q=' + vQ), null),
    safeFetch(vlrFetch(vlrThemePath('/api/v1/events?status=' + vlrStatus)), null),
  ]);
  const vItems = asSegments(vData).map(normalizeEventFromV);
  const vlrItems = (Array.isArray(vlrData) ? vlrData : []).map(normalizeEventFromVlr);
  const desired = tab === 'live' ? 'ongoing' : tab;
  return byId([...vItems, ...vlrItems])
    .filter(ev => !ev.status || ev.status === desired)
    .sort((a, b) => String(a.dates || '').localeCompare(String(b.dates || '')));
}
async function loadEvents() {
  const el = $('#eventsContent');
  if (!el) return;
  setLoading(el);
  try {
    const rawItems = await getCombinedEvents(eventsTab);
    const allItems = rawItems.map(ev => ({ ...ev, series: _extractEventSeries(ev.title), zone: _countryToRegion(ev.region) }));
    // Populate series filter
    const series = [...new Set(allItems.map(ev => ev.series).filter(Boolean))].sort();
    const seriesSel = document.getElementById('eventsFilterSeries');
    if (seriesSel) seriesSel.innerHTML = '<option value="">All Series</option>' + series.map(s => `<option value="${esc(s)}" ${s===_eventsFilterSeries?'selected':''}>${esc(s)}</option>`).join('');
    // Populate region filter
    const zones = [...new Set(allItems.map(ev => ev.zone).filter(Boolean))].sort();
    const regionSel = document.getElementById('eventsFilterRegion');
    if (regionSel) regionSel.innerHTML = '<option value="">All Regions</option>' + zones.map(r => `<option value="${esc(r)}" ${r===_eventsFilterRegion?'selected':''}>${esc(r)}</option>`).join('');
    let items = allItems;
    if (_eventsFilterSeries) items = items.filter(ev => ev.series === _eventsFilterSeries);
    if (_eventsFilterRegion) items = items.filter(ev => ev.zone === _eventsFilterRegion);
    if (!items.length) return setEmpty(el, 'No events found');
    el.innerHTML = '<div class="cards">' + items.map(ev => `
      <div class="card event-card" onclick="navigate('/event/${ev.id}')">
        <img class="event-icon" src="${fixImg(ev.thumb)}" alt="" onerror="this.style.display='none'">
        <div class="event-body">
          <div class="event-title">${esc(ev.title)}</div>
          <div class="event-meta">
            <span class="event-status ${ev.status || eventsTab}">${esc(ev.status || eventsTab)}</span>
            <span>${esc(ev.dates || '')}</span>
            <span>${esc(ev.prize || '')}</span>
            <span>${flagToEmoji(ev.region)} ${esc(ev.region || '')}</span>
          </div>
        </div>
      </div>
    `).join('') + '</div>';
  } catch (e) {
    setError(el, 'Failed to load events', loadEvents);
  }
}

// --- Page: Event Detail ---
async function renderEventDetail(app, id) {
  app.innerHTML = '<div class="loading">Loading</div>';
  try {
    const data = await apiFetch('/event/' + id);
    const seg = data.segments || {};
    const ev = seg.event || {};
    const prizes = seg.prizes || [];
    const teams = seg.teams || [];
    let html = `
      <div class="event-detail-header">
        <img src="${fixImg(ev.logo)}" alt="" onerror="this.style.display='none'">
        <div>
          <div class="event-series">${esc(ev.series || '')}</div>
          <h2>${esc(ev.name)}</h2>
          <div class="event-dates">${esc(ev.dates || '')} · ${esc(ev.prize || '')}</div>
        </div>
      </div>
    `;
    if (teams.length) {
      html += '<h2 class="section-title">Participating Teams</h2><div class="cards">';
      teams.forEach(t => {
        html += `<div class="card" onclick="navigate('/team/${t.id}')" style="padding:var(--s-lg)">
          <div style="display:flex;align-items:center;gap:var(--s-md);margin-bottom:var(--s-md)">
            <img src="${fixImg(t.logo)}" style="width:44px;height:44px;border-radius:var(--r-sm);object-fit:contain;background:var(--surface-soft)" alt="" onerror="this.style.display='none'">
            <div><div style="font-weight:600;font-size:16px">${esc(t.name)}</div><div style="font-size:13px;color:var(--muted)">${esc(t.qualification || '')}</div></div>
          </div>
          ${t.players && t.players.length ? '<div style="display:flex;flex-wrap:wrap;gap:var(--s-xs)">' + t.players.map(p => `<span style="font-size:13px;background:var(--surface-soft);padding:4px 12px;border-radius:var(--r-full);color:var(--body)">${flagToEmoji(p.flag)} ${esc(p.name)}</span>`).join('') + '</div>' : ''}
        </div>`;
      });
      html += '</div>';
    }
    if (prizes.length && prizes.some(p => p.team && p.team.name)) {
      html += '<h2 class="section-title" style="margin-top:var(--s-xl)">Prize Distribution</h2>';
      html += `<div class="table-wrap"><table><thead><tr><th>Placement</th><th>Prize</th><th>Team</th></tr></thead><tbody>`;
      prizes.forEach(p => {
        html += `<tr><td>${esc(p.placement)}</td><td>${esc(p.amount)}</td><td>${p.team && p.team.name ? esc(p.team.name) : '-'}</td></tr>`;
      });
      html += '</tbody></table></div>';
    }
    html += '<h2 class="section-title" style="margin-top:var(--s-xl)">Event Matches</h2><div id="eventMatches"><div class="loading">Loading</div></div>';
    app.innerHTML = html;
    loadEventMatches(id);
  } catch (e) {
    setError(app, 'Failed to load event details', () => renderEventDetail(app, id));
  }
}

async function loadEventMatches(id) {
  const el = $('#eventMatches');
  if (!el) return;
  try {
    const data = await apiFetch('/events/matches?event_id=' + id);
    const items = asSegments(data);
    if (!items.length) return setEmpty(el, 'No event matches found');
    el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Stage</th><th>Match</th><th>Status</th></tr></thead><tbody>' +
      items.map(m => {
        const t1 = m.team1 || {};
        const t2 = m.team2 || {};
        const score = pickFirst(t1.score, '–') + ' : ' + pickFirst(t2.score, '–');
        return `<tr onclick="${m.match_id ? `showMatchDetail('${m.match_id}')` : ''}" style="cursor:${m.match_id ? 'pointer' : 'default'}">
          <td>${esc(m.date || '')}</td>
          <td>${esc(m.event_series || m.note || '')}</td>
          <td><strong>${esc(t1.name || '')}</strong> ${score} <strong>${esc(t2.name || '')}</strong></td>
          <td>${esc(m.status || '')}</td>
        </tr>`;
      }).join('') + '</tbody></table></div>';
  } catch (e) {
    el.innerHTML = '<div style="color:var(--muted);padding:var(--s-md) 0">Failed to load event matches</div>';
  }
}

// --- Page: Team Detail ---
function normalizeTeamPerson(p, fromVlr = false) {
  return fromVlr ? {
    id: p.id,
    alias: p.user,
    real_name: p.name,
    avatar: p.img,
    country: p.country,
    role: p.tag || '',
    is_captain: false,
  } : p;
}
async function renderTeamDetail(app, id) {
  app.innerHTML = '<div class="loading">Loading</div>';
  try {
    const [data, vlrDetail] = await Promise.all([
      apiFetch('/team?id=' + id),
      safeFetch(vlrFetch(vlrThemePath('/api/v1/teams/' + id)), null),
    ]);
    const team = firstSegment(data);
    if (!team || !team.name) return setEmpty(app, 'Team not found');
    const vlrInfo = vlrDetail?.info || {};
    const players = (vlrDetail?.players || []).map(p => normalizeTeamPerson(p, true));
    const staff = (vlrDetail?.staff || []).map(p => normalizeTeamPerson(p, true));
    const roster = players.length ? players : (team.roster || []).filter(p => !p.role && !p.is_staff);
    const staffRoster = staff.length ? staff : (team.roster || []).filter(p => p.role || p.is_staff);
    let html = `
      <div class="team-header">
        <img src="${fixImg(pickFirst(team.logo, vlrInfo.logo))}" alt="" onerror="this.style.display='none'">
        <div class="team-info">
          <h2>${esc(pickFirst(team.name, vlrInfo.name))}</h2>
          <div class="team-tag">${esc(pickFirst(team.tag, vlrInfo.tag))} ${flagToEmoji(team.country)} ${esc(team.country_name || '')}</div>
          ${team.rating ? `<div class="team-stats">
            <div class="stat"><div class="stat-val">#${esc(team.rating.rank)}</div><div class="stat-label">Rank</div></div>
            <div class="stat"><div class="stat-val">${esc(team.rating.rating)}</div><div class="stat-label">Rating</div></div>
            <div class="stat"><div class="stat-val">${esc(team.rating.streak)}</div><div class="stat-label">Streak</div></div>
          </div>` : ''}
        </div>
      </div>
    `;
    if (roster.length) {
      html += '<h2 class="section-title">Roster</h2><div class="roster-grid">';
      roster.forEach(p => {
        html += `<div class="player-card" onclick="navigate('/player/${p.id}')" style="cursor:pointer">
          <img src="${fixImg(p.avatar)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><rect fill=%22%23f7f7f7%22 width=%2248%22 height=%2248%22 rx=%2224%22/></svg>'">
          <div>
            <div class="player-name">${flagToEmoji(p.country)} ${esc(p.alias)}${p.is_captain ? '<span class="captain-badge">C</span>' : ''}</div>
            <div class="player-real">${esc(p.real_name || '')}</div>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    if (staffRoster.length) {
      html += '<h2 class="section-title">Staff</h2><div class="roster-grid">';
      staffRoster.forEach(p => {
        html += `<div class="player-card" ${p.id ? `onclick="navigate('/player/${p.id}')" style="cursor:pointer"` : ''}>
          <img src="${fixImg(p.avatar)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><rect fill=%22%23f7f7f7%22 width=%2248%22 height=%2248%22 rx=%2224%22/></svg>'">
          <div>
            <div class="player-name">${flagToEmoji(p.country)} ${esc(p.alias)}</div>
            <div class="player-real">${esc(p.role || p.real_name || '')}</div>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    if (team.social_links && team.social_links.length) {
      html += '<div class="detail-meta" style="margin-bottom:var(--s-lg)">';
      team.social_links.forEach(s => {
        html += `<a class="link-chip" href="${s.url}" target="_blank" rel="noopener">${esc(s.platform)}</a>`;
      });
      html += '</div>';
    }
    const eventPlacements = vlrDetail?.events || team.event_placements || [];
    if (eventPlacements.length) {
      html += '<h2 class="section-title">Events</h2><div class="detail-panel" style="margin-bottom:var(--s-lg)">';
      eventPlacements.slice(0, 12).forEach(ev => {
        const result = Array.isArray(ev.results) ? ev.results.join(', ') : pickFirst(ev.placement, ev.series);
        html += `<div class="match-row" ${ev.id ? `onclick="navigate('/event/${ev.id}')" style="cursor:pointer"` : ''}>
          <div class="match-main"><strong>${esc(ev.name || ev.event)}</strong></div>
          <div class="match-side">${esc(result)}<br>${esc(ev.year || ev.date || ev.prize || '')}</div>
        </div>`;
      });
      html += '</div>';
    }
    if (vlrDetail?.upcoming?.length) {
      html += '<h2 class="section-title">Upcoming</h2><div class="detail-panel" style="margin-bottom:var(--s-lg)">';
      vlrDetail.upcoming.slice(0, 8).forEach(r => {
        const match = normalizeVlrResult(r);
        html += teamMatchRow(match);
      });
      html += '</div>';
    }
    html += `
      <div class="detail-grid">
        <div><h2 class="section-title">Recent Matches</h2><div id="teamMatches"><div class="loading">Loading</div></div></div>
        <div><h2 class="section-title">Transactions</h2><div id="teamTransactions"><div class="loading">Loading</div></div></div>
      </div>
      <h2 class="section-title">Map Stats</h2><div id="teamStats"><div class="loading">Loading</div></div>
    `;
    app.innerHTML = html;
    loadTeamMatches(id);
    loadTeamTransactions(id);
    loadTeamStats(id);
  } catch (e) {
    setError(app, 'Failed to load team details', () => renderTeamDetail(app, id));
  }
}
function teamMatchRow(m) {
  const isWin = m.result === 'win';
  const t1 = m.team1 || {};
  const t2 = m.team2 || {};
  const opp = t2.name ? t2 : t1;
  return `
    <div class="match-row" ${m.match_id ? `onclick="showMatchDetail('${m.match_id}')" style="cursor:pointer"` : ''}>
      <span style="font-weight:700;min-width:32px;color:${isWin ? 'var(--win)' : 'var(--loss)'}">${m.result ? (isWin ? 'W' : 'L') : ''}</span>
      <span style="font-weight:600;min-width:50px">${esc(m.score || '')}</span>
      <img src="${fixImg(opp.logo || m.event_logo)}" alt="" onerror="this.style.display='none'">
      <span>${esc(opp.name || '')}</span>
      <span class="match-side">${esc(m.event || '')}<br>${esc(m.date || '')}</span>
    </div>`;
}
async function loadTeamMatches(id) {
  const el = $('#teamMatches');
  if (!el) return;
  try {
    const data = await apiFetch('/team?id=' + id + '&q=matches');
    const items = asSegments(data);
    if (!items.length) { setEmpty(el, 'No recent matches'); return; }
    el.innerHTML = '<div class="detail-panel">' + items.slice(0, 10).map(teamMatchRow).join('') + '</div>';
  } catch (e) {
    el.innerHTML = '<div style="color:var(--muted);padding:var(--s-md) 0">Failed to load matches</div>';
  }
}
async function loadTeamTransactions(id) {
  const el = $('#teamTransactions');
  if (!el) return;
  try {
    const data = await apiFetch('/team?id=' + id + '&q=transactions');
    const items = asSegments(data);
    if (!items.length) return setEmpty(el, 'No transactions');
    el.innerHTML = '<div class="detail-panel">' + items.slice(0, 10).map(tx => `
      <div class="match-row">
        <span style="font-weight:700;min-width:44px;color:${tx.action === 'leave' ? 'var(--loss)' : 'var(--win)'}">${esc(tx.action || '')}</span>
        <div class="match-main">
          <img src="${fixImg(tx.player?.avatar)}" alt="" onerror="this.style.display='none'">
          <strong>${esc(tx.player?.name || '')}</strong>
        </div>
        <span class="match-side">${esc(tx.date || '')}<br>${esc(tx.role || '')}</span>
      </div>`).join('') + '</div>';
  } catch (e) {
    el.innerHTML = '<div style="color:var(--muted);padding:var(--s-md) 0">Failed to load transactions</div>';
  }
}
async function loadTeamStats(id) {
  const el = $('#teamStats');
  if (!el) return;
  try {
    const data = await apiFetch('/team?id=' + id + '&q=stats');
    const items = asSegments(data);
    if (!items.length) return setEmpty(el, 'No map stats');
    el.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Map</th><th>Games</th><th>Record</th><th>Win%</th><th>ATK R%</th><th>DEF R%</th></tr></thead>
      <tbody>${items.map(s => `
        <tr>
          <td style="font-weight:600">${esc(s.map)}</td>
          <td>${esc(s.games)}</td>
          <td>${esc(s.wins)}-${esc(s.losses)}</td>
          <td class="stat-highlight">${esc(s.win_pct)}</td>
          <td>${esc(s.atk_rwin_pct)}</td>
          <td>${esc(s.def_rwin_pct)}</td>
        </tr>`).join('')}</tbody>
    </table></div>`;
  } catch (e) {
    el.innerHTML = '<div style="color:var(--muted);padding:var(--s-md) 0">Failed to load map stats</div>';
  }
}

// --- Page: Player Detail ---
function normalizeVlrResult(r) {
  const teams = r.teams || [];
  const t1 = teams[0] || {};
  const t2 = teams[1] || {};
  const hasScore = t1.points != null && t2.points != null;
  return {
    match_id: r.match?.id,
    url: r.match?.url,
    event: r.event?.name,
    event_logo: r.event?.logo,
    date: r.utc || '',
    team1: { name: t1.name, tag: t1.tag, logo: t1.logo },
    team2: { name: t2.name, tag: t2.tag, logo: t2.logo },
    score: hasScore ? `${t1.points}:${t2.points}` : 'vs',
    result: hasScore ? (Number(t1.points) >= Number(t2.points) ? 'win' : 'loss') : '',
  };
}
function playerSocialLinks(profile, detail) {
  const links = [...(profile.social_links || [])];
  const socials = detail?.socials || {};
  ['twitter', 'twitch'].forEach(platform => {
    const url = socials[platform + '_url'];
    if (url) links.push({ platform, url });
  });
  return byId(links.map(link => ({ ...link, id: link.url })));
}
async function renderPlayerDetail(app, id) {
  app.innerHTML = '<div class="loading">Loading</div>';
  try {
    const [profileData, matchesData, vlrDetail] = await Promise.all([
      safeFetch(apiFetch('/player?id=' + id), null),
      safeFetch(apiFetch('/player?id=' + id + '&q=matches'), null),
      safeFetch(vlrFetch(vlrThemePath('/api/v1/players/' + id)), null),
    ]);
    const profile = firstSegment(profileData);
    const info = vlrDetail?.info || {};
    if (!profile.name && !info.user) return setEmpty(app, 'Player not found');

    const team = { ...(vlrDetail?.team || {}), ...(profile.current_team || {}) };
    const name = pickFirst(profile.name, info.user);
    const realName = pickFirst(profile.real_name, info.name);
    const avatar = fixImg(pickFirst(profile.avatar, info.img));
    const country = pickFirst(profile.country, info.country, info.flag);
    const matches = asSegments(matchesData);
    const recentMatches = matches.length ? matches : (vlrDetail?.results || []).map(normalizeVlrResult);
    const pastTeams = profile.past_teams || vlrDetail?.pastTeams || [];
    const socialLinks = playerSocialLinks(profile, vlrDetail);

    let html = `
      <div class="team-header">
        <img src="${avatar}" alt="" onerror="this.style.display='none'">
        <div class="team-info">
          <h2>${flagToEmoji(country)} ${esc(name)}</h2>
          <div class="team-tag">${esc(realName)}${team.name ? ' · ' + esc(team.name) : ''}</div>
          <div class="detail-meta">
            ${profile.total_winnings ? `<span class="link-chip">Winnings ${esc(profile.total_winnings)}</span>` : ''}
            ${profile.agent_stats?.length ? `<span class="link-chip">${profile.agent_stats.length} agents</span>` : ''}
            ${recentMatches.length ? `<span class="link-chip">${recentMatches.length} recent matches</span>` : ''}
          </div>
        </div>
      </div>
    `;

    if (socialLinks.length || team.name) {
      html += '<div class="detail-meta" style="margin-bottom:var(--s-lg)">';
      if (team.name) {
        const teamLabel = `${esc(team.name)}${team.joined ? ' · ' + esc(team.joined) : ''}`;
        html += team.id ? `<a class="link-chip" href="/team/${team.id}">${teamLabel}</a>` : `<span class="link-chip">${teamLabel}</span>`;
      }
      socialLinks.forEach(s => {
        html += `<a class="link-chip" href="${s.url}" target="_blank" rel="noopener">${esc(s.platform)}</a>`;
      });
      html += '</div>';
    }

    if (profile.agent_stats && profile.agent_stats.length) {
      html += '<h2 class="section-title">Agent Stats</h2><div class="table-wrap" style="margin-bottom:var(--s-lg)"><table><thead><tr><th>Agent</th><th>Use</th><th>Rounds</th><th>Rating</th><th>ACS</th><th>K/D</th><th>ADR</th><th>KAST</th></tr></thead><tbody>';
      profile.agent_stats.forEach(a => {
        html += `<tr>
          <td>${agentBadge(a.agent)}</td>
          <td>${esc(a.usage_count)} ${esc(a.usage_pct)}</td>
          <td>${esc(a.rounds)}</td>
          <td class="stat-highlight">${esc(a.rating)}</td>
          <td>${esc(a.acs)}</td>
          <td>${esc(a.kd)}</td>
          <td>${esc(a.adr)}</td>
          <td>${esc(a.kast)}</td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    }

    if (recentMatches.length) {
      html += '<h2 class="section-title">Recent Matches</h2><div class="detail-panel" style="margin-bottom:var(--s-lg)">';
      recentMatches.slice(0, 12).forEach(m => {
        const t1 = m.team1 || {};
        const t2 = m.team2 || {};
        const isWin = m.result === 'win';
        html += `<div class="match-row" ${m.match_id ? `onclick="showMatchDetail('${m.match_id}')" style="cursor:pointer"` : ''}>
          <span style="font-weight:700;min-width:32px;color:${isWin ? 'var(--win)' : 'var(--loss)'}">${m.result ? (isWin ? 'W' : 'L') : ''}</span>
          <div class="match-main">
            <img src="${fixImg(t1.logo || m.event_logo)}" alt="" onerror="this.style.display='none'">
            <strong>${esc(t1.tag || t1.name || '')}</strong>
            <span>${esc(m.score || '')}</span>
            <strong>${esc(t2.tag || t2.name || '')}</strong>
            <img src="${fixImg(t2.logo)}" alt="" onerror="this.style.display='none'">
          </div>
          <div class="match-side">${esc(m.event || '')}<br>${esc(m.date || '')}</div>
        </div>`;
      });
      html += '</div>';
    }

    if (pastTeams.length) {
      html += '<div class="detail-grid">';
      html += '<div class="detail-panel"><h3>Past Teams</h3>';
      pastTeams.slice(0, 16).forEach(t => {
        html += `<div class="match-row">
          <img src="${fixImg(t.logo)}" alt="" onerror="this.style.display='none'">
          <div class="match-main"><strong>${esc(t.name)}</strong></div>
          <div class="match-side">${esc(t.dates || t.info || '')}</div>
        </div>`;
      });
      html += '</div>';
      if (profile.event_placements && profile.event_placements.length) {
        html += '<div class="detail-panel"><h3>Event Placements</h3>';
        profile.event_placements.slice(0, 16).forEach(ev => {
          html += `<div class="match-row">
            <div class="match-main"><strong>${esc(ev.event)}</strong></div>
            <div class="match-side">${esc(ev.placement || ev.series || '')}<br>${esc(ev.prize || ev.date || '')}</div>
          </div>`;
        });
        html += '</div>';
      }
      html += '</div>';
    }
    app.innerHTML = html;
  } catch (e) {
    setError(app, 'Failed to load player details', () => renderPlayerDetail(app, id));
  }
}

// --- Page: Search ---
async function renderSearch(app) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const q = params.get('q') || '';
  if (!q) { app.innerHTML = '<h1 class="page-title">Search</h1><div class="empty"><p>Type something to search</p></div>'; return; }
  app.innerHTML = `<h1 class="page-title">Search: "${esc(q)}"</h1><div class="loading">Loading</div>`;
  try {
    const data = await apiFetch('/search?q=' + encodeURIComponent(q));
    const results = data.segments?.results || {};
    const teams = results.teams || [];
    const players = results.players || [];
    const events = results.events || [];
    if (!teams.length && !players.length && !events.length) {
      setEmpty(app, 'No results found for "' + esc(q) + '"');
      return;
    }
    let html = '';
    if (teams.length) {
      html += '<div class="search-section"><h3>Teams</h3>';
      teams.forEach(t => {
        html += `<div class="search-item" onclick="navigate('/team/${t.id}')">
          <img src="${fixImg(t.img)}" alt="" onerror="this.style.display='none'">
          <div><div class="search-name">${esc(t.name)}</div><div class="search-desc">${esc(t.tag || '')}</div></div>
        </div>`;
      });
      html += '</div>';
    }
    if (players.length) {
      html += '<div class="search-section"><h3>Players</h3>';
      players.forEach(p => {
        html += `<div class="search-item" onclick="navigate('/player/${p.id}')">
          <img src="${fixImg(p.img)}" alt="" onerror="this.style.display='none'">
          <div><div class="search-name">${esc(p.name)}</div><div class="search-desc">${esc(p.description || '')}</div></div>
        </div>`;
      });
      html += '</div>';
    }
    if (events.length) {
      html += '<div class="search-section"><h3>Events</h3>';
      events.forEach(ev => {
        html += `<div class="search-item" onclick="navigate('/event/${ev.id}')">
          <img src="${fixImg(ev.img)}" alt="" onerror="this.style.display='none'">
          <div><div class="search-name">${esc(ev.name)}</div><div class="search-desc">${esc(ev.description || '')}</div></div>
        </div>`;
      });
      html += '</div>';
    }
    app.innerHTML = html;
  } catch (e) {
    setError(app, 'Search failed', () => renderSearch(app));
  }
}

// --- Page: Players ---
let playersRegion = 'cn', playersPage = 1;
async function renderPlayers(app) {
  app.innerHTML = `
    <h1 class="page-title">Players</h1>
    <div class="filters">
      <select class="filter-select" id="playersRegion" onchange="playersRegion=this.value;playersPage=1;loadPlayers()">
        <option value="all" ${playersRegion==='all'?'selected':''}>All Regions</option>
        <option value="na" ${playersRegion==='na'?'selected':''}>North America</option>
        <option value="eu" ${playersRegion==='eu'?'selected':''}>Europe</option>
        <option value="ap" ${playersRegion==='ap'?'selected':''}>Asia Pacific</option>
        <option value="kr" ${playersRegion==='kr'?'selected':''}>Korea</option>
        <option value="br" ${playersRegion==='br'?'selected':''}>Brazil</option>
        <option value="cn" ${playersRegion==='cn'?'selected':''}>China</option>
        <option value="jp" ${playersRegion==='jp'?'selected':''}>Japan</option>
        <option value="lan" ${playersRegion==='lan'?'selected':''}>LATAM North</option>
        <option value="las" ${playersRegion==='las'?'selected':''}>LATAM South</option>
        <option value="oce" ${playersRegion==='oce'?'selected':''}>Oceania</option>
        <option value="mena" ${playersRegion==='mena'?'selected':''}>MENA</option>
        <option value="gc" ${playersRegion==='gc'?'selected':''}>Game Changers</option>
        <option value="world" ${playersRegion==='world'?'selected':''}>World</option>
      </select>
    </div>
    <div id="playersContent"><div class="loading">Loading</div></div>
  `;
  loadPlayers();
}
window.loadPlayers = async function() {
  const el = $('#playersContent');
  if (!el) return;
  setLoading(el);
  try {
    let vlrPath = vlrThemePath('/api/v1/players?page=' + playersPage + '&limit=50' + (playersRegion !== 'all' ? '&region=' + playersRegion : ''));
    const cacheKey = 'vlr:' + vlrPath;
    let json;
    const cached = CacheManager.get(cacheKey);
    if (cached && !cached.isStale) { json = cached.data; }
    else {
      const res = await fetch(VLR_API + vlrPath);
      json = await res.json();
      CacheManager.set(cacheKey, json);
    }
    const items = json.data || [];
    const pagination = json.pagination || {};
    if (!items.length) return setEmpty(el, 'No players found');
    el.innerHTML = '<div class="cards">' + items.map(p => `
      <div class="card player-list-card" onclick="navigate('/player/${p.id}')">
        <span class="player-flag">${flagToEmoji(p.country)}</span>
        <div class="player-info">
          <div class="player-name">${esc(p.name)}</div>
          <div class="player-team">${esc(p.teamTag || 'Free Agent')}</div>
        </div>
      </div>
    `).join('') + '</div>';
    if (pagination.totalPages > 1) {
      el.innerHTML += renderPagination(pagination.page, pagination.totalPages, 'playersPage', 'loadPlayers');
    }
  } catch (e) {
    setError(el, 'Failed to load players', loadPlayers);
  }
};
window.showPlayerDetail = async function(id) {
  openModal('<div class="loading">Loading player details</div>');
  try {
    const res = await fetch(VLR_API + vlrThemePath('/api/v1/players/' + id));
    const json = await res.json();
    const d = json.data;
    if (!d || !d.info) { $('#modalBody').innerHTML = '<p>Player not found</p>'; return; }
    const info = d.info;
    const team = d.team || {};
    const results = d.results || [];
    let html = `
      <div style="display:flex;align-items:center;gap:var(--s-lg);margin-bottom:var(--s-xl)">
        <img src="${fixImg(info.img)}" style="width:72px;height:72px;border-radius:var(--r-full);object-fit:cover;background:var(--surface-soft)" alt="" onerror="this.style.display='none'">
        <div>
          <div style="display:flex;align-items:center;gap:var(--s-sm)">
            <span style="font-size:24px">${flagToEmoji(info.flag)}</span>
            <h3 style="margin:0">${esc(info.user)}</h3>
          </div>
          ${info.name ? `<div style="font-size:14px;color:var(--muted);margin-top:2px">${esc(info.name)}</div>` : ''}
          ${team.name ? `<div style="margin-top:var(--s-sm)"><a href="/team/${team.id}" onclick="closeModal()" style="font-size:14px;font-weight:500;color:var(--primary)">${esc(team.name)}</a><span style="font-size:13px;color:var(--muted);margin-left:var(--s-sm)">${esc(team.joined || '')}</span></div>` : ''}
        </div>
      </div>
    `;
    if (results.length) {
      html += '<h3 style="font-size:16px;font-weight:600;margin-bottom:var(--s-md)">Recent Matches</h3>';
      html += '<div style="display:flex;flex-direction:column;gap:var(--s-sm)">';
      results.slice(0, 10).forEach(r => {
        const ev = r.event || {};
        const teams = r.teams || [];
        const t1 = teams[0] || {};
        const t2 = teams[1] || {};
        const isWin = t1.points > t2.points;
        html += `
          <div style="display:flex;align-items:center;gap:var(--s-md);padding:var(--s-sm) var(--s-md);background:var(--surface-soft);border-radius:var(--r-sm);font-size:13px">
            <img src="${fixImg(ev.logo)}" style="width:20px;height:20px;border-radius:4px;object-fit:contain" alt="" onerror="this.style.display='none'">
            <span style="color:var(--muted);min-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ev.name || '')}</span>
            <img src="${fixImg(t1.logo)}" style="width:20px;height:20px;border-radius:4px;object-fit:contain" alt="" onerror="this.style.display='none'">
            <span style="font-weight:600">${esc(t1.tag || '')} ${esc(t1.points || '0')}</span>
            <span style="color:var(--muted)">-</span>
            <span style="font-weight:600">${esc(t2.points || '0')} ${esc(t2.tag || '')}</span>
            <img src="${fixImg(t2.logo)}" style="width:20px;height:20px;border-radius:4px;object-fit:contain" alt="" onerror="this.style.display='none'">
            <a href="https://www.vlr.gg/${r.match?.id || ''}" target="_blank" rel="noopener" style="margin-left:auto;color:var(--muted-soft);font-size:12px">vlr.gg</a>
          </div>`;
      });
      html += '</div>';
    }
    $('#modalBody').innerHTML = html;
  } catch (e) {
    $('#modalBody').innerHTML = '<div class="error-msg"><p>Failed to load player details</p></div>';
  }
};

// --- Page: Teams (List) ---
let teamsRegion = 'china', teamsPage = 1;
async function renderTeams(app) {
  app.innerHTML = `
    <h1 class="page-title">Teams</h1>
    <div class="filters">
      <select class="filter-select" id="teamsRegion" onchange="teamsRegion=this.value;teamsPage=1;loadTeamsList()">
        <option value="all" ${teamsRegion==='all'?'selected':''}>All Regions</option>
        <option value="na" ${teamsRegion==='na'?'selected':''}>North America</option>
        <option value="eu" ${teamsRegion==='eu'?'selected':''}>Europe</option>
        <option value="ap" ${teamsRegion==='ap'?'selected':''}>Asia Pacific</option>
        <option value="kr" ${teamsRegion==='kr'?'selected':''}>Korea</option>
        <option value="br" ${teamsRegion==='br'?'selected':''}>Brazil</option>
        <option value="china" ${teamsRegion==='china'?'selected':''}>China</option>
        <option value="jp" ${teamsRegion==='jp'?'selected':''}>Japan</option>
        <option value="lan" ${teamsRegion==='lan'?'selected':''}>LATAM North</option>
        <option value="las" ${teamsRegion==='las'?'selected':''}>LATAM South</option>
        <option value="oce" ${teamsRegion==='oce'?'selected':''}>Oceania</option>
        <option value="mena" ${teamsRegion==='mena'?'selected':''}>MENA</option>
        <option value="gc" ${teamsRegion==='gc'?'selected':''}>Game Changers</option>
      </select>
    </div>
    <div id="teamsListContent"><div class="loading">Loading</div></div>
  `;
  loadTeamsList();
}
window.loadTeamsList = async function() {
  const el = $('#teamsListContent');
  if (!el) return;
  setLoading(el);
  try {
    let vlrPath = vlrThemePath('/api/v1/teams?page=' + teamsPage + '&limit=50' + (teamsRegion !== 'all' ? '&region=' + teamsRegion : ''));
    const cacheKey = 'vlr:' + vlrPath;
    let json;
    const cached = CacheManager.get(cacheKey);
    if (cached && !cached.isStale) { json = cached.data; }
    else {
      const res = await fetch(VLR_API + vlrPath);
      json = await res.json();
      CacheManager.set(cacheKey, json);
    }
    const items = json.data || [];
    const pagination = json.pagination || {};
    if (!items.length) return setEmpty(el, 'No teams found');
    el.innerHTML = '<div class="cards">' + items.map(t => `
      <div class="card team-list-card" onclick="navigate('/team/${t.id}')">
        <img class="team-logo-sm" src="${fixImg(t.img)}" alt="" onerror="this.style.display='none'">
        <div>
          <div class="team-name">${esc(t.name)}</div>
          <div class="team-country">${flagToEmoji(t.country)} ${esc(t.country || '')}</div>
        </div>
      </div>
    `).join('') + '</div>';
    if (pagination.totalPages > 1) {
      el.innerHTML += renderPagination(pagination.page, pagination.totalPages, 'teamsPage', 'loadTeamsList');
    }
  } catch (e) {
    setError(el, 'Failed to load teams', loadTeamsList);
  }
};
window.showTeamDetailVlr = async function(id) {
  openModal('<div class="loading">Loading team details</div>');
  try {
    const res = await fetch(VLR_API + vlrThemePath('/api/v1/teams/' + id));
    const json = await res.json();
    const d = json.data;
    if (!d || !d.info) { $('#modalBody').innerHTML = '<p>Team not found</p>'; return; }
    const info = d.info;
    const players = d.players || [];
    const staff = d.staff || [];
    let html = `
      <div style="display:flex;align-items:center;gap:var(--s-lg);margin-bottom:var(--s-xl)">
        <img src="${fixImg(info.logo)}" style="width:72px;height:72px;border-radius:var(--r-lg);object-fit:contain;background:var(--surface-soft)" alt="" onerror="this.style.display='none'">
        <div>
          <h3 style="margin:0">${esc(info.name)}</h3>
          ${info.tag ? `<div style="font-size:14px;color:var(--muted)">${esc(info.tag)}</div>` : ''}
        </div>
      </div>
    `;
    if (players.length) {
      html += '<h3 style="font-size:16px;font-weight:600;margin-bottom:var(--s-md)">Players</h3>';
      html += '<div class="roster-grid">';
      players.forEach(p => {
        html += `<div class="player-card" onclick="closeModal();showPlayerDetail('${p.id}')" style="cursor:pointer">
          <img src="${fixImg(p.img)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><rect fill=%22%23f7f7f7%22 width=%2248%22 height=%2248%22 rx=%2224%22/></svg>'">
          <div>
            <div class="player-name">${flagToEmoji(p.country)} ${esc(p.user)}</div>
            <div class="player-real">${esc(p.name || '')}</div>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    if (staff.length) {
      html += '<h3 style="font-size:16px;font-weight:600;margin-bottom:var(--s-md);margin-top:var(--s-lg)">Staff</h3>';
      html += '<div class="roster-grid">';
      staff.forEach(p => {
        html += `<div class="player-card">
          <img src="${fixImg(p.img)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><rect fill=%22%23f7f7f7%22 width=%2248%22 height=%2248%22 rx=%2224%22/></svg>'">
          <div>
            <div class="player-name">${flagToEmoji(p.country)} ${esc(p.user)}</div>
            <div class="player-real">${esc(p.tag || p.name || '')}</div>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    // Link to full team page on vlr.gg
    html += `<div style="margin-top:var(--s-lg)"><a href="https://www.vlr.gg/team/${id}" target="_blank" rel="noopener" style="font-size:13px;padding:8px 16px;background:var(--surface-soft);border-radius:var(--r-full);color:var(--body);border:1px solid var(--hairline-soft)">View on vlr.gg</a></div>`;
    $('#modalBody').innerHTML = html;
  } catch (e) {
    $('#modalBody').innerHTML = '<div class="error-msg"><p>Failed to load team details</p></div>';
  }
};

// --- Helpers ---
function renderPagination(current, total, pageVar, loadFn) {
  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="${pageVar}=${current - 1};${loadFn}()" ${current <= 1 ? 'disabled' : ''}>Prev</button>`;
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  if (start > 1) html += `<button class="page-btn" onclick="${pageVar}=1;${loadFn}()">1</button>`;
  if (start > 2) html += '<span class="page-info">...</span>';
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="${pageVar}=${i};${loadFn}()">${i}</button>`;
  }
  if (end < total - 1) html += '<span class="page-info">...</span>';
  if (end < total) html += `<button class="page-btn" onclick="${pageVar}=${total};${loadFn}()">${total}</button>`;
  html += `<button class="page-btn" onclick="${pageVar}=${current + 1};${loadFn}()" ${current >= total ? 'disabled' : ''}>Next</button>`;
  html += '</div>';
  return html;
}

function regionOptions(selected) {
  const regions = [
    ['na','North America'],['eu','Europe'],['ap','Asia Pacific'],['kr','Korea'],['br','Brazil'],
    ['cn','China'],['jp','Japan'],['la','Latin America'],['la-s','LATAM South'],['la-n','LATAM North'],
    ['oce','Oceania'],['mn','MENA'],['gc','GC'],['col','Collegiate']
  ];
  return regions.map(([v,l]) => `<option value="${v}" ${v===selected?'selected':''}>${l}</option>`).join('');
}
function esc(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

// --- Init ---
router();
