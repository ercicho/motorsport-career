/* Motorsport Opportunities 3.4.8 - flexible career-time calendar */
(function(){
'use strict';
const catalog=[
{id:'junior-gt',level:0,game:'GT7',track:'Goodwood Motor Circuit',car:'Club / One-Make',title:'GT Weekend · Junior Support Challenge',fee:250,travel:450,days:14,play:21,rep:4,kind:'support'},
{id:'festival-kart',level:0,game:'GT7',track:'Willow Springs International Raceway - Streets of Willow Springs',car:'Racing Kart 125 Shifter',title:'Motorsport Festival · Kart Showcase',fee:120,travel:400,days:14,play:21,rep:3,kind:'festival'},
{id:'f1-paddock',level:0,game:'GT7',track:'Circuit de Barcelona-Catalunya',car:'Road Car / One-Make',title:'Grand Prix Weekend · Young Driver Showcase',fee:350,travel:250,days:14,play:21,rep:5,kind:'support'},
{id:'gt4-test',level:1,game:'ACC',track:'Circuit Zandvoort',car:'GT4 (test)',title:'GT4 Development · Evaluation Day',fee:650,travel:300,days:14,play:21,rep:7,kind:'test'},
{id:'club-wildcard',level:1,game:'GT7',track:'Nürburgring GP',car:'Gr.4',title:'Club Racing · Wildcard Invitation',fee:700,travel:550,days:10,play:14,rep:7,kind:'wildcard'},
{id:'spa-gt4',level:1,game:'ACC',track:'Circuit Paul Ricard',car:'GT4',title:'Endurance Weekend · GT4 Talent Test',fee:900,travel:700,days:14,play:21,rep:8,kind:'test'},
{id:'gt3-test',level:2,game:'ACC',track:'Hungaroring',car:'GT3 (test)',title:'GT3 Regional · Talent Evaluation',fee:1100,travel:650,days:10,play:14,rep:9,kind:'test'},
{id:'endurance',level:2,game:'ACC',track:'Silverstone',car:'GT3',title:'Endurance Paddock · Reserve Driver Trial',fee:1400,travel:500,days:10,play:14,rep:10,kind:'test'}
];
const images={'junior-gt':'opportunity-club.webp','festival-kart':'opportunity-kart.webp','f1-paddock':'opportunity-formula.webp','gt4-test':'opportunity-gt4.webp','club-wildcard':'opportunity-festival.webp','spa-gt4':'opportunity-endurance.webp','gt3-test':'opportunity-gt3.webp','endurance':'opportunity-trial.webp'};
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const en=()=>localStorage.getItem('mc-ui-language')==='en',tr=(it,eng)=>en()?eng:it;
const MS=86400000;
function data(){
  state.opportunities344 ||= {anchor:new Date().toISOString(),entries:{},notified:{}};
  const d=state.opportunities344;
  d.entries ||= {}; d.notified ||= {};
  if(!Number.isFinite(d.careerDay)){
    // Existing invitations retain their relative release stage, but no real-time deadlines survive migration.
    const old=Math.max(0,Math.floor((Date.now()-(Date.parse(d.anchor)||Date.now()))/MS));
    d.careerDay=Math.min(old,21);
  }
  if(!Array.isArray(d.seenRaceIds)) d.seenRaceIds=(state.races||[]).map((r,i)=>String(r.id||r.planId||'legacy-'+i));
  return d;
}
function syncRaceProgress(){
 const d=data(),races=state.races||[],ids=races.map((r,i)=>String(r.id||r.planId||'legacy-'+i));
 const unseen=ids.filter(id=>!d.seenRaceIds.includes(id));
 if(unseen.length){d.careerDay+=7*unseen.length;d.seenRaceIds=ids;return true;}
 return false;
}
function rank(){const n=(state.races||[]).filter(r=>r.outcome==='Classificato').length;return n>=15?2:n>=4?1:0;}
function offer(e){const d=data(),i=catalog.indexOf(e),open=i*3,close=open+e.days,entry=d.entries[e.id];return {open,close,entry,eligible:rank()>=e.level,available:d.careerDay>=open&&d.careerDay<close};}
function outcome(e){const entry=data().entries[e.id];if(!entry)return null;const p=(state.plans||[]).find(x=>x.id===entry.planId);const race=(state.races||[]).find(r=>String(r.planId||'')===String(entry.planId)||(r.event===e.title&&r.track===e.track));return {p,race};}
function isMissed(e){const d=data(),entry=d.entries[e.id];return !!entry&&!outcome(e)?.race&&d.careerDay>entry.deadline;}
function conflicts(e,begin,end){const d=data();return catalog.filter(other=>other.id!==e.id&&d.entries[other.id]&&!outcome(other)?.race&&!isMissed(other)).some(other=>{const x=d.entries[other.id];return begin<=x.deadline&&end>=x.start;});}
function display(){
 const target=$('opportunities344Content');if(!target)return;
 const d=data(),tier=rank();
 const completed=catalog.filter(e=>outcome(e)?.race);
 const missed=catalog.filter(e=>isMissed(e));
 target.innerHTML=`<div class="card"><h3>${tr('Motorsport Opportunities · calendario flessibile','Motorsport Opportunities · flexible calendar')}</h3><p class="helper">${tr('Inviti simulati, non affiliati a organizzatori reali. Le scadenze avanzano soltanto con il tempo carriera, non mentre sei assente.','Simulated invitations, unaffiliated with real organizers. Deadlines advance with career time only, never while you are away.')}</p><p><strong>${tr('Giorno carriera','Career day')}: ${d.careerDay}</strong> · ${tr('Livello scouting','Scouting tier')}: ${tier===0?'Kart / Rookie':tier===1?'Club / GT4':'GT3 / Endurance'}</p><button class="smallbutton" data-op-week="1">${tr('Avanza di una settimana','Advance one career week')}</button><p class="helper">${tr('Ogni gara registrata fa avanzare il calendario di una settimana. Il pulsante permette di avanzare anche senza correre. Gli inviti accettati hanno una proroga utilizzabile una sola volta.','Each recorded race advances the calendar by one week. You can also advance without racing. Accepted invitations have one optional extension.')}</p></div>`+
 catalog.map(e=>{
 const o=offer(e),result=outcome(e),done=!!result?.race,missed=isMissed(e),entry=o.entry;
 const status=done?tr('Completato','Completed'):missed?tr('Impegno non rispettato','Missed commitment'):entry?tr('Iscritto · nel calendario','Registered · in calendar'):d.careerDay>=o.close?tr('Invito scaduto','Invitation expired'):d.careerDay<o.open?tr('Non ancora pubblicato','Not yet announced'):!o.eligible?tr('Requisiti non raggiunti','Requirements not met'):tr('Invito disponibile','Invitation available');
 const can=o.available&&o.eligible&&!entry;
 const begin=Math.max(d.careerDay,o.open),end=begin+e.play;
 const overlap=can&&conflicts(e,begin,end);
 const extend=entry&&!done&&!missed&&!entry.extended;
 return `<div class="card opportunity345-card"><img class="opportunity345-image" src="${images[e.id]}" alt="${esc(e.title)}" loading="lazy"><small>${esc(e.game)} · ${esc(e.kind.toUpperCase())} · ${tr('EVENTO SIMULATO','SIMULATED EVENT')}</small><h3>${esc(e.title)}</h3><p>${esc(e.track)} · ${esc(e.car)}</p><p class="helper">${tr('Iscrizione','Entry fee')}: ${e.fee} Cr. · ${tr('Trasporto indicativo (addebitato nel weekend)','Estimated travel (charged at race weekend)')}: ${e.travel} Cr.</p><p class="helper">${tr('Invito disponibile dal giorno','Invitation opens on career day')} ${o.open} ${tr('al giorno','until day')} ${o.close} · ${tr('Finestra gara','Race window')}: ${e.play} ${tr('giorni carriera','career days')}</p>${entry?`<p class="helper">${tr('Gara da disputare entro il giorno','Race due by career day')} <strong>${entry.deadline}</strong>${entry.extended?' · '+tr('proroga utilizzata','extension used'):''}</p>`:''}<p><strong>${status}</strong>${done?' · P'+esc(result.race.finish||'—'):''}</p>${missed?`<p class="warning">${tr('Invito perso: lo scouting registra un impegno non rispettato. Nessuna penalità economica aggiuntiva.','Invitation missed: scouting records an unfulfilled commitment. No extra financial penalty.')}</p>`:''}${overlap?`<p class="warning">${tr('Conflitto con un altro invito confermato: completa o rinvia prima quello.','Conflicts with another confirmed invitation: complete or postpone it first.')}</p>`:''}<p class="helper">${tr('Possibile visibilità scouting','Potential scouting visibility')}: +${e.rep} · ${tr('nessun contratto garantito','no guaranteed contract')}</p><div class="row"><button class="smallbutton primary" data-op-join="${e.id}" ${can&&!overlap&&balance()>=e.fee?'':'disabled'}>${tr('Accetta invito','Accept invitation')}</button>${extend?`<button class="smallbutton" data-op-extend="${e.id}">${tr('Richiedi rinvio (+7 giorni)','Request extension (+7 days)')}</button>`:''}</div></div>`;
 }).join('')+`<div class="card"><h3>${tr('Scouting · risultati e impegni','Scouting · results and commitments')}</h3><p>${completed.length?completed.map(e=>esc(e.title)+' · P'+esc(outcome(e).race.finish||'—')).join('<br>'):tr('Nessun evento speciale disputato.','No special events completed yet.')}</p><p class="helper">${tr('Impegni non rispettati','Missed commitments')}: ${missed.length}. ${tr('Il rifiuto di un invito non comporta penalità.','Declining an invitation carries no penalty.')}</p></div>`;
}
function join(id){
 const e=catalog.find(x=>x.id===id);if(!e)return;
 const d=data(),o=offer(e);if(!o.available||!o.eligible||o.entry)return;
 const begin=Math.max(d.careerDay,o.open),deadline=begin+e.play;
 if(conflicts(e,begin,deadline)){alert(tr('Hai già un invito confermato nella stessa finestra.','You already have a confirmed invitation in this window.'));return;}
 if(balance()<e.fee){alert(tr('Saldo insufficiente','Insufficient funds'));return;}
 if((state.plans||[]).some(p=>p.opportunity344===id))return;
 if(!confirm(tr('Confermi l’iscrizione? Quota','Confirm entry? Fee')+': '+e.fee+' Cr.\n'+tr('Trasporto e costi gara saranno conteggiati nel weekend.','Travel and race costs are calculated at race weekend.')))return;
 const pid=crypto.randomUUID();
 state.plans.push({id:pid,date:'',event:e.title,game:e.game,track:e.track,car:e.car,rules:tr('Evento speciale simulato · calendario flessibile','Simulated special event · flexible calendar'),ai:'Regular AI / compatible configuration',status:'Da disputare',opportunity344:id});
 d.entries[id]={planId:pid,joinedAt:new Date().toISOString(),start:begin,deadline,extended:false,charged:e.fee};
 addTransaction(tr('Opportunità · quota iscrizione · ','Opportunity · entry fee · ')+e.title,-e.fee,'opportunity344:'+id);
 save();display();
}
function extend(id){const d=data(),e=catalog.find(x=>x.id===id),entry=d.entries[id];if(!e||!entry||entry.extended||isMissed(e)||outcome(e)?.race)return;if(!confirm(tr('Spostare la scadenza di 7 giorni carriera? Il rinvio è utilizzabile una sola volta.','Extend the deadline by 7 career days? Only one extension is allowed.')))return;entry.deadline+=7;entry.extended=true;save();display();}
function advance(){if(!confirm(tr('Avanzare di 7 giorni carriera? Gli inviti possono scadere.','Advance by 7 career days? Invitations may expire.')))return;data().careerDay+=7;save();display();}
function init(){if(!$('opportunities344Content'))return;data();
 if(!$('opportunities344Nav')){const b=document.createElement('button');b.id='opportunities344Nav';b.dataset.page='opportunities344';b.textContent=tr('Opportunità','Opportunities');b.addEventListener('click',()=>{goToPage('opportunities344');display()});$('nav').appendChild(b);}
 $('opportunities344Content').addEventListener('click',ev=>{const b=ev.target.closest('[data-op-join],[data-op-extend],[data-op-week]');if(!b)return;if(b.dataset.opJoin)join(b.dataset.opJoin);else if(b.dataset.opExtend)extend(b.dataset.opExtend);else if(b.dataset.opWeek)advance();});
 display();
 document.addEventListener('mc-cloud-restored',()=>{data();display()});
 document.addEventListener('mc-career-changed',()=>{if(syncRaceProgress()){ /* save only when a new race is recorded; avoid event recursion */ mcCloudLocalSave(JSON.stringify(state)); }if($('opportunities344').classList.contains('active'))display()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
