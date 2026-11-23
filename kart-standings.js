/* Kart Academy standings v3.4.19. Opponent finishes are deterministic simulation, not GT7 telemetry. */
(function(){
'use strict';
const points=[25,18,15,12,10,8,6,4,2,1];
const names=['Alex Moretti','Luca Ferri','Oliver Hayes','Hugo Laurent','Noah Fischer','Mateo Silva','Daniel Weber','Kenji Sato','Marco Conti','Ethan Brooks','Felix Bauer','Theo Martin','Yuki Tanaka','Rafael Costa','Leo Romano','Oscar Clarke','Nico Rossi','Emil Novak','Adam Kowalski'];
const tr=(it,en)=>localStorage.getItem('mc-ui-language')==='en'?en:it;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hash(s){let h=2166136261;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0}
function random(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
function academy(){return (state.plans||[]).filter(p=>p.road18Kart).sort((a,b)=>(Number(a.kart224Index)||0)-(Number(b.kart224Index)||0))}
function recorded(p){return [...(state.races||[])].reverse().find(r=>String(r.planId||'')===String(p.id))}
function model(){const plans=academy(),driver=state.profile?.driver||tr('Il tuo pilota','Your driver');const racers=[{id:'player',name:driver,points:0,wins:0,results:[],isPlayer:true},...names.map((name,i)=>({id:'ai'+i,name,points:0,wins:0,results:[],isPlayer:false}))];let played=0;
 for(let round=0;round<plans.length;round++){
  const p=plans[round],race=recorded(p);if(!race||p.status!=='Disputato')continue;played++;
  const classified=race.outcome==='Classificato'&&Number.isInteger(Number(race.finish))&&Number(race.finish)>=1&&Number(race.finish)<=20;
  const pos=classified?Number(race.finish):0;const rnd=random(hash(p.id+'|kart-standing-v1'));
  // Fixed strengths and per-round variability, never rerolled by refresh.
  const order=racers.slice(1).map((x,i)=>({x,score:i*0.12+rnd()*4.6})).sort((a,b)=>a.score-b.score);
  const free=Array.from({length:20},(_,i)=>i+1).filter(x=>x!==pos);
  racers[0].results.push({round:round+1,position:pos,outcome:race.outcome,points:pos?(points[pos-1]||0):0});racers[0].points+=pos?(points[pos-1]||0):0;if(pos===1)racers[0].wins++;
  order.forEach(({x},i)=>{const place=free[i];const earned=points[place-1]||0;x.results.push({round:round+1,position:place,points:earned});x.points+=earned;if(place===1)x.wins++});
 }
 return {plans,played,racers:racers.sort((a,b)=>b.points-a.points||b.wins-a.wins||a.name.localeCompare(b.name)),driver};}
function render(){const host=document.getElementById('kart345Standings');if(!host)return;const m=model();if(!m.plans.length){host.innerHTML='';return;}const leader=m.racers[0]?.points||0;const you=m.racers.find(r=>r.isPlayer);const rank=m.racers.indexOf(you)+1;
 host.innerHTML=`<div class="card"><h2>${tr('Classifica generale · Kart Academy','Kart Academy · Championship standings')}</h2><p class="helper">${tr('Round completati','Completed rounds')}: <b>${m.played}/${m.plans.length}</b> · ${tr('Tua posizione','Your position')}: <b>P${rank}</b> · ${tr('Punti','Points')}: <b>${you.points}</b></p><p class="helper">${tr('I risultati degli altri 19 piloti sono simulati in modo stabile e coerente; GT7 non fornisce automaticamente la classifica degli avversari. I tuoi risultati provengono dalle gare registrate.','The other 19 drivers have stable simulated results; GT7 does not automatically provide their championship standings. Your results come from your recorded races.')}</p><div class="scroll"><table><thead><tr><th>Pos.</th><th>${tr('Pilota','Driver')}</th><th>${tr('Punti','Points')}</th><th>${tr('Vittorie','Wins')}</th><th>${tr('Distacco','Gap')}</th>${m.plans.map((p,i)=>`<th title="${esc(p.track)}">R${i+1}</th>`).join('')}</tr></thead><tbody>${m.racers.map((r,i)=>`<tr ${r.isPlayer?'style="background:#293c4d;font-weight:700"':''}><td>${i+1}</td><td>${esc(r.name)}${r.isPlayer?' ★':''}</td><td>${r.points}</td><td>${r.wins}</td><td>${i===0?'—':'−'+(leader-r.points)}</td>${m.plans.map((p,j)=>{const z=r.results.find(x=>x.round===j+1);return `<td>${z?(z.position?'P'+z.position:'DNF'):'—'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div><p class="helper">${tr('Punti per i primi 10','Points for the top 10')}: ${points.join(' / ')}. ${tr('In caso di parità: più vittorie, poi ordine alfabetico.','Ties: most wins, then alphabetical order.')}</p>${m.played===m.plans.length?`<p class="success"><strong>${tr('Campionato concluso','Championship completed')} · ${tr('Posizione finale','Final position')}: P${rank}</strong></p>`:''}</div>`;
 // The legacy manual award UI must not override computed championship standings.
 const legacy=document.getElementById('kart342Panel');if(legacy){legacy.style.display='none';}
 if(m.played===m.plans.length&&!state.kart342Award){const award=[1200,700,350][rank-1]||0;state.kart342Award={position:rank,amount:award,date:new Date().toISOString(),automatic:true};if(award&&!(state.ledger||[]).some(x=>x.ref==='kart342-final-award'))addTransaction('Kart Academy · bonus classifica finale P'+rank,award,'kart342-final-award');window.mcCloudLocalSave(JSON.stringify(state));}
}
function mount(){
 const anchor=document.getElementById('academyKart20')||document.getElementById('road18');
 if(!anchor)return;
 let node=document.getElementById('kart345Standings');
 if(!node){node=document.createElement('div');node.id='kart345Standings';}
 // Keep the standings INSIDE the Kart Academy section, never as a sibling of a page.
 // Reparent any node created by older versions without rebuilding championship data.
 if(node.parentElement!==anchor)anchor.appendChild(node);
 render();
}
const oldRender=renderGlobal();function renderGlobal(){return typeof window.render==='function'?window.render:null}
// `render` is a global lexical function in the original application; wrapping it keeps updates live.
try{const prior=window.render;if(typeof prior==='function'){window.render=function(...args){const x=prior.apply(this,args);queueMicrotask(mount);return x;};}}catch{}
document.addEventListener('mc-career-changed',()=>queueMicrotask(mount));document.addEventListener('mc-cloud-restored',()=>queueMicrotask(mount));document.addEventListener('click',e=>{if(e.target.closest('[data-page],[data-career20]'))queueMicrotask(mount)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
