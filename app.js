// app.js - static site logic: fake auth, search, bookmarks, simple data
const STORAGE_USERS = 'studyhub_users_v1';
const STORAGE_CURRENT = 'studyhub_current_v1';
const STORAGE_BOOKMARKS = 'studyhub_bookmarks_v1';

// sample data - replace or extend
const DB = {
  subjects: [
    { id: 'mathematics', title: 'Mathematics', description: 'Algebra, calculus and geometry' },
    { id: 'physics', title: 'Physics', description: 'Mechanics, waves and optics' },
    { id: 'chemistry', title: 'Chemistry', description: 'Inorganic and organic basics' },
    { id: 'cs', title: 'Computer Science', description: 'Programming, data structures' },
  ],
  topics: [
    { id: 'algebra', subject: 'mathematics', title: 'Algebra', description: 'Equations, polynomials' },
    { id: 'calculus', subject: 'mathematics', title: 'Calculus', description: 'Limits, derivatives' },
    { id: 'kinematics', subject: 'physics', title: 'Kinematics', description: 'Motion and equations' },
    { id: 'java-basics', subject: 'cs', title: 'Java Basics', description: 'OOP, syntax' },
  ],
  resources: [
    { id: 'r1', topic: 'algebra', title: 'Algebra Notes (PDF)', type: 'PDF', desc: 'Concise notes with examples', file: 'assets/sample.pdf' },
    { id: 'r2', topic: 'algebra', title: 'Polynomials - Video', type: 'VIDEO', desc: 'Short video lecture', file: 'https://youtu.be/dQw4w9WgXcQ' },
    { id: 'r3', topic: 'calculus', title: 'Derivatives Cheat Sheet', type: 'PDF', desc: 'Rules and shortcuts', file: 'assets/sample.pdf' },
    { id: 'r4', topic: 'java-basics', title: 'Java OOP Guide', type: 'ARTICLE', desc: 'Classes, objects, examples', file: 'https://example.com/java-oop' },
  ]
};

// Utilities for localStorage
function getJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function setJSON(key, v) { localStorage.setItem(key, JSON.stringify(v)); }

// Auth helpers (fake)
function users() { return getJSON(STORAGE_USERS, []); }
function currentUser() { return getJSON(STORAGE_CURRENT, null); }
function setCurrentUser(u) { setJSON(STORAGE_CURRENT, u); updateAuthUI(); }
function createUser(name, email, pass) {
  const all = users();
  if (all.find(x => x.email === email)) return { ok: false, msg: 'Email already used' };
  all.push({ name, email, pass });
  setJSON(STORAGE_USERS, all);
  return { ok: true };
}
function loginUser(email, pass) {
  const u = users().find(x => x.email === email && x.pass === pass);
  if (!u) return { ok: false, msg: 'Invalid credentials' };
  setCurrentUser({ name: u.name, email: u.email });
  return { ok: true };
}
function logout() { localStorage.removeItem(STORAGE_CURRENT); updateAuthUI(); }

// Bookmarks
function bookmarksKeyForUser() {
  const u = currentUser(); return STORAGE_BOOKMARKS + (u ? ('_' + u.email) : '_anon');
}
function getBookmarks() { return getJSON(bookmarksKeyForUser(), []); }
function toggleBookmark(resId) {
  const list = getBookmarks();
  const idx = list.indexOf(resId);
  if (idx === -1) list.push(resId); else list.splice(idx, 1);
  setJSON(bookmarksKeyForUser(), list);
  updateBookmarkCount();
}
function isBookmarked(resId) { return getBookmarks().includes(resId); }
function updateBookmarkCount() {
  const el = document.getElementById('bmCount'); if (!el) return;
  el.textContent = getBookmarks().length;
}

