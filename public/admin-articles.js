(() => {
const supabase = window.supabaseClient;
const loginForm = document.getElementById('admin-login-form');
const articleForm = document.getElementById('article-form');
const authStatus = document.getElementById('auth-status');
const logoutBtn = document.getElementById('logout-btn');
const formStatus = document.getElementById('form-status');
const sessionPanel = document.getElementById('session-panel');
const loginPanel = document.getElementById('login-panel');
const articlesPanel = document.getElementById('articles-panel');
const adminArticleList = document.getElementById('admin-article-list');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveArticleBtn = document.getElementById('save-article-btn');
let editingArticleId = null;

function setVisible(element, visible) {
  element.hidden = !visible;
  element.classList.toggle('hidden', !visible);
}

function showStatus(element, message, type = 'info') {
  element.textContent = message;
  element.className = `status status-${type}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(value) {
  return String(value || 'article')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 55) || 'article';
}

function resetArticleForm() {
  editingArticleId = null;
  articleForm.reset();
  document.getElementById('article-pii').value = 'S1201-9712(26)00706-X';
  document.getElementById('issue').value = 'S1201-9712(26)X2009-4';
  saveArticleBtn.textContent = 'Save article';
  setVisible(cancelEditBtn, false);
}

function startEditing(article) {
  editingArticleId = article.id;
  for (const [field, value] of Object.entries({
    'article-title': article.title, 'article-pii': article.article_pii,
    'article-authors': article.authors, 'article-type': article.article_type,
    'article-section': article.section, 'order-number': article.order_number,
    'page-number': article.page_number, volume: article.volume, issue: article.issue,
    doi: article.doi, 'published-at': article.published_at,
    'article-abstract': article.abstract, 'article-highlights': article.highlights,
    'article-keywords': article.keywords
  })) document.getElementById(field).value = value ?? '';
  saveArticleBtn.textContent = 'Update article';
  setVisible(cancelEditBtn, true);
  document.getElementById('article-title').focus();
}

async function loadAdminArticles() {
  const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
  if (error) { adminArticleList.innerHTML = `<p class="status status-error">${escapeHtml(error.message)}</p>`; return; }
  adminArticleList.innerHTML = '';
  if (!data?.length) { adminArticleList.innerHTML = '<p class="meta-text">No uploaded articles yet.</p>'; return; }
  for (const article of data) {
    const item = document.createElement('article');
    item.className = 'article-admin-item';
    item.innerHTML = `<h3></h3><p class="article-admin-meta"></p><div class="article-admin-actions"><button type="button" class="button secondary edit-article">Edit</button><button type="button" class="button secondary delete-article">Delete</button></div>`;
    item.querySelector('h3').textContent = article.title;
    item.querySelector('.article-admin-meta').textContent = `${article.article_pii || 'No PII'} | Issue: ${article.issue || 'N/A'} | Order: ${article.order_number ?? 0} | Page: ${article.page_number || 'N/A'}`;
    item.querySelector('.edit-article').addEventListener('click', () => startEditing(article));
    item.querySelector('.delete-article').addEventListener('click', async () => {
      if (!window.confirm(`Delete "${article.title}"?`)) return;
      const { error: deleteError } = await supabase.from('articles').delete().eq('id', article.id);
      if (deleteError) { showStatus(formStatus, deleteError.message, 'error'); return; }
      if (article.pdf_path) await supabase.storage.from('article-pdfs').remove([article.pdf_path]);
      if (editingArticleId === article.id) resetArticleForm();
      showStatus(formStatus, 'Article deleted successfully.', 'success');
      await loadAdminArticles();
    });
    adminArticleList.appendChild(item);
  }
}

async function refreshSessionUi() {
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = Boolean(session);

  setVisible(sessionPanel, isLoggedIn);
  setVisible(articleForm, isLoggedIn);
  setVisible(articlesPanel, isLoggedIn);
  setVisible(loginPanel, !isLoggedIn);
  setVisible(logoutBtn, isLoggedIn);

  if (session) {
    authStatus.textContent = `Signed in as ${session.user.email}`;
    authStatus.className = 'status status-success';
    await loadAdminArticles();
  } else {
    authStatus.textContent = 'Sign in to upload an article.';
    authStatus.className = 'status status-info';
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showStatus(authStatus, 'Enter both email and password.', 'error');
    return;
  }

  showStatus(authStatus, 'Signing in...', 'info');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showStatus(authStatus, error.message, 'error');
    return;
  }

  if (data?.session) {
    await refreshSessionUi();
    showStatus(authStatus, `Signed in as ${data.session.user.email}`, 'success');
  }
});

logoutBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    showStatus(authStatus, error.message, 'error');
    return;
  }

  showStatus(authStatus, 'Signed out successfully.', 'success');
  await refreshSessionUi();
});

articleForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    showStatus(formStatus, 'Please sign in before uploading.', 'error');
    return;
  }

  const title = document.getElementById('article-title').value.trim();
  const articlePii = document.getElementById('article-pii').value.trim();
  const authors = document.getElementById('article-authors').value.trim();
  const articleType = document.getElementById('article-type').value.trim();
  const abstract = document.getElementById('article-abstract').value.trim();
  const highlights = document.getElementById('article-highlights').value.trim();
  const keywords = document.getElementById('article-keywords').value.trim();
  const section = document.getElementById('article-section').value;
  const orderNumber = Number(document.getElementById('order-number').value || 0);
  const pageNumber = document.getElementById('page-number').value.trim();
  const volume = document.getElementById('volume').value.trim();
  const issue = document.getElementById('issue').value.trim();
  const doi = document.getElementById('doi').value.trim();
  const publishedAt = document.getElementById('published-at').value || null;
  const pdfFile = document.getElementById('pdf-file').files[0];

  if (!title || !articlePii || !authors || !section || (!editingArticleId && !pdfFile)) {
    showStatus(formStatus, 'Title, article PII, authors, section, and PDF are required for new articles.', 'error');
    return;
  }

  let pdfPath = null;
  if (pdfFile) {
    const extension = pdfFile.name.split('.').pop() || 'pdf';
    pdfPath = `${Date.now()}-${slugify(title)}.${extension}`;
    showStatus(formStatus, 'Uploading PDF to storage...', 'info');
    const { error: uploadError } = await supabase.storage.from('article-pdfs').upload(pdfPath, pdfFile, {
      cacheControl: '3600', upsert: false, contentType: pdfFile.type || 'application/pdf'
    });
    if (uploadError) { showStatus(formStatus, uploadError.message, 'error'); return; }
  }

  const articleValues = {
    title,
    article_pii: articlePii,
    authors,
    article_type: articleType,
    abstract,
    highlights,
    keywords,
    section,
    order_number: orderNumber,
    page_number: pageNumber,
    volume,
    issue,
    doi,
    published_at: publishedAt,
    created_by: session.user.id
  };
  if (pdfPath) articleValues.pdf_path = pdfPath;
  const result = editingArticleId
    ? await supabase.from('articles').update(articleValues).eq('id', editingArticleId).select().single()
    : await supabase.from('articles').insert({ ...articleValues, pdf_path: pdfPath }).select().single();
  const row = result.data;
  const insertError = result.error;

  if (insertError) {
    const message = insertError.message.includes('row-level security policy')
      ? 'This account is not an active admin. Run the admin activation SQL in Supabase, then sign in again.'
      : insertError.message;
    showStatus(formStatus, message, 'error');
    return;
  }

  const wasEditing = Boolean(editingArticleId);
  resetArticleForm();
  showStatus(formStatus, `${wasEditing ? 'Article updated' : 'Article saved'} successfully: ${escapeHtml(row.title)}`, 'success');
  await loadAdminArticles();
});

cancelEditBtn.addEventListener('click', resetArticleForm);

refreshSessionUi();
})();
