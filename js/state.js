// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
const S = {
  width:800, height:1100,
  borderColor:'#ffffff', borderWidth:12,
  strokeColor:'#000000', strokeWidth:2,
  pageBg:'#d0cbc4',
  pages:[], currentPage:0,
};
let _fid=0,_lid=0;
const mkFrame=(x,y,w,h)=>({id:++_fid,x,y,w,h,layers:[],borderWidths:{},strokeWidths:{}});
const mkLayer=(src,name)=>({id:++_lid,src,name:name||'Слой',parallax:20,hidden:false,tx:0,ty:0,scale:1,rotate:0});
// Per-page overrides
const pageW=(pg)=>pg.w||S.width;
const pageH=(pg)=>pg.h||S.height;

let activeLayers=null;
let selectedLayerId=null;
let pendingUpload=null;
let canvasScale=1;
let panX=0,panY=0; // viewport pan offset
let pageDragIdx=null;
let layerDragData=null;

// Флаги активного перетаскивания для блокировки глобального зума
let isDraggingDivider = false;
let isDraggingEdge = false;


// ═══════════════════════════════════════════════
// UNDO / REDO ──
// ═══════════════════════════════════════════════
const _history=[]; let _histIdx=-1;
function snapshot(){
  const snap=JSON.parse(JSON.stringify(S.pages));
  _history.splice(_histIdx+1);
  _history.push(snap);
  if(_history.length>30) _history.shift();
  _histIdx=_history.length-1;
  _updateUndoUI();
}
function undo(){
  if(_histIdx<=0) return;
  _histIdx--;
  S.pages=JSON.parse(JSON.stringify(_history[_histIdx]));
  _afterRestore();
}
function redo(){
  if(_histIdx>=_history.length-1) return;
  _histIdx++;
  S.pages=JSON.parse(JSON.stringify(_history[_histIdx]));
  _afterRestore();
}
function _afterRestore(){
  activeLayers=null; selectedLayerId=null;
  if(S.currentPage>=S.pages.length) S.currentPage=S.pages.length-1;
  applyWrapperSize(); renderSidebar(); renderPage(); _updateUndoUI();
}
function _updateUndoUI(){
  const u=document.getElementById('btn-undo'),r=document.getElementById('btn-redo');
  if(u) u.style.opacity=_histIdx>0?'1':'0.4';
  if(r) r.style.opacity=_histIdx<_history.length-1?'1':'0.4';
}

document.addEventListener('keydown',e=>{
  const mac=e.metaKey, ctrl=e.ctrlKey;
  if(!mac&&!ctrl) return;
  
  const code = e.code;
  if(code==='KeyZ'&&!e.shiftKey){ e.preventDefault(); undo(); }
  if(code==='KeyZ'&&e.shiftKey){ e.preventDefault(); redo(); }
  if(code==='KeyY'&&!e.shiftKey){ e.preventDefault(); redo(); }
});