const gallery = document.querySelector('#gallery');
const status = document.querySelector('#load-status');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function renderEntry(item, index, total) {
  const section = document.createElement('section');
  section.className = 'entry';
  section.id = `place-${item.id}`;
  section.innerHTML = `<div class="window"><img alt="${escapeHTML(item.name)}の建築写真" width="${item.photo.width}" height="${item.photo.height}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>
    <div class="entry-info"><div><div class="entry-top"><span class="sequence">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span><span class="sequence">ARCHITECTURE</span></div><h2><a href="${escapeHTML(item.detailUrl)}">${escapeHTML(item.name)} ↗</a></h2><p class="location">${escapeHTML(item.location)}</p><p class="file-id">FACILITY ID / ${escapeHTML(item.id)}</p></div>
    <div class="credit"><span class="credit-label">PHOTO / ATTRIBUTION</span><p>撮影：${escapeHTML(item.photo.artist)}</p><p>出典：<a href="${escapeHTML(item.photo.source)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons ↗</a></p><p>ライセンス：<a href="${escapeHTML(item.photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.photo.license)} ↗</a></p></div></div>`;
  const img = section.querySelector('img');
  img.addEventListener('error', () => {
    img.replaceWith(Object.assign(document.createElement('p'), {className: 'fallback', textContent: '写真を読み込めませんでした。出典リンクから原画像をご覧ください。'}));
  }, {once: true});
  img.src = item.photo.url;
  return section;
}

fetch('./photos.json').then(response => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then(data => {
  const items = data.items;
  document.querySelector('#count').textContent = `${items.length} / ${data.categoryTotal} 件の写真を確認`;
  gallery.replaceChildren(...items.map((item, index) => renderEntry(item, index, items.length)));
  status.textContent = 'すべての記録を表示しました。';
}).catch(() => {
  status.textContent = '写真データを読み込めませんでした。時間をおいて再読み込みしてください。';
});
