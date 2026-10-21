/* Evaluador de Reparación — versión para GitHub Pages.
   Los datos (equipos, piezas y precios) se leen de equipos.json.
   Para cambiar precios, edita ese archivo; no hace falta tocar este código. */
(function(){
const $=id=>document.getElementById(id);
const VKEY='evalrep.gh.v1';
function n(v){const x=parseFloat(v);return isFinite(x)?x:0}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function money(v,cur){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:cur||'COP',maximumFractionDigits:0}).format(v)}catch(e){return Math.round(v).toLocaleString('es')}}
const ls={get(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let V=Object.assign({current:null,model:{},sel:{},sortBy:'tag',zoom:1},ls.get(VKEY)||{});
const saveV=()=>ls.set(VKEY,V);
let DATA=null;

const eq=()=>DATA.equipos.find(e=>e.id===V.current)||DATA.equipos[0];
const modelOf=e=>e.modelos?(V.model[e.id]&&e.modelos.includes(V.model[e.id])?V.model[e.id]:e.modelo):null;
function qtyOf(p,e){const m=modelOf(e);return (m&&p.cantidadPorModelo)?n(p.cantidadPorModelo[m]):n(p.cantidad)}
function inModel(p,e){const m=modelOf(e);return !(m&&p.cantidadPorModelo)||n(p.cantidadPorModelo[m])>0}
function visible(e){
  const v=e.piezas.filter(p=>inModel(p,e)&&n(p.precio)>0);
  const t=p=>{const x=parseFloat(p.plano);return isFinite(x)?x:1e9};
  const c=p=>String(p.codigo||'').replace(/^REF\s*/,'');
  return v.slice().sort(V.sortBy==='code'?(a,b)=>c(a).localeCompare(c(b),'es',{numeric:true}):(a,b)=>t(a)-t(b));
}
const isSel=p=>!!V.sel[p.id];
function toggleSel(p){if(isSel(p))delete V.sel[p.id];else V.sel[p.id]=true;saveV();renderStage();renderParts();renderVerdict()}

function compute(e){
  const vis=visible(e).filter(isSel);
  const repair=vis.reduce((s,p)=>s+n(p.precio)*qtyOf(p,e),0);
  const nv=n(e.valorReposicion), th=n(e.umbral)||60;
  const ratio=nv>0?repair/nv*100:null;
  let v='warn',label='Falta valor del equipo';
  if(ratio!==null){v=ratio<=th?'ok':'bad';label=ratio<=th?'Viable':'No viable'}
  if(repair===0){v='warn';label='Elige piezas'}
  return {count:vis.length,repair,nv,th,ratio,v,label};
}

function renderEqSelect(){$('eqSelect').innerHTML=DATA.equipos.map(e=>`<option value="${esc(e.id)}" ${e.id===eq().id?'selected':''}>${esc(e.nombre)}</option>`).join('')}
function renderInfo(){
  const e=eq(),m=modelOf(e);
  $('modelWrap').hidden=!e.modelos;
  if(e.modelos)$('eqModel').innerHTML=e.modelos.map(x=>`<option ${x===m?'selected':''}>${esc(x)}</option>`).join('');
  const item=(k,v)=>`<div class="kv"><span>${k}</span><b class="num">${v}</b></div>`;
  $('infoView').innerHTML=item('Valor reposición',e.valorReposicion?money(n(e.valorReposicion),e.moneda):'Pendiente')+item('Umbral de reparación',(n(e.umbral)||60)+'%')+(e.ubicacion?item('Ubicación',esc(e.ubicacion)):'');
}
function renderStage(){
  const e=eq(),st=$('stage');
  $('zLbl').textContent=Math.round(V.zoom*100)+'%';
  if(!e.plano){st.innerHTML='<div class="empty-stage">Este equipo aún no tiene plano.</div>';return}
  const pins=visible(e).map(p=>p.x==null?'':`<button class="pin ${isSel(p)?'a-rep':'a-ok'}" style="left:${n(p.x)}%;top:${n(p.y)}%" data-id="${esc(p.id)}" aria-label="${esc(p.plano)} ${esc(p.nombre)}">${esc(p.plano||'•')}</button>`).join('');
  st.innerHTML=`<div class="canvas" style="width:${V.zoom*100}%"><img src="${esc(e.plano)}" alt="Plano de ${esc(e.nombre)}" draggable="false">${pins}</div>`;
}
function renderParts(){
  const e=eq(),vis=visible(e),cur=e.moneda;
  [...$('sortSeg').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===V.sortBy));
  const sel=vis.filter(isSel).length;
  $('partCount').textContent=vis.length?`${sel} de ${vis.length} a reemplazar`:'';
  $('btnClearSel').hidden=!sel;
  if(!vis.length){$('partRows').innerHTML='<tr><td colspan="4" class="muted" style="padding:18px 6px">Este equipo aún no tiene piezas con precio.</td></tr>';return}
  $('partRows').innerHTML=vis.map(p=>{const q=qtyOf(p,e),pr=n(p.precio),on=isSel(p);
    const cost=on?'<b>'+money(pr*q,cur)+'</b>':'<span class="muted">'+money(pr*q,cur)+'</span>';
    return `<tr class="part" data-id="${esc(p.id)}">
      <td><span class="badge" style="border-color:var(--line)">${esc(p.plano||'·')}</span></td>
      <td style="min-width:130px"><div class="pname">${esc(p.nombre)}</div><div class="psub">Cant. ${q}${p.codigo?' · '+esc(p.codigo):''}</div><div class="mcost num">${cost}</div></td>
      <td><button type="button" class="rbtn" data-tog="${esc(p.id)}" aria-pressed="${on}">${on?'✓ Reemplazar':'Reemplazar'}</button></td>
      <td class="r num">${cost}</td></tr>`}).join('');
}
function renderVerdict(){
  const e=eq(),r=compute(e),cur=e.moneda,pct=r.ratio===null?0:Math.min(r.ratio,100);
  const ok=r.ratio===null?null:r.ratio<=r.th;
  $('verdict').className='verdict '+r.v;
  $('verdict').innerHTML=`
    <div class="v-head"><span class="v-label">${r.label}</span><span class="v-total">${money(r.repair,cur)}</span></div>
    <div class="hint" style="margin-top:-6px">Costo de repuestos a reemplazar · ${esc(e.nombre)}</div>
    <div>
      <div class="meter" role="img" aria-label="La reparación equivale al ${r.ratio===null?'—':r.ratio.toFixed(0)}% del valor de reposición">
        <div class="fill" style="width:${pct}%"></div><div class="th" style="left:${Math.min(r.th,100)}%"></div>
      </div>
      <div class="meter-lbl" style="margin-top:4px;position:relative"><span>0%</span><span class="th-lbl" style="left:${Math.min(r.th,100)}%">Umbral ${r.th}%</span><span>100%</span></div>
      ${r.ratio!==null&&r.ratio>100?'<div class="hint fail">La reparación supera el valor del equipo nuevo.</div>':''}
    </div>
    <div class="checks"><div><b class="${ok===null?'muted':ok?'pass':'fail'}">${ok===null?'–':ok?'✓':'✗'}</b><span>${r.ratio===null?'Falta el valor del equipo nuevo para comparar.':`La reparación cuesta el <b class="num" style="min-width:0">${r.ratio.toFixed(1)}%</b> del equipo nuevo. Tope: ${money(r.nv*r.th/100,cur)}.`}</span></div></div>
    <div class="breakdown">
      <div><span>Piezas a reemplazar</span><span>${r.count}</span></div>
      <div class="tot"><span>Total repuestos</span><span>${money(r.repair,cur)}</span></div>
      <div><span class="muted">Valor reposición</span><span class="muted">${r.nv?money(r.nv,cur):'Pendiente'}</span></div>
    </div>`;
  $('dock').innerHTML=`<div class="verdict ${r.v}" style="padding:0;border:0;background:none"><span class="v-label">${r.label}</span></div>
    <div style="text-align:right"><div class="num" style="font-weight:600">${money(r.repair,cur)}</div><div class="hint num">${r.ratio===null?'—':r.ratio.toFixed(0)+'% de reposición'}</div></div>`;
}
function renderAll(){renderEqSelect();renderInfo();renderStage();renderParts();renderVerdict()}

$('eqSelect').onchange=ev=>{V.current=ev.target.value;saveV();renderAll()};
$('eqModel').onchange=ev=>{V.model[eq().id]=ev.target.value;saveV();renderAll()};
$('zIn').onclick=()=>{V.zoom=Math.min(3,+(V.zoom+0.5).toFixed(1));saveV();renderStage()};
$('zOut').onclick=()=>{V.zoom=Math.max(1,+(V.zoom-0.5).toFixed(1));saveV();renderStage()};
$('sortSeg').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;V.sortBy=b.dataset.s;saveV();renderParts()});
$('btnClearSel').onclick=()=>{eq().piezas.forEach(p=>delete V.sel[p.id]);saveV();renderStage();renderParts();renderVerdict()};
$('stage').addEventListener('click',ev=>{const pin=ev.target.closest('.pin');if(!pin)return;toggleSel(eq().piezas.find(p=>p.id===pin.dataset.id))});
$('partRows').addEventListener('click',ev=>{const tr=ev.target.closest('[data-tog]')||ev.target.closest('tr.part');if(!tr)return;const id=tr.dataset.tog||tr.dataset.id;toggleSel(eq().piezas.find(p=>p.id===id))});

fetch('equipos.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(d=>{
  if(!d||!Array.isArray(d.equipos)||!d.equipos.length)throw new Error('sin equipos');
  d.equipos.forEach(e=>{e.piezas=e.piezas||[];e.piezas.forEach((p,i)=>{if(!p.id)p.id=e.id+'-'+i})});
  DATA=d;$('loading').hidden=true;$('main').hidden=false;
  $('updatedLbl').textContent=d.actualizado?'Precios actualizados el '+d.actualizado+'.':'';
  renderAll();
}).catch(err=>{
  $('loading').hidden=true;$('error').hidden=false;
  $('error').textContent='No se pudieron cargar los datos de los equipos. Si acabas de editar equipos.json, revisa que no falte una coma o una llave. ('+err.message+')';
});
})();
