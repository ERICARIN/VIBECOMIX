// ═══════════════════════════════════════════════
// INIT ──
// ═══════════════════════════════════════════════
function initEditor(){
  applyWrapperSize();
  fitCanvas();
  window.addEventListener('resize',fitCanvas);
  setupZoomAndPan();
  setupPageEdgeHandles();
  setupTopbarSize();
  renderSidebar();
  renderPage();
  snapshot();
  document.getElementById('btn-undo').addEventListener('click',undo);
  document.getElementById('btn-redo').addEventListener('click',redo);
}

function applyWrapperSize(){
  const pg=S.pages[S.currentPage];
  const pw=pageW(pg),ph=pageH(pg);
  const w=document.getElementById('canvas-wrapper');
  w.style.width=pw+'px'; w.style.height=ph+'px';
  w.style.background=S.borderColor;
  document.getElementById('tb-w').value=pw;
  document.getElementById('tb-h').value=ph;
}

function applyViewport(){
  const vp=document.getElementById('canvas-viewport');
  vp.style.transform=`translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`;
  const w=document.getElementById('canvas-wrapper');
  w.style.transformOrigin='center center';
  w.style.transform=`scale(${canvasScale})`;
}

// ═══════════════════════════════════════════════
// FIT CANVAS ──
// ═══════════════════════════════════════════════
function fitCanvas(){
  const area=document.getElementById('canvas-area');
  const pg=S.pages[S.currentPage];
  const pw=pageW(pg),ph=pageH(pg);
  const pad=100;
  canvasScale=Math.min((area.clientWidth-pad)/pw,(area.clientHeight-pad)/ph,1);
  panX=0; panY=0;
  applyViewport();
}

// ═══════════════════════════════════════════════
// ZOOM + PAN ──
// ═══════════════════════════════════════════════
function setupZoomAndPan(){
  const area=document.getElementById('canvas-area');

  area.addEventListener('wheel',e=>{
    if(isDraggingDivider || isDraggingEdge) return;
    if(e.ctrlKey||e.metaKey) return;
    
    e.preventDefault();
    const oldScale=canvasScale;
    const factor=e.deltaY>0?0.92:1.08;
    const newScale=Math.max(0.05,Math.min(8,oldScale*factor));
    const rect=area.getBoundingClientRect();
    const mx=e.clientX-rect.left-rect.width/2;
    const my=e.clientY-rect.top-rect.height/2;
    panX=mx-(mx-panX)*(newScale/oldScale);
    panY=my-(my-panY)*(newScale/oldScale);
    canvasScale=newScale;
    applyViewport();
  },{passive:false});

  let isPanning=false,panStartX=0,panStartY=0,panStartPX=0,panStartPY=0;

  area.addEventListener('mousedown',e=>{
    if(e.button===1||(e.button===0&&e.shiftKey)){
      if (isDraggingDivider || isDraggingEdge) return;
      e.preventDefault();
      isPanning=true;
      panStartX=e.clientX; panStartY=e.clientY;
      panStartPX=panX; panStartPY=panY;
      area.classList.add('panning');
    }
  });

  window.addEventListener('mousemove',e=>{
    if(!isPanning) return;
    panX=panStartPX+(e.clientX-panStartX);
    panY=panStartPY+(e.clientY-panStartY);
    applyViewport();
  });

  window.addEventListener('mouseup',e=>{
    if(isPanning && (e.button===1||e.button===0)){
      isPanning=false;
      area.classList.remove('panning');
    }
  });

  area.addEventListener('contextmenu',e=>{ if(e.button===1) e.preventDefault(); });
}

// ═══════════════════════════════════════════════
// PAGE EDGE RESIZE HANDLES ──
// ═══════════════════════════════════════════════
function setupPageEdgeHandles(){
  document.querySelectorAll('.page-edge-handle').forEach(handle=>{
    handle.addEventListener('mousedown',e=>{
      if(e.button!==0) return;
      e.preventDefault(); e.stopPropagation();
      isDraggingEdge = true;
      
      const dir=handle.dataset.dir;
      const pg=S.pages[S.currentPage];
      const startX=e.clientX,startY=e.clientY;
      const startW=pageW(pg),startH=pageH(pg);

      const startFrames=pg.frames.map(fr=>({id:fr.id,x:fr.x,y:fr.y,w:fr.w,h:fr.h}));
      
      const mm=e2=>{
        const dx=(e2.clientX-startX)/canvasScale;
        const dy=(e2.clientY-startY)/canvasScale;
        let newW=startW, newH=startH;
        if(dir.includes('e')) newW=Math.max(200,Math.round(startW+dx));
        if(dir.includes('s')) newH=Math.max(200,Math.round(startH+dy));
        if(dir.includes('w')) newW=Math.max(200,Math.round(startW-dx));
        if(dir.includes('n')) newH=Math.max(200,Math.round(startH-dy));
        const scaleX=newW/startW, scaleY=newH/startH;
        startFrames.forEach(sf=>{
          const fr=pg.frames.find(f=>f.id===sf.id); if(!fr) return;
          fr.x=Math.round(sf.x*scaleX); fr.y=Math.round(sf.y*scaleY);
          fr.w=Math.round(sf.w*scaleX); fr.h=Math.round(sf.h*scaleY);
        });
        pg.w=newW; pg.h=newH;
        applyWrapperSize();
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
          adjustEdgeSeam(pg, dir, delta, 'stroke');
        } else {
          adjustEdgeSeam(pg, dir, delta, 'border');
        }
        renderPage();
      };

      const mu=()=>{
        isDraggingEdge = false;
        window.removeEventListener('mousemove',mm);
        window.removeEventListener('mouseup',mu);
        window.removeEventListener('wheel',mw);
        snapshot();
      };

      window.addEventListener('mousemove',mm);
      window.addEventListener('mouseup',mu);
      window.addEventListener('wheel',mw, {passive:false});
    });
  });
}

// ═══════════════════════════════════════════════
// TOPBAR SIZE ──
// ═══════════════════════════════════════════════
function setupTopbarSize(){
  document.getElementById('btn-apply-size').addEventListener('click',()=>{
    const nw=Math.max(100,parseInt(document.getElementById('tb-w').value)||S.width);
    const nh=Math.max(100,parseInt(document.getElementById('tb-h').value)||S.height);
    resizePage(S.pages[S.currentPage],nw,nh);
    applyWrapperSize(); fitCanvas(); renderPage(); snapshot();
  });
  document.getElementById('btn-apply-all').addEventListener('click',()=>{
    const nw=Math.max(100,parseInt(document.getElementById('tb-w').value)||S.width);
    const nh=Math.max(100,parseInt(document.getElementById('tb-h').value)||S.height);
    S.pages.forEach(pg=>resizePage(pg,nw,nh));
    S.width=nw; S.height=nh;
    applyWrapperSize(); fitCanvas(); renderSidebar(); renderPage(); snapshot();
  });
}

function resizePage(pg,nw,nh){
  const ow=pageW(pg),oh=pageH(pg);
  const sx=nw/ow,sy=nh/oh;
  pg.frames.forEach(fr=>{ fr.x=Math.round(fr.x*sx); fr.y=Math.round(fr.y*sy); fr.w=Math.round(fr.w*sx); fr.h=Math.round(fr.h*sy); });
  pg.w=nw; pg.h=nh;
}