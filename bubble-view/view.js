const gallery = document.querySelector('#gallery');
const status = document.querySelector('#load-status');
const dialog = document.querySelector('#photo-dialog');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function renderEntry(item, index, total) {
  const section = document.createElement('article');
  section.className = 'entry';
  section.id = `place-${item.id}`;
  const imageMarkup = item.photo
    ? `<button class="window" type="button" aria-label="${escapeHTML(item.name)}の写真を拡大"><img alt="${escapeHTML(item.name)}の建築写真" width="${item.photo.width}" height="${item.photo.height}" ${index < 3 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></button>`
    : `<div class="window empty" role="img" aria-label="${escapeHTML(item.name)}の写真は未登録"><span class="photo-missing"><span>NO IMAGE</span><span>写真未登録</span></span></div>`;
  const creditMarkup = item.photo
    ? `<div class="credit"><span class="credit-label">PHOTO / ATTRIBUTION</span><p>撮影：${escapeHTML(item.photo.artist)}</p><p>出典：<a href="${escapeHTML(item.photo.source)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons ↗</a></p><p>ライセンス：<a href="${escapeHTML(item.photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.photo.license)} ↗</a></p></div>`
    : `<div class="credit"><span class="credit-label">PHOTO / STATUS</span><p>写真はまだ登録されていません。</p></div>`;
  section.innerHTML = `${imageMarkup}
    <div class="entry-info"><div><div class="entry-top"><span class="sequence">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span><span class="sequence">ARCHITECTURE</span></div><h2><a href="${escapeHTML(item.detailUrl)}">${escapeHTML(item.name)} ↗</a></h2><p class="location">${escapeHTML(item.location)}</p><p class="file-id">FACILITY ID / ${escapeHTML(item.id)}</p></div>
    ${creditMarkup}</div>`;
  if (!item.photo) return section;
  const img = section.querySelector('img');
  img.addEventListener('error', () => {
    img.replaceWith(Object.assign(document.createElement('p'), {className: 'fallback', textContent: '写真を読み込めませんでした。出典リンクから原画像をご覧ください。'}));
    section.querySelector('.window').disabled = true;
  }, {once: true});
  img.src = item.photo.url;
  section.querySelector('.window').addEventListener('click', () => {
    dialog.querySelector('.dialog-image').replaceChildren(img.cloneNode());
    dialog.querySelector('.dialog-info').innerHTML = `<h2>${escapeHTML(item.name)}</h2><p>${escapeHTML(item.location)}</p><p>撮影：${escapeHTML(item.photo.artist)} · <a href="${escapeHTML(item.photo.source)}" target="_blank" rel="noopener noreferrer">出典</a> · <a href="${escapeHTML(item.photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.photo.license)}</a></p>`;
    dialog.showModal();
  });
  return section;
}

dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

fetch('./photos.json').then(response => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then(data => {
  const items = data.items;
  const photoCount = items.filter(item => item.photo).length;
  document.querySelector('#count').textContent = `${items.length}施設 / 写真${photoCount}件`;
  gallery.replaceChildren(...items.map((item, index) => renderEntry(item, index, items.length)));
  status.textContent = 'すべての記録を表示しました。';
}).catch(() => {
  status.textContent = '写真データを読み込めませんでした。時間をおいて再読み込みしてください。';
});
