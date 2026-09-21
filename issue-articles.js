(() => {
  function init() {
  const issueId = 'S1201-9712(26)X2009-4';
  const supabase = window.supabaseClient;
  const panel = document.createElement('section');
  panel.id = 'supabase-issue-articles';
  panel.innerHTML = `
    <style>
      #supabase-issue-articles .issue-error { color: #b42318; font-weight: 700; }
    </style>
    <div id="issue-article-results">Loading articles...</div>`;

  document.head.appendChild(panel.querySelector('style'));
  const results = panel.querySelector('#issue-article-results');
  const originalHeading = document.getElementById('OriginalReports172');
  const originalList = originalHeading?.nextElementSibling;

  function pageNumber(value) {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  }

  function renderArticle(article, pdfUrl) {
    const item = document.createElement('li');
    item.className = 'articleCitation';
    item.innerHTML = `<div class="toc__item clearfix"><div class="toc__item__prefix"><div class="input-group"><label class="checkbox--primary"><input type="checkbox" disabled><span class="label-txt"></span></label></div></div><div class="toc__item__body"><div class="row"><div class="toc__item__detials col-md-9 col-lg-10"><h3 class="toc__item__title"></h3><div class="toc__item__authors"></div><div class="toc__item__details"><div class="toc__item__pages"></div><div class="toc__articleNumber"></div></div><div class="toc__item__links"><ul class="rlist--inline download-links"><li><a class="pdfLink" target="_blank" rel="noreferrer">PDF</a></li></ul></div></div></div></div></div>`;
    item.querySelector('.toc__item__title').textContent = article.title;
    item.querySelector('.toc__item__authors').textContent = article.authors || 'Authors not provided';
    item.querySelector('.toc__item__pages').textContent = `Page ${article.page_number || 'N/A'} | Order ${article.order_number ?? 0}`;
    item.querySelector('.toc__articleNumber').textContent = article.article_type || 'Article';
    const link = item.querySelector('.pdfLink');
    if (pdfUrl) link.href = pdfUrl;
    else { link.textContent = 'PDF unavailable'; link.removeAttribute('href'); }
    return item;
  }

  async function loadIssueArticles() {
    if (!supabase) {
      results.textContent = 'Supabase is not configured.';
      results.className = 'issue-error';
      return;
    }

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('issue', issueId)
      .order('order_number', { ascending: true });

    if (error) {
      results.textContent = error.message;
      results.className = 'issue-error';
      return;
    }

    const articles = (data || []).sort((a, b) => {
      const orderDiff = Number(a.order_number || 0) - Number(b.order_number || 0);
      return orderDiff || pageNumber(a.page_number) - pageNumber(b.page_number);
    });
    if (!articles.length) {
      results.textContent = 'No Supabase articles have been uploaded for this issue yet.';
      return;
    }

    results.remove();
    if (!originalList) return;
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
