const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
function app(initial,now=100000000){const data=new Map(initial?[["monzuki.collection.v1",JSON.stringify(initial)]]:[]),els={},jobs=[];const ctx={Date:{now:()=>now},Image:class{},setInterval:()=>{},Uint32Array,crypto:require('crypto').webcrypto,setTimeout:f=>jobs.push(f),localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},document:{getElementById(id){return els[id]??={style:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},value:'all',addEventListener(type,fn){this[type+'Listener']=fn},setPointerCapture(){}}}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'cards.js'),'utf8'),ctx);vm.runInContext(script,ctx);return {setTime:t=>now=t,ctx,run:s=>vm.runInContext(s,ctx),data,els,jobs,state:()=>JSON.parse(data.get('monzuki.collection.v1'))}}
const old={counts:{'florami:base':3,'florami:rare':2,'florami:holo':1,'florami:prism':1},packs:2,pending:[{id:'florami',tier:'base',fresh:false,revealed:false}]};
const migrated=app(old);assert.equal(migrated.state().counts['florami:rare'],5);assert.equal(migrated.state().counts['florami:prism'],2);assert.equal(migrated.state().pending[0].tier,'rare');assert.equal(migrated.state().catalogVersion,2);assert.equal(JSON.parse(migrated.data.get('monzuki.collection.v1.before-card-layout-v2')).counts['florami:base'],3);
const again=app(migrated.state());assert.deepEqual(again.state(),migrated.state());
const a=app();for(const c of JSON.parse(fs.readFileSync(path.join(root,'cards.json')))){const base=a.run(`cardFace('${c.id}','base')`),holo=a.run(`cardFace('${c.id}','holo')`),rare=a.run(`cardFace('${c.id}','rare')`);assert(base.includes(c.id+'-creature.webp'));assert(!base.includes('scene-foil'));assert(holo.indexOf('scene-foil')<holo.indexOf('class="creature"'));assert(rare.includes(c.image));assert(!rare.includes('basic-move'));assert.equal((rare.match(/<img /g)||[]).length,1)}
a.run('openPack();openPack()');assert.equal(a.state().packs,1);a.run('tearPack()');a.jobs.shift()();for(let i=0;i<5;i++){a.run('advanceCard();advanceCard()');assert.equal(a.jobs.length,1);a.jobs.shift()()}assert.equal(a.state().pending.filter(c=>c.revealed).length,5);assert.equal(Object.values(a.state().counts).reduce((s,n)=>s+n,0),5);assert(a.els.spread.innerHTML.includes('summary'));
for(const [n,t] of [[0,'base'],[.64999,'base'],[.65,'holo'],[.89999,'holo'],[.90,'rare'],[.97999,'rare'],[.98,'prism']])assert.equal(a.run(`roll(${n})`),t);
console.log('PASS: migration preserves all copies and pending packs, migration is idempotent, 24 basic/illustration pairs render separately, foil behind creatures, no double awards or swipes, rarity boundaries.');

