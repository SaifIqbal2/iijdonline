(() => {
  function init() {
    const articlePii = 'S1201-9712(26)00706-X';
    const supabase = window.supabaseClient;
    const article = document.querySelector(`article[data-pii="${articlePii}"]`);
    if (!article || !supabase) return;

    supabase.from('articles').select('*').eq('article_pii', articlePii).maybeSingle().then(async ({ data, error }) => {
      if (!data && !error) {
        const fallback = await supabase.from('articles').select('*').eq('issue', 'S1201-9712(26)X2009-4').eq('order_number', 1).limit(1).maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }
      if (error || !data) return;
      let pdfUrl = '';
      if (data.pdf_path) {
        const signed = await supabase.storage.from('article-pdfs').createSignedUrl(data.pdf_path, 86400);
        pdfUrl = signed.data?.signedUrl || '';
      }
      const highlights = String(data.highlights || '').split(/\r?\n|\|/).map((value) => value.trim()).filter(Boolean);
      const keywords = String(data.keywords || '').split(',').map((value) => value.trim()).filter(Boolean);
      article.innerHTML = `
        <style>
          .supabase-preview { max-width: 900px; margin: 0 auto; padding: 28px 0 60px; color: #1d2a39; }
          .supabase-preview .preview-meta { color: #526477; font-size: .95rem; margin-bottom: 12px; }
          .supabase-preview h1 { color: #164f73; font-size: 2rem; line-height: 1.2; margin: 12px 0; }
          .supabase-preview h2 { color: #164f73; margin: 28px 0 10px; }
          .supabase-preview .preview-authors { font-weight: 600; margin: 12px 0 24px; }
          .supabase-preview .preview-abstract { line-height: 1.7; white-space: pre-line; }
          .supabase-preview .preview-keywords { color: #526477; }
          .supabase-preview .preview-pdf { display: inline-block; margin-top: 22px; padding: 11px 16px; background: #17618b; color: #fff; text-decoration: none; font-weight: 700; }
          .supabase-preview ul { line-height: 1.7; }
        </style>
        <div class="supabase-preview"><div class="preview-meta">${data.article_type || 'Article'} | Volume ${data.volume || 'N/A'} | Issue ${data.issue || 'N/A'}</div><h1>${data.title}</h1><p class="preview-authors">${data.authors || 'Authors not provided'}</p><div class="preview-meta">Page ${data.page_number || 'N/A'} | Order ${data.order_number ?? 0} | Published ${data.published_at || 'Date not set'}</div><h2>Abstract</h2><div class="preview-abstract">${data.abstract || 'No abstract available.'}</div>${highlights.length ? `<h2>Highlights</h2><ul>${highlights.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}${keywords.length ? `<h2>Keywords</h2><p class="preview-keywords">${keywords.join(', ')}</p>` : ''}${pdfUrl ? `<a class="preview-pdf" href="${pdfUrl}" target="_blank" rel="noreferrer">Open PDF</a>` : ''}</div>`;
    });
  }
  window.addEventListener('load', init);
})();
