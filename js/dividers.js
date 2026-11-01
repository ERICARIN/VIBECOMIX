// ═══════════════════════════════════════════════
// ВЕКТОРНОЕ ДАВЛЕНИЕ (SAI PRESSURE) ДЛЯ СТОРОН ФРЕЙМОВ ──
// ═══════════════════════════════════════════════
function adjustLocalSeam(frA, frB, dir, valueDelta, type) {
  if (!frA.borderWidths) frA.borderWidths = {};
  if (!frB.borderWidths) frB.borderWidths = {};
  if (!frA.strokeWidths) frA.strokeWidths = {};
  if (!frB.strokeWidths) frB.strokeWidths = {};

  const field = type === 'border' ? 'borderWidths' : 'strokeWidths';
  const defaultValue = type === 'border' ? S.borderWidth : S.strokeWidth;

  if (dir === 'h') {
    if (frA[field].bottom === undefined) frA[field].bottom = defaultValue;
    if (frB[field].top === undefined) frB[field].top = defaultValue;

    frA[field].bottom = Math.max(0, frA[field].bottom + valueDelta);
    frB[field].top = Math.max(0, frB[field].top + valueDelta);
  } else if (dir === 'v') {
    if (frA[field].right === undefined) frA[field].right = defaultValue;
    if (frB[field].left === undefined) frB[field].left = defaultValue;

    frA[field].right = Math.max(0, frA[field].right + valueDelta);
    frB[field].left = Math.max(0, frB[field].left + valueDelta);
  }
}

function adjustEdgeSeam(pg, dir, valueDelta, type) {
  const field = type === 'border' ? 'borderWidths' : 'strokeWidths';
  const defaultValue = type === 'border' ? S.borderWidth : S.strokeWidth;
  const pw = pageW(pg), ph = pageH(pg);

  pg.frames.forEach(fr => {
    if (!fr.borderWidths) fr.borderWidths = {};
    if (!fr.strokeWidths) fr.strokeWidths = {};

    if (dir.includes('n') && Math.abs(fr.y) <= 2) {
      if (fr[field].top === undefined) fr[field].top = defaultValue;
      fr[field].top = Math.max(0, fr[field].top + valueDelta);
    }
    if (dir.includes('s') && Math.abs((fr.y + fr.h) - ph) <= 2) {
      if (fr[field].bottom === undefined) fr[field].bottom = defaultValue;
      fr[field].bottom = Math.max(0, fr[field].bottom + valueDelta);
    }
    if (dir.includes('w') && Math.abs(fr.x) <= 2) {
      if (fr[field].left === undefined) fr[field].left = defaultValue;
      fr[field].left = Math.max(0, fr[field].left + valueDelta);
    }
    if (dir.includes('e') && Math.abs((fr.x + fr.w) - pw) <= 2) {
      if (fr[field].right === undefined) fr[field].right = defaultValue;
      fr[field].right = Math.max(0, fr[field].right + valueDelta);
    }
  });
}


// ═══════════════════════════════════════════════
// RENDER PAGE ──
// ═══════════════════════════════════════════════
function renderPage(){
  const page=S.pages[S.currentPage];
  const container=document.getElementById('frame-container');
  container.innerHTML='';
  page.frames.forEach(fr=>renderFrame(container,fr));
  renderDividers(container,page.frames);
}

// ═══════════════════════════════════════════════
// DIVIDERS ──
// ═══════════════════════════════════════════════
function renderDividers(container,frames){
  const tol=Math.max(4,S.borderWidth*2+4);
  const drawn=new Set();
  for(let i=0;i<frames.length;i++){
    for(let j=0;j<frames.length;j++){
      if(i===j) continue;
      const a=frames[i], b=frames[j];

      if(Math.abs((a.y+a.h)-b.y)<=tol){
        const xL=Math.max(a.x,b.x), xR=Math.min(a.x+a.w,b.x+b.w);
        if(xR-xL>4){
          const key=`h_${i}_${j}`;
          if(!drawn.has(key)){
            drawn.add(key);
            drawn.add(`h_${j}_${i}`);
            makeDividerSegment(container,'h',a,b,xL,xR-xL);
          }
        }
      }

      if(Math.abs((a.x+a.w)-b.x)<=tol){
        const yT=Math.max(a.y,b.y), yB=Math.min(a.y+a.h,b.y+b.h);
        if(yB-yT>4){
          const key=`v_${i}_${j}`;
          if(!drawn.has(key)){
            drawn.add(key);
            drawn.add(`v_${j}_${i}`);
            makeDividerSegment(container,'v',a,b,yT,yB-yT);
          }
        }
      }
    }
  }
}

function makeDividerSegment(container,dir,frA,frB,segStart,segLen){
  const h=document.createElement('div'); h.className=`div-handle ${dir}`;
  const line=document.createElement('div'); line.className='div-handle-line'; h.appendChild(line);
  let seamCoord;
  if(dir==='h'){
    seamCoord=frA.y+frA.h;
    h.style.cssText=`left:${segStart}px;top:${seamCoord-7}px;width:${segLen}px;height:14px;`;
  } else {
    seamCoord=frA.x+frA.w;
    h.style.cssText=`top:${segStart}px;left:${seamCoord-7}px;height:${segLen}px;width:14px;`;
  }
  makeDividerInteraction(h,dir,frA,frB,seamCoord,segStart,segLen);
  container.appendChild(h);
}