const hours=7200000,b=app();
assert.equal(b.run('save.openings.credits'),5);
b.run('openPack()');assert.equal(b.state().openings.credits,4);
b.setTime(100000000+hours-1);b.run('refreshOpenings()');assert.equal(b.run('save.openings.credits'),4);
b.setTime(100000000+hours);b.run('refreshOpenings()');assert.equal(b.run('save.openings.credits'),5);
b.setTime(100000000+100*hours);b.run('refreshOpenings();opening=false;save.pending=[];openPack()');assert.equal(b.state().openings.credits,4);assert.equal(b.state().openings.anchor,100000000+100*hours);
b.setTime(100000000);b.run('refreshOpenings()');assert.equal(b.run('save.openings.credits'),4);
const zero={catalogVersion:2,counts:{},packs:0,pending:[],openings:{credits:0,anchor:100000000,lastSeen:100000000}};
const limited=app(zero);limited.run('openPack()');assert.equal(limited.state().packs,0);
const restored=app(zero,100000000+7*hours);assert.equal(restored.state().openings.credits,5);
const fractional=app(zero,100000000+hours+3600000);assert.equal(fractional.state().openings.credits,1);assert.equal(fractional.state().openings.anchor,100000000+hours);
const pools=b.run('packThemes.map(p=>p.cards)');assert.equal(new Set(pools.flat()).size,24);assert(pools.every(p=>p.length===8));
for(let i=0;i<3;i++){const test=app();test.run(`selectPack(${i});openPack()`);assert(test.state().pending.every(c=>pools[i].includes(c.id)))}
let reward='token-1',acks=0;const rewarded=app(zero);rewarded.ctx.AndroidAds={pendingReward:()=>reward,acknowledgeReward:()=>{acks++;reward=''},showRewarded:()=>{}};
rewarded.run('onAdState("rewarded")');
assert.equal(rewarded.state().openings.credits,1);assert.equal(acks,1);
reward='token-1';rewarded.run('claimAdReward()');assert.equal(rewarded.state().openings.credits,1);assert.equal(acks,2);
reward='';rewarded.run('onAdState("failed")');assert.equal(rewarded.state().openings.credits,1);
console.log('PASS: exact 2h refill, cap 5, offline regeneration, no overflow banking, backwards clock, exclusive pools, reward deduplication and failed ads.');

const galleryApp=app();
for(let i=0;i<3;i++){galleryApp.run(`selectPack(${i})`);const preview=galleryApp.els.packPreview.innerHTML;const images=[...preview.matchAll(/src="([^"]+)"/g)].map(m=>m[1]);assert.equal(images.length,3);const allowed=galleryApp.run(`packThemes[${i}].cards.map(id=>CARDS.find(c=>c.id===id).image)`);assert(images.every(src=>allowed.includes(src)));}
const gallery=galleryApp.els.boosterGallery;
function gesture(x,y,cancel=false){gallery.onpointerdown({clientX:150,clientY:150,pointerId:1,button:0});gallery.onpointermove({clientX:150+x,clientY:150+y,pointerId:1});if(cancel)gallery.onpointercancel();else gallery.onpointerup({clientX:150+x,clientY:150+y,pointerId:1});}
gesture(-100,5);assert.equal(galleryApp.run('selectedPack'),0);gesture(100,5);assert.equal(galleryApp.run('selectedPack'),2);gesture(5,100);assert.equal(galleryApp.run('selectedPack'),2);gesture(-100,0,true);assert.equal(galleryApp.run('selectedPack'),2);gesture(-15,0);assert.equal(galleryApp.run('selectedPack'),2);gesture(-100,0);let stopped=false;gallery.clickListener({preventDefault(){},stopPropagation(){stopped=true}});assert(stopped);assert.equal(galleryApp.state().packs,0);assert.equal(galleryApp.state().openings.credits,5);
console.log('PASS: previews use selected pool only; pack swipes wrap both ways, ignore vertical/short/cancelled gestures, suppress ghost clicks and spend no openings.');

const orbit=app(),wrapper=orbit.els['booster-0'],originalGallery=orbit.els.boosterGallery.innerHTML;let animation;
wrapper.animate=(frames,options)=>{animation={frames,options}};
orbit.run('selectPack(1)');assert.equal(orbit.els['booster-0'],wrapper);assert.equal(orbit.els.boosterGallery.innerHTML,originalGallery);assert.equal(animation.frames.length,25);assert.equal(animation.options.duration,560);assert.equal(animation.frames.at(-1).transform,wrapper.style.transform);assert.notEqual(animation.frames[0].transform,animation.frames.at(-1).transform);
orbit.run('selectPack(2);selectPack(0)');assert.equal(animation.frames.at(-1).transform,wrapper.style.transform);assert.equal(orbit.state().openings.credits,5);
console.log('PASS: persistent pack elements animate through 25 orbit positions, match final position and wrap without spending openings.');

wrapper.getAnimations=()=>[{playState:"running"}];orbit.run("selectPack(1)");assert.equal(orbit.run("selectedPack"),0);
