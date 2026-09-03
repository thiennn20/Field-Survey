// Giao diện và kết nối IndexedDB
const form = document.getElementById('survey-form');
const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');
const pendingCount = document.getElementById('pending-count');
const surveyList = document.getElementById('survey-list');
const searchInput = document.getElementById('survey-search');
const successMessage = document.getElementById('success-message');
let surveysCache = [];

const emptyIcon = '<span class="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 5h6M9 9h6M9 13h4"/><rect x="5" y="3" width="14" height="18" rx="2"/></svg></span>';
const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function loadSurveys() {
  return getAllSurveys().then(saved => {
    surveysCache = saved.sort((a, b) => Number(b.id) - Number(a.id));
    applySearch();
    updateDashboard(surveysCache.length);
  }).catch(error => console.error('Lỗi khi tải khảo sát:', error));
}
loadSurveys();

form.addEventListener('submit', event => {
  event.preventDefault(); clearErrors();
  const fullName = document.getElementById('fullName').value.trim();
  const area = document.getElementById('area').value;
  const category = document.getElementById('category').value.trim();
  const rating = document.getElementById('rating').value;
  const comment = document.getElementById('comment').value.trim();
  let isValid = true;
  if (!fullName) { showError('fullName'); isValid = false; }
  if (!area) { showError('area'); isValid = false; }
  if (!category) { showError('category'); isValid = false; }
  if (!rating) { showError('rating'); isValid = false; }
  if (!comment) { showError('comment'); isValid = false; }
  if (!isValid) { form.querySelector('.form-group.error input, .form-group.error select, .form-group.error textarea')?.focus(); return; }
  const newSurvey = {id:Date.now().toString(), fullName, area, category, rating, comment, timestamp:new Date().toLocaleString('vi-VN')};
  addSurvey(newSurvey).then(() => addPendingSurvey(newSurvey)).then(() => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-surveys')).catch(error => { console.warn('[App] Background Sync không khả dụng:', error); syncNow(); });
    else syncNow();
    return loadSurveys();
  }).then(() => { successMessage.classList.remove('hidden'); setTimeout(() => successMessage.classList.add('hidden'), 3000); form.reset(); }).catch(error => console.error('Lỗi khi lưu khảo sát:', error));
});

function showError(fieldId) { const field = document.getElementById(fieldId); field.closest('.form-group').classList.add('error'); field.setAttribute('aria-invalid', 'true'); }
function clearErrors() { document.querySelectorAll('.form-group.error').forEach(group => group.classList.remove('error')); form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid')); }
function applySearch() { const query = searchInput.value.trim().toLocaleLowerCase('vi'); const filtered = query ? surveysCache.filter(survey => [survey.fullName,survey.area,survey.category,survey.rating,survey.comment].some(value => String(value ?? '').toLocaleLowerCase('vi').includes(query))) : surveysCache; renderSurveys(filtered, Boolean(query)); }
searchInput.addEventListener('input', applySearch);

function renderSurveys(surveys, isSearching = false) {
  if (!surveys.length) {
    surveyList.innerHTML = `<div class="empty-state${isSearching ? ' no-results' : ''}">${emptyIcon}<h3>${isSearching ? 'Không tìm thấy kết quả' : 'Chưa có khảo sát'}</h3><p>${isSearching ? 'Hãy thử một từ khóa khác.' : 'Các khảo sát được tạo sẽ xuất hiện tại đây.'}</p>${isSearching ? '' : '<button class="btn-primary" type="button" data-focus-form><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Tạo khảo sát đầu tiên</button>'}</div>`; return;
  }
  const classes = {'Rất tốt':'rating-rtot','Tốt':'rating-tot','Trung bình':'rating-tb','Kém':'rating-kem','Rất kém':'rating-rkem'};
  surveyList.innerHTML = surveys.map(survey => `<article class="survey-card"><div class="survey-header"><div class="survey-user">${escapeHTML(survey.fullName)}</div><time class="survey-time">${escapeHTML(survey.timestamp)}</time></div><div class="survey-details"><div class="detail-item"><span>Khu vực</span><span>${escapeHTML(survey.area)}</span></div><div class="detail-item"><span>Hạng mục</span><span>${escapeHTML(survey.category)}</span></div></div><div class="survey-rating ${classes[survey.rating] || 'rating-tb'}">${escapeHTML(survey.rating)}</div><div class="survey-comment">${escapeHTML(survey.comment)}</div><button class="btn-delete" type="button" data-delete-id="${escapeHTML(survey.id)}" aria-label="Xóa khảo sát của ${escapeHTML(survey.fullName)}"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>Xóa khảo sát</button></article>`).join('');
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-focus-form]')) { document.getElementById('create-survey').scrollIntoView({behavior:'smooth',block:'start'}); setTimeout(() => document.getElementById('fullName').focus(), 350); }
  const deleteButton = event.target.closest('[data-delete-id]'); if (deleteButton) deleteSurvey(deleteButton.dataset.deleteId);
});
window.deleteSurvey = function(id) { if (!confirm('Bạn có chắc chắn muốn xóa khảo sát này?')) return; deleteSurveyFromDB(id).then(loadSurveys).catch(error => console.error('Lỗi khi xóa khảo sát:', error)); };
function updateDashboard(total) { const completed = total; totalCount.textContent = total; completedCount.textContent = completed; pendingCount.textContent = Math.max(total - completed, 0); }
function syncNow() { const MOCK_API = 'https://jsonplaceholder.typicode.com/posts'; getAllPendingSurveys().then(items => Promise.all(items.map(survey => fetch(MOCK_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(survey)}).then(response => response.json()).then(() => deletePendingSurvey(survey.id)).catch(error => console.warn('[Sync] Gửi thất bại:', error.message))))); }
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.error('[App] Đăng ký SW thất bại:', error)));
let deferredPrompt; const installBtn = document.getElementById('btn-install');
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; installBtn.classList.remove('hidden'); });
installBtn.addEventListener('click', async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; installBtn.classList.add('hidden'); });
window.addEventListener('appinstalled', () => installBtn.classList.add('hidden'));
