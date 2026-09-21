(() => {
  function init() {
    const supabase = window.supabaseClient;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const articlePii = new URLSearchParams(window.location.search).get('pii') || decodeURIComponent(parts[1] || '');
    const root = document.getElementById('article-preview') || document.querySelector(`article[data-pii="${articlePii}"]`) || document.querySelector('article[typeof="ScholarlyArticle"]');
    if (!root || !supabase || !articlePii) return;

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

      const nativeArticle = root.matches('article[typeof="ScholarlyArticle"], article[data-pii]');
      if (nativeArticle) {
        const title = root.querySelector('h1[property="name"]') || root.querySelector('h1');
        const type = root.querySelector('.meta-panel__type span');
        const volume = root.querySelector('.meta-panel__volumeIssue span');
        const number = root.querySelector('.meta-panel__number');
        const onlineDate = root.querySelector('.meta-panel__onlineDate');
        const contributors = root.querySelector('.contributors');
        const abstract = root.querySelector('#abstracts');
        const pdfLink = root.querySelector('.article-tools__pdf a, a.pdfLink');

        if (title) title.textContent = data.title;
        if (type) type.textContent = data.article_type || 'Research Article';
        if (volume) volume.textContent = `Volume ${data.volume || 'N/A'}`;
        if (number) number.textContent = data.page_number || '';
        if (onlineDate) onlineDate.textContent = data.published_at ? new Date(data.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
        if (contributors) contributors.textContent = data.authors || 'Authors not provided';
        if (pdfLink && pdfUrl) { pdfLink.href = pdfUrl; pdfLink.target = '_blank'; }
        if (abstract) {
          abstract.innerHTML = '<section class="supabase-native-content"><h2>Abstract</h2><p class="supabase-abstract"></p></section>';
          abstract.querySelector('.supabase-abstract').textContent = data.abstract || 'No abstract available.';
          if (data.highlights) {
            const section = document.createElement('section');
            section.innerHTML = '<h2>Highlights</h2><ul></ul>';
            String(data.highlights).split(/\r?\n|\|/).map((item) => item.trim()).filter(Boolean).forEach((item) => { const li = document.createElement('li'); li.textContent = item; section.querySelector('ul').appendChild(li); });
            abstract.appendChild(section);
          }
          if (data.keywords) {
            const section = document.createElement('section');
            section.innerHTML = '<h2>Keywords</h2><p></p>';
            section.querySelector('p').textContent = data.keywords;
            abstract.appendChild(section);
          }
        }
        document.title = data.title;
        return;
      }

      root.innerHTML = '<h1></h1><p class="preview-authors"></p><p class="preview-date"></p><h2>Abstract</h2><p class="preview-abstract"></p>';
      root.querySelector('h1').textContent = data.title;
      root.querySelector('.preview-authors').textContent = data.authors || 'Authors not provided';
      root.querySelector('.preview-date').textContent = `Published online: ${data.published_at || 'Date not set'}`;
      root.querySelector('.preview-abstract').textContent = data.abstract || 'No abstract available.';
    });
  }

  window.addEventListener('load', init);
})();
