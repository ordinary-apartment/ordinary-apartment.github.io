// Pure search logic for the facility ledger.  Region terms are resolved
// against structured prefecture/city fields before the remaining terms use
// the ordinary full-text index.
(function(root){
  const normalizeSearch=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g,' ').trim();
  const shortRegion=value=>normalizeSearch(value).replace(/[都府県市区町村]$/,'');

  function addAlias(map,alias,value){
    if(!alias)return;
    if(!map.has(alias))map.set(alias,new Set());
    map.get(alias).add(value);
  }

  function createAliases(materials,field){
    const aliases=new Map();
    materials.forEach(material=>material.items.forEach(item=>{
      const value=normalizeSearch(item[field]);
      addAlias(aliases,value,value);
      addAlias(aliases,shortRegion(value),value);
    }));
    return aliases;
  }

  function buildIndex(dataset,materialDisplayNumbers){
    const prefectures=createAliases(dataset.materials,'prefecture');
    const cities=createAliases(dataset.materials,'city');
    const entries=dataset.materials.flatMap(material=>material.items.map((item,index)=>({
      item,
      key:material.id,
      index,
      number:materialDisplayNumbers.get(material.id),
      title:material.name,
      text:normalizeSearch([
        item.prefecture,item.city,item.name,item.type,item.kind,item.note,
        item.description,item.aim,material.name,material.shortName,
        ...(item.relatedLinks||[]).flatMap(link=>[link.title,link.url])
      ].filter(Boolean).join(' '))
    })));
    return {entries,prefectures,cities};
  }

  function parseQuery(query,index){
    const tokens=normalizeSearch(query).split(/\s+/).filter(Boolean);
    const regions=[];
    const text=[];
    tokens.forEach(token=>{
      const prefectureValues=index.prefectures.get(token);
      const cityValues=index.cities.get(token);
      if(prefectureValues||cityValues){
        regions.push({prefectures:prefectureValues||new Set(),cities:cityValues||new Set()});
      }else text.push(token);
    });
    return {regions,text,tokens};
  }

  function matches(entry,parsed){
    return parsed.regions.every(region=>
      region.prefectures.has(normalizeSearch(entry.item.prefecture))||
      region.cities.has(normalizeSearch(entry.item.city))
    ) && parsed.text.every(token=>entry.text.includes(token));
  }

  root.FACILITY_SEARCH={normalizeSearch,buildIndex,parseQuery,matches};
})(window);
