/* Configuratore Yacht — modulo "quote" */
function discMultiplier(){return (1-(S.discount||0)/100)*(1-(S.discount2||0)/100)*(1-(S.discount3||0)/100);}
function discLabel(){const parts=[S.discount||0];if(S.discount2)parts.push(S.discount2);if(S.discount3)parts.push(S.discount3);return parts.join('+');}
// Sconto per riga: la macchina e ogni accessorio possono avere uno sconto EXTRA (item.disc, anche a più step "5+3")
// che si applica in cascata sopra lo sconto generale (passo Opzioni, condizioni commerciali).
// Lo sconto di riga è EXTRA: si somma (in cascata) allo sconto generale. Accetta uno o più step: "5" oppure "5+3".
function parseSteps(d){
  if(d==null||d==='')return [];
  return String(d).split(/[+;\/\s]+/).map(x=>parseFloat(String(x).replace(',','.'))).filter(x=>isFinite(x)&&x>0).map(x=>Math.min(100,x));
}
function itemMult(d){return discMultiplier()*parseSteps(d).reduce((m,x)=>m*(1-x/100),1);}
function itemDiscLabel(d){const e=parseSteps(d);return e.length?discLabel()+'+'+e.join('+'):discLabel();}
// Machines: by default each one is an ALTERNATIVE solution (customer picks one). A machine flagged
// sameOrder (S.solutions[i].sameOrder, i>0) belongs to the SAME ORDER as the previous one: they are
// quoted together and their totals add up. Consecutive machines linked this way form one "package".
function lineTotals(){
  const mult=discMultiplier();
  const sols=S.solutions.map(s=>{
    const rows=[];
    const mk=(o,d)=>{o.disc=itemDiscLabel(d);o.total=o.partial*itemMult(d);return o;};
    if(!s.sparesOnly)rows.push(mk({code:s.code,desc:s.tableDesc||s.name,unit:s.unit,qty:s.qty,partial:s.unit*s.qty,img:s.img},s.disc));
    const seenAcc=new Set();
    s.accessories.forEach(a=>{
      const key=String(a.code||'').trim().toLowerCase()+'|'+String(a.desc||'').trim().toLowerCase();
      if(key==='|'||seenAcc.has(key))return;   // niente righe vuote né doppioni
      seenAcc.add(key);
      rows.push(mk({code:a.code||(a.group?optGroupLabel(a.group):a.desc),desc:a.desc||'',unit:a.price,qty:a.qty,partial:a.price*a.qty,img:a.img},a.disc));});
    const listTot=rows.reduce((x,r)=>x+r.partial,0);
    return {s,rows,listTot,solTot:rows.reduce((x,r)=>x+r.total,0)};
  });
  const packages=[];
  sols.forEach((sd,i)=>{
    if(i>0&&sd.s.sameOrder)packages[packages.length-1].members.push(i);
    else packages.push({members:[i]});
  });
  packages.forEach((p,pi)=>{
    p.listTot=p.members.reduce((x,i)=>x+sols[i].listTot,0);
    p.net=p.members.reduce((x,i)=>x+sols[i].solTot,0);
    p.members.forEach((i,k)=>{sols[i].pkg=pi+1;sols[i].pos=k+1;sols[i].pkgSize=p.members.length;});
  });
  // registry total: with a single package it is the whole offer; with alternatives it is the first one
  const grand=packages.length?packages[0].net:0;
  return {sols,packages,grand,mult};
}
function solLabel(sd){return sd.pkgSize>1?`${t('solution')} ${sd.pkg}${String.fromCharCode(64+sd.pos)}`:`${t('solution')} ${sd.pkg}`;}
// totals block printed under a machine's table: list subtotal, discount, net total
function totalsHtml(sd,pk,showPkg){
  const rows=[];
  const hasDisc=sd.listTot-sd.solTot>0.005;
  const mk=(lbl,val,cls)=>`<div class="totline${cls?' '+cls:''}"><span>${lbl}</span><span>${val}</span></div>`;
  if(hasDisc){rows.push(mk(t('list_total'),money(sd.listTot)));rows.push(mk(t('discount'),'−'+money(sd.listTot-sd.solTot)));}
  rows.push(`<div class="totbar"><span>${t('total_general')}</span><span>${money(sd.solTot)}</span></div>`);
  let h=`<div class="totblock">${rows.join('')}</div>`;
  if(showPkg&&pk.members.length>1)h+=`<div class="totbar pkg"><span>${t('order_total')} ${sd.pkg} (${pk.members.map((_,k)=>sd.pkg+String.fromCharCode(65+k)).join(' + ')})</span><span>${money(pk.net)}</span></div>`;
  return h;
}

