const records=window.ARCHIVE_DATA,main=document.querySelector('#main');
const categories=[...new Set(records.map(x=>x.category))],tags=[...new Set(records.flatMap(x=>x.tags))].sort((a,b)=>a.localeCompare(b,'ja'));
const card=x=>`<button class="card" data-id="${x.id}"><span class="file-tab">FILE ${String(records.indexOf(x)+1).padStart(3,'0')}</span><img src="${x.image}" alt="${x.title}" loading="lazy"><span class="card-copy"><span class="card-meta"><span>分類 / ${x.category}</span><span>${x.date}</span></span><h3>${x.title}</h3><p>${x.excerpt}</p><span class="card-foot"><span>${x.place}</span><span>詳細を見る →</span></span></span></button>`;
function wire(){document.querySelectorAll('[data-id]').forEach(e=>e.onclick=()=>go('detail/'+e.dataset.id));document.querySelectorAll('[data-route]').forEach(e=>e.onclick=()=>go(e.dataset.route==='archive'?'home':e.dataset.route))}function active(r){document.querySelectorAll('[data-route]').forEach(e=>e.classList.toggle('active',e.dataset.route===r))}function go(r){location.hash=r}function random(){let x=records[Math.floor(Math.random()*records.length)];if(location.hash.endsWith(x.id))x=records[(records.indexOf(x)+1)%records.length];go('detail/'+x.id)}
function home(){active('home');main.innerHTML=`<div class="page home-page"><section class="ledger"><div class="ledger-title">管理記録（自動処理情報）</div><div class="ledger-scroll"><table><thead><tr><th>処理番号</th><th>処理対象</th><th>処理区分</th><th>照合日時</th><th>状態</th></tr></thead><tbody><tr><td>SYS-001</td><td>資料本文索引</td><td>全文照合 / UTF-8</td><td>2026.09.13 03:14</td><td>正常</td></tr><tr><td>IMG-${String(records.length*40).padStart(3,'0')}</td><td>画像参照台帳</td><td>外部参照 / 遅延読込</td><td>2026.09.13 03:12</td><td>継続</td></tr><tr><td>CLS-${String(categories.length).padStart(3,'0')}</td><td>分類語彙表</td><td>重複除外 / 昇順</td><td>2026.09.13 02:48</td><td>正常</td></tr><tr><td>TAG-${String(tags.length).padStart(3,'0')}</td><td>付与語句一覧</td><td>仮名照合 / 未校正</td><td>2026.09.12 23:59</td><td>保留</td></tr></tbody></table></div></section><section><div class="section-head"><div><p class="eyebrow">ALL ENTRIES / ${String(records.length).padStart(3,'0')}</p><h2>記録</h2></div></div><div class="featured home-tiles">${records.map(card).join('')}</div></section></div>`;wire()}
function archive(selected='すべて'){active('archive');const list=selected==='すべて'?records:records.filter(x=>x.category===selected);main.innerHTML=`<div class="page"><p class="eyebrow">ALL RECORDS</p><h1 class="archive-title">記録一覧 <small>${String(list.length).padStart(2,'0')}</small></h1><div class="filter">${['すべて',...categories].map(c=>`<button class="chip ${c===selected?'active':''}" data-filter="${c}">${c}</button>`).join('')}</div><div class="grid">${list.map(card).join('')}</div></div>`;wire();document.querySelectorAll('[data-filter]').forEach(e=>e.onclick=()=>archive(e.dataset.filter))}
function tagPage(){active('tags');main.innerHTML=`<div class="page"><p class="eyebrow">INDEX BY WORDS</p><h1 class="archive-title">タグから探す</h1><p class="lead">場所の種類、光、時間、そこで感じたもの。記録に付けた言葉から横断できます。</p><div class="tag-cloud">${tags.map(t=>`<button class="chip" data-tag="${t}"># ${t} <small>${records.filter(x=>x.tags.includes(t)).length}</small></button>`).join('')}</div><div id="tag-results"></div></div>`;document.querySelectorAll('[data-tag]').forEach(e=>e.onclick=()=>{document.querySelectorAll('[data-tag]').forEach(x=>x.classList.toggle('active',x===e));document.querySelector('#tag-results').innerHTML=`<div class="section-head"><h2># ${e.dataset.tag}</h2></div><div class="grid">${records.filter(x=>x.tags.includes(e.dataset.tag)).map(card).join('')}</div>`;wire()})}
const maps=q=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const tullys=q=>`https://shop.tullys.co.jp/all?keyword=${encodeURIComponent(q)}`;
const facilityDataset=window.FACILITY_DATASET;
// Display consecutive numbers; keep stored IDs and record links unchanged.
const materialDisplayNumbers=new Map(facilityDataset.materials.map((m,index)=>[m.id,String(index+1).padStart(2,'0')]));
const materialDefinitions=facilityDataset.materials.map(m=>[m.id,materialDisplayNumbers.get(m.id),m.name,m.shortName]);
const materialItemMap=new Map(facilityDataset.materials.map(m=>[m.id,m.items]));
const materialItems=key=>materialItemMap.get(key)||[];
const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sortableHead=`<thead><tr><th scope="col">参照</th><th scope="col"><button class="sort-button" data-sort="prefecture" data-label="都道府県">都道府県 ↕</button></th><th scope="col">市区町村</th><th scope="col">店舗名・施設名</th><th scope="col"><button class="sort-button" data-sort="type" data-label="分類">分類 ↕</button></th><th scope="col"><button class="sort-button" data-sort="rank" data-label="評価">評価 ↕</button></th><th scope="col">説明・狙い目</th></tr></thead>`;
let facilitiesScrollTop=0;
function catalogSection(number,id,title,note,items){const rows=items.map(x=>`<tr data-prefecture="${h(x.prefecture)}" data-type="${h(x.type)}" data-rank="${h(x.rank)}"><td>${x.official?`<a href="${h(x.official)}" target="_blank" rel="noopener">公式</a> `:''}<a href="${h(x.maps)}" target="_blank" rel="noopener">地図</a></td><td>${h(x.prefecture)}</td><td>${h(x.city)}</td><td>${x.name==='玄海海中展望塔'?`<button class="facility-detail-link" data-facility-detail="genkai-undersea">${h(x.name)}</button>`:h(x.name)}</td><td>${h(x.type)}</td><td>${h(x.rank)}</td><td>${h(x.note)}</td></tr>`).join('');return `<section class="reference-section" id="${id}"><div class="reference-heading"><span>資料${number}</span><h2>${title}</h2><span>${String(items.length).padStart(3,'0')}件</span></div><p class="reference-note">${note}　都道府県・分類・評価の見出しで昇順／降順。</p><div class="record-table catalog-table"><table>${sortableHead}<tbody>${rows}</tbody></table></div></section>`}
function wireSortTables(){
  document.querySelectorAll('.record-table table').forEach(table=>{
    table.querySelectorAll('[data-sort]').forEach(button=>{
      button.onclick=()=>{
        const key=button.dataset.sort,ascending=button.dataset.direction!=='asc',body=table.tBodies[0],rows=[...body.rows],rank={S:0,A:1,B:2,C:3,'':4};
        rows.sort((a,b)=>{const av=a.dataset[key]||'',bv=b.dataset[key]||'';const value=key==='rank'?(rank[av]??9)-(rank[bv]??9):av.localeCompare(bv,'ja');return ascending?value:-value});
        rows.forEach(row=>body.append(row));
        table.querySelectorAll('[data-sort]').forEach(x=>{x.dataset.direction='';x.textContent=`${x.dataset.label} ↕`});
        button.dataset.direction=ascending?'asc':'desc';button.textContent=`${button.dataset.label} ${ascending?'↑':'↓'}`;
      };
    });
  });
}

// Search normalizes text without changing the source records.
const normalizeSearch=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g,' ').trim();
const prefectureAliases=new Map();
facilityDataset.materials.forEach(m=>m.items.forEach(x=>{
  const full=normalizeSearch(x.prefecture);
  if(full)prefectureAliases.set(full,full.replace(/[都府県]$/,''));
}));
const normalizeRegion=value=>{
  let text=normalizeSearch(value);
  for(const [full,short] of prefectureAliases){
    if(full!==short)text=text.split(full).join(short);
  }
  return text;
};
const facilityEntries=facilityDataset.materials.flatMap(m=>m.items.map((item,index)=>({
  item,key:m.id,index,number:materialDisplayNumbers.get(m.id),title:m.name,
  text:normalizeRegion([item.prefecture,item.city,item.name,item.type,item.kind,item.note,item.description,item.aim,m.name,m.shortName].filter(Boolean).join(' '))
})));
let facilityQuery='',selectedFacilityId=null,unfilteredList=null,unfilteredScroll=0;
function detailMarkup(selected,definition){
  return selected?`<section class="material-detail facilities-top-detail"><div class="material-detail-copy"><div class="facility-record-head"><span>資料${definition[1]} / 個別記録</span><span>${selected.rank?`評価 ${h(selected.rank)}`:'分類・評価なし'}</span></div><h2>${h(selected.name)}</h2><div class="facility-register"><div><span>都道府県</span><span>${h(selected.prefecture)}</span></div><div><span>市区町村</span><span>${h(selected.city)}</span></div><div><span>分類</span><span>${h(selected.type)}</span></div><div><span>評価</span><span>${h(selected.rank)}</span></div><div class="facility-register-wide"><span>説明</span><span>${h(selected.note)}</span></div><div class="facility-register-wide"><span>参照</span><span>${selected.official?`<a href="${h(selected.official)}" target="_blank" rel="noopener">公式サイト</a>　`:''}<a href="${h(selected.maps)}" target="_blank" rel="noopener">地図</a>　<a href="${h(selected.maps)}" target="_blank" rel="noopener">Googleマップで写真を見る ↗</a></span></div></div></div><iframe title="${h(selected.name)}の地図" src="https://maps.google.com/maps?q=${encodeURIComponent(`${selected.name} ${selected.prefecture}${selected.city}`)}&output=embed" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></section>`:'';

}
function ledgerRow(entry){
  const x=entry.item,id=`${entry.key}/${entry.index}`;
  return `<tr class="${id===selectedFacilityId?'selected-row':''}" data-prefecture="${h(x.prefecture)}" data-type="${h(x.type)}" data-rank="${h(x.rank)}"><td>${x.official?`<a href="${h(x.official)}" target="_blank" rel="noopener">公式</a> `:''}<a href="${h(x.maps)}" target="_blank" rel="noopener">地図</a></td><td>${h(x.prefecture)}</td><td>${h(x.city)}</td><td><button class="facility-detail-link" data-all-facility="${h(id)}" aria-controls="facility-detail-panel" aria-expanded="false">${h(x.name)}</button></td><td>${h(x.type)}</td><td>${h(x.rank)}</td><td>${h(x.note)}</td></tr>`;
}
function ledgerSection(id,number,title,entries,expanded=false){
  return `<details class="all-material-section" id="${h(id)}"${expanded?' open':''}><summary class="reference-heading"><span>${h(number)}</span><h2>${h(title)}</h2><span>${String(entries.length).padStart(3,'0')}件</span></summary><div class="record-table catalog-table"><table aria-label="${h(title)}">${sortableHead}<tbody>${entries.map(ledgerRow).join('')}</tbody></table></div></details>`;
}
function hideFacilityDetail(){
  const panel=document.querySelector('#facility-detail-panel');
  if(!panel||panel.hidden)return;
  panel.hidden=true;
  document.querySelectorAll('[data-all-facility][aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));
}
function showFacilityDetail(key,index){
  const entry=facilityEntries.find(e=>e.key===key&&e.index===Number(index));
  if(!entry){hideFacilityDetail();return;}
  selectedFacilityId=`${key}/${index}`;
  const material=document.getElementById('material-'+key);
  if(material)material.open=true;
  const panel=document.querySelector('#facility-detail-panel');
  panel.innerHTML=`<div class="detail-panel-bar"><span>一覧をスクロールすると詳細を閉じます</span><button type="button" id="hide-facility-detail">詳細を閉じる ×</button></div>${detailMarkup(entry.item,materialDefinitions.find(d=>d[0]===key))}`;
  panel.hidden=false;
  document.querySelectorAll('[data-all-facility]').forEach(button=>{
    const selected=button.dataset.allFacility===selectedFacilityId;
    button.setAttribute('aria-expanded',String(selected));
    button.closest('tr').classList.toggle('selected-row',selected);
  });
  document.querySelector('#hide-facility-detail').onclick=()=>{
    hideFacilityDetail();
    const button=[...document.querySelectorAll('[data-all-facility]')].find(b=>b.dataset.allFacility===selectedFacilityId);
    button?.focus({preventScroll:true});
  };
}
function wireLedgerRows(){
  document.querySelectorAll('details.all-material-section').forEach(section=>{
    section.ontoggle=()=>{if(!section.open&&section.querySelector('.selected-row'))hideFacilityDetail();};
  });
  wireSortTables();
  document.querySelectorAll('[data-all-facility]').forEach(button=>button.onclick=()=>{
    // Updating only the panel preserves row order, query and scroll position.
    const [key,index]=button.dataset.allFacility.split('/');
    showFacilityDetail(key,index);
    const hash='#facility/'+button.dataset.allFacility;
    if(location.hash!==hash)history.pushState(null,'',hash);
  });
}
function renderLedgerResults(){
  const scroller=document.querySelector('.facilities-ledger-scroll');
  const tokens=normalizeRegion(facilityQuery).split(/\s+/).filter(Boolean);
  hideFacilityDetail();
  if(tokens.length){
    if(!unfilteredList){
      unfilteredScroll=scroller.scrollTop;
      unfilteredList=document.createDocumentFragment();
      unfilteredList.append(...scroller.childNodes);
    }
    const matches=facilityEntries.filter(entry=>tokens.every(token=>entry.text.includes(token)));
    scroller.innerHTML=matches.length?ledgerSection('facility-search-results','横断検索','全資料の検索結果',matches,true):'<p class="empty">該当する施設はありません。検索語を変えてお試しください。</p>';
    document.querySelector('#facility-search-status').textContent=`${matches.length} / ${facilityEntries.length}件`;
    scroller.scrollTop=0;
  }else{
    if(unfilteredList){scroller.replaceChildren(unfilteredList);unfilteredList=null;scroller.scrollTop=unfilteredScroll;}
    else if(!scroller.children.length){
      scroller.innerHTML=materialDefinitions.map(([key,number,title])=>ledgerSection('material-'+key,'資料'+number,title,facilityEntries.filter(e=>e.key===key))).join('');
      scroller.scrollTop=facilitiesScrollTop;
    }
    document.querySelector('#facility-search-status').textContent=`全${facilityEntries.length}件`;
  }
  document.querySelector('#clear-facility-search').disabled=!facilityQuery;
  wireLedgerRows();
}
function facilitiesPage(selectedKey=null,selectedIndex=null){
  active('facilities');
  if(!document.querySelector('.facilities-ledger')){
    unfilteredList=null;
    const jumps=materialDefinitions.map(([key,number,,short])=>`<button data-material-jump="${h(key)}"><span>${number}</span> ${h(short)}</button>`).join('');
    main.innerHTML=`<div class="facilities-ledger"><div class="facilities-ledger-fixed"><div class="facility-index-bar"><div class="facility-title-line"><h1>施設資料総合台帳</h1><nav class="material-jumps" aria-label="資料内リンク">${jumps}</nav></div><span>資料 ${String(materialDefinitions.length).padStart(2,'0')}</span><span>収録 ${facilityEntries.length}</span><a href="https://www.google.com/maps" target="_blank" rel="noopener">Googleマップ ↗</a></div><div class="facility-search" role="search"><label for="facility-query">全資料検索</label><input id="facility-query" type="search" placeholder="東京 植物園 ／ 市区町村・施設名・説明など" autocomplete="off" aria-describedby="facility-search-status" value="${h(facilityQuery)}"><button id="clear-facility-search" type="button">解除</button><output id="facility-search-status" aria-live="polite"></output></div></div><div class="ledger-viewport"><div class="facilities-ledger-scroll" tabindex="0" role="region" aria-label="施設一覧"></div><aside id="facility-detail-panel" aria-label="選択した施設の詳細" hidden></aside></div></div>`;
    renderLedgerResults();wire();
    const input=document.querySelector('#facility-query'),scroller=document.querySelector('.facilities-ledger-scroll');
    input.addEventListener('input',event=>{if(!event.isComposing){facilityQuery=input.value;renderLedgerResults();}});
    input.addEventListener('compositionend',()=>{facilityQuery=input.value;renderLedgerResults();});
    const clear=()=>{input.value='';facilityQuery='';renderLedgerResults();};
    document.querySelector('#clear-facility-search').onclick=()=>{clear();input.focus();};
    input.addEventListener('keydown',event=>{if(event.key==='Escape'){clear();event.preventDefault();}});
    document.querySelectorAll('[data-material-jump]').forEach(button=>button.onclick=()=>{
      if(facilityQuery)clear();
      hideFacilityDetail();
      const target=document.getElementById('material-'+button.dataset.materialJump);
      if(target){target.open=true;scroller.scrollTop+=target.getBoundingClientRect().top-scroller.getBoundingClientRect().top;}
    });
    // The panel overlays the list: closing it never changes the list geometry.
    scroller.addEventListener('wheel',event=>{if(event.deltaY)hideFacilityDetail();},{passive:true});
    let touchY=null;
    scroller.addEventListener('touchstart',event=>{touchY=event.touches[0]?.clientY??null;},{passive:true});
    scroller.addEventListener('touchmove',event=>{if(touchY!==null&&Math.abs(event.touches[0].clientY-touchY)>4)hideFacilityDetail();},{passive:true});
    scroller.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!event.target.closest('button,a'))hideFacilityDetail();});
    scroller.addEventListener('scroll',()=>{facilitiesScrollTop=scroller.scrollTop;hideFacilityDetail();},{passive:true});
  }
  if(selectedKey!==null&&selectedIndex!==null)showFacilityDetail(selectedKey,selectedIndex);
  else hideFacilityDetail();
}
function materialPage(key){
  facilitiesPage();
  const button=[...document.querySelectorAll('[data-material-jump]')].find(b=>b.dataset.materialJump===key);
  button?.click();
}
function facilityDetail(key,index){facilitiesPage(key,index)}
function detail(id){
  const x=records.find(v=>v.id===id);if(!x)return home();active('');
  const gallery=x.gallery?.length?x.gallery:[x.image],related=records.filter(v=>v.id!==id&&v.tags.some(t=>x.tags.includes(t))).slice(0,3);
  main.innerHTML=`<article class="page detail"><button class="text-button back" data-route="archive">← 一覧へ戻る</button><div class="detail-copy detail-copy-top"><p class="eyebrow">${x.category} / ${x.date}</p><h1>${x.title}</h1><p class="intro">${x.excerpt}</p><div class="meta"><div><span>PLACE</span>${x.place}</div><div><span>FILE</span>${String(records.indexOf(x)+1).padStart(3,'0')} / ${String(records.length).padStart(3,'0')}</div></div><p class="body">${x.body}</p><div class="tag-cloud">${x.tags.map(t=>`<button class="chip" data-tag-link="${t}"># ${t}</button>`).join('')}</div></div><div class="gallery-workspace"><figure class="main-photo"><img id="main-photo" src="${gallery[0]}" alt="${x.title} メイン写真"><figcaption>PHOTO 01 / ${String(gallery.length).padStart(2,'0')}</figcaption></figure><div class="photo-grid">${gallery.map((src,i)=>`<button class="photo-tile ${i===0?'active':''}" data-photo="${src}" data-photo-index="${i}" aria-label="写真${i+1}を表示"><img src="${src}" alt="${x.title} 別角度 ${i+1}" loading="lazy"><span>${String(i+1).padStart(2,'0')}</span></button>`).join('')}</div></div>${related.length?`<section class="related"><div class="section-head"><h2>近くの記録</h2></div><div class="grid">${related.map(card).join('')}</div></section>`:''}</article>`;
  wire();
  document.querySelectorAll('[data-photo]').forEach(e=>e.onclick=()=>{document.querySelector('#main-photo').src=e.dataset.photo;document.querySelector('.main-photo figcaption').textContent=`PHOTO ${String(Number(e.dataset.photoIndex)+1).padStart(2,'0')} / ${String(gallery.length).padStart(2,'0')}`;document.querySelectorAll('[data-photo]').forEach(t=>t.classList.toggle('active',t===e));});
  document.querySelectorAll('[data-tag-link]').forEach(e=>e.onclick=()=>{go('tags');setTimeout(()=>document.querySelector(`[data-tag="${e.dataset.tagLink}"]`)?.click())});scrollTo(0,0)
}
function route(){const routeHash=location.hash.slice(1)||'facilities',parts=routeHash.split('/');routeHash.startsWith('facility/')?facilityDetail(parts[1],parts[2]):routeHash.startsWith('material/')?materialPage(parts[1]):facilitiesPage()}
addEventListener('hashchange',route);wire();route();
