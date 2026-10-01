(() => {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function pageNumber(value) {
    const m = String(value || '').match(/\d+/);
    return m ? Number(m[0]) : Number.MAX_SAFE_INTEGER;
  }

  function renderArticle(article, pdfUrl) {
    const item = document.createElement('li');
    item.className = 'articleCitation dynamic-article';
    item.innerHTML = `<div class="toc__item clearfix"><div class="toc__item__prefix"><div class="input-group"><label class="checkbox--primary"><input type="checkbox" disabled><span class="label-txt"></span></label></div></div><div class="toc__item__body"><div class="toc__item__detials "><h3 class="toc__item__title"></h3><div class="toc__item__authors"></div><div class="toc__item__details"><div class="toc__item__date"></div><div class="toc__item__pages"></div><div class="toc__articleNumber"></div></div><div class="toc__item__links"><ul class="rlist--inline download-links"><li><a class="pdfLink" target="_blank" rel="noreferrer">PDF</a></li></ul></div></div></div></div>`;
    const titleEl = item.querySelector('.toc__item__title');
    const anchor = document.createElement('a');
    anchor.href = pdfUrl || '#';
    anchor.target = '_blank';
    anchor.textContent = article.title;
    titleEl.appendChild(anchor);
    item.querySelector('.toc__item__authors').textContent = article.authors || '';
    const pub = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    item.querySelector('.toc__item__date').textContent = pub ? 'Published online: ' + pub : '';
    item.querySelector('.toc__item__pages').textContent = article.page_number ? 'Page: ' + article.page_number : '';
    item.querySelector('.toc__articleNumber').textContent = article.article_type || '';
    const pdfLink = item.querySelector('.pdfLink');
    if (pdfUrl) { pdfLink.href = pdfUrl; } else { pdfLink.textContent = 'PDF unavailable'; pdfLink.removeAttribute('href'); }
    return item;
  }

  async function init() {
    // Extract issue ID from URL path
    const pathMatch = window.location.pathname.match(/\/issue\/([^.\/]+)/);
    if (!pathMatch) return; // Not an issue page
    const issueId = decodeURIComponent(pathMatch[1]);

    console.log('[issue-articles] issueId:', issueId);

    // Get supabase client - try window.supabaseClient first, then build it
    let sb = window.supabaseClient;
    if (!sb && window.supabase && window.SUPABASE_CONFIG) {
      sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    }
    if (!sb) {
      console.error('[issue-articles] Supabase client not available');
      return;
    }

    console.log('[issue-articles] Querying for issue:', issueId);
    const { data, error } = await sb.from('articles').select('*').eq('issue', issueId).order('order_number', { ascending: true });

    if (error) { console.error('[issue-articles] Error:', error.message); return; }
    console.log('[issue-articles] Found', (data || []).length, 'articles');

    if (!data || data.length === 0) return;

    const articles = [...data].sort((a, b) => {
      const od = Number(a.order_number || 0) - Number(b.order_number || 0);
      return od || pageNumber(a.page_number) - pageNumber(b.page_number);
    });

    // Group by article_type / section
    const byType = {};
    articles.forEach(art => {
      const type = art.article_type || 'Other';
      if (!byType[type]) byType[type] = [];
      byType[type].push(art);
    });

    const tocBody = document.querySelector('.table-of-content__body');
    if (!tocBody) { console.error('[issue-articles] .table-of-content__body not found'); return; }

    for (const [type, typeArticles] of Object.entries(byType)) {
      // Try to find existing section matching this type
      let section = Array.from(tocBody.querySelectorAll('.toc__section')).find(s => {
        const h2 = s.querySelector('h2');
        return h2 && h2.textContent.trim().toLowerCase() === type.toLowerCase();
      });

      let ul;
      if (section) {
        ul = section.querySelector('.toc__body.rlist, ul.rlist');
      } else {
        // Create a new section
        section = document.createElement('section');
        section.className = 'toc__section';
        const h2 = document.createElement('h2');
        h2.className = 'toc__heading__header top';
        h2.textContent = type;
        ul = document.createElement('ul');
        ul.className = 'toc__body rlist clearfix';
        section.appendChild(h2);
        section.appendChild(ul);
        tocBody.appendChild(section);
      }

      if (!ul) continue;

      for (const article of typeArticles) {
        let pdfUrl = '';
        if (article.pdf_path) {
          const { data: urlData } = sb.storage.from('article-pdfs').getPublicUrl(article.pdf_path);
          pdfUrl = urlData?.publicUrl || '';
        }
        ul.appendChild(renderArticle(article, pdfUrl));
      }
    }
  }

  // Run immediately since script is at end of body
  init();
})();
