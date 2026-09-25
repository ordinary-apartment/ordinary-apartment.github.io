const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const context={window:{},console};
vm.createContext(context);
vm.runInContext(fs.readFileSync('generated/facility-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('data.js','utf8'),context);
const dataset=context.window.FACILITY_DATASET;
const numbers=new Map(dataset.materials.map(m=>[m.id,String(m.number).padStart(2,'0')]));
const search=context.window.FACILITY_SEARCH;
const index=search.buildIndex(dataset,numbers);
const find=query=>index.entries.filter(entry=>search.matches(entry,search.parseQuery(query,index)));
const names=entries=>entries.map(entry=>`${entry.item.prefecture}/${entry.item.city}/${entry.item.name}`);

assert.strictEqual(find('リミナル').length,0);
const tokyo=find('東京');
assert(tokyo.length>0);
assert(tokyo.every(entry=>[entry.item.prefecture,entry.item.city,entry.item.name].join(' ').includes('東京')));
assert(find('東京都').every(entry=>[entry.item.prefecture,entry.item.city,entry.item.name].join(' ').includes('東京都')));

const osaka=find('大阪');
assert(osaka.length>0);
assert(osaka.every(entry=>[entry.item.prefecture,entry.item.city,entry.item.name].join(' ').includes('大阪')));

const shinjuku=find('新宿');
assert(shinjuku.length>0);
assert(shinjuku.every(entry=>[entry.item.prefecture,entry.item.city,entry.item.name].join(' ').includes('新宿')));

const tokyoAquarium=find('東京 水族館');
assert(tokyoAquarium.length>0);
assert(tokyoAquarium.every(entry=>[entry.item.prefecture,entry.item.city,entry.item.name].join(' ').includes('東京')));
assert(tokyoAquarium.every(entry=>[entry.item.prefecture,entry.item.city,entry.item.name].join(' ').includes('水族館')));

const aquarium=find('水族館');
assert(aquarium.length>tokyoAquarium.length);
assert(aquarium.some(entry=>entry.item.prefecture!=='東京都'));

const tokyoBayQuery=search.parseQuery('東京湾',index);
assert.deepStrictEqual(Array.from(tokyoBayQuery.text),['東京湾']);
const tokyoBay=find('東京湾');
assert.strictEqual(tokyoBay.length,0);

// Only prefecture, city, and facility name participate in matching.
const fixture={materials:[{id:'fixture',name:'資料にリミナル',items:[
  {prefecture:'東京都',city:'新宿区',name:'通常施設',type:'分類にリミナル',note:'説明にリミナル',relatedLinks:[{title:'リンクにリミナル',url:'https://example.com/リミナル'}]},
  {prefecture:'大阪府',city:'大阪市',name:'リミナル展示館',type:'通常',note:'通常',relatedLinks:[]}
]}]};
const fixtureIndex=search.buildIndex(fixture,new Map([['fixture','01']]));
const fixtureFind=query=>fixtureIndex.entries.filter(entry=>search.matches(entry,search.parseQuery(query,fixtureIndex)));
assert.strictEqual(fixtureFind('リミナル').length,1);
assert.strictEqual(fixtureFind('リミナル')[0].item.name,'リミナル展示館');
assert.strictEqual(fixtureFind('東京 リミナル').length,0);
assert.strictEqual(fixtureFind('新宿').length,1);
assert.strictEqual(fixtureFind('大阪 リミナル').length,1);
assert.strictEqual(fixtureFind('説明').length,0);

console.log('search tests passed',JSON.stringify({tokyo:tokyo.length,osaka:osaka.length,shinjuku:shinjuku.length,tokyoAquarium:tokyoAquarium.length,aquarium:aquarium.length,tokyoBay:tokyoBay.length,fixtureLiminal:fixtureFind('リミナル').length}));
