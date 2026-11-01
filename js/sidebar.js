// ═══════════════════════════════════════════════
// SIDEBAR ──
// ═══════════════════════════════════════════════
function renderSidebar(){
  const list=document.getElementById('page-list');
  list.innerHTML='';
  S.pages.forEach((pg,i)=>{
    const pw=pageW(pg),ph=pageH(pg);
    const ratio=ph/pw;
    const t=document.createElement('div');
    t.className='page-thumb'+(i===S.currentPage?' active':'');
    t.style.paddingTop=(ratio*100)+'%';
    t.draggable=true; t.dataset.idx=i;

    const tc=document.createElement('canvas');
    tc.width=96; tc.height=Math.round(96*ratio);
    drawThumb(tc,pg); t.appendChild(tc);

    const n=document.createElement('div'); n.className='page-thumb-num'; n.textContent=i+1;
    t.appendChild(n);

    t.addEventListener('click',()=>switchPage(i));
    t.addEventListener('dragstart',e=>{ pageDragIdx=i; t.classList.add('dragging-page'); e.dataTransfer.effectAllowed='move'; });
    t.addEventListener('dragend',()=>{ pageDragIdx=null; document.querySelectorAll('.page-thumb').forEach(el=>el.classList.remove('dragging-page','drag-over')); });
    t.addEventListener('dragover',e=>{ e.preventDefault(); if(pageDragIdx===null||pageDragIdx===i) return; document.querySelectorAll('.page-thumb').forEach(el=>el.classList.remove('drag-over')); t.classList.add('drag-over'); });
    t.addEventListener('dragleave',()=>t.classList.remove('drag-over'));
    t.addEventListener('drop',e=>{
      e.preventDefault();
      if(pageDragIdx===null||pageDragIdx===i) return;
      const moved=S.pages.splice(pageDragIdx,1)[0];
      S.pages.splice(parseInt(t.dataset.idx),0,moved);
      S.currentPage=parseInt(t.dataset.idx);
      renderSidebar(); renderPage();
    });
    list.appendChild(t);
  });
  document.getElementById('page-indicator').textContent=S.currentPage+1;
  document.getElementById('page-total').textContent=S.pages.length;
}

function drawThumb(canvas,pg){
  const pw=pageW(pg),ph=pageH(pg);
  const ctx=canvas.getContext('2d');
  const sx=canvas.width/pw,sy=canvas.height/ph;
  ctx.fillStyle=S.borderColor; ctx.fillRect(0,0,canvas.width,canvas.height);
  pg.frames.forEach(fr=>{
    const b=S.borderWidth;
    const cx=(fr.x+b)*sx,cy=(fr.y+b)*sy,cw=(fr.w-b*2)*sx,ch=(fr.h-b*2)*sy;
    if(cw<=0||ch<=0) return;
    ctx.fillStyle=S.pageBg; ctx.fillRect(cx,cy,cw,ch);
    const vis=fr.layers.filter(l=>!l.hidden);
    if(vis.length>0){
      try{
        const img=new Image(); img.src=vis[0].src;
        if(img.complete&&img.naturalWidth>0){
          ctx.save(); ctx.beginPath(); ctx.rect(cx,cy,cw,ch); ctx.clip();
          const iw=img.naturalWidth,ih=img.naturalHeight;
          const ir=iw/ih,fr2=cw/ch;
          let dw,dh;
          if(ir>fr2){dh=ch;dw=ch*ir;}else{dw=cw;dh=cw/ir;}
          ctx.drawImage(img,cx+(cw-dw)/2,cy+(ch-dh)/2,dw,dh);
          ctx.restore();
        }
      }catch(e){}
    }
    if(S.strokeWidth>0){
      ctx.strokeStyle=S.strokeColor; ctx.lineWidth=S.strokeWidth*sx;
      ctx.strokeRect(cx,cy,cw,ch);
    }
  });
}

function switchPage(i){
  S.currentPage=i; activeLayers=null; selectedLayerId=null;
  applyWrapperSize(); fitCanvas(); renderSidebar(); renderPage();
}

document.getElementById('btn-add-page').addEventListener('click',()=>{
  const pg=S.pages[S.currentPage];
  S.pages.push({frames:[mkFrame(0,0,pageW(pg),pageH(pg))],w:pageW(pg),h:pageH(pg)});
  switchPage(S.pages.length-1);
});