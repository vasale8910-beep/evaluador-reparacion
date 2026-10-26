/* Evaluador de Reparación — versión para GitHub Pages.
   Los datos (equipos, piezas y precios) se leen de datos/equipos.json.
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
  return v.slice().sort(V.sortBy==='code'?(a,b)=>codeKey(a).localeCompare(codeKey(b),'es',{numeric:true})
    :V.sortBy==='price'?(a,b)=>n(b.precio)-n(a.precio):(a,b)=>t(a)-t(b));
}
/* Código principal de la pieza: el primer número largo (SAP); si no hay, el número REF */
function codeKey(p){const c=String(p.codigo||'');const m=c.match(/\d{6,}/);if(m)return m[0];const r=c.replace(/^REF\s*/,'').split(/[\s·]/)[0];return r||'~'}
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
let Q='';
function listed(e){
  let v=visible(e);
  if(V.only==='sel')v=v.filter(isSel);
  const q=norm(Q).trim();if(!q)return v;
  const words=q.split(/\s+/);
  return v.filter(p=>{const hay=norm(p.nombre+' '+p.codigo+' '+codeKey(p));
    return words.every(w=>hay.includes(w)||(/^\d+$/.test(w)&&String(p.plano)===w))});
}
function hl(text){const q=norm(Q).trim();if(!q)return esc(text);let out=esc(text);
  q.split(/\s+/).filter(w=>w.length>1).forEach(w=>{const i=norm(text).indexOf(w);if(i>=0){const raw=String(text).substr(i,w.length);out=out.replace(esc(raw),'<mark>'+esc(raw)+'</mark>')}});return out}
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
  st.innerHTML=`<div class="canvas" style="width:${V.zoom*100}%"><img src="${esc(e.plano)}" onerror="if(!this.dataset.f){this.dataset.f=1;this.src=this.getAttribute('src').split('/').pop()}" alt="Plano de ${esc(e.nombre)}" draggable="false">${pins}</div>`;
}
function renderParts(){
  const e=eq(),all=visible(e),vis=listed(e),cur=e.moneda;
  [...$('sortSeg').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===V.sortBy));
  [...$('viewSeg').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===(V.only||'all')));
  $('qClear').hidden=!Q;
  const sel=all.filter(isSel).length;
  $('partCount').textContent=all.length?`${sel} de ${all.length} a reemplazar`+(vis.length!==all.length?` · mostrando ${vis.length}`:''):'';
  $('btnClearSel').hidden=!sel;
  if(!all.length){$('partRows').innerHTML='<tr><td colspan="4" class="muted" style="padding:18px 6px">Este equipo aún no tiene piezas con precio.</td></tr>';return}
  if(!vis.length){$('partRows').innerHTML=`<tr><td colspan="4" class="muted" style="padding:18px 6px">${V.only==='sel'&&!Q?'Aún no marcas piezas para reemplazar.':'Ningún repuesto coincide con «'+esc(Q)+'».'}</td></tr>`;return}
  let lastG=null;
  $('partRows').innerHTML=vis.map(p=>{const q=qtyOf(p,e),pr=n(p.precio),on=isSel(p);
    const cost=on?'<b>'+money(pr*q,cur)+'</b>':'<span class="muted">'+money(pr*q,cur)+'</span>';
    let head='';
    if(V.sortBy==='code'){const g=codeKey(p).slice(0,4);if(g!==lastG){lastG=g;const cnt=vis.filter(x=>codeKey(x).slice(0,4)===g).length;head=`<tr class="grp"><td colspan="4">Código ${esc(g)}… · ${cnt} ${cnt===1?'pieza':'piezas'}</td></tr>`}}
    return head+`<tr class="part${on?' on':''}" data-id="${esc(p.id)}">
      <td><span class="badge" style="border-color:var(--line)">${esc(p.plano||'·')}</span></td>
      <td style="min-width:130px"><div class="pname">${hl(p.nombre)}</div><div class="psub">Cant. ${q}${p.codigo?' · '+hl(p.codigo):''}</div><div class="mcost num">${cost}</div></td>
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
function renderAll(){renderEqSelect();renderInfo();renderStage();renderParts();renderVerdict();renderReg()}

/* ---------- Historial de reparaciones (Google Sheets vía Apps Script) ---------- */
const HURL=()=>String(DATA.historialURL||'').trim();
const CENTROS=()=>(Array.isArray(DATA.centros)&&DATA.centros.length)?DATA.centros:['Mina Providencia','Mina Sandra K','Mina Silencio'];
function renderReg(){
  const on=!!HURL();$('regPanel').hidden=!on;$('expPanel').hidden=!on;if(!on){$('histPanel').hidden=true;return}
  const xc=$('xCentro').value,xe=$('xEquipo').value;
  $('xCentro').innerHTML='<option value="">Todos</option>'+CENTROS().map(c=>`<option ${c===xc?'selected':''}>${esc(c)}</option>`).join('');
  $('xEquipo').innerHTML='<option value="">Todos</option>'+DATA.equipos.map(e=>`<option value="${esc(e.id)}" ${e.id===xe?'selected':''}>${esc(e.nombre)}</option>`).join('');
  const cs=CENTROS();if(!cs.includes(V.centro))V.centro=cs[0];
  $('rCentro').innerHTML=cs.map(c=>`<option ${c===V.centro?'selected':''}>${esc(c)}</option>`).join('');
  const e=eq();$('activosList').innerHTML=(e.activos||[]).filter(a=>!a.centro||a.centro===V.centro).map(a=>`<option value="${esc(a.numero)}">${esc(a.descripcion||'')}</option>`).join('');
  if(!$('rResp').value)$('rResp').value=V.resp||'';
}
function msg(t,bad){$('rMsg').textContent=t;$('rMsg').style.color=bad?'var(--bad)':''}
function payload(){
  const e=eq(),r=compute(e),sel=visible(e).filter(isSel);
  return {centro:$('rCentro').value,activo:$('rActivo').value.trim().toUpperCase(),equipo:e.nombre,equipoId:e.id,ot:$('rOT').value.trim(),responsable:$('rResp').value.trim(),
    decision:$('rDec').value,dictamen:r.label,total:Math.round(r.repair),valorReposicion:r.nv,pct:r.ratio===null?'':+r.ratio.toFixed(1),umbral:r.th,
    piezas:sel.map(p=>`${p.plano} ${p.nombre} x${qtyOf(p,e)}`).join('; '),observaciones:$('rObs').value.trim()};
}
async function saveHist(){
  const d=payload();
  if(!d.activo){msg('Escribe el número de activo.',true);$('rActivo').focus();return}
  if(!d.piezas){msg('Marca al menos una pieza.',true);return}
  if(!d.responsable){msg('Escribe quién registra.',true);$('rResp').focus();return}
  V.resp=d.responsable;saveV();
  $('btnSave').disabled=true;msg('Guardando…');
  const body=JSON.stringify(d);
  try{await fetch(HURL(),{method:'POST',body,headers:{'Content-Type':'text/plain;charset=utf-8'}})}
  catch(err){try{await fetch(HURL(),{method:'POST',body,mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'}})}catch(e2){$('btnSave').disabled=false;msg('No se pudo guardar. Revisa la conexión e inténtalo de nuevo.',true);return}}
  $('btnSave').disabled=false;msg('Reparación guardada en el historial.');
  $('rOT').value='';$('rObs').value='';loadHist();
}
async function loadHist(){
  const a=$('rActivo').value.trim().toUpperCase();if(!a){msg('Escribe el número de activo.',true);return}
  $('histPanel').hidden=false;$('histTitle').textContent=a;$('histRows').innerHTML='<tr><td colspan="3" class="muted">Cargando…</td></tr>';$('histSum').innerHTML='';
  try{
    const r=await fetch(HURL()+(HURL().includes('?')?'&':'?')+'activo='+encodeURIComponent(a),{cache:'no-store'});
    const d=await r.json();const rows=d.rows||[];const e=eq(),cur=e.moneda;
    if(!rows.length){$('histRows').innerHTML='<tr><td colspan="3" class="muted">Este activo aún no tiene reparaciones registradas.</td></tr>';return}
    const tot=rows.reduce((s,x)=>s+n(x.total),0),yr=Date.now()-365*864e5;
    const tot12=rows.filter(x=>new Date(x.fecha).getTime()>=yr).reduce((s,x)=>s+n(x.total),0);
    const nv=n(e.valorReposicion);
    $('histSum').innerHTML=`<div><span>Reparaciones registradas</span><span>${rows.length}</span></div>
      <div><span>Gastado últimos 12 meses</span><span>${money(tot12,cur)}${nv?' · '+(tot12/nv*100).toFixed(0)+'%':''}</span></div>
      <div class="tot"><span>Gastado en total</span><span>${money(tot,cur)}${nv?' · '+(tot/nv*100).toFixed(0)+'% del equipo nuevo':''}</span></div>`;
    $('histRows').innerHTML=rows.map(x=>{const f=new Date(x.fecha);return `<tr><td class="num" style="white-space:nowrap">${isNaN(f)?esc(x.fecha):f.toLocaleDateString('es-CO')}</td>
      <td><div class="pname">${esc(x.decision||'')} · ${esc(x.dictamen||'')}</div><div class="psub">${x.centro?esc(x.centro)+' · ':''}${x.ot?'OT '+esc(x.ot)+' · ':''}${esc(x.responsable||'')}</div><div class="psub">${esc(x.piezas||'')}</div>${x.observaciones?`<div class="hint">${esc(x.observaciones)}</div>`:''}</td>
      <td class="num" style="text-align:right;white-space:nowrap">${money(n(x.total),cur)}</td></tr>`}).join('');
  }catch(err){$('histRows').innerHTML='<tr><td colspan="3" class="muted">No se pudo leer el historial. Revisa la conexión.</td></tr>'}
}
$('btnSave').onclick=saveHist;
function loadXLSX(){return window.XLSX?Promise.resolve(window.XLSX):new Promise((ok,ko)=>{const sc=document.createElement('script');
  sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=()=>ok(window.XLSX);sc.onerror=()=>ko(new Error('xlsx'));document.head.appendChild(sc)})}
function xmsg(t,bad){$('xMsg').textContent=t;$('xMsg').style.color=bad?'var(--bad)':''}
$('btnExport').onclick=async()=>{
  xmsg('Leyendo historial…');$('btnExport').disabled=true;
  try{
    const r=await fetch(HURL()+(HURL().includes('?')?'&':'?')+'todos=1',{cache:'no-store'});const d=await r.json();
    if(!d.version){xmsg('Actualiza el código de Apps Script a la versión nueva para poder descargar todo el historial.',true);return}
    const c=$('xCentro').value,eid=$('xEquipo').value,de=$('xDesde').value,ha=$('xHasta').value;
    const rows=(d.rows||[]).filter(x=>{const f=String(x.fecha).slice(0,10);
      return (!c||x.centro===c)&&(!eid||x.equipoId===eid)&&(!de||f>=de)&&(!ha||f<=ha)});
    if(!rows.length){xmsg('No hay reparaciones con esos filtros.',true);return}
    const det=rows.map(x=>({'Fecha':new Date(x.fecha),'Centro de trabajo':x.centro||'','N° activo':String(x.activo),'Equipo':x.equipo,'OT / aviso':x.ot||'',
      'Responsable':x.responsable||'','Decisión':x.decision||'','Dictamen':x.dictamen||'','Total repuestos':n(x.total),'Valor reposición':n(x.valorReposicion),
      '% de reposición':x.pct===''?'':n(x.pct)/100,'Umbral %':n(x.umbral)/100,'Piezas':x.piezas||'','Observaciones':x.observaciones||''}));
    const byA={};rows.forEach(x=>{const k=x.activo+'|'+(x.centro||'');const a=byA[k]||(byA[k]={'Centro de trabajo':x.centro||'','N° activo':String(x.activo),'Equipo':x.equipo,'Reparaciones':0,'Total gastado':0,'Valor reposición':n(x.valorReposicion),'Última reparación':null});
      a['Reparaciones']++;a['Total gastado']+=n(x.total);const f=new Date(x.fecha);if(!a['Última reparación']||f>a['Última reparación'])a['Última reparación']=f});
    const resA=Object.values(byA).map(a=>Object.assign(a,{'% del equipo nuevo':a['Valor reposición']?a['Total gastado']/a['Valor reposición']:''})).sort((a,b)=>b['Total gastado']-a['Total gastado']);
    const byC={};rows.forEach(x=>{const k=x.centro||'Sin centro';const a=byC[k]||(byC[k]={'Centro de trabajo':k,'Reparaciones':0,'Activos distintos':new Set(),'Total gastado':0});a['Reparaciones']++;a['Activos distintos'].add(x.activo);a['Total gastado']+=n(x.total)});
    const resC=Object.values(byC).map(a=>Object.assign(a,{'Activos distintos':a['Activos distintos'].size}));
    let XL;try{XL=await loadXLSX()}catch(e){XL=null}
    const stamp=new Date().toISOString().slice(0,10);
    if(XL){
      const wb=XL.utils.book_new();
      const add=(data,name,widths,money,pct)=>{const ws=XL.utils.json_to_sheet(data,{cellDates:true});ws['!cols']=widths.map(w=>({wch:w}));
        const rg=XL.utils.decode_range(ws['!ref']);const hdr=Object.keys(data[0]);
        for(let R=1;R<=rg.e.r;R++)hdr.forEach((h,C)=>{const cell=ws[XL.utils.encode_cell({r:R,c:C})];if(!cell)return;
          if(money.includes(h)&&cell.t==='n')cell.z='"$"#,##0';if(pct.includes(h)&&cell.t==='n')cell.z='0.0%';if(cell.t==='d')cell.z='dd/mm/yyyy'});
        XL.utils.book_append_sheet(wb,ws,name)};
      add(det,'Detalle',[12,18,14,30,14,18,16,12,16,16,14,10,60,40],['Total repuestos','Valor reposición'],['% de reposición','Umbral %']);
      add(resA,'Resumen por activo',[18,14,30,13,16,16,16,16],['Total gastado','Valor reposición'],['% del equipo nuevo']);
      add(resC,'Resumen por centro',[20,13,16,16],['Total gastado'],[]);
      XL.writeFile(wb,`historial-costos-${stamp}.xlsx`);
    }else{
      const hdr=Object.keys(det[0]);const csv=[hdr.join(';')].concat(det.map(o=>hdr.map(h=>{let v=o[h];if(v instanceof Date)v=v.toLocaleDateString('es-CO');return '"'+String(v).replace(/"/g,'""')+'"'}).join(';'))).join('\r\n');
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download=`historial-costos-${stamp}.csv`;document.body.appendChild(a);a.click();a.remove();
    }
    xmsg(`Descargadas ${rows.length} reparaciones.`);
  }catch(err){xmsg('No se pudo leer el historial. Revisa la conexión.',true)}
  finally{$('btnExport').disabled=false}
};
$('rCentro').onchange=ev=>{V.centro=ev.target.value;saveV();renderReg()};
$('rActivo').addEventListener('change',()=>{const a=$('rActivo').value.trim().toUpperCase();
  for(const e of DATA.equipos){const f=(e.activos||[]).find(x=>x.numero===a);
    if(f){if(f.centro&&f.centro!==V.centro){V.centro=f.centro;saveV()}if(e.id!==eq().id){V.current=e.id;saveV();renderAll();$('rActivo').value=a}else renderReg();return}}});
$('btnHist').onclick=loadHist;

$('eqSelect').onchange=ev=>{V.current=ev.target.value;saveV();renderAll()};
$('eqModel').onchange=ev=>{V.model[eq().id]=ev.target.value;saveV();renderAll()};
$('zIn').onclick=()=>{V.zoom=Math.min(3,+(V.zoom+0.5).toFixed(1));saveV();renderStage()};
$('zOut').onclick=()=>{V.zoom=Math.max(1,+(V.zoom-0.5).toFixed(1));saveV();renderStage()};
$('sortSeg').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;V.sortBy=b.dataset.s;saveV();renderParts()});
$('q').addEventListener('input',ev=>{Q=ev.target.value;renderParts()});
$('qClear').onclick=()=>{Q='';$('q').value='';renderParts();$('q').focus()};
$('viewSeg').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;V.only=b.dataset.v;saveV();renderParts()});
$('btnClearSel').onclick=()=>{eq().piezas.forEach(p=>delete V.sel[p.id]);saveV();renderStage();renderParts();renderVerdict()};
$('stage').addEventListener('click',ev=>{const pin=ev.target.closest('.pin');if(!pin)return;toggleSel(eq().piezas.find(p=>p.id===pin.dataset.id))});
$('partRows').addEventListener('click',ev=>{const tr=ev.target.closest('[data-tog]')||ev.target.closest('tr.part');if(!tr)return;const id=tr.dataset.tog||tr.dataset.id;toggleSel(eq().piezas.find(p=>p.id===id))});

/* Busca los datos en datos/equipos.json y, si no está, en equipos.json en la raíz */
const getJSON=u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status+' en '+u);return r.json()});
getJSON('equipos.json').catch(()=>getJSON('datos/equipos.json')).then(d=>{
  if(!d||!Array.isArray(d.equipos)||!d.equipos.length)throw new Error('sin equipos');
  d.equipos.forEach(e=>{e.piezas=e.piezas||[];e.piezas.forEach((p,i)=>{if(!p.id)p.id=e.id+'-'+i})});
  DATA=d;$('loading').hidden=true;$('main').hidden=false;
  $('updatedLbl').textContent=d.actualizado?'Precios actualizados el '+d.actualizado+'.':'';
  renderAll();
}).catch(err=>{
  $('loading').hidden=true;$('error').hidden=false;
  $('error').textContent='No se pudieron cargar los datos de los equipos. Si acabas de editar datos/equipos.json, revisa que no falte una coma o una llave. ('+err.message+')';
});
})();