// Motorizzazione e velocità cambiano solo se è selezionato l'optional motore (codice ENG-…): altrimenti restano quelle standard
function engineOptSelected(s){return (s.accessories||[]).some(a=>/^ENG-/i.test(String(a.code||'')));}
function effSpecs(s){
  const sp=Object.assign({},s.specs||{});
  if(!s.custom&&engineOptSelected(s)){
    const m=DATA.machines.find(x=>x.code===s.code);
    if(m&&m.engine_opt){sp.engine=m.engine_opt;if(m.speed_opt)sp.speed=m.speed_opt;}
  }
  return sp;
}
// dati tecnici in sola lettura: griglia di cifre (usata nella scheda soluzione)
function figsHtml(s,keys){
  const sp=effSpecs(s);
  return keys.filter(k=>sp[k]!=null&&String(sp[k]).trim()!=='').map(k=>`<div><b>${esc(locSpec(sp[k]))}</b><span>${esc(t('spec_'+k))}</span></div>`).join('');
}
function heroOf(m,fallback){const ph=(m&&m.photos||[]).map(photoUrl);return ph[0]||fallback||'';}
function specBullets(s){
  const out=[];
  SPEC_FIELDS.forEach(([k])=>{if(s.specs[k])out.push(`${t('spec_'+k)}: ${esc(s.specs[k])}`);});
  return out;
}
// Price tables: when a machine page is taller than an A4 sheet, move the last rows (and the totals
// that follow the table) onto a continuation page, repeating logo, title bar and table header.
function repaginateQuote(){
  const A4H=297*96/25.4;
  const queue=[...document.querySelectorAll('#view .pages > .page')].filter(p=>p.querySelector(':scope > .pad > table.ptable'));
  while(queue.length){
    const p=queue.shift();
    const pad=p.querySelector(':scope > .pad'),foot=pad.querySelector(':scope > .foot'),table=pad.querySelector(':scope > table.ptable');
    if(!foot||!table)continue;
    // content must end where the page's bottom padding starts, so the sheet never grows beyond A4
    const limit=A4H-(parseFloat(getComputedStyle(pad).paddingBottom)||98);
    const bottomOf=()=>{const top=p.getBoundingClientRect().top;let m=0;[...pad.children].forEach(e=>{if(e!==foot)m=Math.max(m,e.getBoundingClientRect().bottom-top);});return m;};
    const rowsOf=()=>[...table.querySelectorAll('tr')].filter(r=>!r.querySelector('th'));
    let cont=null,guard=0;
    while(bottomOf()>limit&&rowsOf().length>1&&guard++<400){
      if(!cont){
        cont=document.createElement('div');cont.className=p.className;
        const cpad=document.createElement('div');cpad.className='pad';
        const logo=pad.querySelector(':scope > .plogo'),bar=pad.querySelector(':scope > .hbar, :scope > .sl-eyebrow');
        if(logo)cpad.appendChild(logo.cloneNode(true));
        if(bar)cpad.appendChild(bar.cloneNode(true));
        const ct=table.cloneNode(false);const head=table.querySelector('tr');if(head)ct.appendChild(head.cloneNode(true));
        cpad.appendChild(ct);
        // everything after the table (totals, order total) travels with the last rows
        let n=table.nextElementSibling;const tail=[];
        while(n&&n!==foot){tail.push(n);n=n.nextElementSibling;}
        tail.forEach(e=>cpad.appendChild(e));
        cpad.appendChild(foot.cloneNode(true));
        cont.appendChild(cpad);p.after(cont);
      }
      const ct=cont.querySelector('table.ptable');
      const last=rowsOf().pop();
      const firstMoved=ct.querySelectorAll('tr')[1];
      ct.insertBefore(last,firstMoved||null);
    }
    if(cont)queue.unshift(cont);
  }
}
// anteprima A4 (794 px) su schermi stretti: si riduce in scala per stare nella pagina (dopo l'impaginazione, che misura in px reali)
function fitPreview(){
  const p=document.querySelector('#view .pages');if(!p)return;
  p.style.zoom='';p.style.padding='';
  const avail=document.documentElement.clientWidth;
  if(avail<860){p.style.padding='6px 0';p.style.zoom=Math.max(.3,(avail-8)/794).toFixed(3);}
}
window.addEventListener('resize',()=>{if(typeof step!=='undefined'&&step===3)fitPreview();});
function stepQuote(){
  const v=$('#view');
  // if the registry file is shared, refresh the preview number to the latest free one (avoids showing a number a colleague just used)
  if(REGISTRY.fileHandle&&!stepQuote._refreshing){stepQuote._refreshing=true;
    reloadRegistry().then(ok=>{stepQuote._refreshing=false;if(ok){const b=S.offerNum;applyNextOfferNumber();if(S.offerNum!==b&&step===3)stepQuote();}}).catch(()=>{stepQuote._refreshing=false;});}
  const {sols,packages}=lineTotals();
  // copertina: foto a tutta pagina del primo modello, titolo grande, riferimenti
  const firstSol=S.solutions.find(x=>!x.sparesOnly&&!x.custom);
  const firstM=firstSol&&DATA.machines.find(x=>x.code===firstSol.code);
  const coverImg=heroOf(firstM,firstSol&&firstSol.img);
  const coverNames=S.solutions.filter(x=>!x.sparesOnly).map(x=>String(x.name).replace(/^Ferretti Yachts\s*/i,'')).filter((v,i,a)=>a.indexOf(v)===i);
  let html=`<div class="page cover">
    ${coverImg?`<img class="cv-hero" src="${coverImg}">`:COVER_SYMBOL}
    <div class="cv-shade"></div>
    <div class="cv-top">${logoDark(80)}</div>
    <div class="cv-main">
      <div class="cv-eyebrow">${t('offer_n')} ${esc(S.offerNum)} · ${esc(S.date)}</div>
      <div class="cv-title">${esc(coverNames.join(' · ')||t('step_quote'))}</div>
      ${S.client?`<div class="cv-client">${esc(S.client)}</div>`:''}
    </div>
    <div class="cv-foot"><div><span>${t('contact').toUpperCase()}</span><b>${esc(S.rep.name)}</b>${esc(S.rep.email)}${S.rep.phone?' · '+esc(S.rep.phone):''}</div><div class="cv-web">${esc(BRAND.web)}</div></div>
  </div>`;
  // lettera: impaginazione editoriale
  const toRows=[[t('l_client'),esc((S.client||'').trim())],
     [t('l_contact'),(S.contact||'').trim()?esc(S.contact.trim())+((S.role||'').trim()?' · '+esc(S.role.trim()):''):''],
     [t('l_phone'),esc((S.phone||'').trim())],[t('l_email'),esc((S.email||'').trim())]].filter(([,v])=>v);
  const fromRows=[[t('l_writtenby'),esc((S.rep.name||'').trim())],['E-mail',esc((S.rep.email||'').trim())],[t('f_repphone'),esc((S.rep.phone||'').trim())],[t('l_ref'),esc((S.offerNum||'').trim())]].filter(([,v])=>v);
  html+=`<div class="page"><div class="pad lt">
    <div class="plogo">${logoLight(34)}</div>
    <div class="lt-eyebrow">${t('offer_n')} ${esc(S.offerNum)} · ${esc(S.date)}</div>
    <div class="lt-subject">${esc(S.subject||t('def_subject'))}</div>
    <div class="lt-grid">
      <div><div class="lt-h">${t('l_client')}</div>${toRows.map(([l,v])=>`<div class="lt-r"><span>${l}</span>${v}</div>`).join('')}</div>
      <div><div class="lt-h">${esc(BRAND.legalName)}</div>${fromRows.map(([l,v])=>`<div class="lt-r"><span>${l}</span>${v}</div>`).join('')}</div>
    </div>
    <div class="lt-body">${esc(S.intro||t('intro_default')).replace(/\n/g,'<br>')}</div>
    <div class="lt-sign"><span>${t('best_regards')}</span><b>${esc(S.rep.name)}</b><span>${esc(BRAND.legalName)} · ${t('sign_dept')}</span></div>
    ${footer()}
  </div></div>`;
  // presentazione dei modelli offerti: una pagina A4 intera per modello (foto a tutta larghezza, testo del cantiere, dati principali)
  const presModels=[];
  S.solutions.forEach(sl=>{if(sl.sparesOnly||sl.custom)return;const m=DATA.machines.find(x=>x.code===sl.code);if(m&&!presModels.some(x=>x.m.code===m.code))presModels.push({m,sl,img:sl.img||imgUrlForCode(m.code)});});
  const clip=(txt,n)=>{txt=String(txt||'').trim();if(txt.length<=n)return txt;const c=txt.slice(0,n);const k=Math.max(c.lastIndexOf('. '),c.lastIndexOf('.\n'));return (k>n*0.5?c.slice(0,k+1):c.replace(/\s+\S*$/,'')+'…');};
  presModels.forEach(({m,sl,img})=>{
    const paras=String((LANG==='en'?(m.story_en||m.desc_en):(m.story||m.desc))||m.desc||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
    const lead=clip(paras[0]||'',260), rest=clip(paras.slice(1).join('\n\n'),(m.photos||[]).length>1?430:1100).split(/\n+/).filter(Boolean);
    const ph=(m.photos||[]).map(photoUrl);
    const hero=ph[0]||img, strip=ph.slice(1,4);
    const shortName=String(m.name).replace(/^Ferretti Yachts\s*/i,'');
    const figs=[['spec_loa',m.loa],['spec_beam',m.beam],['spec_draft',m.draft],['spec_cabins',m.cabins],['spec_persons',m.persons],['spec_speed',effSpecs(sl).speed],['spec_engine',effSpecs(sl).engine],['spec_fuel',m.fuel],['spec_disp_full',m.disp_full]].filter(([,v])=>v)
      .map(([k,v])=>`<div><b>${esc(locSpec(v))}</b><span>${esc(t(k))}</span></div>`).join('');
    html+=`<div class="page pres">
      ${hero?`<img class="pres-hero" src="${hero}">`:'<div class="pres-hero"></div>'}
      <div class="pres-head"><div class="pres-eyebrow">FERRETTI YACHTS · ${esc(LANG==='en'&&m.family==='Gamma flybridge'?'Flybridge range':(m.family||''))}</div>
        <div class="pres-h1">${esc(shortName)}</div>${m.tagline?`<div class="pres-tag">${esc(m.tagline)}</div>`:''}</div>
      <div class="pres-body">
        <div class="pres-lead">${esc(lead)}</div>
        ${rest.length?`<div class="pres-cols">${rest.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}
        <div class="pres-figs">${figs}</div>
        ${strip.length?`<div class="pres-strip">${strip.map(u=>`<img src="${u}">`).join('')}</div>`:''}
        ${m.url?`<div class="pres-link">${esc(t('pres_brochure'))}: ${esc(m.url.replace(/^https?:\/\//,'').replace('/it-it/','/'+(LANG==='en'?'en-us':'it-it')+'/'))}</div>`:''}
      </div>
      ${footer()}
    </div>`;
  });
  // application data page (only the fields that were filled in; whole page omitted when none)
  const appFilled=APP_KEYS.filter(k=>String((S.app&&S.app[k])||'').trim());
  if(appFilled.length){
    html+=`<div class="page"><div class="pad">
      <div class="plogo">${logoLight(30)}</div>
      <div class="hbar"><div class="l">${t('step_application').toUpperCase()}</div><div class="r"></div></div>
      <table class="supply">${appFilled.map(k=>`<tr><td style="width:42%">${t('a_'+k)}</td><td>${esc(String(S.app[k]).trim())}</td></tr>`).join('')}</table>
      ${footer()}
    </div></div>`;
  }
  // solution pages
  sols.forEach((sd,i)=>{const {s,rows,solTot}=sd;const pk=packages[sd.pkg-1];const isPkgLast=sd.pos===sd.pkgSize;
    const priceRowsArr=rows.map((r,ri)=>`<tr><td class="pc">${esc(r.code)}</td><td class="pdesc ce" contenteditable="true" data-editdesc="${i}|${ri}">${esc(r.desc||'')}</td><td class="r nw ce" contenteditable="true" data-editprice="${i}|${ri}">${money(r.unit)}</td>
      <td class="c">${r.qty}</td><td class="r nw">${money(r.partial)}</td><td class="c nw">${r.disc}%</td><td class="r nw tt">${money(r.total)}</td></tr>`);
    // tutte le righe sulla prima pagina: repaginateQuote() sposta le righe in eccesso (e i totali) su pagine di continuazione
    const rowChunks=[priceRowsArr];
    const ptableHead=`<tr><th>${t('code')}</th><th>${t('description')}</th><th class="r">${t('unit_price')}</th>
      <th class="c">${t('qty')}</th><th class="r">${t('partial')}</th><th class="c">${t('discount')}</th>
      <th class="r">${t('total')}</th></tr>`;
    const m=!s.custom&&DATA.machines.find(x=>x.code===s.code);
    const hero=(m&&heroOf(m,s.img))||s.img||'';
    const label=`${solLabel(sd).toUpperCase()}${sd.pkgSize>1?' · '+t('same_order').toUpperCase():(packages.length>1?' · '+t('alternative').toUpperCase():'')}`;
    html+=`<div class="page"><div class="pad">
      <div class="plogo">${logoLight(30)}</div>
      <div class="sl-eyebrow">${label}</div>`;
    if(s.sparesOnly){
      html+=`<div class="sl-title">${esc(s.name)}</div>${s.desc||s.tableDesc?`<div class="sl-note">${esc(s.desc||s.tableDesc||'')}</div>`:''}`;
    } else {
      const keys=['loa','beam','draft','hull','cabins','persons','engine','speed','disp_empty','disp_full','fuel','water'];
      html+=`<div class="sl-title">${esc(s.name)}</div>
      ${hero?`<img class="sl-hero" src="${hero}">`:''}
      <div class="sl-figs">${figsHtml(s,keys)}</div>`;
    }
    html+=`<table class="ptable">${ptableHead}${rowChunks[0].join('')}</table>`;
    html+=`${totalsHtml(sd,pk,isPkgLast)}
      ${footer()}
    </div></div>`;
  });
  // supply + general conditions page
  const sc=[['sc_validity',(S.validity||'30')+' '+t('days')+'.'],['sc_lead',S.lead?S.lead+' '+t('weeks_from_order')+'.':t('def_lead')],
    ['sc_incoterm',S.incoterm||'Ex Works'],['sc_payment',S.payment||t('def_payment')]];
  const scRows=sc.map(([k,val])=>`<tr><td>${t(k)}</td><td>${esc(val)}</td></tr>`).join('');
  const exclItems=(S.exclusions||t('def_exclusions')).split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);
  html+=`<div class="page"><div class="pad">
    <div class="plogo">${logoLight(30)}</div>
    ${S.notes?`<div class="hbar"><div class="l">${t('notes')}</div><div class="r"></div></div><div class="excl-box" style="padding:12px 14px;line-height:1.7">${esc(S.notes).replace(/\n/g,'<br>')}</div>`:''}
    <div class="hbar"><div class="l">${t('exclusions_supply')}</div><div class="r"></div></div>
    <div class="excl-box"><ul>${exclItems.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="hbar"><div class="l">${t('supply_conditions')}</div><div class="r"></div></div>
    <table class="supply">${scRows}</table>
    ${footer()}
  </div></div>`;
  // general conditions — official full terms (EN/IT/ES/FR), flow across pages
  const GT=GENERAL_TERMS[LANG]||GENERAL_TERMS['en'];
  const gcPara=p=>{
    const t2=p.trim();
    if(/^_{5,}$/.test(t2))return `<div class="gc-sign-line"></div>`;
    if(/^\(\*\)/.test(t2))return `<p class="gc-note">${esc(p)}</p>`;
    if(/^timbro e firma|^stamp and signature|^sello y firma|^cachet et signature/i.test(t2))return `<p class="gc-sign-label">${esc(p)}</p>`;
    return `<p>${esc(p)}</p>`;
  };
  const clausesHtml=GT.clauses.map(c=>`<div class="gc-c">${c.t?`<span class="gc-h">${esc(c.t)}</span>`:''}${c.b.map(gcPara).join('')}</div>`).join('');
  html+=`<div class="page terms"><div class="pad">
    <div class="plogo">${logoLight(30)}</div>
    <div class="hbar"><div class="l">${t('general_conditions')}</div><div class="r"></div></div>
    <div class="gc-title">${esc(GT.title)}</div>
    <div class="gc-terms">${clausesHtml}</div>
    ${footer()}
  </div></div>`;

  v.innerHTML=`
    <div class="card app-noprint">
      <h2>${t('step_quote')}</h2><p class="hint">${t('hint_quote')}</p>
      <div class="doc-tools">
        <button class="btn prim" id="btnPrint">🖨 ${t('print_pdf')}</button>
        <button class="btn prim" id="btnSaveAll" style="background:#1f7a4d">✅ ${t('save_all')}</button>
        <span class="fileinfo">${t('filename')}: <b>${esc(suggestedFilename())}.pdf</b></span>
      </div>
      <div style="background:#fff7e6;border:1px solid #ffe1a8;border-radius:9px;padding:12px 14px;font-size:12.5px;color:#7a5b00;line-height:1.6">
        ${t('save_note')}
      </div>
    </div>
    <div class="pages">${html}</div>`;
  repaginateQuote();
  fitPreview();
  $('#btnPrint').onclick=()=>{document.title=suggestedFilename();window.print();};
  $('#btnSaveAll').onclick=saveOfferComplete;
  // inline editing directly in the document preview
  v.querySelectorAll('[data-editname]').forEach(el=>el.addEventListener('blur',()=>{S.solutions[+el.dataset.editname].name=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editspec]').forEach(el=>el.addEventListener('blur',()=>{const[si,k]=el.dataset.editspec.split('|');S.solutions[+si].specs[k]=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editlabel]').forEach(el=>el.addEventListener('blur',()=>{const[si,k]=el.dataset.editlabel.split('|');const s=S.solutions[+si];s.specLabels=s.specLabels||{};s.specLabels[k]=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-delspec]').forEach(el=>el.onclick=()=>{const[si,k]=el.dataset.delspec.split('|');const s=S.solutions[+si];s.hiddenSpecs=s.hiddenSpecs||{};s.hiddenSpecs[k]=true;s.specs[k]='';stepQuote();});
  v.querySelectorAll('[data-addextra]').forEach(b=>b.onclick=()=>{const si=+b.dataset.addextra;const s=S.solutions[si];s.extraSpecs=s.extraSpecs||[];s.extraSpecs.push({label:'',text:''});stepQuote();});
  v.querySelectorAll('[data-editextralabel]').forEach(el=>el.addEventListener('blur',()=>{const[si,ei]=el.dataset.editextralabel.split('|').map(Number);S.solutions[si].extraSpecs[ei].label=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editextratext]').forEach(el=>el.addEventListener('blur',()=>{const[si,ei]=el.dataset.editextratext.split('|').map(Number);S.solutions[si].extraSpecs[ei].text=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-delextra]').forEach(el=>el.onclick=()=>{const[si,ei]=el.dataset.delextra.split('|').map(Number);S.solutions[si].extraSpecs.splice(ei,1);stepQuote();});
  v.querySelectorAll('[data-editmark]').forEach(el=>el.addEventListener('blur',()=>{S.solutions[+el.dataset.editmark].marking=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editdesc]').forEach(el=>el.addEventListener('blur',()=>{const[si,ri]=el.dataset.editdesc.split('|').map(Number);const s=S.solutions[si];if(ri===0)s.tableDesc=el.textContent.trim();else if(s.accessories[ri-1])s.accessories[ri-1].desc=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editprice]').forEach(el=>el.addEventListener('blur',()=>{
    const[si,ri]=el.dataset.editprice.split('|').map(Number);const s=S.solutions[si];
    const raw=String(el.textContent).replace(/[^0-9,.-]/g,'');
    const n=parseFloat(raw.replace(/\./g,'').replace(',','.'))||0;
    if(ri===0)s.unit=n;else if(s.accessories[ri-1])s.accessories[ri-1].price=n;
    stepQuote();
  }));
  v.querySelectorAll('[data-addrowimg]').forEach(inp=>inp.onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    const[si,ri]=inp.dataset.addrowimg.split('|').map(Number);
    const url=URL.createObjectURL(file);
    const s=S.solutions[si];
    if(ri===0){s.img=url;ensureImgs(s);if(!s.imgs.includes(url))s.imgs.unshift(url);}
    else if(s.accessories[ri-1]){s.accessories[ri-1].img=url;}
    stepQuote();
  });
}
function suggestedFilename(){return (S.offerNum||'OFFER').replace(/[^\w\-]/g,'_')+'_'+(S.client||'CLIENT').replace(/[^\w\-]/g,'_').toUpperCase();}
