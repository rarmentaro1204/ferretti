/* Configuratore Yacht — modulo "init" */
/* ============== INIT ============== */
$('#brandLogo').innerHTML=logoDark(30);
setupLoader();
$('#dashBtn').onclick=()=>toggleDashboard(!DASH);
$('#offersBtn').onclick=openOfferList;
loadRegistryLocal();
ghInit();
if(!S.delivery)S.delivery=t('def_delivery');
if(!S.packaging)S.packaging=t('def_packaging');
if(!S.payment)S.payment=t('def_payment');
$('#langSel').value=LANG;
if(CLIENTS.length&&$('#cliTxt'))$('#cliTxt').textContent='✓ '+CLIENTS.length+' '+t('clients');
render();
restoreFolder();

// Prezzi riservati: se la cartella data-private/ è servita (sviluppo locale) i listini si caricano da soli.
// Nel file pubblicato (Netlify) non esistono: si caricano a mano con "Carica listino" e "Carica matrice optional".
async function autoLoadPrivate(){
  if(!/^https?:/.test(location.protocol))return;
  try{
    const a=await fetch('data-private/01_Listino_Prezzi_Ferretti.xlsx',{cache:'no-cache'});
    if(a.ok)applyXlsxBuffer(await a.arrayBuffer(),'01_Listino_Prezzi_Ferretti.xlsx');
    const b=await fetch('data-private/02_Matrice_Optional_Ferretti.xlsx',{cache:'no-cache'});
    if(b.ok){applyMatrixWorkbook(XLSX.read(await b.arrayBuffer(),{type:'array'}),'02_Matrice_Optional_Ferretti.xlsx');if($('#matTxt'))$('#matTxt').textContent='✓ 02_Matrice_Optional_Ferretti.xlsx';render();}
  }catch(e){console.warn('prezzi riservati non caricati',e);}
}
autoLoadPrivate();
