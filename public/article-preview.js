(() => {
  const supabase = window.supabaseClient;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const articlePii = new URLSearchParams(window.location.search).get('pii') || decodeURIComponent(parts[1] || '');
  const root = document.getElementById('article-preview') || document.querySelector(`article[data-pii="${articlePii}"]`);
  if (!root || !supabase || !articlePii) return;
  const issueStyle = document.createElement('style');
  issueStyle.textContent = '.supabase-issue-list{max-width:900px;margin:28px auto;padding:24px;border-top:1px solid #dce5ef;font-family:Arial,sans-serif}.supabase-issue-list h2{color:#164f73}.issue-list-item{padding:14px 0;border-bottom:1px solid #dce5ef}.issue-list-item h3{margin:0 0 6px}.issue-list-item a{color:#12618d}.issue-list-item p,.issue-list-item span{display:block;margin:4px 0;color:#526477}';
  document.head.appendChild(issueStyle);

  supabase.from('articles').select('*').eq('article_pii', articlePii).maybeSingle().then(async ({ data, error }) => {
    if (!data && !error && articlePii === 'S1201-9712(26)00706-X') {
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
      root.innerHTML = `<style>.supabase-live-preview{max-width:900px;margin:0 auto;padding:28px;color:#1d2a39;font-family:Arial,sans-serif}.supabase-live-preview h1{color:#164f73;font-size:2rem;line-height:1.2}.supabase-live-preview h2{color:#164f73;margin-top:28px}.supabase-live-preview .preview-meta{color:#526477;margin:10px 0}.supabase-live-preview .preview-authors{font-weight:600}.supabase-live-preview .preview-abstract{line-height:1.7;white-space:pre-line}.supabase-live-preview .preview-pdf{display:inline-block;margin-top:22px;padding:11px 16px;background:#17618b;color:#fff;text-decoration:none;font-weight:700}</style>
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
        <div class="supabase-live-preview"><div class="preview-meta">${data.article_type || 'Article'} | Volume ${data.volume || 'N/A'} | Issue ${data.issue || 'N/A'}</div><h1></h1><p class="preview-authors"></p><div class="preview-meta">Published online: ${data.published_at || 'Date not set'}</div><h2>Abstract</h2><div class="preview-abstract"></div>${highlights.length ? '<h2>Highlights</h2><ul class="preview-highlights"></ul>' : ''}${keywords.length ? '<h2>Keywords</h2><p class="preview-keywords"></p>' : ''}${pdfUrl ? `<a class="preview-pdf" href="${pdfUrl}" target="_blank" rel="noreferrer">Open PDF</a>` : ''}</div>`;
      root.querySelector('h1').textContent = data.title;
      root.querySelector('.preview-authors').textContent = data.authors || 'Authors not provided';
      root.querySelector('.preview-abstract').textContent = data.abstract || 'No abstract available.';
      if (highlights.length) highlights.forEach((value) => { const item = document.createElement('li'); item.textContent = value; root.querySelector('.preview-highlights').appendChild(item); });
      if (keywords.length) root.querySelector('.preview-keywords').textContent = keywords.join(', ');
      document.title = data.title;
      const issueList = document.createElement('section');
      issueList.className = 'supabase-issue-list';
      issueList.innerHTML = '<h2>All articles in this issue</h2><div class="issue-list-items">Loading...</div>';
      root.parentElement.appendChild(issueList);
      const issueItems = issueList.querySelector('.issue-list-items');
      const issueResult = await supabase.from('articles').select('*').eq('issue', data.issue).order('order_number', { ascending: true });
      if (issueResult.error) {
        issueItems.textContent = issueResult.error.message;
        return;
      }
      issueItems.textContent = '';
      for (const issueArticle of issueResult.data || []) {
        const item = document.createElement('article');
        item.className = 'issue-list-item';
        const targetPii = issueArticle.article_pii || 'S1201-9712(26)00706-X';
        item.innerHTML = `<h3><a href="/article/${encodeURIComponent(targetPii)}/fulltext.html"></a></h3><p></p><span></span>`;
        item.querySelector('h3 a').textContent = issueArticle.title;
        item.querySelector('p').textContent = issueArticle.authors || 'Authors not provided';
        item.querySelector('span').textContent = issueArticle.published_at ? `Published online: ${issueArticle.published_at}` : 'Date not set';
        issueItems.appendChild(item);
      }
    });
})();
