const SITE_LANG=window.SITE_LANG||'ja';
const IS_EN=SITE_LANG==='en';
const records=window.ARCHIVE_DATA,main=document.querySelector('#main');
const uiText={
  ja:{ref:'参照',pref:'都道府県',city:'市区町村',name:'店舗名・施設名',type:'分類',related:'関連リンク',note:'説明・狙い目',official:'公式',map:'地図',all:'すべて',search:'全資料検索',placeholder:'都道府県・市区町村・施設名',clear:'解除',collections:'資料',places:'施設',detail:'個別記録',close:'詳細を閉じる ×',back:'← 一覧へ戻る',noResult:'該当する施設はありません。検索語を変えてお試しください。',records:'記録一覧',count:'件'},
  en:{ref:'References',pref:'Prefecture',city:'City / Ward',name:'Place',type:'Category',related:'Related Links',note:'Description / Notes',official:'Official',map:'Map',all:'All',search:'Search all collections',placeholder:'Prefecture, city, or place name',clear:'Clear',collections:'Collections',places:'Places',detail:'Place record',close:'Close details ×',back:'← Back to list',noResult:'No matching places. Try another search term.',records:'All places',count:'places'}
};
const ui=k=>uiText[IS_EN?'en':'ja'][k]||k;
const displayName=x=>x?.name_en||window.EN_TRANSLATIONS?.facilities?.[x?.name]||x?.name||'';
const displayNote=x=>x?.note_en||x?.note||'';
const displayType=x=>x?.type_en||window.EN_TRANSLATIONS?.types?.[x?.type]||x?.type||'';
const displayMaterial=m=>m?.name_en||window.EN_TRANSLATIONS?.materials?.[m?.name]||m?.name||'';
const categories=[...new Set(records.map(x=>x.category))],tags=[...new Set(records.flatMap(x=>x.tags))].sort((a,b)=>a.localeCompare(b,'ja'));
const card=x=>`<button class="card" data-id="${x.id}"><span class="file-tab">FILE ${String(records.indexOf(x)+1).padStart(3,'0')}</span><img src="${x.image}" alt="${x.title}" loading="lazy"><span class="card-copy"><span class="card-meta"><span>分類 / ${x.category}</span><span>${x.date}</span></span><h3>${x.title}</h3><p>${x.excerpt}</p><span class="card-foot"><span>${x.place}</span><span>詳細を見る →</span></span></span></button>`;
function wire(){document.querySelectorAll('[data-id]').forEach(e=>e.onclick=()=>go('detail/'+e.dataset.id));document.querySelectorAll('[data-route]').forEach(e=>e.onclick=()=>go(e.dataset.route==='archive'?'home':e.dataset.route))}function active(r){document.querySelectorAll('[data-route]').forEach(e=>e.classList.toggle('active',e.dataset.route===r))}function go(r){location.hash=r}function random(){let x=records[Math.floor(Math.random()*records.length)];if(location.hash.endsWith(x.id))x=records[(records.indexOf(x)+1)%records.length];go('detail/'+x.id)}
function home(){active('home');main.innerHTML=`<div class="page home-page"><section class="ledger"><div class="ledger-title">管理記録（自動処理情報）</div><div class="ledger-scroll"><table><thead><tr><th>処理番号</th><th>処理対象</th><th>処理区分</th><th>照合日時</th><th>状態</th></tr></thead><tbody><tr><td>SYS-001</td><td>資料本文索引</td><td>全文照合 / UTF-8</td><td>2026.09.13 03:14</td><td>正常</td></tr><tr><td>IMG-${String(records.length*40).padStart(3,'0')}</td><td>画像参照台帳</td><td>外部参照 / 遅延読込</td><td>2026.09.13 03:12</td><td>継続</td></tr><tr><td>CLS-${String(categories.length).padStart(3,'0')}</td><td>分類語彙表</td><td>重複除外 / 昇順</td><td>2026.09.13 02:48</td><td>正常</td></tr><tr><td>TAG-${String(tags.length).padStart(3,'0')}</td><td>付与語句一覧</td><td>仮名照合 / 未校正</td><td>2026.09.12 23:59</td><td>保留</td></tr></tbody></table></div></section><section><div class="section-head"><div><p class="eyebrow">ALL ENTRIES / ${String(records.length).padStart(3,'0')}</p><h2>記録</h2></div></div><div class="featured home-tiles">${records.map(card).join('')}</div></section></div>`;wire()}
function archive(selected='すべて'){active('archive');const list=selected==='すべて'?records:records.filter(x=>x.category===selected);main.innerHTML=`<div class="page"><p class="eyebrow">ALL RECORDS</p><h1 class="archive-title">記録一覧 <small>${String(list.length).padStart(2,'0')}</small></h1><div class="filter">${['すべて',...categories].map(c=>`<button class="chip ${c===selected?'active':''}" data-filter="${c}">${c}</button>`).join('')}</div><div class="grid">${list.map(card).join('')}</div></div>`;wire();document.querySelectorAll('[data-filter]').forEach(e=>e.onclick=()=>archive(e.dataset.filter))}
function tagPage(){active('tags');main.innerHTML=`<div class="page"><p class="eyebrow">INDEX BY WORDS</p><h1 class="archive-title">タグから探す</h1><p class="lead">場所の種類、光、時間、そこで感じたもの。記録に付けた言葉から横断できます。</p><div class="tag-cloud">${tags.map(t=>`<button class="chip" data-tag="${t}"># ${t} <small>${records.filter(x=>x.tags.includes(t)).length}</small></button>`).join('')}</div><div id="tag-results"></div></div>`;document.querySelectorAll('[data-tag]').forEach(e=>e.onclick=()=>{document.querySelectorAll('[data-tag]').forEach(x=>x.classList.toggle('active',x===e));document.querySelector('#tag-results').innerHTML=`<div class="section-head"><h2># ${e.dataset.tag}</h2></div><div class="grid">${records.filter(x=>x.tags.includes(e.dataset.tag)).map(card).join('')}</div>`;wire()})}
const maps=q=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const tullys=q=>`https://shop.tullys.co.jp/all?keyword=${encodeURIComponent(q)}`;
const facilityDataset=window.FACILITY_DATASET;
// Registry numbers are the public display numbers. IDs remain the durable keys.
const materialDisplayNumbers=new Map(facilityDataset.materials.map(m=>[m.id,String(m.number).padStart(2,'0')]));
const materialDefinitions=facilityDataset.materials.map(m=>[m.id,materialDisplayNumbers.get(m.id),displayMaterial(m),m.shortName]);
const materialItemMap=new Map(facilityDataset.materials.map(m=>[m.id,m.items]));
const materialItems=key=>materialItemMap.get(key)||[];
const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sortableHead=`<thead><tr><th scope="col">${ui('ref')}</th><th scope="col"><button class="sort-button" data-sort="prefecture" data-label="${ui('pref')}">${ui('pref')} ↕</button></th><th scope="col">${ui('city')}</th><th scope="col">${ui('name')}</th><th scope="col"><button class="sort-button" data-sort="type" data-label="${ui('type')}">${ui('type')} ↕</button></th><th scope="col">${ui('related')}</th><th scope="col">${ui('note')}</th></tr></thead>`;
let facilitiesScrollTop=0;
const isWikipediaLink=link=>/(?:https?:\/\/)(?:ja|en)\.wikipedia\.org\/wiki\//i.test(link?.url||'');
const visibleRelatedLinks=links=>(links||[]).filter(link=>!isWikipediaLink(link));
const relatedLinksMarkup=(links,compact=false)=>{
  const visible=visibleRelatedLinks(links).slice(0,3);
  return visible.length?`<span class="related-links">${visible.map(link=>{const label=compact?'■':h(link.title);return `<a class="related-link${compact?' related-link-mark':''}" href="${h(link.url)}" target="_blank" rel="noopener noreferrer" title="${h(link.title)}" aria-label="${h(link.title)}">${label}</a>`}).join('')}</span>`:'—';
};
const wikipediaLinksMarkup=(extra,links=[])=>{
  const text=extra?.['参照']||'';
  const extraUrls=[...text.matchAll(/https?:\/\/(?:ja|en)\.wikipedia\.org\/wiki\/[^\s\n]+/gi)].map(m=>m[0]);
  const relatedUrls=links.filter(isWikipediaLink).map(link=>link.url);
  const urls=[...new Set([...extraUrls,...relatedUrls])];
  return urls.length?`<span class="reference-links">${urls.map(url=>`<a href="${h(url)}" target="_blank" rel="noopener noreferrer" title="wiki" aria-label="wiki">wiki</a>`).join('')}</span>`:'';
};
const referenceMarkup=(extra,links=[])=>wikipediaLinksMarkup(extra,links)||'';
function catalogSection(number,id,title,note,items){const rows=items.map(x=>`<tr data-prefecture="${h(x.prefecture)}" data-type="${h(displayType(x))}"><td>${x.official?`<a href="${h(x.official)}" target="_blank" rel="noopener noreferrer">${ui('official')}</a> `:''}<a href="${h(x.maps)}" target="_blank" rel="noopener noreferrer">${ui('map')}</a> ${referenceMarkup(x.extra,x.relatedLinks)}</td><td>${h(x.prefecture)}</td><td>${h(x.city)}</td><td>${x.name==='玄海海中展望塔'?`<button class="facility-detail-link" data-facility-detail="genkai-undersea">${h(displayName(x))}</button>`:h(displayName(x))}</td><td>${h(displayType(x))}</td><td>${relatedLinksMarkup(x.relatedLinks,true)}</td><td>${h(displayNote(x))}</td></tr>`).join('');return `<section class="reference-section" id="${id}"><div class="reference-heading"><span>${IS_EN?'Collection':'資料'}${number}</span><h2>${h(title)}</h2><span>${String(items.length).padStart(3,'0')}${ui('count')}</span></div><p class="reference-note">${h(note)}　${IS_EN?'Sort by prefecture or category.':'都道府県・分類の見出しで昇順／降順。'}</p><div class="record-table catalog-table"><table>${sortableHead}<tbody>${rows}</tbody></table></div></section>`}
function wireSortTables(){
  document.querySelectorAll('.record-table table').forEach(table=>{
    table.querySelectorAll('[data-sort]').forEach(button=>{
      button.onclick=()=>{
        const key=button.dataset.sort,ascending=button.dataset.direction!=='asc',body=table.tBodies[0],rows=[...body.rows];
        rows.sort((a,b)=>{const av=a.dataset[key]||'',bv=b.dataset[key]||'';const value=av.localeCompare(bv,'ja');return ascending?value:-value});
        rows.forEach(row=>body.append(row));
        table.querySelectorAll('[data-sort]').forEach(x=>{x.dataset.direction='';x.textContent=`${x.dataset.label} ↕`});
        button.dataset.direction=ascending?'asc':'desc';button.textContent=`${button.dataset.label} ${ascending?'↑':'↓'}`;
      };
    });
  });
}

// Search only prefecture, city, and facility name.
const facilitySearchIndex=FACILITY_SEARCH.buildIndex(facilityDataset,materialDisplayNumbers);
const facilityEntries=facilitySearchIndex.entries;
let facilityQuery='',selectedFacilityId=null,unfilteredList=null,unfilteredScroll=0;
function detailMarkup(selected,definition){
  return selected?`<section class="material-detail facilities-top-detail"><div class="material-detail-copy"><div class="facility-record-head"><span>${IS_EN?'Collection':'資料'}${definition[1]} / ${ui('detail')}</span><span>${ui('related')} ${visibleRelatedLinks(selected.relatedLinks).length}${ui('count')}</span></div><h2>${h(displayName(selected))}</h2><div class="facility-register"><div><span>${ui('pref')}</span><span>${h(selected.prefecture)}</span></div><div><span>${ui('city')}</span><span>${h(selected.city)}</span></div><div><span>${ui('type')}</span><span>${h(displayType(selected))}</span></div><div class="facility-register-wide"><span>${ui('related')}</span><span>${relatedLinksMarkup(selected.relatedLinks)}</span></div><div class="facility-register-wide"><span>${ui('note')}</span><span>${h(displayNote(selected))}</span></div><div class="facility-register-wide"><span>${ui('ref')}</span><span>${selected.official?`<a href="${h(selected.official)}" target="_blank" rel="noopener noreferrer">${ui('official')} Website</a>　`:''}<a href="${h(selected.maps)}" target="_blank" rel="noopener noreferrer">${ui('map')}</a>　<a href="${h(selected.maps)}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a> ${referenceMarkup(selected.extra,selected.relatedLinks)}</span></div></div></div><iframe title="${h(displayName(selected))} map" src="https://maps.google.com/maps?q=${encodeURIComponent(`${selected.name} ${selected.prefecture}${selected.city}`)}&output=embed" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></section>`:'';

}
function ledgerRow(entry){
  const x=entry.item,id=`${entry.key}/${entry.index}`;
  return `<tr class="${id===selectedFacilityId?'selected-row':''}" data-prefecture="${h(x.prefecture)}" data-type="${h(displayType(x))}"><td>${x.official?`<a href="${h(x.official)}" target="_blank" rel="noopener noreferrer">${ui('official')}</a> `:''}<a href="${h(x.maps)}" target="_blank" rel="noopener noreferrer">${ui('map')}</a> ${referenceMarkup(x.extra,x.relatedLinks)}</td><td>${h(x.prefecture)}</td><td>${h(x.city)}</td><td><a class="facility-detail-link" href="#facility/${h(id)}" data-all-facility="${h(id)}" aria-controls="facility-detail-panel" aria-expanded="false">${h(displayName(x))}</a></td><td>${h(displayType(x))}</td><td>${relatedLinksMarkup(x.relatedLinks,true)}</td><td>${h(displayNote(x))}</td></tr>`;
}
function ledgerSection(id,number,title,entries,expanded=false){
  return `<details class="all-material-section" id="${h(id)}"${expanded?' open':''}><summary class="reference-heading"><span>${h(number)}</span><h2>${h(title)}</h2><span>${String(entries.length).padStart(3,'0')}${ui('count')}</span></summary><div class="record-table catalog-table"><table aria-label="${h(title)}">${sortableHead}<tbody>${entries.map(ledgerRow).join('')}</tbody></table></div></details>`;
}
function hideFacilityDetail(){
  const panel=document.querySelector('#facility-detail-panel');
  if(!panel||panel.hidden)return;
  panel.hidden=true;
  document.querySelectorAll('[data-all-facility][aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));
  // Keep the URL in sync so reloading does not reopen a dismissed detail.
  if(location.hash.startsWith('#facility/'))history.replaceState(null,'','#facilities');
}
function showFacilityDetail(key,index){
  const entry=facilityEntries.find(e=>e.key===key&&e.index===Number(index));
  if(!entry){hideFacilityDetail();return;}
  selectedFacilityId=`${key}/${index}`;
  const material=document.getElementById('material-'+key);
  if(material)material.open=true;
  const panel=document.querySelector('#facility-detail-panel');
  panel.innerHTML=`<div class="detail-panel-bar"><span>${IS_EN?'Scroll the list to close details':'一覧をスクロールすると詳細を閉じます'}</span><button type="button" id="hide-facility-detail">${ui('close')}</button></div>${detailMarkup(entry.item,materialDefinitions.find(d=>d[0]===key))}`;
  panel.hidden=false;
  document.querySelectorAll('[data-all-facility]').forEach(button=>{
    const selected=button.dataset.allFacility===selectedFacilityId;
    button.setAttribute('aria-expanded',String(selected));
    button.closest('tr').classList.toggle('selected-row',selected);
  });
  document.querySelector('#hide-facility-detail').onclick=()=>{
    const closedId=selectedFacilityId;
    // Explicit dismissal also clears a stale route when the panel is already hidden.
    history.replaceState(null,'','#facilities');
    hideFacilityDetail();
    selectedFacilityId=null;
    document.querySelectorAll('.selected-row').forEach(row=>row.classList.remove('selected-row'));
    const button=[...document.querySelectorAll('[data-all-facility]')].find(b=>b.dataset.allFacility===closedId);
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
  const parsedQuery=FACILITY_SEARCH.parseQuery(facilityQuery,facilitySearchIndex);
  const tokens=parsedQuery.tokens;
  hideFacilityDetail();
  if(tokens.length){
    if(!unfilteredList){
      unfilteredScroll=scroller.scrollTop;
      unfilteredList=document.createDocumentFragment();
      unfilteredList.append(...scroller.childNodes);
    }
    const matches=facilityEntries.filter(entry=>FACILITY_SEARCH.matches(entry,parsedQuery));
    scroller.innerHTML=matches.length?ledgerSection('facility-search-results',IS_EN?'Search':'横断検索',IS_EN?'Search results across all collections':'全資料の検索結果',matches,true):`<p class="empty">${ui('noResult')}</p>`;
    document.querySelector('#facility-search-status').textContent=`${matches.length} / ${facilityEntries.length}${ui('count')}`;
    scroller.scrollTop=0;
  }else{
    if(unfilteredList){scroller.replaceChildren(unfilteredList);unfilteredList=null;scroller.scrollTop=unfilteredScroll;}
    else if(!scroller.children.length){
      scroller.innerHTML=materialDefinitions.map(([key,number,title])=>ledgerSection('material-'+key,'資料'+number,title,facilityEntries.filter(e=>e.key===key))).join('');
      scroller.scrollTop=facilitiesScrollTop;
    }
    document.querySelector('#facility-search-status').textContent=`${IS_EN?'All ': '全'}${facilityEntries.length}${ui('count')}`;
  }
  document.querySelector('#clear-facility-search').disabled=!facilityQuery;
  wireLedgerRows();
}
function facilitiesPage(selectedKey=null,selectedIndex=null){
  active('facilities');
  if(!document.querySelector('.facilities-ledger')){
    unfilteredList=null;
    main.innerHTML=`<div class="facilities-ledger"><div class="facilities-ledger-fixed"><div class="facility-search" role="search"><label for="facility-query">${ui('search')}</label><input id="facility-query" type="search" placeholder="${ui('placeholder')}" autocomplete="off" aria-describedby="facility-search-status" value="${h(facilityQuery)}"><button id="clear-facility-search" type="button">${ui('clear')}</button><output id="facility-search-status" aria-live="polite"></output></div></div><div class="ledger-viewport"><div class="facilities-ledger-scroll" tabindex="0" role="region" aria-label="${ui('places')}"></div><aside id="facility-detail-panel" aria-label="${ui('detail')}" hidden></aside></div></div>`;
    renderLedgerResults();wire();
    const input=document.querySelector('#facility-query'),scroller=document.querySelector('.facilities-ledger-scroll');
    input.addEventListener('input',event=>{if(!event.isComposing){facilityQuery=input.value;renderLedgerResults();}});
    input.addEventListener('compositionend',()=>{facilityQuery=input.value;renderLedgerResults();});
    const clear=()=>{input.value='';facilityQuery='';renderLedgerResults();};
    document.querySelector('#clear-facility-search').onclick=()=>{clear();input.focus();};
    input.addEventListener('keydown',event=>{if(event.key==='Escape'){clear();event.preventDefault();}});
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
  const target=document.getElementById('material-'+key);
  const scroller=document.querySelector('.facilities-ledger-scroll');
  if(target&&scroller){target.open=true;scroller.scrollTop+=target.getBoundingClientRect().top-scroller.getBoundingClientRect().top;}
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
function syncLanguageLinks(){document.querySelectorAll('.language-switch a').forEach(a=>{const base=a.getAttribute('href').split('#')[0];a.href=base+(location.hash||'')})}
addEventListener('hashchange',()=>{syncLanguageLinks();route()});wire();syncLanguageLinks();route();
