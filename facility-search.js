// Pure search logic for the facility ledger.
// Search is intentionally limited to the three public location/name fields.
(function(root){
  const normalizeSearch=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g,' ').trim();

  function buildIndex(dataset,materialDisplayNumbers){
    const entries=dataset.materials.flatMap(material=>material.items.map((item,index)=>({
      item,
      key:material.id,
      index,
      number:materialDisplayNumbers.get(material.id),
      title:material.name,
      // Do not add type, notes, material names, URLs, or any CSV extras here.
      text:normalizeSearch([item.prefecture,item.city,item.name].filter(Boolean).join(' '))
    })));
    return {entries};
  }

  function parseQuery(query){
    const tokens=normalizeSearch(query).split(/\s+/).filter(Boolean);
    return {text:tokens,tokens};
  }

  function matches(entry,parsed){
    return parsed.text.every(token=>entry.text.includes(token));
  }

  root.FACILITY_SEARCH={normalizeSearch,buildIndex,parseQuery,matches};
})(window);
