const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const context={window:{},console};
vm.createContext(context);
vm.runInContext(fs.readFileSync('generated/facility-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('facility-search.js','utf8'),context);
const dataset=context.window.FACILITY_DATASET;
const numbers=new Map(dataset.materials.map((m,i)=>[m.id,String(i+1).padStart(2,'0')]));
const search=context.window.FACILITY_SEARCH;
const index=search.buildIndex(dataset,numbers);
const find=query=>index.entries.filter(entry=>search.matches(entry,search.parseQuery(query,index)));
const names=entries=>entries.map(entry=>`${entry.item.prefecture}/${entry.item.city}/${entry.item.name}`);

const tokyo=find('東京');
assert(tokyo.length>0);
assert(tokyo.every(entry=>entry.item.prefecture==='東京都'));
assert.deepStrictEqual(names(tokyo),names(find('東京都')));

const osaka=find('大阪');
assert(osaka.length>0);
assert(osaka.every(entry=>entry.item.prefecture==='大阪府'));

const shinjuku=find('新宿');
assert(shinjuku.length>0);
assert(shinjuku.every(entry=>entry.item.city==='新宿区'));

const tokyoAquarium=find('東京 水族館');
assert(tokyoAquarium.length>0);
assert(tokyoAquarium.every(entry=>entry.item.prefecture==='東京都'));
assert(tokyoAquarium.every(entry=>entry.text.includes('水族館')));

const aquarium=find('水族館');
assert(aquarium.length>tokyoAquarium.length);
assert(aquarium.some(entry=>entry.item.prefecture!=='東京都'));

const tokyoBayQuery=search.parseQuery('東京湾',index);
assert.strictEqual(tokyoBayQuery.regions.length,0);
assert.deepStrictEqual(Array.from(tokyoBayQuery.text),['東京湾']);
const tokyoBay=find('東京湾');
assert(tokyoBay.some(entry=>entry.item.prefecture==='千葉県'));

console.log('search tests passed',JSON.stringify({tokyo:tokyo.length,osaka:osaka.length,shinjuku:shinjuku.length,tokyoAquarium:tokyoAquarium.length,aquarium:aquarium.length,tokyoBay:tokyoBay.length}));
