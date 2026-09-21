(() => {
  function init() {
  const issueId = 'S1201-9712(26)X2009-4';
  const supabase = window.supabaseClient;
  const panel = document.createElement('section');
  panel.id = 'supabase-issue-articles';
  panel.innerHTML = `
    <style>
      #supabase-issue-articles { max-width: 1100px; margin: 28px auto; padding: 24px; background: #f4f7fb; border: 1px solid #dce5ef; font-family: Arial, sans-serif; }
      #supabase-issue-articles h2 { margin: 0 0 8px; color: #164f73; }
      #supabase-issue-articles .issue-meta { color: #5b6b7a; margin: 0 0 20px; }
      #supabase-issue-articles .issue-article { background: #fff; border: 1px solid #dce5ef; padding: 16px; margin-top: 12px; }
      #supabase-issue-articles .issue-article h3 { margin: 0 0 8px; color: #164f73; }
      #supabase-issue-articles .issue-article p { margin: 6px 0; color: #425466; }
      #supabase-issue-articles a { color: #12618d; font-weight: 700; }
      #supabase-issue-articles .issue-error { color: #b42318; font-weight: 700; }
    </style>
    <h2>Articles for this issue</h2>
    <p class="issue-meta">${issueId}</p>
    <div id="issue-article-results">Loading articles...</div>`;

  document.body.insertBefore(panel, document.body.firstChild);
  const results = panel.querySelector('#issue-article-results');

  function pageNumber(value) {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  }

  function renderArticle(article, pdfUrl) {
    const item = document.createElement('article');
    item.className = 'issue-article';
    const title = document.createElement('h3');
    title.textContent = article.title;
    const authors = document.createElement('p');
    authors.textContent = article.authors || 'Authors not provided';
    const details = document.createElement('p');
    details.textContent = `Page: ${article.page_number || 'N/A'} | Order: ${article.order_number ?? 0}`;
    item.append(title, authors, details);
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = 'Open PDF';
      item.appendChild(link);
    }
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

    results.textContent = '';
    const articles = (data || []).sort((a, b) => {
      const orderDiff = Number(a.order_number || 0) - Number(b.order_number || 0);
      return orderDiff || pageNumber(a.page_number) - pageNumber(b.page_number);
    });
    if (!articles.length) {
      results.textContent = 'No Supabase articles have been uploaded for this issue yet.';
      return;
    }

    for (const article of articles) {
      let pdfUrl = '';
      if (article.pdf_path) {
        const signed = await supabase.storage.from('article-pdfs').createSignedUrl(article.pdf_path, 86400);
        pdfUrl = signed.data?.signedUrl || '';
      }
      results.appendChild(renderArticle(article, pdfUrl));
    }
  }

  loadIssueArticles();
  }

  window.addEventListener('load', init);
})();