// Basic rendering and routing helpers
function injectSubjects() {
  const grid = document.getElementById('subjectGrid');
  if (!grid) return;
  grid.innerHTML = DB.subjects.map(s => `
    <a class="card" href="subject.html?subject=${encodeURIComponent(s.id)}">
      <h3>${s.title}</h3>
      <p>${s.description}</p>
    </a>
  `).join('');
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function renderSubjectPage() {
  const sid = getQueryParam('subject') || 'mathematics';
  const sub = DB.subjects.find(s => s.id === sid) || DB.subjects[0];
  document.getElementById('subjectTitle').textContent = sub.title;
  document.getElementById('subjectDesc').textContent = sub.description;
  const topics = DB.topics.filter(t => t.subject === sub.id);
  const grid = document.getElementById('topicGrid');
  grid.innerHTML = topics.map(t => `
    <a class="card" href="topic.html?topic=${encodeURIComponent(t.id)}">
      <h3>${t.title}</h3>
      <p>${t.description}</p>
    </a>
  `).join('');
}

function renderTopicPage() {
  const tid = getQueryParam('topic');
  const t = DB.topics.find(x => x.id === tid);
  if (!t) return;
  document.getElementById('topicTitle').textContent = t.title;
  document.getElementById('topicDesc').textContent = t.description;
  const resources = DB.resources.filter(r => r.topic === t.id);
  const list = document.getElementById('resourceList');
  list.innerHTML = resources.map(r => `
    <div class="item">
      <h4><a href="resource.html?res=${encodeURIComponent(r.id)}">${r.title}</a></h4>
      <p class="muted">${r.type} • ${r.desc}</p>
      <div style="margin-top:8px">
        <a class="btn" href="${r.file}" ${r.file && r.file.endsWith('.pdf') ? 'download' : 'target="_blank"'}>Open</a>
        <button class="btn outline" data-res="${r.id}">${isBookmarked(r.id) ? 'Saved' : 'Save'}</button>
      </div>
    </div>
  `).join('');
  // attach bookmark handlers
  Array.from(list.querySelectorAll('button[data-res]')).forEach(b => {
    b.addEventListener('click', e => {
      const id = e.currentTarget.dataset.res;
      toggleBookmark(id);
      // update label
      e.currentTarget.textContent = isBookmarked(id) ? 'Saved' : 'Save';
    });
  });
}

function renderResourcePage() {
  const rid = getQueryParam('res');
  const r = DB.resources.find(x => x.id === rid);
  if (!r) return;
  document.getElementById('resTitle').textContent = r.title;
  document.getElementById('resMeta').textContent = `${r.type} • Topic: ${r.topic}`;
  document.getElementById('resDesc').textContent = r.desc;
  const dl = document.getElementById('downloadBtn');
  dl.href = r.file || '#';
  dl.setAttribute('target', r.file && r.file.startsWith('http') ? '_blank' : '_self');
  const bm = document.getElementById('bookmarkBtn');
  bm.textContent = isBookmarked(r.id) ? 'Remove from bookmarks' : 'Save to bookmarks';
  bm.onclick = () => { toggleBookmark(r.id); bm.textContent = isBookmarked(r.id) ? 'Remove from bookmarks' : 'Save to bookmarks'; };
}

function renderBookmarksPage() {
  const ids = getBookmarks();
  const list = document.getElementById('bookmarkList');
  if (!list) return;
  if (!ids.length) { list.innerHTML = '<p class="muted">No bookmarks yet.</p>'; return; }
  const items = ids.map(id => DB.resources.find(r => r.id === id)).filter(Boolean);
  list.innerHTML = items.map(r => `
    <div class="item">
      <h4><a href="resource.html?res=${encodeURIComponent(r.id)}">${r.title}</a></h4>
      <p class="muted">${r.type} • ${r.desc}</p>
      <div style="margin-top:8px"><a class="btn" href="${r.file}" ${r.file && r.file.endsWith('.pdf') ? 'download' : 'target="_blank"'}>Open</a></div>
    </div>
  `).join('');
}

function doSearch(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return alert('Type a search term');
  // search titles and descriptions in resources, topics, subjects
  const resFromResources = DB.resources.filter(r => (r.title + ' ' + r.desc).toLowerCase().includes(q));
  const resFromTopics = DB.topics.filter(t => (t.title + ' ' + t.description).toLowerCase().includes(q))
    .flatMap(t => DB.resources.filter(r => r.topic === t.id));
  const resFromSubjects = DB.subjects.filter(s => (s.title + ' ' + s.description).toLowerCase().includes(q))
    .flatMap(s => DB.topics.filter(t => t.subject === s.id).flatMap(t => DB.resources.filter(r => r.topic === t.id)));
  const results = Array.from(new Set([...resFromResources, ...resFromTopics, ...resFromSubjects]));
  // simple results rendering in alert or navigate to topic / resource
  if (!results.length) return alert('No results found for: ' + q);
  // if single result open resource page
  if (results.length === 1) {
    location.href = 'resource.html?res=' + encodeURIComponent(results[0].id);
    return;
  }
  // otherwise show results page built on index.html for simplicity
  const html = results.map(r => `<li><a href="resource.html?res=${r.id}">${r.title}</a> — <span class="muted">${r.type}</span><div class="muted">${r.desc}</div></li>`).join('');
  const win = window.open('', '_blank', 'noopener');
  win.document.write(`<title>Search: ${q}</title><style>body{font-family:Arial;padding:16px}li{margin-bottom:10px}</style><h2>Results for "${q}"</h2><ul>${html}</ul>`);
  win.document.close();
}

// UI wiring
function wireSearchButtons() {
  const map = [
    ['globalSearch', 'searchBtn'],
    ['globalSearch2', 'searchBtn2'],
    ['globalSearch3', 'searchBtn3']
  ];
  map.forEach(([inputId, btnId]) => {
    const inp = document.getElementById(inputId), btn = document.getElementById(btnId);
    if (!inp || !btn) return;
    btn.addEventListener('click', () => doSearch(inp.value));
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(inp.value);});
  });
}

