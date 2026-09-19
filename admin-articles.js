const supabase = window.supabaseClient;
const loginForm = document.getElementById('admin-login-form');
const articleForm = document.getElementById('article-form');
const authStatus = document.getElementById('auth-status');
const logoutBtn = document.getElementById('logout-btn');
const formStatus = document.getElementById('form-status');
const sessionPanel = document.getElementById('session-panel');

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

async function refreshSessionUi() {
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = Boolean(session);

  sessionPanel.hidden = !isLoggedIn;
  articleForm.hidden = !isLoggedIn;
  loginForm.hidden = isLoggedIn;
  logoutBtn.hidden = !isLoggedIn;

  if (session) {
    authStatus.textContent = `Signed in as ${session.user.email}`;
    authStatus.className = 'status status-success';
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
  const authors = document.getElementById('article-authors').value.trim();
  const articleType = document.getElementById('article-type').value.trim();
  const abstract = document.getElementById('article-abstract').value.trim();
  const section = document.getElementById('article-section').value;
  const orderNumber = Number(document.getElementById('order-number').value || 0);
  const pageNumber = document.getElementById('page-number').value.trim();
  const volume = document.getElementById('volume').value.trim();
  const issue = document.getElementById('issue').value.trim();
  const doi = document.getElementById('doi').value.trim();
  const publishedAt = document.getElementById('published-at').value || null;
  const pdfFile = document.getElementById('pdf-file').files[0];

  if (!title || !authors || !section || !pdfFile) {
    showStatus(formStatus, 'Title, authors, section, and PDF are required.', 'error');
    return;
  }

  const extension = pdfFile.name.split('.').pop() || 'pdf';
  const safeFileName = `${Date.now()}-${slugify(title)}.${extension}`;

  showStatus(formStatus, 'Uploading PDF to storage...', 'info');

  const { error: uploadError } = await supabase.storage
    .from('article-pdfs')
    .upload(safeFileName, pdfFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: pdfFile.type || 'application/pdf'
    });

  if (uploadError) {
    showStatus(formStatus, uploadError.message, 'error');
    return;
  }

  const { data: row, error: insertError } = await supabase.from('articles').insert({
    title,
    authors,
    article_type: articleType,
    abstract,
    section,
    order_number: orderNumber,
    page_number: pageNumber,
    volume,
    issue,
    doi,
    pdf_path: safeFileName,
    published_at: publishedAt,
    created_by: session.user.id
  }).select().single();

  if (insertError) {
    showStatus(formStatus, insertError.message, 'error');
    return;
  }

  articleForm.reset();
  showStatus(formStatus, `Article saved successfully: ${escapeHtml(row.title)}`, 'success');
  await refreshSessionUi();
});

refreshSessionUi();