// ═══════════════════════════════════════════════
// ИСПРАВЛЕННЫЙ ИНТЕРАКТИВНЫЙ АЛГОРИТМ ПЕРЕГОРОДОК ──
// ═══════════════════════════════════════════════
function makeDividerInteraction(h,dir,frA,frB,seamCoord,segStart,segLen){
  h.addEventListener('mousedown',e=>{
    if(e.button!==0) return;
    e.stopPropagation(); e.preventDefault(); h.classList.add('dragging');
    isDraggingDivider = true;

    const tol=Math.max(4,S.borderWidth*2+4);
    const page=S.pages[S.currentPage];
    const allFrames=page.frames;
    const pw = pageW(page), ph = pageH(page);

    // ВЫЧИСЛЕНИЕ СПЛОШНОСТИ ЛИНИИ (ОТ КРАЯ ДО КРАЯ ЛИСТА)
    // Линия считается сплошной, если её длина практически равна полной длине/ширине макета.
    const isFullContinuous = (dir === 'h') ? (Math.abs(segLen - pw) <= tol * 2) : (Math.abs(segLen - ph) <= tol * 2);

    let framesA, framesB;

    if (isFullContinuous) {
      // Сплошная линия: Двигаем ВСЕ фреймы, примыкающие к этой координатной плоскости
      if(dir==='h'){
        framesA=allFrames.filter(f=>Math.abs((f.y+f.h)-seamCoord)<=tol);
        framesB=allFrames.filter(f=>Math.abs(f.y-seamCoord)<=tol);
      } else {
        framesA=allFrames.filter(f=>Math.abs((f.x+f.w)-seamCoord)<=tol);
        framesB=allFrames.filter(f=>Math.abs(f.x-seamCoord)<=tol);
      }
    } else {
      // Одиночная перегородка (Рис. 2): Двигаем ТОЛЬКО два конкретных фрейма, образующих этот сегмент
      framesA = [frA];
      framesB = [frB];
    }

    const startA=framesA.map(f=>dir==='h'?f.h:f.w);
    const startB=framesB.map(f=>dir==='h'?f.h:f.w);
    const startPosB=framesB.map(f=>dir==='h'?f.y:f.x);
    const sm=dir==='h'?e.clientY:e.clientX;
    const minSz=Math.max(20,S.borderWidth*2+10);

    const mm=e2=>{
      const delta=((dir==='h'?e2.clientY:e2.clientX)-sm)/canvasScale;
      framesA.forEach((f,i)=>{
        const newSz=Math.max(minSz,startA[i]+delta);
        if(dir==='h') f.h=newSz;
        else f.w=newSz;
      });
      framesB.forEach((f,i)=>{
        const newPos=startPosB[i]+delta;
        const newSz=Math.max(minSz,startB[i]-delta);
        if(dir==='h'){ f.y=newPos; f.h=newSz; }
        else{ f.x=newPos; f.w=newSz; }
      });
      renderPage();
    };

    const mw=eWheel=>{
      eWheel.preventDefault();
      eWheel.stopPropagation();
      const delta = eWheel.deltaY > 0 ? -1 : 1;
      const hasShift = eWheel.shiftKey;
      const hasCtrl = eWheel.ctrlKey || eWheel.metaKey;

      if (hasShift && hasCtrl) {
        S.strokeWidth = Math.max(0, S.strokeWidth + delta);
      } else if (hasShift) {
        S.borderWidth = Math.max(0, S.borderWidth + delta);
        applyWrapperSize();
      } else if (hasCtrl) {
        framesA.forEach(fa => framesB.forEach(fb => {
          const xLA=Math.max(fa.x,fb.x), xRA=Math.min(fa.x+fa.w,fb.x+fb.w);
          const yTA=Math.max(fa.y,fb.y), yBA=Math.min(fa.y+fa.h,fb.y+fb.h);
          if(dir==='h' && xRA-xLA>4) adjustLocalSeam(fa,fb,dir,delta,'stroke');
          if(dir==='v' && yBA-yTA>4) adjustLocalSeam(fa,fb,dir,delta,'stroke');
        }));
      } else {
        framesA.forEach(fa => framesB.forEach(fb => {
          const xLA=Math.max(fa.x,fb.x), xRA=Math.min(fa.x+fa.w,fb.x+fb.w);
          const yTA=Math.max(fa.y,fb.y), yBA=Math.min(fa.y+fa.h,fb.y+fb.h);
          if(dir==='h' && xRA-xLA>4) adjustLocalSeam(fa,fb,dir,delta,'border');
          if(dir==='v' && yBA-yTA>4) adjustLocalSeam(fa,fb,dir,delta,'border');
        }));
      }
      renderPage();
    };

    const mu=()=>{
      h.classList.remove('dragging');
      isDraggingDivider = false;
      window.removeEventListener('mousemove',mm);
      window.removeEventListener('mouseup',mu);
      window.removeEventListener('wheel',mw);
      snapshot();
    };

    window.addEventListener('mousemove',mm);
    window.addEventListener('mouseup',mu);
    window.addEventListener('wheel',mw, {passive:false});
  });
}