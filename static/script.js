const KEY = 'mindflow-v2';
const moods = [
  ['Muito bem', '😊'], ['Bem', '🙂'], ['Normal', '😐'], ['Não muito bem', '😕'], ['Triste', '😔'],
  ['Irritado', '😡'], ['Muito mal', '😭'], ['Cansado', '😴'], ['Sobrecarregado', '🫠'],
];
const levels = [
  { name: 'SEMENTE', icon: '✦', from: 0, to: 50 },
  { name: 'BROTO', icon: '🌱', from: 50, to: 120 },
  { name: 'CRESCENDO', icon: '🌿', from: 120, to: 220 },
  { name: 'ÁRVORE', icon: '🌳', from: 220, to: 350 },
  { name: 'ÁRVORE DESENVOLVIDA', icon: '🌳', from: 350, to: 500 },
];
const quotes = ['“Um pequeno passo ainda é um passo.”', '“Você não precisa resolver tudo hoje.”', '“Descansar também faz parte.”', '“Uma coisa de cada vez.”', '“Seu ritmo também é progresso.”'];
const questions = ['O que te deixou feliz hoje?', 'O que você gostaria de deixar para amanhã?', 'Do que você se orgulha hoje?', 'O que está ocupando sua cabeça?', 'O que você gostaria de ouvir hoje?'];
let state = load();
let breathTimer;
let selectedMinutes = 1;
let saveQueue = Promise.resolve();
let saveErrorShown = false;

function initialState() { return { name: '', avatar: '🌱', xp: 0, entries: [], moods: [], reflections: [], missions: [], wordNote: '', favoriteWord: false, theme: 'light' }; }
function load() { try { return { ...initialState(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return initialState(); } }
function save() {
  const snapshot = JSON.stringify(state);
  localStorage.setItem(KEY, snapshot);
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    const response = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: snapshot });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    saveErrorShown = false;
  });
  saveQueue.catch(error => {
    console.error('Não foi possível salvar no banco SQLite:', error);
    if (!saveErrorShown) {
      toast('Não foi possível salvar no banco. Seus dados locais foram mantidos.');
      saveErrorShown = true;
    }
  });
}
function $(id) { return document.getElementById(id); }
function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2200); }
function levelData() { return levels.reduce((current, level) => state.xp >= level.from ? level : current, levels[0]); }
function levelIndex() { return levels.indexOf(levelData()) + 1; }
function registeredDays() { return new Set([...state.entries.map(item => item.date), ...state.moods.map(item => item.date)]).size; }
function addXp(amount, message) { state.xp += amount; save(); render(); toast(message || `+${amount} XP ✦`); }
function formatDate(date) { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date).toUpperCase(); }

function showPage(page) {
  document.querySelectorAll('.page').forEach(section => section.classList.toggle('active', section.id === page));
  document.querySelectorAll('[data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function bindNavigation() {
  document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); showPage(button.dataset.page); }));
}

