const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
function app(initial,now=100000000){const data=new Map(initial?[["monzuki.collection.v1",JSON.stringify(initial)]]:[]),els={},jobs=[];const ctx={Date:{now:()=>now},Image:class{},setInterval:()=>{},Uint32Array,crypto:require('crypto').webcrypto,setTimeout:f=>jobs.push(f),localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},document:{getElementById(id){return els[id]??={style:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},value:'all',addEventListener(type,fn){this[type+'Listener']=fn},setPointerCapture(){}}}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'cards.js'),'utf8'),ctx);vm.runInContext(script,ctx);return {setTime:t=>now=t,ctx,run:s=>vm.runInContext(s,ctx),data,els,jobs,state:()=>JSON.parse(data.get('monzuki.collection.v1'))}}
const old={counts:{'florami:base':3,'florami:rare':2,'florami:holo':1,'florami:prism':1},packs:2,pending:[{id:'florami',tier:'base',fresh:false,revealed:false}]};
const migrated=app(old);assert.equal(migrated.state().counts['florami:rare'],5);assert.equal(migrated.state().counts['florami:prism'],2);assert.equal(migrated.state().pending[0].tier,'rare');assert.equal(migrated.state().catalogVersion,2);assert.equal(JSON.parse(migrated.data.get('monzuki.collection.v1.before-card-layout-v2')).counts['florami:base'],3);
const again=app(migrated.state());assert.deepEqual(again.state(),migrated.state());
const a=app();for(const c of JSON.parse(fs.readFileSync(path.join(root,'cards.json')))){const base=a.run(`cardFace('${c.id}','base')`),holo=a.run(`cardFace('${c.id}','holo')`),rare=a.run(`cardFace('${c.id}','rare')`);assert(base.includes(c.id+'-creature.webp'));assert(!base.includes('scene-foil'));assert(holo.indexOf('scene-foil')<holo.indexOf('class="creature"'));assert(rare.includes(c.image));assert(!rare.includes('basic-move'));assert.equal((rare.match(/<img /g)||[]).length,1)}
a.run('openPack();openPack()');assert.equal(a.state().packs,1);a.run('tearPack()');a.jobs.shift()();for(let i=0;i<5;i++){a.run('advanceCard();advanceCard()');assert.equal(a.jobs.length,1);a.jobs.shift()()}assert.equal(a.state().pending.filter(c=>c.revealed).length,5);assert.equal(Object.values(a.state().counts).reduce((s,n)=>s+n,0),5);assert(a.els.spread.innerHTML.includes('summary'));
for(const [n,t] of [[0,'base'],[.65999,'base'],[.66,'holo'],[.90999,'holo'],[.91,'rare'],[.98999,'rare'],[.99,'prism']])assert.equal(a.run(`roll(${n})`),t);
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

const album=app();album.run('renderCollection()');album.els.collectionPack.value='0';album.run('renderCollection()');assert.equal((album.els.grid.innerHTML.match(/class="missing-card"/g)||[]).length,32);assert(!album.els.grid.innerHTML.includes('<img'));assert(album.els.collectionTitle.textContent.includes('Skogsglänta · 0 / 32'));
album.run("save.counts['florami:holo']=3;save.counts['voltique:base']=2;renderCollection()");assert.equal((album.els.grid.innerHTML.match(/class="missing-card"/g)||[]).length,31);assert.equal((album.els.grid.innerHTML.match(/class="owned-slot"/g)||[]).length,1);assert(!album.els.grid.innerHTML.includes('voltique'));assert(album.els.collectionTitle.textContent.includes('1 / 32'));
album.els.filter.value='holo';album.run('renderCollection()');assert.equal((album.els.grid.innerHTML.match(/class="missing-card"/g)||[]).length,7);assert(album.els.grid.innerHTML.includes('florami-creature.webp'));
album.els.collectionPack.value='1';album.els.filter.value='all';album.run('renderCollection()');assert(album.els.collectionTitle.textContent.includes('Åskglöd · 1 / 32'));assert(!album.els.grid.innerHTML.includes('florami'));
album.els.collectionPack.value='all';album.run('renderCollection()');assert.equal((album.els.grid.innerHTML.match(/class="missing-card"/g)||[]).length,94);assert(album.els.collectionTitle.textContent.includes('2 / 96'));console.log('PASS: per-pack album slots, hidden missing art, owned duplicates, rarity filters and all-pack totals.');

const sound=app();sound.run("var chimes=0;playPrismaSound=()=>chimes++;save.pending=[{id:'florami',tier:'prism',revealed:false}];showCard();showCard()");assert.equal(sound.run('chimes'),1);sound.run("save.pending=[{id:'florami',tier:'holo',revealed:false}];showCard()");assert.equal(sound.run('chimes'),1);assert.equal((sound.els.packPreview.innerHTML.match(/class="preview-card"/g)||[]).length,3);assert(sound.els.packPreview.innerHTML.includes("inspect('florami','rare')"));console.log('PASS: clickable previews and Prisma sound only on first reveal.');

for(let i=0;i<3;i++){const tapped=app();tapped.run(`tapPack(${i});tapPack(${i})`);assert.equal(tapped.state().packs,1);assert.equal(tapped.state().openings.credits,4);assert.equal(tapped.state().pendingPack,i);assert(tapped.state().pending.every(c=>pools[i].includes(c.id)));}const emptyTap=app(zero);emptyTap.run('tapPack(1)');assert.equal(emptyTap.state().packs,0);assert(emptyTap.els.adStatus.textContent.includes('Inga öppningar'));assert(!html.includes('id="openButton"'));console.log('PASS: tapping each wrapper opens its pool exactly once; empty balance cannot open; separate open button removed.');

const effects=app();effects.run("var newSounds=0,prismSounds=0,swipeSounds=0;playNewCardSound=()=>newSounds++;playPrismaSound=()=>prismSounds++;playSwipeSound=()=>swipeSounds++;save.pending=[{id:'florami',tier:'base',fresh:true,revealed:false}];showCard();showCard()");assert.equal(effects.run('newSounds'),1);effects.run("save.pending=[{id:'florami',tier:'holo',fresh:false,revealed:false}];showCard()");assert.equal(effects.run('newSounds'),1);effects.run("save.pending=[{id:'florami',tier:'prism',fresh:true,revealed:false}];showCard()");assert.equal(effects.run('prismSounds'),1);assert.equal(effects.run('newSounds'),1);effects.run('advanceCard();advanceCard()');assert.equal(effects.run('swipeSounds'),1);console.log('PASS: new-card sound once, no duplicate-card chime, Prisma takes priority, swipe sound not doubled.');

const music=app();music.run('setMusicEnabled(false)');assert.equal(music.data.get('monzuki.music'),'off');assert.equal(music.run('musicEnabled'),false);music.run('setMusicEnabled(true)');assert.equal(music.data.get('monzuki.music'),'on');assert.equal(music.run('musicEnabled'),true);music.run('setMusicEnabled(false);startAmbience()');assert.equal(music.run('musicBus'),null);console.log('PASS: music toggle persists independently of collection and disabled music cannot start.');
