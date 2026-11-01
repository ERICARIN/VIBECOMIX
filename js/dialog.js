// ═══════════════════════════════════════════════
// DIALOG ──
// ═══════════════════════════════════════════════
document.getElementById('btn-create').addEventListener('click',()=>{
  S.width       =Math.max(100,parseInt(document.getElementById('inp-width').value)||800);
  S.height      =Math.max(100,parseInt(document.getElementById('inp-height').value)||1100);
  S.borderWidth =Math.max(0,parseInt(document.getElementById('inp-border-width').value));
  S.borderColor =document.getElementById('inp-border-color').value;
  S.strokeWidth =Math.max(0,parseInt(document.getElementById('inp-stroke-width').value));
  S.strokeColor =document.getElementById('inp-stroke-color').value;
  S.pageBg      =document.getElementById('inp-page-bg').value;
  const n=Math.max(1,parseInt(document.getElementById('inp-pages').value)||1);
  for(let i=0;i<n;i++) S.pages.push({frames:[mkFrame(0,0,S.width,S.height)]});
  document.getElementById('dialog-overlay').style.display='none';
  document.getElementById('editor').classList.add('visible');
  initEditor();
});