function renderMoods() {
  $('moods').innerHTML = moods.map(([label, emoji]) => `<button type="button" data-mood="${label}">${emoji} ${label}</button>`).join('');
  document.querySelectorAll('[data-mood]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-mood]').forEach(item => item.classList.remove('selected')); button.classList.add('selected'); $('selected-mood').value = button.dataset.mood; $('mood-form-panel').classList.remove('hidden'); $('mood-form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
}
function renderMoodOptions() { $('entry-mood').innerHTML = moods.map(([label, emoji]) => `<option value="${label}">${emoji} ${label}</option>`).join(''); $('history-mood').innerHTML = '<option value="">Todos os humores</option>' + moods.map(([label, emoji]) => `<option value="${label}">${emoji} ${label}</option>`).join(''); }
function renderHome() {
  const level = levelData(); const next = level.to - state.xp;
  $('today').textContent = formatDate(new Date()); $('home-name').textContent = state.name || 'aventureiro'; $('streak').textContent = registeredDays(); $('xp').textContent = `${state.xp} XP`; $('xp-next').textContent = `${Math.max(0, next)} XP para o próximo nível`; $('level-name').textContent = `NÍVEL ${levelIndex()} · ${level.name}`; $('tree-icon').textContent = level.icon; $('missions-count').textContent = state.missions.length; $('xp-bar').style.width = `${Math.min(100, ((state.xp - level.from) / Math.max(1, level.to - level.from)) * 100)}%`;
  const done = state.missions.includes('daily'); $('mission-button').textContent = done ? 'QUEST COMPLETED ✦' : 'MARCAR COMO FEITA'; $('mission-button').disabled = done;
}
function renderProgress() {
  const values = { 'stat-xp': state.xp, 'stat-level': levelIndex(), 'stat-days': registeredDays(), 'stat-moods': state.moods.length, 'stat-entries': state.entries.length, 'stat-missions': state.missions.length, 'profile-xp': state.xp, 'profile-days': registeredDays(), 'profile-entries': state.entries.length, 'profile-missions': state.missions.length };
  Object.entries(values).forEach(([id, value]) => { if ($(id)) $(id).textContent = value; });
  $('profile-name').textContent = state.name || 'Seu nome'; $('profile-level').textContent = `NÍVEL ${levelIndex()} · ${levelData().name}`; $('profile-avatar').textContent = state.avatar || '🌱'; $('profile-name-input').value = state.name; $('profile-avatar-input').value = state.avatar;
  const counts = moods.map(([label, emoji]) => ({ label, emoji, count: state.moods.filter(item => item.mood === label).length })); const max = Math.max(1, ...counts.map(item => item.count)); $('mood-chart').innerHTML = counts.map(item => `<div class="chart-row"><span>${item.emoji} ${item.label}</span><div class="chart-track"><div class="chart-fill" style="width:${item.count / max * 100}%"></div></div><b>${item.count}</b></div>`).join('');
}
function renderEntries() {
  const search = ($('entry-search').value || '').toLowerCase(); const entries = state.entries.filter(item => `${item.title} ${item.text} ${item.tags}`.toLowerCase().includes(search)).slice().reverse(); $('entries').innerHTML = entries.length ? entries.map(entry => `<article class="entry-item"><div class="entry-head"><div><h3>${safe(entry.title)}</h3><div class="entry-meta">${entry.date} · ${entry.time} · ${safe(entry.mood)}</div></div><div class="entry-actions"><button class="mini-action" data-edit="${entry.id}">Editar</button><button class="mini-action" data-remove="${entry.id}">Excluir</button></div></div><p>${safe(entry.text)}</p><small>${safe(entry.tags || '')}</small></article>`).join('') : '<p>Nenhuma entrada encontrada.</p>';
  document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => { if (confirm('Excluir esta entrada?')) { state.entries = state.entries.filter(item => item.id !== Number(button.dataset.remove)); save(); render(); toast('Entrada excluída.'); } }));
  document.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => { const item = state.entries.find(entry => entry.id === Number(button.dataset.edit)); if (!item) return; $('entry-date').value = item.date; $('entry-time').value = item.time; $('entry-mood').value = item.mood; $('entry-title').value = item.title; $('entry-text').value = item.text; $('entry-tags').value = item.tags; $('entry-form').dataset.editing = item.id; $('entry-form-panel').classList.remove('hidden'); showPage('diario'); }));
}
function renderHistory() { const date = $('history-date').value; const mood = $('history-mood').value; const tag = ($('history-tag').value || '').toLowerCase(); const items = state.entries.filter(item => (!date || item.date === date) && (!mood || item.mood === mood) && (!tag || item.tags.toLowerCase().includes(tag))).slice().reverse(); $('history-list').innerHTML = items.length ? items.map(item => `<article class="history-item"><h3>${safe(item.title)}</h3><div class="entry-meta">${item.date} · ${safe(item.mood)}</div><p>${safe(item.text.slice(0, 150))}${item.text.length > 150 ? '...' : ''}</p></article>`).join('') : '<p>Nenhum registro encontrado.</p>'; }
function render() { renderHome(); renderProgress(); renderEntries(); renderHistory(); }
function safe(value) { return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }

