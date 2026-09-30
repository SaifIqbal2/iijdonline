(() => {
  function init() {
  // Extract issueId from URL, fallback to default if not found
  const pathMatch = window.location.pathname.match(/\/issue\/([^\.]+)/);
  const issueId = pathMatch ? pathMatch[1] : 'S1201-9712(26)X2009-4';
  const supabase = window.supabaseClient;
  console.log('[issue-articles] pathname:', window.location.pathname);
  console.log('[issue-articles] issueId:', issueId);
  console.log('[issue-articles] supabaseClient:', supabase ? 'LOADED' : 'NOT LOADED');
  const panel = document.createElement('section');
  panel.id = 'supabase-issue-articles';
  panel.innerHTML = `
    <style>
      #supabase-issue-articles .issue-error { color: #b42318; font-weight: 700; }
    </style>
    <div id="issue-article-results">Loading articles...</div>`;

  document.head.appendChild(panel.querySelector('style'));
  const results = panel.querySelector('#issue-article-results');
  let originalHeading = document.querySelector('h2.toc__heading__header');
  let originalList = originalHeading ? originalHeading.nextElementSibling : null;
  
  if (!originalList) {
    const tocBody = document.querySelector('.table-of-content__body');
    if (tocBody) {
      originalList = document.createElement('ul');
      originalList.className = 'toc__body rlist clearfix';
      tocBody.prepend(originalList);
    }
  }

  function pageNumber(value) {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  }

  function renderArticle(article, pdfUrl) {
    const item = document.createElement('li');
    item.className = 'articleCitation';
    item.innerHTML = `<div class="toc__item clearfix"><div class="toc__item__prefix"><div class="input-group"><label class="checkbox--primary"><input type="checkbox" disabled><span class="label-txt"></span></label></div></div><div class="toc__item__body"><div class="row"><div class="toc__item__cover col-md-3 col-lg-2 hidden-xs hidden-sm hidden-md"><img src="./S1201-9712(26)X2009-4_files/gr1.sml" loading="lazy" alt=""></div><div class="toc__item__detials col-md-9 col-lg-10"><h3 class="toc__item__title"></h3><div class="toc__item__authors"></div><div class="toc__item__details"><div class="toc__item__date"></div><div class="toc__item__pages"></div><div class="toc__articleNumber"></div></div><div class="toc__item__links"><ul class="rlist--inline download-links"><li><a class="pdfLink" target="_blank" rel="noreferrer">PDF</a></li></ul></div></div></div></div></div>`;
    const titleLink = item.querySelector('.toc__item__title');
    titleLink.textContent = article.title;
    titleLink.innerHTML = '';
    const titleAnchor = document.createElement('a');
    titleAnchor.href = `/article/S1201-9712(26)00706-X/fulltext.html?pii=${encodeURIComponent(article.article_pii || 'S1201-9712(26)00706-X')}`;
    titleAnchor.textContent = article.title;
    titleLink.appendChild(titleAnchor);
    item.querySelector('.toc__item__authors').textContent = article.authors || 'Authors not provided';
    item.querySelector('.toc__item__date').textContent = article.published_at ? `Published online: ${new Date(article.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}` : '';
    item.querySelector('.toc__item__pages').textContent = '';
    item.querySelector('.toc__articleNumber').textContent = article.article_type || 'Article';
    const link = item.querySelector('.pdfLink');
    if (pdfUrl) link.href = pdfUrl;
    else { link.textContent = 'PDF unavailable'; link.removeAttribute('href'); }
    return item;
  }

  async function loadIssueArticles() {
    if (!supabase) {
      console.error('[issue-articles] Supabase not configured!');
      results.textContent = 'Supabase is not configured.';
      results.className = 'issue-error';
      return;
    }

    console.log('[issue-articles] Querying Supabase for issue:', issueId);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('issue', issueId)
      .order('order_number', { ascending: true });

    console.log('[issue-articles] Query result - data:', data, 'error:', error);

    if (error) {
      console.error('[issue-articles] Query error:', error.message);
      results.textContent = error.message;
      results.className = 'issue-error';
      return;
    }

    const articles = (data || []).sort((a, b) => {
      const orderDiff = Number(a.order_number || 0) - Number(b.order_number || 0);
      return orderDiff || pageNumber(a.page_number) - pageNumber(b.page_number);
    });
    console.log('[issue-articles] Found', articles.length, 'articles for issueId:', issueId);
    if (!articles.length) {
      console.warn('[issue-articles] No articles found for issue:', issueId);
      results.textContent = 'No articles uploaded for issue: ' + issueId;
      // Show in page for debugging
      const tocBody = document.querySelector('.table-of-content__body');
      if (tocBody) tocBody.prepend(results);
      return;
    }

    results.remove();
    if (!originalList) {
      console.error('[issue-articles] originalList not found in DOM!');
      return;
    }
    const fragment = document.createDocumentFragment();

    for (const article of articles) {
      let pdfUrl = '';
      if (article.pdf_path) {
        const signed = await supabase.storage.from('article-pdfs').createSignedUrl(article.pdf_path, 86400);
        pdfUrl = signed.data?.signedUrl || '';
      }
      fragment.appendChild(renderArticle(article, pdfUrl));
    }
    originalList.prepend(fragment);
  }

  loadIssueArticles();
  }

  window.addEventListener('load', init);
})();
