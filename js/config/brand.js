/* ==========================================================================
   Brand e anagrafica — unico punto da modificare per cambiare intestazione/footer/logo.
   Identità RICOSTRUITA dal sito www.ferretti-yachts.com (vedi brand/BRAND_GUIDELINES.md): non è un manuale ufficiale.
   I valori tra [parentesi quadre] sono SEGNAPOSTO: completare con i dati reali di chi emette l'offerta.
   ========================================================================== */
const BRAND = {
  name: 'Ferretti Yachts',
  legalName: '[Ragione sociale emittente]',
  office: 'SALES',
  offerPrefix: 'FY-',
  web: 'www.ferretti-yachts.com',
  address: ['[Indirizzo]', '[CAP Città (Prov.)] • Italy'],
  tel: '[Telefono]', fax: '[Fax]', email: '[email@dominio.it]',
  vat: '[P.IVA]',
  colors: { ink: '#212322', petrol: '#003E4D', stone: '#D1CDC7', mist: '#92989B' }
};
// Wordmark provvisorio (da sostituire con l'SVG ufficiale): FERRETTI in Jost 500 spaziato + YACHTS in Jost 300.
// h = altezza nominale (px).
function wordmark(h,fill){return `<svg height="${Math.round(h*0.5)}" viewBox="0 0 440 44" xmlns="http://www.w3.org/2000/svg" style="display:block" role="img" aria-label="Ferretti Yachts">`
  +`<text x="0" y="32" fill="${fill}" font-family="Jost,'Helvetica Neue',Arial,sans-serif" font-size="34" font-weight="500" letter-spacing="7">FERRETTI <tspan font-weight="300">YACHTS</tspan></text></svg>`;}
function logoLight(h){return wordmark(h,'#212322');}   // su sfondo chiaro
function logoDark(h){return wordmark(h,'#ffffff');}    // su sfondo scuro (copertina)
// decorazione di copertina: onde sottili in basso a sinistra
const COVER_SYMBOL = `<svg class="symbol" viewBox="0 0 400 200" preserveAspectRatio="xMinYMax slice" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#D1CDC7" stroke-width="1.2">`
  + [0,1,2,3,4,5,6].map(i=>`<path d="M0 ${120+i*14} C 70 ${95+i*14}, 130 ${145+i*14}, 200 ${120+i*14} S 330 ${95+i*14}, 400 ${120+i*14}" opacity="${(0.55-i*0.07).toFixed(2)}"/>`).join('')+`</svg>`;
function footer(){return `<div class="foot">
  <span><b>${BRAND.legalName}</b><br>${BRAND.address[0]}<br>${BRAND.address[1]}</span>
  <span><b>Tel.</b> ${BRAND.tel}<br><b>Email.</b> ${BRAND.email}</span>
  <span><b>C.F./P.IVA</b> ${BRAND.vat}</span>
  <span class="web">${BRAND.web}</span><span class="notch"></span></div>`;}

// Dati dell'emittente (intestazione e piè di pagina del documento): modificabili dal passo Cliente, salvati nel browser.
const ISSUER_FIELDS=[['legalName','f_i_legal'],['address0','f_i_addr1'],['address1','f_i_addr2'],['tel','f_i_tel'],['email','f_i_mail'],['vat','f_i_vat'],['web','f_i_web']];
const ISSUER_LS='yacht_issuer_v1';
function issuerGet(k){return k==='address0'?BRAND.address[0]:k==='address1'?BRAND.address[1]:BRAND[k]||'';}
function issuerSet(k,v,silent){
  if(k==='address0')BRAND.address[0]=v;else if(k==='address1')BRAND.address[1]=v;else BRAND[k]=v;
  try{localStorage.setItem(ISSUER_LS,JSON.stringify(Object.fromEntries(ISSUER_FIELDS.map(([f])=>[f,issuerGet(f)]))));}catch(_){}
  if(!silent&&typeof setQueue==='function')setQueue();   // copia anche su GitHub
}
(function(){try{const o=JSON.parse(localStorage.getItem(ISSUER_LS)||'null');if(o)Object.keys(o).forEach(k=>{if(o[k]!=null)issuerSet(k,o[k]);});}catch(_){}})();
