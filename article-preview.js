(() => {
  const root = document.getElementById('article-preview');
  const supabase = window.supabaseClient;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const articlePii = decodeURIComponent(parts[1] || '');
  if (!root || !supabase || !articlePii) return;

  supabase.from('articles').select('*').eq('article_pii', articlePii).maybeSingle().then(async ({ data, error }) => {
    if (error || !data) {
      root.textContent = error?.message || 'Article not found.';
      root.classList.add('error');
      return;
    }

    let pdfUrl = '';
    if (data.pdf_path) {
      const signed = await supabase.storage.from('article-pdfs').createSignedUrl(data.pdf_path, 86400);
      pdfUrl = signed.data?.signedUrl || '';
    }

    const highlights = String(data.highlights || '').split(/\r?\n|\|/).map((value) => value.trim()).filter(Boolean);
    const keywords = String(data.keywords || '').split(',').map((value) => value.trim()).filter(Boolean);

    root.innerHTML = `<div class="preview-meta">${data.article_type || 'Article'} | Volume ${data.volume || 'N/A'} | Issue ${data.issue || 'N/A'}</div><h1></h1><p class="preview-authors"></p><div class="preview-meta">Published online: ${data.published_at || 'Date not set'}</div><h2>Abstract</h2><div class="preview-abstract"></div>${highlights.length ? '<h2>Highlights</h2><ul class="preview-highlights"></ul>' : ''}${keywords.length ? '<h2>Keywords</h2><p class="preview-keywords"></p>' : ''}${pdfUrl ? `<a class="preview-pdf" href="${pdfUrl}" target="_blank" rel="noreferrer">Open PDF</a>` : ''}`;
    root.querySelector('h1').textContent = data.title;
    root.querySelector('.preview-authors').textContent = data.authors || 'Authors not provided';
    root.querySelector('.preview-abstract').textContent = data.abstract || 'No abstract available.';
    if (highlights.length) highlights.forEach((value) => { const item = document.createElement('li'); item.textContent = value; root.querySelector('.preview-highlights').appendChild(item); });
    if (keywords.length) root.querySelector('.preview-keywords').textContent = keywords.join(', ');
    document.title = data.title;
  });
})();