function bindForms() {
  $('welcome-form').addEventListener('submit', event => { event.preventDefault(); state.name = $('name-input').value.trim(); if (!state.name) return; save(); $('welcome').classList.add('hidden'); $('app').classList.remove('hidden'); render(); });
  $('mood-form').addEventListener('submit', event => { event.preventDefault(); const mood = $('selected-mood').value; if (!mood) return toast('Escolha um humor antes de registrar.'); state.moods.push({ id: Date.now(), mood, date: new Date().toISOString().slice(0, 10), event: $('mood-event').value, more: $('mood-more').value, good: $('mood-good').value, thought: $('mood-thought').value }); event.target.reset(); $('mood-form-panel').classList.add('hidden'); save(); addXp(10, '+10 XP · humor registrado ✦'); });
  $('new-entry').addEventListener('click', () => { $('entry-form-panel').classList.toggle('hidden'); $('entry-date').value = new Date().toISOString().slice(0, 10); $('entry-time').value = new Date().toTimeString().slice(0, 5); });
  $('entry-form').addEventListener('submit', event => { event.preventDefault(); const form = event.target; const item = { id: Number(form.dataset.editing || Date.now()), date: $('entry-date').value, time: $('entry-time').value, mood: $('entry-mood').value, title: $('entry-title').value.trim(), text: $('entry-text').value.trim(), tags: $('entry-tags').value.trim() }; const index = state.entries.findIndex(entry => entry.id === item.id); if (index >= 0) state.entries[index] = item; else { state.entries.push(item); state.xp += 15; } delete form.dataset.editing; form.reset(); $('entry-form-panel').classList.add('hidden'); save(); render(); toast(index >= 0 ? 'Entrada atualizada.' : '+15 XP · diário salvo ✦'); });
  $('entry-search').addEventListener('input', renderEntries); ['history-date', 'history-mood', 'history-tag'].forEach(id => $(id).addEventListener('input', renderHistory));
  $('mission-button').addEventListener('click', () => { if (!state.missions.includes('daily')) { state.missions.push('daily'); addXp(20, '+20 XP · missão concluída ✦'); } });
  $('new-quote').addEventListener('click', () => $('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)]);
  $('save-reflection').addEventListener('click', () => { const answer = $('reflection-answer').value.trim(); if (!answer) return toast('Escreva uma resposta primeiro.'); state.reflections.push({ question: $('reflection-question').textContent, answer, date: Date.now() }); $('reflection-answer').value = ''; addXp(10, '+10 XP · reflexão salva ✦'); });
  $('skip-reflection').addEventListener('click', () => { $('reflection-question').textContent = questions[Math.floor(Math.random() * questions.length)]; $('reflection-answer').value = ''; });
  $('reflection-question').textContent = questions[0]; $('favorite-word').addEventListener('click', () => { state.favoriteWord = !state.favoriteWord; save(); $('favorite-word').textContent = state.favoriteWord ? '★' : '✦'; }); $('save-word').addEventListener('click', () => { state.wordNote = $('word-note').value.trim(); save(); addXp(10, '+10 XP · palavra refletida ✦'); });
  document.querySelectorAll('.duration').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.duration').forEach(item => item.classList.remove('active')); button.classList.add('active'); selectedMinutes = Number(button.dataset.minutes); })); $('start-breath').addEventListener('click', startBreathing);
  $('profile-form').addEventListener('submit', event => { event.preventDefault(); state.name = $('profile-name-input').value.trim() || state.name; state.avatar = $('profile-avatar-input').value.trim() || '🌱'; save(); render(); toast('Perfil atualizado.'); });
  $('theme').addEventListener('change', event => { state.theme = event.target.value; document.body.classList.toggle('dark', state.theme === 'dark'); save(); }); $('export-data').addEventListener('click', exportData); $('delete-data').addEventListener('click', deleteData); $('logout').addEventListener('click', logout);
}
function startBreathing() { const orb = $('breath-orb'); clearInterval(breathTimer); let elapsed = 0; orb.textContent = 'INSPIRE'; orb.classList.add('grow'); breathTimer = setInterval(() => { elapsed += 4; orb.classList.toggle('grow'); orb.textContent = orb.classList.contains('grow') ? 'INSPIRE' : 'EXPIRE'; if (elapsed >= selectedMinutes * 60) { clearInterval(breathTimer); orb.classList.remove('grow'); orb.textContent = 'RESPIRA.'; toast('Pausa concluída ✦'); } }, 4000); }
function exportData() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'mindflow-dados.json'; link.click(); URL.revokeObjectURL(link.href); toast('Dados exportados.'); }
function deleteData() { if (!confirm('Apagar todos os registros locais?')) return; const name = state.name; state = initialState(); state.name = name; save(); render(); toast('Registros apagados.'); }
function logout() { if (!confirm('Deseja deslogar?')) return; state.name = ''; save(); $('app').classList.add('hidden'); $('welcome').classList.remove('hidden'); $('name-input').value = ''; }

async function init() {
  bindNavigation();
  bindForms();
  renderMoods();
  renderMoodOptions();
  $('welcome-form').querySelectorAll('input, button').forEach(control => { control.disabled = true; });
  try {
    const response = await fetch('/api/state');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.state) {
      state = { ...initialState(), ...result.state };
      localStorage.setItem(KEY, JSON.stringify(state));
    } else if (localStorage.getItem(KEY)) {
      save();
    } else {
      state = initialState();
    }
  } catch (error) {
    console.error('Não foi possível carregar os dados do banco SQLite:', error);
    toast('Banco indisponível. Os dados locais serão usados até reconectar.');
  }
  $('welcome-form').querySelectorAll('input, button').forEach(control => { control.disabled = false; });
  if (state.name) {
    $('welcome').classList.add('hidden');
    $('app').classList.remove('hidden');
  }
  $('theme').value = state.theme;
  document.body.classList.toggle('dark', state.theme === 'dark');
  $('word-note').value = state.wordNote;
  render();
}
init();