// Auth modal wiring
function updateAuthUI() {
  const current = currentUser();
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  if (current) loginBtn.textContent = `Hi, ${current.name}`;
  else loginBtn.textContent = 'Login / Signup';
  updateBookmarkCount();
}

function setupAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  const openBtn = document.getElementById('loginBtn'), closeBtn = document.getElementById('closeAuth');
  const loginForm = document.getElementById('loginForm'), signupForm = document.getElementById('signupForm');
  const showSignup = document.getElementById('showSignup'), showLogin = document.getElementById('showLogin');
  const status = document.getElementById('authStatus');

  function openAuth() { modal.setAttribute('aria-hidden','false'); document.getElementById('authTitle').textContent='Login'; loginForm.classList.remove('hidden'); signupForm.classList.add('hidden'); status.textContent=''; }
  function closeAuth() { modal.setAttribute('aria-hidden','true'); }

  openBtn?.addEventListener('click', openAuth);
  closeBtn?.addEventListener('click', closeAuth);
  showSignup?.addEventListener('click', () => { loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); document.getElementById('authTitle').textContent='Create account'; });
  showLogin?.addEventListener('click', () => { loginForm.classList.remove('hidden'); signupForm.classList.add('hidden'); document.getElementById('authTitle').textContent='Login'; });

  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const res = loginUser(email, pass);
    if (!res.ok) { status.textContent = res.msg; return; }
    status.textContent = 'Welcome back';
    setTimeout(() => { updateAuthUI(); closeAuth(); }, 600);
  });

  signupForm?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pass = document.getElementById('signupPass').value;
    const res = createUser(name, email, pass);
    if (!res.ok) { status.textContent = res.msg; return; }
    status.textContent = 'Account created. You can log in now.';
    setTimeout(() => { document.getElementById('showLogin').click(); }, 600);
  });
}

function initPage() {
  injectSubjects();
  wireSearchButtons();
  setupAuthModal();
  updateAuthUI();
  updateBookmarkCount();

  // page-specific render
  const path = window.location.pathname.split('/').pop();
  if (path === 'subject.html') renderSubjectPage();
  if (path === 'topic.html') renderTopicPage();
  if (path === 'resource.html') renderResourcePage();
  if (path === 'bookmarks.html') renderBookmarksPage();
}

// run on DOM loaded
document.addEventListener('DOMContentLoaded', initPage);
