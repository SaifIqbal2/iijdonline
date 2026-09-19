const supabase = window.supabaseClient;
const articleList = document.getElementById('article-list');
const articleFilter = document.getElementById('article-filter');
const articleStatus = document.getElementById('article-status');

const sectionLabels = {
  inpress: 'Articles in Press',
  inprogress: 'In Progress',
  current: 'Current Issue',
  archive: 'Archive'
};

function parsePageNumber(value) {
  if (!value && value !== 0) return Number.MAX_SAFE_INTEGER;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortArticles(articles) {
  return [...articles].sort((a, b) => {
    const pageDiff = parsePageNumber(a.page_number) - parsePageNumber(b.page_number);
    if (pageDiff !== 0) return pageDiff;
    return Number(a.order_number || 0) - Number(b.order_number || 0) ||
      new Date(b.published_at || 0) - new Date(a.published_at || 0);
  });
}

async function loadArticlePdfUrl(pdfPath) {
  if (!pdfPath) return '#';
  const { data, error } = await supabase.storage.from('article-pdfs').createSignedUrl(pdfPath, 86400);
  return error || !data?.signedUrl ? '#' : data.signedUrl;
}

function renderArticleCard(article) {
  const card = document.createElement('article');
  card.className = 'article-card';
  const published = article.published_at
    ? new Date(article.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Date not set';
  card.innerHTML = `
    <div class="article-meta-row"><span class="article-type">${article.article_type || 'Article'}</span><span class="article-section">${sectionLabels[article.section] || article.section}</span></div>
    <h3>${article.title}</h3>
    <p class="article-authors">${article.authors || 'Authors not provided'}</p>
    <p class="article-date">Published: ${published}</p>
    <p class="article-summary">${article.abstract || 'No abstract available.'}</p>
    <div class="article-meta-boxes"><span>Page: ${article.page_number || 'N/A'}</span><span>Order: ${article.order_number ?? 0}</span><span>Volume: ${article.volume || 'N/A'}</span><span>Issue: ${article.issue || 'N/A'}</span></div>
    <div class="article-actions"><a href="#" class="article-link" target="_blank" rel="noreferrer">Open PDF</a></div>`;
  return card;
}

async function renderArticles() {
  const { data, error } = await supabase.from('articles').select('*');
  if (error) {
    articleList.innerHTML = '<p class="empty-state">Unable to load articles from Supabase.</p>';
    articleStatus.textContent = error.message;
    return;
  }

  const selectedSection = articleFilter.value;
  const grouped = { inpress: [], inprogress: [], current: [], archive: [] };
  for (const article of sortArticles(data || [])) {
    const key = Object.prototype.hasOwnProperty.call(grouped, article.section) ? article.section : 'archive';
    if (!selectedSection || selectedSection === key) grouped[key].push(article);
  }

  articleList.innerHTML = '';
  let hasAny = false;
  for (const [key, label] of Object.entries(sectionLabels)) {
    if (!grouped[key].length) continue;
    hasAny = true;
    const section = document.createElement('section');
    section.className = 'article-section';
    section.innerHTML = `<h2>${label}</h2>`;
    const fragment = document.createDocumentFragment();
    for (const article of grouped[key]) {
      const card = renderArticleCard(article);
      const link = card.querySelector('.article-link');
      const signedUrl = await loadArticlePdfUrl(article.pdf_path);
      if (signedUrl !== '#') link.href = signedUrl;
      else { link.textContent = 'PDF unavailable'; link.removeAttribute('href'); link.classList.add('disabled'); }
      fragment.appendChild(card);
    }
    section.appendChild(fragment);
    articleList.appendChild(section);
  }
  if (!hasAny) articleList.innerHTML = '<p class="empty-state">No articles found for this section yet.</p>';
  articleStatus.textContent = `${(data || []).length} article(s) loaded.`;
}

articleFilter.addEventListener('change', renderArticles);
renderArticles();
