import { initializeTheme, getTheme, toggleTheme } from './theme.js';
import { request, storageMode } from './transport.js';
import { money, numberInput, displayDate, today, parseMoney, csv, overview, reportRows } from './reports.js';

initializeTheme();
const $ = (s, root = document) => root.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paths = {
 sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 moon: '<path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z"/>',
 building: '<path d="M4 21V5l10-3v19M14 9h6v12M2 21h20M8 7h2m-2 4h2m-2 4h2m7-2h1m-1 4h1"/>',
 home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
 users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 8"/><circle cx="9" cy="7" r="4"/>',
 file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8m-8 4h5"/>',
 card: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M6 15h4"/>',
 bars: '<path d="M4 21V11h4v10m2 0V3h4v18m2 0V7h4v14M2 21h20"/>',
 bank: '<path d="m2 9 10-6 10 6H2Zm2 3v6m5-6v6m6-6v6m5-6v6M2 21h20"/>',
 chart: '<path d="M21.2 15.9A10 10 0 1 1 8.1 2.8M12 2v10h10A10 10 0 0 0 12 2Z"/>',
 settings: '<path d="m9 3-1 3-3 1-2 4 2 2v4l4 2 3-1 3 1 4-2v-4l2-2-2-4-3-1-1-3Z"/><circle cx="12" cy="11" r="3"/>',
 plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="m5 12 4 4L19 6"/>',
 clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8V5a2 2 0 0 1 2-2h13M15 11h6v5h-6Z"/>',
 search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 arrow: '<path d="m9 5 7 7-7 7"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
 logout: '<path d="M9 4H4v16h5m5-13 5 5-5 5m-6-5h11"/>',
 lock: '<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
 download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 print: '<path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6Zm12-2h.01"/>',
 edit: '<path d="m16 3 5 5-12 12H4v-5Zm-2 2 5 5"/>',
 cancel: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
 info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
 transfer: '<path d="M3 7h18m-4-4 4 4-4 4M21 17H3m4-4-4 4 4 4"/>',
 eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.file}</svg>`;
const themeButton = () => `<button type="button" class="icon-button theme-toggle" data-action="theme" aria-label="${getTheme() === 'dark' ? 'Açık temayı aç' : 'Koyu temayı aç'}" aria-pressed="${getTheme() === 'dark'}" title="${getTheme() === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}">${icon(getTheme() === 'dark' ? 'sun' : 'moon')}<span>${getTheme() === 'dark' ? 'Açık' : 'Koyu'}</span></button>`;
const brand = () => `<div class="brand"><svg class="brand-mark" viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M7 43V12L25 5v38M25 21h10v22M3 43h35M13 16h5m-5 9h5m-5 9h5m12-7h2m-2 8h2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div><strong>Apartman Yönetimi</strong><small>AİDAT TAKİP SİSTEMİ</small></div></div>`;
const navItems = [['dashboard', 'Genel Bakış', 'home'], ['units', 'Daireler', 'users'], ['charges', 'Aidatlar', 'file'], ['payments', 'Tahsilatlar', 'card'], ['expenses', 'Giderler', 'bars'], ['accounts', 'Kasa ve Banka', 'bank'], ['reports', 'Raporlar', 'chart'], ['settings', 'Ayarlar', 'settings']];
const descriptions = { dashboard: 'Apartmanınızın mali durumunu tek ekrandan takip edin.', units: 'Daire, malik ve sakin bilgilerini yönetin.', charges: 'Aylık aidatları oluşturun, borç durumlarını takip edin.', payments: 'Ödemeleri kaydedin, makbuzları görüntüleyin.', expenses: 'Apartman giderlerini düzenli ve şeffaf biçimde takip edin.', accounts: 'Nakit kasa ve banka hesaplarınızın güncel durumu.', reports: 'Kayıtları filtreleyin, raporlayın ve dışa aktarın.', settings: 'Apartman bilgileri, güvenlik ve işlem geçmişi.' };
let state = { data: null, csrf: '', passwordRequired: false, page: 'dashboard', month: today().slice(0, 7), query: '', status: 'all', unitFilter: '', reportType: 'debts', reportMonth: today().slice(0, 7), reportUnit: '' };
const modal = $('#modal');
let modalSubmit = null, toastTimer;
function toast(message, error = false) { const el = $('#toast'); el.textContent = message; el.className = `visible${error ? ' error' : ''}`; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = '', 4000); }
async function api(path, body) {
  const response = await request(path, body, state.csrf);
  const result = await response.json();
  if (!response.ok) { const error = new Error(result.error || 'İşlem tamamlanamadı.'); error.status = response.status; throw error; }
  return result;
}
async function load() { state.data = await api('data'); document.title = `${state.data.settings.name} · Aidat Takip`; }
async function action(name, payload) { const response = await api('actions', { action: name, payload }); await load(); return response.result; }
const active = rows => rows.filter(r => !r.voidReason);
const unitBy = id => state.data.units.find(u => u.id === Number(id));
const unitLabel = id => `Daire ${unitBy(id)?.number || '—'}`;
const accountName = id => state.data.accounts.find(a => a.id === Number(id))?.name || '—';
const unitOptions = (selected = '', includeAll = false) => `${includeAll ? '<option value="">Tüm daireler</option>' : '<option value="">Daire seçin</option>'}${state.data.units.map(u => `<option value="${u.id}" ${String(selected) === String(u.id) ? 'selected' : ''}>Daire ${esc(u.number)} · ${esc(u.resident || u.owner || 'İsim yok')}${u.active ? '' : ' (arşiv)'}</option>`).join('')}`;
const accountOptions = selected => state.data.accounts.map(a => `<option value="${a.id}" ${String(selected) === String(a.id) ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
const badge = (text, color = 'gray') => `<span class="badge ${color}">${esc(text)}</span>`;
function status(c) { if (c.voidReason) return badge('İptal', 'red'); if (c.paidCents >= c.amountCents) return badge('Ödendi', 'teal'); if (c.paidCents > 0) return badge('Kısmi ödeme', 'blue'); return c.dueDate < today() ? badge('Gecikmiş', 'amber') : badge('Bekliyor'); }
const btn = (label, act, ico, primary = false, extra = '') => `<button type="button" class="btn${primary ? ' primary' : ''}" data-action="${act}" ${extra}>${ico ? icon(ico) : ''}<span>${label}</span></button>`;
const iconBtn = (label, act, ico, id, extra = '') => `<button type="button" class="icon-button" title="${label}" aria-label="${label}" data-action="${act}" data-id="${id}" ${extra}>${icon(ico)}</button>`;
const empty = (heading, description, button = '', ico = 'file') => `<div class="empty"><div class="empty-icon">${icon(ico)}</div><h3>${heading}</h3><p>${description}</p>${button}</div>`;
const table = (headers, rows, fallback = '') => rows.length ? `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : fallback;
const field = (label, name, value = '', type = 'text', extra = '', hint = '') => `<label class="field">${label}<input class="control" name="${name}" type="${type}" value="${esc(value)}" ${extra}>${hint ? `<small>${hint}</small>` : ''}</label>`;
const selectField = (label, name, options, extra = '') => `<label class="field">${label}<select class="control" name="${name}" ${extra}>${options}</select></label>`;
const noteField = (value = '', required = false) => `<label class="field">Açıklama<textarea class="control" name="note" maxlength="300" ${required ? 'required' : ''}>${esc(value)}</textarea></label>`;
function rowVoid(type, id) { return iconBtn('Kaydı iptal et', 'void', 'cancel', id, `data-type="${type}"`); }
function shell() {
  const current = navItems.find(n => n[0] === state.page) || navItems[0];
  $('#app').innerHTML = `<div class="nav-overlay" data-action="close-menu"></div><aside class="sidebar" aria-label="Ana gezinme">${brand()}<button type="button" class="icon-button drawer-close" data-action="close-menu" aria-label="Menüyü kapat">${icon('close')}</button><div class="nav-label">YÖNETİM PANELİ</div><nav class="nav">${navItems.map(([id, label, ico]) => `<a href="#${id}" class="${state.page === id ? 'active' : ''}" ${state.page === id ? 'aria-current="page"' : ''}>${icon(ico)}${label}</a>`).join('')}</nav><div class="sidebar-bottom"><div class="avatar">${icon('users')}</div><div><strong>Yönetici</strong><small>Tek apartman yönetimi</small></div>${state.passwordRequired ? iconBtn('Çıkış yap', 'logout', 'logout', '') : ''}</div></aside><div class="workspace"><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" data-action="menu" aria-label="Menüyü aç" aria-expanded="false">${icon('menu')}</button><span>${esc(state.data.settings.name)}</span>${icon('arrow')}<strong>${current[1]}</strong></div><div class="top-meta"><span class="private-label">${icon(state.passwordRequired ? 'lock' : 'info')} ${state.passwordRequired ? 'Yalnızca yönetici erişimi' : storageMode === 'browser' ? 'Bu tarayıcıdaki kayıtlar' : 'Parolasız erişim'}</span><span class="top-date">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>${themeButton()}${iconBtn('Verileri yenile', 'refresh', 'refresh', '')}</div></header><main class="main" id="main" tabindex="-1"></main></div>`;
  render();
}
function heading() {
  const title = navItems.find(n => n[0] === state.page)[1];
  let extra = '';
  if (['dashboard', 'charges', 'payments', 'expenses', 'accounts'].includes(state.page)) extra += `<input class="month-field" type="month" id="period-filter" aria-label="Dönem seçin" value="${state.month}" min="1900-01" max="2199-12">`;
  const actions = { units: ['Daire Ekle', 'unit', 'plus'], charges: ['Aidat Oluştur', 'batch', 'plus'], payments: ['Tahsilat Ekle', 'payment', 'plus'], expenses: ['Gider Ekle', 'expense', 'plus'], accounts: ['Hesaplar Arası Transfer', 'transfer', 'transfer'] };
  if (actions[state.page]) extra += btn(...actions[state.page], true);
  if (state.page === 'dashboard') extra += `<button type="button" class="btn primary only-mobile" data-action="payment" aria-label="Tahsilat ekle">${icon('plus')} Tahsilat</button>`;
  return `<div class="page-heading"><div><h1>${title}</h1><p>${descriptions[state.page]}</p></div><div class="heading-actions">${extra}</div></div>`;
}
function render() {
  const views = { dashboard, units, charges, payments, expenses, accounts, reports, settings };
  $('#main').innerHTML = heading() + (storageMode === 'browser' ? `<div class="notice">${icon('info')}<span><strong>Ücretsiz kişisel sürüm.</strong> Kayıtlar bu cihazdaki tarayıcıda saklanır. Her değişiklikte otomatik iç yedek alınır. Cihaz dışında korumak için Ayarlar’dan yedek klasörü seçin. ${btn('Yedek İndir', 'export', 'download')}</span></div>` : '') + (storageMode === 'browser' && state.data.backupInfo?.folderConfigured && state.data.backupInfo.fileInfo?.state !== 'ok' ? `<div class="notice warning">${icon('info')}<span>${esc(state.data.backupInfo.fileInfo?.message || 'Dosya yedeği henüz tamamlanmadı.')} <a href="#settings">Yedek ayarlarını aç</a></span></div>` : '') + views[state.page]() + `<footer class="footer"><span>${icon('building')} ${esc(state.data.settings.name)} · Aidat Takip</span><span>${icon('lock')} ${storageMode === 'browser' ? 'Kayıtlar bu tarayıcıda saklanır.' : 'Kayıtlarınız bu sunucudaki veritabanında saklanır.'}</span></footer>`;
  if (state.page === 'settings') bindSettings();
}
function stats() {
  const s = overview(state.data, state.month);
  const cards = [['Toplam Tahakkuk', s.charged, 'wallet', 'blue', 'Seçili dönemde oluşturulan borç'], ['Tahsil Edilen', s.collected, 'check', 'teal', 'Seçili dönemde kaydedilen ödemeler'], ['Kalan Borç', s.outstanding, 'clock', 'amber', 'Seçili dönem borçlarının güncel kalanı'], ['Toplam Bakiye', s.balance, 'bank', 'slate', 'Nakit ve banka · tüm zamanlar']];
  return `<div class="stats">${cards.map(([label, value, ico, color, note]) => `<div class="stat ${color}"><span class="stat-icon ${color}">${icon(ico)}</span><div><span class="stat-label">${label}</span><strong>${money(value)}</strong><small class="stat-sub">${note}</small></div></div>`).join('')}</div>`;
}
function chart() {
  const end = new Date(state.month + '-15T12:00:00');
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(end.getFullYear(), end.getMonth() - 5 + i, 15); return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('tr-TR', { month: 'short' }) }; });
  const values = months.map(m => ({ ...m, ...overview(state.data, m.month) }));
  const max = Math.max(100000, ...values.flatMap(v => [v.collected, v.spent]));
  const ceil = Math.ceil(max / 100000) * 100000;
  const grid = [0, 1, 2, 3, 4].map(i => `<line class="grid" x1="61" y1="${20 + i * 38}" x2="650" y2="${20 + i * 38}"/><text x="50" y="${24 + i * 38}" text-anchor="end">${new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format((ceil * (4 - i) / 4) / 100)}</text>`).join('');
  const bars = values.map((v, i) => { const x = 95 + i * 99; const a = v.collected / ceil * 152, b = v.spent / ceil * 152; return `<g><rect class="income" x="${x - 15}" y="${172 - a}" width="21" height="${a}" rx="3"><title>${v.label} gelir: ${money(v.collected)}</title></rect><rect class="expense" x="${x + 12}" y="${172 - b}" width="21" height="${b}" rx="3"><title>${v.label} gider: ${money(v.spent)}</title></rect><text x="${x + 8}" y="199" text-anchor="middle">${v.label}</text></g>`; }).join('');
  return `<svg class="chart" viewBox="0 0 680 215" role="img" aria-label="Son altı ayın gelir ve gider grafiği. Ayrıntılar raporlar ekranında.">${grid}${bars}</svg>`;
}
function dashboard() {
  const ds = state.data, debts = active(ds.charges).filter(c => c.amountCents > c.paidCents && (c.period || c.dueDate.slice(0, 7)) === state.month);
  const debtorRows = debts.slice(0, 5).map(c => `<tr><td><strong>${esc(unitLabel(c.unitId))}</strong></td><td>${esc(unitBy(c.unitId)?.resident || unitBy(c.unitId)?.owner || '—')}</td><td class="money">${money(c.amountCents - c.paidCents)}</td><td>${status(c)}</td><td>${iconBtn('Tahsilat ekle', 'payment', 'plus', c.unitId)}</td></tr>`);
  const recent = active(ds.payments).filter(p => p.date.startsWith(state.month)).slice().reverse().slice(0, 4);
  const onboarding = !ds.units.length ? `<div class="notice">${icon('info')}<span>Hoş geldiniz! Önce apartman bilgilerinizi ayarlayın, daireleri ekleyin ve ardından aylık aidatları oluşturun. Tüm tutarlar gerçek kayıtlarınızdan hesaplanır.</span></div>` : '';
  return onboarding + stats() + `<div class="dashboard-row"><section class="panel chart-panel"><div class="panel-head"><h2>Gelir ve Gider</h2><div class="chart-meta"><span class="legend"><i></i>Gelir</span><span class="legend gray"><i></i>Gider</span></div></div>${chart()}</section><section class="panel quick-panel"><div class="panel-head"><h2>Hızlı İşlemler</h2></div><div class="quick-actions">${btn('Tahsilat Ekle', 'payment', 'plus', true)}${btn('Aidat Oluştur', 'batch', 'file')}${btn('Gider Ekle', 'expense', 'wallet')}</div><div class="quick-note">${icon('info')}<span>İşlemler kaydedildiğinde bakiye ve raporlar otomatik güncellenir.</span></div></section></div><div class="dashboard-row"><section class="panel"><div class="panel-head"><h2>Borçlu Daireler <span class="muted">(${debts.length} kayıt)</span></h2><a class="btn ghost" href="#charges">Tümünü gör ${icon('arrow')}</a></div>${table(['Daire', 'Sakin', 'Kalan Borç', 'Durum', ''], debtorRows, empty('Bu dönemde açık borç yok', ds.units.length ? 'Borç kayıtlarınızı aidatlar ekranından yönetebilirsiniz.' : 'İlk dairenizi ekleyerek başlayın.', btn('Daire Ekle', 'unit', 'plus'), 'check'))}</section><section class="panel recent-panel"><div class="panel-head"><h2>Son Tahsilatlar</h2><a href="#payments" class="btn ghost" aria-label="Tüm tahsilatlar">${icon('arrow')}</a></div><div class="recent">${recent.length ? recent.map(p => `<div class="recent-item"><div><strong>${esc(unitLabel(p.unitId))}</strong><small>${esc(accountName(p.accountId))}</small></div><div><span class="money positive">+${money(p.amountCents)}</span><small>${displayDate(p.date)}</small></div></div>`).join('') : empty('Henüz tahsilat yok', 'Seçili dönemin tahsilatları burada görünür.', '', 'card')}</div></section></div>`;
}
function searchToolbar(extra = '') { return `<div class="toolbar"><div class="searchbox">${icon('search')}<input class="control" id="search" aria-label="Kayıtlarda ara" placeholder="Daire veya isim ara…" value="${esc(state.query)}"></div><div class="toolbar-group">${extra}</div></div>`; }
function matchesUnit(u) { return !state.query || `${u.number} ${u.owner} ${u.resident}`.toLocaleLowerCase('tr').includes(state.query.toLocaleLowerCase('tr')); }
function units() {
  const rows = state.data.units.filter(matchesUnit).filter(u => state.status === 'all' || (state.status === 'active' ? u.active : !u.active));
  return `<section class="panel">${searchToolbar(`<select class="control" id="status-filter" aria-label="Daire durumu"><option value="all" ${state.status === 'all' ? 'selected' : ''}>Tüm daireler</option><option value="active" ${state.status === 'active' ? 'selected' : ''}>Aktif</option><option value="archived" ${state.status === 'archived' ? 'selected' : ''}>Arşiv</option></select><span class="table-count">${rows.length} daire</span>`)}${table(['Daire', 'Malik / Sakin', 'Aylık Aidat', 'Güncel Borç', 'Avans', 'Durum', 'İşlemler'], rows.map(u => `<tr><td><strong>Daire ${esc(u.number)}</strong></td><td>${esc(u.owner || '—')}<span class="cell-sub">${esc(u.resident || 'Sakin belirtilmedi')}${u.phone ? ' · ' + esc(u.phone) : ''}</span></td><td class="money">${money(u.monthlyCents)}</td><td class="money ${u.debtCents ? 'negative' : ''}">${money(u.debtCents)}</td><td class="money positive">${money(u.advanceCents)}</td><td>${badge(u.active ? 'Aktif' : 'Arşiv', u.active ? 'teal' : 'gray')}</td><td><div class="row-actions">${iconBtn('Daireyi düzenle', 'unit', 'edit', u.id)}${iconBtn('Hesap dökümü', 'statement', 'file', u.id)}${iconBtn('Tahsilat ekle', 'payment', 'plus', u.id)}</div></td></tr>`), empty('Daire bulunamadı', 'Daire bilgilerini ve aylık aidat tutarlarını buradan yönetin.', btn('İlk Daireyi Ekle', 'unit', 'plus', true), 'users'))}</section>`;
}
function charges() {
  const rows = state.data.charges.filter(c => (c.period || c.dueDate.slice(0, 7)) === state.month && (!state.unitFilter || String(c.unitId) === state.unitFilter)).slice().reverse();
  return `<div class="notice">${icon('info')}<span>Tahakkuklar borç oluşturur; kasaya para girişi yalnızca tahsilatla gerçekleşir. Başlangıç borcu ve ek borç ayrıca eklenebilir.</span></div><section class="panel"><div class="toolbar"><div class="toolbar-group"><select class="control" id="unit-filter" aria-label="Daire filtrele">${unitOptions(state.unitFilter, true)}</select><span class="table-count">${rows.length} kayıt</span></div>${btn('Ek / Devir Borcu', 'extra', 'plus')}</div>${table(['Daire', 'Tür / Açıklama', 'Son Ödeme', 'Borç', 'Ödenen', 'Kalan', 'Durum', ''], rows.map(c => `<tr class="${c.voidReason ? 'struck' : ''}"><td><strong>${esc(unitLabel(c.unitId))}</strong></td><td>${c.kind === 'dues' ? 'Aylık aidat' : c.kind === 'opening' ? 'Devir borcu' : 'Ek borç'}<span class="cell-sub">${esc(c.voidReason || c.note)}</span></td><td>${displayDate(c.dueDate)}</td><td class="money">${money(c.amountCents)}</td><td class="money positive">${money(c.paidCents)}</td><td class="money">${money(c.voidReason ? 0 : c.amountCents - c.paidCents)}</td><td>${status(c)}</td><td><div class="row-actions">${!c.voidReason ? `${iconBtn('Bu borca tahsilat', 'payment', 'plus', c.unitId, `data-charge="${c.id}"`)}${rowVoid('charges', c.id)}` : ''}</div></td></tr>`), empty('Bu dönemde borç kaydı yok', 'Aktif dairelerin aylık aidatlarını tek işlemle oluşturabilirsiniz.', btn('Aidat Oluştur', 'batch', 'plus', true)))}</section>`;
}
function payments() {
  const rows = state.data.payments.filter(p => p.date.startsWith(state.month) && (!state.unitFilter || String(p.unitId) === state.unitFilter)).slice().reverse();
  const total = active(rows).reduce((s, p) => s + p.amountCents, 0);
  return `<section class="panel"><div class="toolbar"><div class="toolbar-group"><select class="control" id="unit-filter" aria-label="Daire filtrele">${unitOptions(state.unitFilter, true)}</select><span class="table-count">${rows.length} kayıt</span></div><span class="money positive">Dönem tahsilatı: ${money(total)}</span></div>${table(['Makbuz', 'Tarih', 'Daire / Sakin', 'Hesap', 'Tutar', 'Durum', 'İşlemler'], rows.map(p => `<tr class="${p.voidReason ? 'struck' : ''}"><td class="muted">#${String(p.id).padStart(4, '0')}</td><td>${displayDate(p.date)}</td><td><strong>${esc(unitLabel(p.unitId))}</strong><span class="cell-sub">${esc(unitBy(p.unitId)?.resident || unitBy(p.unitId)?.owner)}</span></td><td>${esc(accountName(p.accountId))}<span class="cell-sub">${esc(p.voidReason || p.note)}</span></td><td class="money positive">${money(p.amountCents)}</td><td>${badge(p.voidReason ? 'İptal' : 'Kaydedildi', p.voidReason ? 'red' : 'teal')}</td><td><div class="row-actions">${iconBtn('Makbuzu görüntüle', 'receipt', 'print', p.id)}${!p.voidReason ? rowVoid('payments', p.id) : ''}</div></td></tr>`), empty('Bu dönemde tahsilat yok', 'Nakit ve banka ödemelerini kaydedin; kısmi ödemeler ve avans otomatik takip edilir.', btn('Tahsilat Ekle', 'payment', 'plus', true), 'card'))}</section>`;
}
function expenses() {
  const rows = state.data.expenses.filter(e => e.date.startsWith(state.month)).slice().reverse();
  const total = active(rows).reduce((s, e) => s + e.amountCents, 0);
  return `<section class="panel"><div class="toolbar"><span class="table-count">${rows.length} gider kaydı</span><span class="money negative">Dönem gideri: ${money(total)}</span></div>${table(['Kayıt', 'Tarih', 'Kategori', 'Açıklama', 'Hesap', 'Tutar', ''], rows.map(e => `<tr class="${e.voidReason ? 'struck' : ''}"><td class="muted">#${e.id}</td><td>${displayDate(e.date)}</td><td>${badge(e.category, 'blue')}</td><td>${esc(e.note || '—')}<span class="cell-sub">${e.voidReason ? 'İptal: ' + esc(e.voidReason) : ''}</span></td><td>${esc(accountName(e.accountId))}</td><td class="money negative">${money(e.amountCents)}</td><td>${!e.voidReason ? rowVoid('expenses', e.id) : badge('İptal', 'red')}</td></tr>`), empty('Bu dönemde gider yok', 'Elektrik, su, temizlik ve bakım giderlerini buradan kaydedin.', btn('Gider Ekle', 'expense', 'plus', true), 'wallet'))}</section>`;
}
function accounts() {
  const ds = state.data;
  const movements = [...ds.payments.map(p => ({ ...p, type: 'payments', label: `Tahsilat · ${unitLabel(p.unitId)}`, income: true })), ...ds.expenses.map(e => ({ ...e, type: 'expenses', label: e.category, income: false })), ...ds.transfers.map(t => ({ ...t, type: 'transfers', label: 'Hesaplar arası transfer' }))].filter(m => m.date.startsWith(state.month)).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  return `<div class="cards-2">${ds.accounts.map(a => `<section class="panel account-card"><span class="stat-icon ${a.id === 1 ? 'teal' : 'blue'}">${icon(a.id === 1 ? 'wallet' : 'bank')}</span><div><h2>${esc(a.name)}</h2><strong>${money(a.balanceCents)}</strong><span class="muted">Güncel bakiye · tüm zamanlar</span><div>${btn('Açılış Bakiyesi', 'opening', 'edit', false, `data-id="${a.id}"`)}</div></div></section>`).join('')}</div><div class="notice">${icon('info')}<span>Hesaplar arası transfer toplam bakiyeyi değiştirmez. Açılış bakiyesi gelir olarak sayılmaz. Eksi bakiye, eksik açılış tutarı veya eksik tahsilat kaydı olduğunu gösterebilir.</span></div><section class="panel"><div class="panel-head"><h2>Hesap Hareketleri</h2><span class="table-count">${movements.length} kayıt</span></div>${table(['Tarih', 'İşlem', 'Hesap', 'Tutar', ''], movements.map(m => `<tr class="${m.voidReason ? 'struck' : ''}"><td>${displayDate(m.date)}</td><td><strong>${esc(m.label)}</strong><span class="cell-sub">${esc(m.voidReason || m.note)}</span></td><td>${m.type === 'transfers' ? `${esc(accountName(m.fromId))} → ${esc(accountName(m.toId))}` : esc(accountName(m.accountId))}</td><td class="money ${m.type === 'transfers' ? '' : m.income ? 'positive' : 'negative'}">${m.type === 'transfers' ? '' : m.income ? '+' : '−'}${money(m.amountCents)}</td><td>${m.voidReason ? badge('İptal', 'red') : rowVoid(m.type, m.id)}</td></tr>`), empty('Bu dönemde hareket yok', 'Tahsilat, gider ve hesap transferleri burada listelenir.', '', 'bank'))}</section>`;
}
function currentReport() { return reportRows(state.data, state.reportType, state.reportMonth, state.reportType === 'expenses' ? '' : state.reportUnit); }
function reports() {
  const rows = currentReport();
  return `<section class="panel"><div class="report-filters">${selectField('Rapor türü', 'reportType', [['debts', 'Borçlu Daireler'], ['payments', 'Tahsilatlar'], ['expenses', 'Giderler'], ['balances', 'Daire Bakiyeleri']].map(([id, label]) => `<option value="${id}" ${id === state.reportType ? 'selected' : ''}>${label}</option>`).join(''), 'id="report-type"')}${field('Dönem (boş: tümü)', 'reportMonth', state.reportMonth, 'month', 'id="report-month" min="1900-01" max="2199-12"')}${selectField('Daire', 'reportUnit', unitOptions(state.reportUnit, true), `id="report-unit" ${state.reportType === 'expenses' ? 'disabled' : ''}`)}${btn('CSV İndir', 'csv', 'download')}${btn('Yazdır', 'print-report', 'print')}</div>${state.reportType === 'balances' ? '<div class="notice">Daire bakiyeleri seçilen aydan bağımsız, güncel borç ve avans tutarlarını gösterir.</div>' : ''}${table(rows[0], rows.slice(1).map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`), empty('Filtrelere uygun kayıt yok', 'Dönemi veya daire filtresini değiştirerek tekrar deneyin.', '', 'chart'))}<div class="padded muted">${rows.length - 1} kayıt · İptal edilmiş mali hareketler rapora dahil edilmez.</div></section><div class="notice">${icon('info')}<span>CSV dosyaları Excel ile açılabilir. Belirli bir dairenin tüm hareketleri için Daireler ekranındaki hesap dökümünü kullanın.</span></div>`;
}
const actionNames = { 'unit.save': 'Daire kaydedildi', 'charge.batch': 'Toplu aidat oluşturuldu', 'charge.add': 'Borç eklendi', 'payment.add': 'Tahsilat kaydedildi', 'expense.add': 'Gider kaydedildi', 'transfer.add': 'Hesap transferi', 'account.opening': 'Açılış bakiyesi değişti', 'settings.save': 'Apartman bilgileri güncellendi', 'record.void': 'Mali kayıt iptal edildi', 'backup.restore': 'Yedek geri yüklendi' };
const backupDate = value => value ? new Date(value).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}) : 'Henüz yok';
function backupPanel() {
  const info=state.data.backupInfo||{}, file=info.fileInfo||{};
  const folder=info.folderConfigured ? `<div class="backup-folder"><strong>${esc(info.folderName)} / TROCKI-Aidat-Yedekleri</strong><span class="cell-sub">${esc(file.message || 'Dosya yedeği hazırlanıyor.')} ${file.lastSavedAt ? 'Son başarılı yedek: '+backupDate(file.lastSavedAt) : ''}</span></div><div class="backup-buttons">${file.state!=='ok'?btn('Klasöre Yeniden İzin Ver','backup-permission','lock'):''}${btn('Klasörü Değiştir','backup-folder','file')}${btn('Klasör Bağlantısını Kaldır','backup-disconnect','close')}</div>` : `<p class="form-hint">${info.folderSupported ? 'Bilgisayarınızda bir klasör seçin. Program açıkken her değişiklikte son yedek ve günlük JSON dosyası bu klasöre otomatik yazılır.' : 'Bu tarayıcı klasöre otomatik yazmayı desteklemiyor. Tarayıcı içi yedek açık; dışarıda saklamak için Yedek İndir kullanın.'}</p>${info.folderSupported ? btn('Yedek Klasörü Seç','backup-folder','file',true) : ''}`;
  return `<section class="panel backup-panel"><div class="panel-head"><h2>Otomatik Yedekleme</h2>${badge('Etkin','teal')}</div><div class="panel-body"><div class="backup-summary"><span>Son tarayıcı yedeği<strong>${backupDate(info.lastSavedAt)}</strong></span><span>Yedek geçmişi<strong>${info.dailyCount||0} gün · ${info.recentCount||0} işlem</strong></span></div><p class="form-hint">Her değişiklik otomatik yedeklenir. Son 30 günlük yedek ve son 10 işlem öncesi sürüm korunur. Tarayıcı içi yedekler, site verileri temizlenirse silinir.</p>${btn('Yedek Geçmişini Aç','backup-history','clock')}<hr><h3 class="backup-subtitle">Klasöre otomatik dosya yedeği</h3>${folder}<p class="backup-footnote">Yedekler bu cihazda tutulur. Program kapalıyken zamanlanmış yedek veya bulut eşitleme yapılmaz.</p></div></section>`;
}
function showBackupHistory() {
  const rows=(state.data.backups||[]).map(b=>`<tr><td>${backupDate(b.createdAt)}<span class="cell-sub">${b.kind==='daily'?'Günlük son sürüm':'İşlem öncesi sürüm'}</span></td><td>${esc(b.reason)}<span class="cell-sub">${b.units} daire · ${b.payments} tahsilat · ${b.expenses} gider</span></td><td><div class="row-actions">${iconBtn('Yedeği indir','backup-download','download',esc(b.id))}${iconBtn('Bu yedeği geri yükle','backup-restore','refresh',esc(b.id))}</div></td></tr>`);
  showModal('Otomatik Yedek Geçmişi',`${table(['Tarih (İstanbul)','İçerik','İşlemler'],rows,empty('Henüz yedek yok','İlk kayıtla birlikte otomatik yedekler oluşturulur.'))}<div class="modal-footer">${btn('Kapat','close-modal')}</div>`,null,true);
}
function restoreHistory(id) {
  const b=state.data.backups.find(r=>r.id===id);if(!b)return;
  showModal('Otomatik Yedeği Geri Yükle',`<div class="notice warning">${icon('info')}<span>Mevcut kayıtlar seçilen sürüme dönecek. İşlem öncesinde bugünkü kayıtlarınızın otomatik kopyası saklanır.</span></div><p class="form-hint"><strong>${backupDate(b.createdAt)}</strong><br>${esc(b.reason)}<br>${b.units} daire · ${b.payments} tahsilat · ${b.expenses} gider</p>`,async()=>{await api('backups.restore',{id});await load();modal.close();shell();toast('Otomatik yedek geri yüklendi.');},false,'Geri Yükle');
}

function settings() {
  const s = state.data.settings;
  return `<div class="settings-grid"><section class="panel"><div class="panel-head"><h2>Apartman Bilgileri</h2>${icon('building')}</div><form id="settings-form">${field('Apartman adı', 'name', s.name, 'text', 'required maxlength="100"')}${field('Adres', 'address', s.address, 'text', 'maxlength="300"')}<div class="form-grid">${field('Varsayılan aylık aidat (₺)', 'monthly', numberInput(s.monthlyCents), 'text', 'required inputmode="decimal"', 'Yeni daire eklenirken önerilir.')}${field('Son ödeme günü', 'dueDay', s.dueDay, 'number', 'required min="1" max="28"', 'Her ayın 1–28. günü.')}</div><p class="form-hint">Varsayılan tutarı değiştirmek mevcut dairelerin aidatlarını değiştirmez. Daireye özel tutarı Daireler ekranından düzenleyin.</p><div class="form-error" role="alert"></div><button class="btn primary" type="submit">${icon('check')} Değişiklikleri Kaydet</button></form></section><div><section class="panel"><div class="panel-head"><h2>Erişim ve Veriler</h2>${icon('lock')}</div><div class="panel-body"><p class="form-hint">${state.passwordRequired ? 'Parola ile yönetici girişi açık. Oturumlar 8 saat sonra sona erer.' : (storageMode === 'browser' ? 'Parola yok. Kayıtlar yalnızca bu tarayıcıda saklanır; siteyi başka cihazdan açan kişi kendi boş kayıt alanını görür.' : 'Parola ile giriş kapalı. Uygulamaya ulaşan herkes kayıtları görüntüleyebilir ve değiştirebilir.')}</p>${state.passwordRequired ? btn('Parolayı Değiştir', 'password', 'lock') : ''}<hr><p class="form-hint">${storageMode === 'browser' ? 'Tarayıcı kayıtlarını temizlemek verilerinizi siler. Düzenli olarak yedek indirin. Cihaz değiştirirken yedeği yeni cihazda yükleyin. Gizli gezinme kullanmayın.' : 'Mali kayıtlarınızı JSON dosyası olarak dışa aktarabilirsiniz. Bu dosya veri incelemesi içindir; tam yedekleme adımları kurulum belgesindedir.'}</p>${btn(storageMode === 'browser' ? 'Yedek İndir' : 'Verileri Dışa Aktar', 'export', 'download')}${storageMode === 'browser' ? btn('Yedek Yükle', 'restore', 'file') + '<input type="file" id="restore-file" accept="application/json,.json" hidden>' : ''}</div></section>${storageMode === 'browser' ? backupPanel() : ''}<section class="panel"><div class="panel-head"><h2>Son İşlemler</h2><span class="muted">Son 500 işlem</span></div><div class="audit">${state.data.audit.length ? state.data.audit.map(a => `<div class="audit-item"><span>${actionNames[a.action] || esc(a.action)}</span><small>${esc(a.createdAt)}</small></div>`).join('') : '<p class="form-hint">Henüz işlem yapılmadı.</p>'}</div></section></div></div>`;
}
function bindSettings() { $('#settings-form').addEventListener('submit', async e => { e.preventDefault(); const form = e.currentTarget; await submitForm(form, async () => { const p = Object.fromEntries(new FormData(form)); await action('settings.save', { name: p.name, address: p.address, monthlyCents: parseMoney(p.monthly), dueDay: Number(p.dueDay) }); shell(); toast('Apartman bilgileri güncellendi.'); }); }); }
function showModal(title, content, handler, wide = false, submitLabel = 'Kaydet') {
  modal.className = wide ? 'modal-wide' : '';
  modal.innerHTML = `<div class="modal-head"><h2 id="modal-title">${title}</h2><button type="button" class="icon-button" data-action="close-modal" aria-label="Pencereyi kapat">${icon('close')}</button></div><div class="modal-body">${handler ? `<form id="modal-form">${content}<div class="form-error" role="alert"></div><div class="modal-footer">${btn('Vazgeç', 'close-modal')}<button type="submit" class="btn primary">${icon('check')} ${submitLabel}</button></div></form>` : content}</div>`;
  modalSubmit = handler;
  if (!modal.open) modal.showModal();
  if (handler) $('#modal-form').addEventListener('submit', async e => { e.preventDefault(); const form = e.currentTarget; await submitForm(form, async () => { await modalSubmit(Object.fromEntries(new FormData(form)), form); }); });
}
async function submitForm(form, fn) { const button = $('button[type="submit"]', form), error = $('.form-error', form); error.textContent = ''; button.disabled = true; try { await fn(); } catch (e) { error.textContent = e.message; } finally { button.disabled = false; } }
function finish(message) { modal.close(); render(); toast(message); }
function requireUnits() { if (!state.data.units.length) { toast('Önce bir daire ekleyin.', true); openUnit(); return false; } return true; }
function openUnit(id = '') {
  const u = unitBy(id) || { number: '', owner: '', resident: '', phone: '', monthlyCents: state.data.settings.monthlyCents, active: true };
  showModal(id ? 'Daireyi Düzenle' : 'Yeni Daire Ekle', `<div class="form-grid">${field('Daire numarası', 'number', u.number, 'text', 'required maxlength="20"')}${field('Aylık aidat (₺)', 'monthly', numberInput(u.monthlyCents), 'text', 'required inputmode="decimal"')}</div>${field('Malik adı soyadı', 'owner', u.owner, 'text', 'maxlength="100"')}${field('Sakin / kiracı adı soyadı', 'resident', u.resident, 'text', 'maxlength="100"')}${field('Telefon (isteğe bağlı)', 'phone', u.phone, 'tel', 'maxlength="30"')}<label class="checkbox"><input type="checkbox" name="active" ${u.active ? 'checked' : ''}>Daire aktif; toplu aidatlara dahil et</label><p class="form-hint">Arşivlenen dairelerin geçmiş kayıtları korunur. Aylık aidat değişikliği sonraki borçlandırmalarda geçerlidir.</p>`, async p => { await action('unit.save', { ...(id ? { id: Number(id) } : {}), number: p.number, owner: p.owner, resident: p.resident, phone: p.phone, monthlyCents: parseMoney(p.monthly), active: p.active === 'on' }); finish('Daire kaydedildi.'); });
}
function openBatch() {
  if (!requireUnits()) return;
  const dueDate = `${state.month}-${String(state.data.settings.dueDay).padStart(2, '0')}`;
  showModal('Aylık Aidat Oluştur', `<p class="form-hint">Her aktif daire için kayıtlı aylık aidat tutarı uygulanır. Bu dönemde zaten aidatı olan daireler tekrar borçlandırılmaz.</p><div class="form-grid">${field('Aidat dönemi', 'period', state.month, 'month', 'required min="1900-01" max="2199-12"')}${field('Son ödeme tarihi', 'dueDate', dueDate, 'date', 'required min="1900-01-01" max="2199-12-31"')}</div><div id="batch-preview"></div>`, async p => { const result = await action('charge.batch', p); state.month = p.period; finish(`${result.count} daire için ${money(result.totalCents)} aidat oluşturuldu.`); }, false, 'Aidatları Oluştur');
  const preview = () => { const month = $('[name="period"]', modal).value; const rows = state.data.units.filter(u => u.active && u.monthlyCents > 0 && !active(state.data.charges).some(c => c.kind === 'dues' && c.period === month && c.unitId === u.id)); $('#batch-preview').innerHTML = `<div class="form-total"><span>${rows.length} daire borçlandırılacak</span><strong>${money(rows.reduce((s, u) => s + u.monthlyCents, 0))}</strong></div>`; };
  $('[name="period"]', modal).addEventListener('change', preview); preview();
}
function openExtra() {
  if (!requireUnits()) return;
  showModal('Ek / Devir Borcu Ekle', `${selectField('Daire', 'unitId', unitOptions(), 'required')}${selectField('Borç türü', 'kind', '<option value="extra">Ek borç</option><option value="opening">Başlangıç / devir borcu</option>')}<div class="form-grid">${field('Tutar (₺)', 'amount', '', 'text', 'required inputmode="decimal"')}${field('Son ödeme tarihi', 'dueDate', today(), 'date', 'required')}</div>${noteField('', true)}<p class="form-hint">Bu kayıt sadece dairenin borcunu artırır, kasaya gelir yazılmaz.</p>`, async p => { await action('charge.add', { unitId: Number(p.unitId), kind: p.kind, amountCents: parseMoney(p.amount), dueDate: p.dueDate, note: p.note }); state.month = p.dueDate.slice(0, 7); finish('Borç kaydedildi.'); });
}
function openPayment(unitId = '', chargeId = '') {
  if (!requireUnits()) return;
  const requestKey = crypto.randomUUID();
  showModal('Tahsilat Ekle', `${selectField('Daire', 'unitId', unitOptions(unitId), 'required')}<div id="payment-summary"></div>${selectField('Öncelikli borç (isteğe bağlı)', 'chargeId', '<option value="">En eski borçtan başla</option>')}<div class="form-grid">${field('Tahsilat tutarı (₺)', 'amount', '', 'text', 'required inputmode="decimal"')}${field('İşlem tarihi', 'date', today(), 'date', 'required')}</div>${selectField('Ödemenin alındığı hesap', 'accountId', accountOptions(1))}${noteField()}<p class="form-hint">Kısmi ödeme kabul edilir. Borcu aşan tutar avans olarak tutulur ve sonraki borçlara uygulanır.</p>`, async p => { await action('payment.add', { unitId: Number(p.unitId), chargeId: p.chargeId ? Number(p.chargeId) : null, amountCents: parseMoney(p.amount), date: p.date, accountId: Number(p.accountId), note: p.note, requestKey }); state.month = p.date.slice(0, 7); finish('Tahsilat kaydedildi.'); });
  const update = () => { const u = unitBy($('[name="unitId"]', modal).value); $('#payment-summary').innerHTML = u ? `<div class="form-total"><span>Güncel borç: <strong>${money(u.debtCents)}</strong></span><span>Avans: <strong>${money(u.advanceCents)}</strong></span></div>` : ''; const own = active(state.data.charges).filter(c => c.unitId === u?.id && c.amountCents > c.paidCents); $('[name="chargeId"]', modal).innerHTML = '<option value="">En eski borçtan başla</option>' + own.map(c => `<option value="${c.id}" ${String(chargeId) === String(c.id) ? 'selected' : ''}>${esc(c.period || c.note)} · ${money(c.amountCents - c.paidCents)}</option>`).join(''); };
  $('[name="unitId"]', modal).addEventListener('change', update); update();
}
function openExpense() {
  showModal('Gider Ekle', `<div class="form-grid">${field('Gider tutarı (₺)', 'amount', '', 'text', 'required inputmode="decimal"')}${field('İşlem tarihi', 'date', today(), 'date', 'required')}</div>${selectField('Kategori', 'category', ['Elektrik', 'Su', 'Temizlik', 'Bakım', 'Asansör', 'Sigorta', 'Diğer'].map(s => `<option>${s}</option>`).join(''))}${selectField('Ödemenin yapıldığı hesap', 'accountId', accountOptions(1))}${noteField()}`, async p => { await action('expense.add', { amountCents: parseMoney(p.amount), date: p.date, accountId: Number(p.accountId), category: p.category, note: p.note }); state.month = p.date.slice(0, 7); finish('Gider kaydedildi.'); });
}
function openTransfer() {
  showModal('Hesaplar Arası Transfer', `${selectField('Kaynak hesap', 'fromId', accountOptions(1))}${selectField('Hedef hesap', 'toId', accountOptions(2))}<div class="form-grid">${field('Tutar (₺)', 'amount', '', 'text', 'required inputmode="decimal"')}${field('İşlem tarihi', 'date', today(), 'date', 'required')}</div>${noteField()}<p class="form-hint">Transfer yeni gelir veya gider oluşturmaz; yalnızca hesap bakiyelerini değiştirir.</p>`, async p => { await action('transfer.add', { fromId: Number(p.fromId), toId: Number(p.toId), amountCents: parseMoney(p.amount), date: p.date, note: p.note }); state.month = p.date.slice(0, 7); finish('Transfer kaydedildi.'); });
}
function openOpening(id) {
  const a = state.data.accounts.find(a => a.id === Number(id));
  showModal(`${esc(a.name)} · Açılış Bakiyesi`, `${field('Açılış bakiyesi (₺)', 'amount', numberInput(a.openingCents), 'text', 'required inputmode="decimal"')}<p class="form-hint">Mevcut hesap hareketlerinden önceki bakiye. Bu değer yeni bir gelir değildir. Değişiklik işlem geçmişine kaydedilir.</p>`, async p => { await action('account.opening', { id: Number(id), openingCents: parseMoney(p.amount, true) }); finish('Açılış bakiyesi güncellendi.'); });
}
function openVoid(type, id) {
  showModal('Mali Kaydı İptal Et', `<div class="notice warning">${icon('info')}<span>İptal edilen kayıt silinmez. Borç dağılımları ve hesap bakiyeleri yeniden hesaplanır.</span></div><label class="field">İptal gerekçesi<textarea class="control" name="reason" required maxlength="300" placeholder="Kaydı neden iptal ediyorsunuz?"></textarea></label>`, async p => { await action('record.void', { type, id: Number(id), reason: p.reason }); finish('Kayıt gerekçesiyle birlikte iptal edildi.'); }, false, 'Kaydı İptal Et');
}
function printButtons() { return `<div class="modal-footer no-print">${btn('Kapat', 'close-modal')}${btn('Yazdır / PDF', 'print', 'print', true)}</div>`; }
function receipt(id) {
  const p = state.data.payments.find(p => p.id === Number(id)); if (!p) return;
  showModal('Tahsilat Makbuzu', `<div class="receipt-header"><h3>${esc(state.data.settings.name)}</h3><p>${esc(state.data.settings.address)}</p><p>TAHSİLAT MAKBUZU · #${String(p.id).padStart(5, '0')}</p></div>${p.voidReason ? `<div class="notice warning">İPTAL EDİLDİ: ${esc(p.voidReason)}</div>` : ''}<div class="receipt-grid"><div><small>Daire</small><strong>${esc(unitLabel(p.unitId))}</strong></div><div><small>İşlem tarihi</small>${displayDate(p.date)}</div><div><small>Malik / sakin</small>${esc(unitBy(p.unitId)?.resident || unitBy(p.unitId)?.owner || '—')}</div><div><small>Ödeme hesabı</small>${esc(accountName(p.accountId))}</div></div><div class="receipt-amount">${money(p.amountCents)}</div><p class="form-hint">${esc(p.note || 'Aidat / borç tahsilatı')}</p><p class="print-note">Uygulama içi tahsilat dökümüdür. Resmi fatura yerine geçmez.<br>Döküm tarihi: ${displayDate(today())}</p>${printButtons()}`);
}
function statement(id) {
  const u = unitBy(id); if (!u) return;
  const charges = active(state.data.charges).filter(c => c.unitId === u.id), payments = active(state.data.payments).filter(p => p.unitId === u.id);
  const entries = [...charges.map(c => ({ date: c.dueDate, desc: c.kind === 'dues' ? `${c.period} aidatı` : c.note, debt: c.amountCents, paid: 0 })), ...payments.map(p => ({ date: p.date, desc: `Tahsilat #${p.id} · ${accountName(p.accountId)}`, debt: 0, paid: p.amountCents }))].sort((a, b) => a.date.localeCompare(b.date));
  let balance = 0;
  const rows = entries.map(e => { balance += e.debt - e.paid; return `<tr><td>${displayDate(e.date)}</td><td>${esc(e.desc)}</td><td>${e.debt ? money(e.debt) : '—'}</td><td>${e.paid ? money(e.paid) : '—'}</td><td>${money(balance)}</td></tr>`; });
  showModal('Daire Hesap Dökümü', `<div class="receipt-header"><h3>${esc(state.data.settings.name)}</h3><p>Daire ${esc(u.number)} · ${esc(u.resident || u.owner || '—')} · Tüm zamanlar</p></div><div class="statement-summary"><div>Güncel borç<strong>${money(u.debtCents)}</strong></div><div>Avans<strong>${money(u.advanceCents)}</strong></div></div>${table(['Tarih', 'İşlem', 'Borç', 'Ödeme', 'Net Bakiye'], rows, empty('Henüz hareket yok', 'Borç ve ödemeler eklendikçe burada görünür.'))}<p class="print-note">Borçlar son ödeme tarihine göre sıralanır. Eksi net bakiye avansı gösterir. İptaller dahil değildir.</p>${printButtons()}`, null, true);
}
function printReport() { const rows = currentReport(), name = { debts: 'Borçlu Daireler', payments: 'Tahsilatlar', expenses: 'Giderler', balances: 'Daire Bakiyeleri' }[state.reportType]; showModal('Raporu Yazdır', `<div class="receipt-header"><h3>${esc(state.data.settings.name)}</h3><p>${name} · ${state.reportMonth || 'Tüm dönemler'} · Döküm: ${displayDate(today())}</p></div>${table(rows[0], rows.slice(1).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`), '<p>Bu filtrelerle kayıt yok.</p>')}${printButtons()}`, null, true); }
function download(content, name, type) { const link = document.createElement('a'), url = URL.createObjectURL(new Blob([content], { type })); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function changePassword() { showModal('Yönetici Parolasını Değiştir', `${field('Mevcut parola', 'currentPassword', '', 'password', 'required autocomplete="current-password"')}${field('Yeni parola', 'newPassword', '', 'password', 'required minlength="12" maxlength="200" autocomplete="new-password"', 'En az 12 karakter kullanın.')}${field('Yeni parolayı tekrar girin', 'confirm', '', 'password', 'required minlength="12" autocomplete="new-password"')}`, async p => { if (p.newPassword !== p.confirm) throw new Error('Yeni parolalar eşleşmiyor.'); await api('password', { currentPassword: p.currentPassword, newPassword: p.newPassword }); modal.close(); await boot(); toast('Parola değişti. Yeni parolanızla giriş yapın.'); }); }
function authView(session) {
  const setup = session.setupRequired;
  $('#app').innerHTML = `<div class="auth-page"><section class="auth-art">${brand()}<h1>Apartmanınızın hesabı<br><em>her zaman net.</em></h1><p>Aidatlar, tahsilatlar ve giderler. Apartman yönetiminiz için ihtiyacınız olan her şey tek bir yerde.</p><div class="auth-points"><span>${icon('check')} Daire bazında borç ve ödeme takibi</span><span>${icon('check')} Güncel kasa ve banka bakiyeleri</span><span>${icon('check')} Raporlar ve hesap dökümleri</span></div><div class="auth-bottom">TEK APARTMAN · YALNIZCA YÖNETİCİ İÇİN</div></section><main class="auth-form" id="main"><div class="auth-box"><div class="eyebrow">YÖNETİCİ PANELİ</div><h2>${setup ? 'İlk kuruluma hoş geldiniz' : 'Tekrar hoş geldiniz'}</h2><p>${setup ? 'Apartman kayıtlarınızı korumak için bir yönetici parolası oluşturun.' : 'Apartmanınızı yönetmeye devam etmek için giriş yapın.'}</p>${setup && !session.setupAllowed ? '<div class="notice warning">İlk kurulum için sunucuda ADMIN_PASSWORD tanımlanmalıdır. Kurulum belgesindeki adımları izleyin.</div>' : `<form id="auth-form"><label class="field">${setup ? 'Yönetici parolası' : 'Parola'}<div class="password-wrap"><input class="control" type="password" name="password" required ${setup ? 'minlength="12"' : ''} maxlength="200" autocomplete="${setup ? 'new-password' : 'current-password'}" placeholder="${setup ? 'En az 12 karakter' : 'Parolanızı girin'}"><button type="button" class="icon-button" data-action="toggle-password" aria-label="Parolayı göster">${icon('eye')}</button></div></label>${setup ? field('Parolayı tekrar girin', 'confirm', '', 'password', 'required minlength="12" maxlength="200" autocomplete="new-password"') : ''}<div class="form-error" role="alert"></div><button class="btn primary" type="submit">${setup ? 'Parola Oluştur ve Başla' : 'Giriş Yap'} ${icon('arrow')}</button></form>`}<div class="auth-privacy">${icon('lock')} Güvenli yönetici erişimi</div><div class="auth-note">Sakin hesabı yoktur. Parolanızı unuttuysanız sunucu yöneticiniz kurulum belgesindeki parola sıfırlama adımlarını uygulayabilir.</div></div></main></div>`;
  if ($('#auth-form')) $('#auth-form').addEventListener('submit', async e => { e.preventDefault(); const form = e.currentTarget; await submitForm(form, async () => { const p = Object.fromEntries(new FormData(form)); if (setup && p.password !== p.confirm) throw new Error('Parolalar eşleşmiyor.'); const result = await api(setup ? 'setup' : 'login', { password: p.password }); state.csrf = result.csrf; await load(); state.page = pageFromHash(); shell(); }); });
}
function pageFromHash() { const p = location.hash.slice(1); return navItems.some(n => n[0] === p) ? p : 'dashboard'; }
async function importBackup(file) {
  if (!file) return;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('Yedek dosyası 10 MB sınırını aşıyor.');
    const backup = JSON.parse(await file.text());
    if (backup.backupFormat !== 'aidat-browser-v1' || !Array.isArray(backup.units)) throw new Error('Geçerli bir aidat takip yedeği seçin.');
    showModal('Yedeği Geri Yükle', `<div class="notice warning">${icon('info')}<span>Bu işlem mevcut kayıtların yerine seçilen yedeği koyar. Devam etmeden önce mevcut kayıtlarınız otomatik olarak indirilecek.</span></div><p class="form-hint">Yedek: ${esc(backup.settings?.name || 'Apartman')} · ${backup.units.length} daire · ${esc(file.name)}</p>`, async () => {
      download(JSON.stringify({exportedAt:new Date().toISOString(),...state.data},null,2), `apartman-onceki-yedek-${today()}.json`, 'application/json');
      await api('restore', {backup}); await load(); modal.close(); shell(); toast('Yedek yüklendi.');
    }, false, 'Yedeği Yükle');
  } catch (error) { toast(error instanceof SyntaxError ? 'Yedek dosyası okunamadı. Geçerli bir JSON dosyası seçin.' : error.message, true); }
}
async function boot() { try { const session = await api('session'); state.passwordRequired = session.passwordRequired !== false; state.csrf = session.csrf || ''; if (!session.authenticated) { state.data = null; authView(session); return; } await load(); state.page = pageFromHash(); shell(); } catch (e) { $('#app').innerHTML = `<div class="initial-loading"><h2>${storageMode === 'browser' ? 'Tarayıcı kayıtları açılamadı' : 'Sunucuya bağlanılamadı'}</h2><p>${esc(e.message)}</p>${btn('Tekrar Dene', 'retry', 'refresh')}</div>`; } }
function closeOpening() {
  const opening = $('#opening-splash');
  const restoreFocus = opening?.contains(document.activeElement);
  opening?.remove(); $('#app').removeAttribute('inert');
  if (restoreFocus) $('#main')?.focus();
}
function closeMenu() {
  $('.sidebar')?.classList.remove('open'); $('.nav-overlay')?.classList.remove('visible');
  const trigger = $('.mobile-menu'); if (trigger) { trigger.setAttribute('aria-expanded','false'); if (trigger.getClientRects().length) trigger.focus(); }
}
matchMedia('(min-width:960px)').addEventListener('change', () => { if ($('.sidebar.open')) closeMenu(); });
document.addEventListener('keydown', e => {
  const drawer = $('.sidebar.open'); if (!drawer || matchMedia('(min-width:960px)').matches) return;
  if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
  if (e.key !== 'Tab') return;
  const focusable = [...drawer.querySelectorAll('a[href],button:not([disabled])')], first = focusable[0], last = focusable.at(-1);
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
document.addEventListener('click', async e => {
  if (e.target.closest('.sidebar .nav a')) closeMenu();
  const button = e.target.closest('[data-action]'); if (!button) return;
  const a = button.dataset.action, id = button.dataset.id;
  try {
    switch (a) {
      case 'skip-opening': closeOpening(); break;
      case 'theme': { toggleTheme(); const next = document.createElement('template'); next.innerHTML = themeButton(); const fresh = next.content.firstElementChild; button.innerHTML = fresh.innerHTML; for (const name of ['aria-label','aria-pressed','title']) button.setAttribute(name, fresh.getAttribute(name)); break; }
      case 'unit': openUnit(id); break; case 'batch': openBatch(); break; case 'extra': openExtra(); break;
      case 'payment': openPayment(id, button.dataset.charge); break; case 'expense': openExpense(); break;
      case 'transfer': openTransfer(); break; case 'opening': openOpening(id); break; case 'void': openVoid(button.dataset.type, id); break;
      case 'receipt': receipt(id); break; case 'statement': statement(id); break; case 'close-modal': modal.close(); break;
      case 'print': window.print(); break; case 'print-report': printReport(); break;
      case 'csv': download(csv(currentReport()), `apartman-${state.reportType}-${state.reportMonth || 'tum-donemler'}.csv`, 'text/csv;charset=utf-8'); break;
      case 'export': download(JSON.stringify({ exportedAt: new Date().toISOString(), ...state.data }, null, 2), `apartman-veriler-${today()}.json`, 'application/json'); toast('Veriler dışa aktarıldı.'); break;
      case 'backup-history': showBackupHistory(); break;
      case 'backup-restore': restoreHistory(id); break;
      case 'backup-download': { const b=await api('backups.get',{id}); download(JSON.stringify(b.backup,null,2),`apartman-otomatik-yedek-${b.createdAt.replaceAll(':','-')}.json`,'application/json'); break; }
      case 'backup-folder': { if (!window.showDirectoryPicker) throw new Error('Klasöre yazma bu tarayıcıda desteklenmiyor.'); const handle=await window.showDirectoryPicker({id:'trocki-aidat-backup',mode:'readwrite',startIn:'documents'}); button.disabled=true; await api('backups.directory',{handle}); await load(); render(); toast(state.data.backupInfo?.fileInfo?.state==='ok'?'Klasöre otomatik yedekleme açıldı.':'Klasör bağlandı; yedek durumunu Ayarlar’dan kontrol edin.'); break; }
      case 'backup-permission': button.disabled=true; await api('backups.permission',{}); await load(); render(); toast('Yedek klasörü durumu güncellendi.'); break;
      case 'backup-disconnect': await api('backups.disconnect',{}); await load(); render(); toast('Klasör bağlantısı kaldırıldı. Tarayıcı içi yedekler açık.'); break;
      case 'restore': $('#restore-file').click(); break;
      case 'password': if (state.passwordRequired) changePassword(); break;
      case 'refresh': button.disabled = true; await load(); render(); toast('Veriler güncellendi.'); break;
      case 'logout': await api('logout', {}); state.data = null; await boot(); break;
      case 'menu': $('.sidebar').classList.add('open'); $('.nav-overlay').classList.add('visible'); button.setAttribute('aria-expanded','true'); $('.drawer-close').focus(); break;
      case 'close-menu': closeMenu(); break;
      case 'toggle-password': { const input = $('[name="password"]'); input.type = input.type === 'password' ? 'text' : 'password'; button.setAttribute('aria-label', input.type === 'password' ? 'Parolayı göster' : 'Parolayı gizle'); break; }
      case 'retry': await boot(); break;
    }
  } catch (err) { if (err.name === 'AbortError') return; toast(err.message, true); if (err.status === 401) { modal.close(); await boot(); } }
  finally { if (button.isConnected) button.disabled = false; }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'restore-file') { await importBackup(e.target.files[0]); e.target.value = ''; return; }
  const id = e.target.id, value = e.target.value;
  if (id === 'period-filter' && /^\d{4}-\d{2}$/.test(value)) { state.month = value; render(); }
  if (id === 'status-filter') { state.status = value; render(); }
  if (id === 'unit-filter') { state.unitFilter = value; render(); }
  if (id === 'report-type') { state.reportType = value; render(); }
  if (id === 'report-month') { state.reportMonth = value; render(); }
  if (id === 'report-unit') { state.reportUnit = value; render(); }
});
document.addEventListener('input', e => { if (e.target.id === 'search') { const position = e.target.selectionStart; state.query = e.target.value; render(); const input = $('#search'); input.focus(); input.setSelectionRange(position, position); } });
window.addEventListener('hashchange', () => { if (!state.data) return; state.page = pageFromHash(); state.query = ''; state.status = 'all'; state.unitFilter = ''; shell(); });
window.addEventListener('offline', () => toast(storageMode === 'browser' ? 'İnternet bağlantısı kesildi. Açık panelde kayıt yapmaya devam edebilirsiniz.' : 'Bağlantı kesildi. Kayıt yapmak için sunucu bağlantısı gerekiyor.', storageMode !== 'browser'));
modal.addEventListener('click', e => { if (e.target === modal) { const r = modal.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) modal.close(); } });
setTimeout(closeOpening, 1200);
await boot();
