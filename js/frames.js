// ═══════════════════════════════════════════════
// RENDER FRAME ──
// ═══════════════════════════════════════════════
function renderFrame(container,fr){
  const el=document.createElement('div');
  el.className='frame no-select'; el.dataset.fid=fr.id;
  el.style.cssText=`left:${fr.x}px;top:${fr.y}px;width:${fr.w}px;height:${fr.h}px;`;

  const b=S.borderWidth,sw=S.strokeWidth;
  el.style.background=S.borderColor;

  const bTop = (fr.borderWidths && fr.borderWidths.top !== undefined) ? fr.borderWidths.top : b;
  const bBottom = (fr.borderWidths && fr.borderWidths.bottom !== undefined) ? fr.borderWidths.bottom : b;
  const bLeft = (fr.borderWidths && fr.borderWidths.left !== undefined) ? fr.borderWidths.left : b;
  const bRight = (fr.borderWidths && fr.borderWidths.right !== undefined) ? fr.borderWidths.right : b;

  const content=document.createElement('div');
  content.className='frame-content';
  content.style.cssText=`left:${bLeft}px;top:${bTop}px;right:${bRight}px;bottom:${bBottom}px;background:${S.pageBg};`;

  const stack=document.createElement('div'); stack.className='layer-stack';
  const visible=fr.layers.filter(l=>!l.hidden);
  if(visible.length===0){
    const hint=document.createElement('div'); hint.className='frame-upload-hint';
    hint.innerHTML=`<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 16V8m0 0-3 3m3-3 3 3"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg><span>загрузить</span>`;
    hint.addEventListener('click',()=>openUpload(fr.id));
    stack.appendChild(hint);
  } else {
    visible.forEach(layer=>{
      const li=document.createElement('div');
      const isActive=selectedLayerId===layer.id;
      li.className='layer-item'+(isActive?' active-layer':'');
      li.dataset.lid=layer.id; li.dataset.parallax=layer.parallax;
      const img = document.createElement('img'); img.src=layer.src; img.draggable=false;
      applyImgTransform(img,layer);
      if(isActive) setupImgDrag(img,layer);
      li.appendChild(img); stack.appendChild(li);
    });
  }
  content.appendChild(stack);

  const swTop = (fr.strokeWidths && fr.strokeWidths.top !== undefined) ? fr.strokeWidths.top : sw;
  const swBottom = (fr.strokeWidths && fr.strokeWidths.bottom !== undefined) ? fr.strokeWidths.bottom : sw;
  const swLeft = (fr.strokeWidths && fr.strokeWidths.left !== undefined) ? fr.strokeWidths.left : sw;
  const swRight = (fr.strokeWidths && fr.strokeWidths.right !== undefined) ? fr.strokeWidths.right : sw;

  if (swTop > 0) {
    const s = document.createElement('div'); s.className = 'frame-stroke';
    s.style.cssText = `position:absolute;left:0;right:0;top:0;height:${swTop}px;background:${S.strokeColor};pointer-events:none;z-index:99;`;
    content.appendChild(s);
  }
  if (swBottom > 0) {
    const s = document.createElement('div'); s.className = 'frame-stroke';
    s.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:${swBottom}px;background:${S.strokeColor};pointer-events:none;z-index:99;`;
    content.appendChild(s);
  }
  if (swLeft > 0) {
    const s = document.createElement('div'); s.className = 'frame-stroke';
    s.style.cssText = `position:absolute;left:0;top:0;bottom:0;width:${swLeft}px;background:${S.strokeColor};pointer-events:none;z-index:99;`;
    content.appendChild(s);
  }
  if (swRight > 0) {
    const s = document.createElement('div'); s.className = 'frame-stroke';
    s.style.cssText = `position:absolute;right:0;top:0;bottom:0;width:${swRight}px;background:${S.strokeColor};pointer-events:none;z-index:99;`;
    content.appendChild(s);
  }

  // Кнопка удаления и слоев сдвинуты глубже (14px)
  const delBtn=document.createElement('button'); delBtn.className='frame-del-btn'; delBtn.title='Удалить'; delBtn.innerHTML='✕';
  delBtn.addEventListener('click',e=>{ e.stopPropagation(); deleteFrame(fr); });

  const toggle=document.createElement('button'); toggle.className='frame-layers-toggle'+(activeLayers===fr.id?' active':'');
  toggle.innerHTML='⊞'; toggle.title='Слои';
  toggle.addEventListener('click',e=>{ e.stopPropagation(); activeLayers=activeLayers===fr.id?null:fr.id; renderPage(); });

  [['top','h'],['bottom','h'],['left','v'],['right','v']].forEach(([side,dir])=>{
    const zone=document.createElement('div'); zone.className=`split-zone ${side}`;
    
    if(side === 'top') zone.style.top = bTop + 'px';
    if(side === 'bottom') zone.style.bottom = bBottom + 'px';
    if(side === 'left') zone.style.left = bLeft + 'px';
    if(side === 'right') zone.style.right = bRight + 'px';

    const semi=document.createElement('div'); semi.className='split-semi'; semi.textContent='+';
    semi.addEventListener('click',e=>{ e.stopPropagation(); splitFrame(fr,dir); });
    zone.appendChild(semi); el.appendChild(zone);
  });

  el.appendChild(content);
  el.appendChild(delBtn);
  el.appendChild(toggle);
  container.appendChild(el);

  if(activeLayers===fr.id) buildLayersPanel(fr,el);
}

// ═══════════════════════════════════════════════
// DELETE FRAME ──
// ═══════════════════════════════════════════════
function deleteFrame(fr){
  const page=S.pages[S.currentPage];
  if(page.frames.length<=1){ alert('Нельзя удалить единственный фрейм'); return; }
  const idx=page.frames.indexOf(fr);
  const tol=S.borderWidth*2+8;

  let selectedNeighbour = null;
  let mergeDir = '';

  for (let i = 0; i < page.frames.length; i++) {
    const other = page.frames[i];
    if (other === fr) continue;

    if (Math.abs(other.x - fr.x) <= 2 && Math.abs(other.w - fr.w) <= 2) {
      if (Math.abs((fr.y + fr.h) - other.y) <= tol) {
        selectedNeighbour = other;
        mergeDir = 'below';
        break;
      }
      if (Math.abs((other.y + other.h) - fr.y) <= tol) {
        selectedNeighbour = other;
        mergeDir = 'above';
        break;
      }
    }

    if (Math.abs(other.y - fr.y) <= 2 && Math.abs(other.h - fr.h) <= 2) {
      if (Math.abs((fr.x + fr.w) - other.x) <= tol) {
        selectedNeighbour = other;
        mergeDir = 'right';
        break;
      }
      if (Math.abs((other.x + other.w) - fr.x) <= tol) {
        selectedNeighbour = other;
        mergeDir = 'left';
        break;
      }
    }
  }

  if (!selectedNeighbour) {
    const fallbackNeighbours = [];
    page.frames.forEach(other => {
      if (other === fr) return;
      if (Math.abs((fr.y + fr.h) - other.y) <= tol && fr.x >= other.x - 2 && (fr.x + fr.w) <= (other.x + other.w) + 2)
        fallbackNeighbours.push({fr: other, dir: 'below', shared: fr.w});
      if (Math.abs((other.y + other.h) - fr.y) <= tol && fr.x >= other.x - 2 && (fr.x + fr.w) <= (other.x + other.w) + 2)
        fallbackNeighbours.push({fr: other, dir: 'above', shared: fr.w});
      if (Math.abs((fr.x + fr.w) - other.x) <= tol && fr.y >= other.y - 2 && (fr.y + fr.h) <= (other.y + other.h) + 2)
        fallbackNeighbours.push({fr: other, dir: 'right', shared: fr.h});
      if (Math.abs((other.x + other.w) - fr.x) <= tol && fr.y >= other.y - 2 && (fr.y + fr.h) <= (other.y + other.h) + 2)
        fallbackNeighbours.push({fr: other, dir: 'left', shared: fr.h});
    });

    if (fallbackNeighbours.length > 0) {
      fallbackNeighbours.sort((a, b) => b.shared - a.shared);
      selectedNeighbour = fallbackNeighbours[0].fr;
      mergeDir = fallbackNeighbours[0].dir;
    }
  }

  if (selectedNeighbour) {
    if (mergeDir === 'below') {
      selectedNeighbour.y = fr.y;
      selectedNeighbour.h += fr.h;
    } else if (mergeDir === 'above') {
      selectedNeighbour.h += fr.h;
    } else if (mergeDir === 'right') {
      selectedNeighbour.x = fr.x;
      selectedNeighbour.w += fr.w;
    } else if (mergeDir === 'left') {
      selectedNeighbour.w += fr.w;
    }
  }

  page.frames.splice(idx, 1);
  if (activeLayers === fr.id) activeLayers = null;
  if (selectedLayerId && fr.layers.some(l => l.id === selectedLayerId)) selectedLayerId = null;
  
  snapshot();
  renderPage();
}

// ═══════════════════════════════════════════════
// SPLIT ──
// ═══════════════════════════════════════════════
function splitFrame(fr,dir){
  const page=S.pages[S.currentPage];
  const idx=page.frames.indexOf(fr);
  const b=S.borderWidth;
  const half_b = b/2;
  if(dir==='h'){
    const half=Math.floor(fr.h/2);
    const newFr=mkFrame(fr.x,fr.y+half,fr.w,fr.h-half);
    if(!fr.borderWidths) fr.borderWidths={top:b,bottom:b,left:b,right:b};
    fr.borderWidths.bottom = half_b;
    if(!newFr.borderWidths) newFr.borderWidths={top:half_b,bottom:b,left:b,right:b};
    newFr.borderWidths.left = fr.borderWidths.left;
    newFr.borderWidths.right = fr.borderWidths.right;
    fr.h=half;
    page.frames.splice(idx+1,0,newFr);
  } else {
    const half=Math.floor(fr.w/2);
    const newFr=mkFrame(fr.x+half,fr.y,fr.w-half,fr.h);
    if(!fr.borderWidths) fr.borderWidths={top:b,bottom:b,left:b,right:b};
    fr.borderWidths.right = half_b;
    if(!newFr.borderWidths) newFr.borderWidths={top:b,bottom:b,left:half_b,right:b};
    newFr.borderWidths.top = fr.borderWidths.top;
    newFr.borderWidths.bottom = fr.borderWidths.bottom;
    fr.w=half;
    page.frames.splice(idx+1,0,newFr);
  }
  snapshot();
  renderPage();
}
