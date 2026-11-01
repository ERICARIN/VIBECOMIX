

// ═══════════════════════════════════════════════
// IMG TRANSFORM ──
// ═══════════════════════════════════════════════
function applyImgTransform(img,layer){
  img.style.transform=`translate(${layer.tx}px,${layer.ty}px) scale(${layer.scale}) rotate(${layer.rotate}deg)`;
}

// ═══════════════════════════════════════════════
// SETUP IMG DRAG ──
// ═══════════════════════════════════════════════
function setupImgDrag(img,layer){
  let ox,oy,otx,oty;
  img.addEventListener('mousedown',e=>{
    if(e.button!==0) return;
    e.preventDefault(); e.stopPropagation();
    ox=e.clientX; oy=e.clientY; otx=layer.tx; oty=layer.ty;
    img.classList.add('is-dragging');
    const mm=e2=>{
      layer.tx=otx+(e2.clientX-ox)/canvasScale;
      layer.ty=oty+(e2.clientY-oy)/canvasScale;
      applyImgTransform(img,layer); syncTI(layer);
    };
    const mu=()=>{ img.classList.remove('is-dragging'); window.removeEventListener('mousemove',mm); window.removeEventListener('mouseup',mu); };
    window.addEventListener('mousemove',mm); window.addEventListener('mouseup',mu);
  });
  img.addEventListener('wheel',e=>{
    e.preventDefault(); e.stopPropagation();
    if(e.shiftKey){
      const deg = e.deltaY > 0 ? -2 : 2;
      layer.rotate = ((layer.rotate + deg) % 360 + 360) % 360;
      if(layer.rotate > 180) layer.rotate -= 360;
    } else {
      layer.scale=Math.max(0.05,Math.min(20,layer.scale+(e.deltaY>0?-0.05:0.05)));
    }
    applyImgTransform(img,layer); syncTI(layer);
  },{passive:false});
}

function syncTI(layer){
  const sv=(cls,v)=>{ const el=document.querySelector(`.${cls}[data-lid="${layer.id}"]`); if(el) el.value=Number.isInteger(v)?v:v.toFixed(2); };
  sv('t-tx',Math.round(layer.tx)); sv('t-ty',Math.round(layer.ty)); sv('t-sc',layer.scale); sv('t-ro',Math.round(layer.rotate));
}

// ═══════════════════════════════════════════════
// LAYERS PANEL ──
// ═══════════════════════════════════════════════
function buildLayersPanel(fr,frameEl){
  const panel=document.createElement('div'); panel.className='layers-panel open';
  const hdr=document.createElement('div'); hdr.className='lp-header';
  hdr.innerHTML='<span>СЛОИ</span><button class="lp-close">✕</button>';
  hdr.querySelector('button').addEventListener('click',()=>{ activeLayers=null; renderPage(); });
  
  // Перетаскивание панели слоев за заголовок
  hdr.style.cursor='move';
  let _pdx,_pdy,_pox,_poy;
  hdr.addEventListener('mousedown',e=>{
    if(e.target.classList.contains('lp-close')) return;
    e.preventDefault(); e.stopPropagation();
    _pdx=e.clientX; _pdy=e.clientY;
    _pox=panel.offsetLeft; _poy=panel.offsetTop;
    const mm2=e2=>{
      panel.style.left=(_pox+(e2.clientX-_pdx))+'px';
      panel.style.top=(_poy+(e2.clientY-_pdy))+'px';
      panel.style.right='auto';
    };
    const mu2=()=>{ window.removeEventListener('mousemove',mm2); window.removeEventListener('mouseup',mu2); };
    window.addEventListener('mousemove',mm2); window.addEventListener('mouseup',mu2);
  });
  panel.appendChild(hdr);
  const list=document.createElement('div'); list.className='lp-list';

  fr.layers.forEach((layer,idx)=>{
    const row=document.createElement('div');
    row.className='lp-row'+(selectedLayerId===layer.id?' sel':'');
    row.draggable=true; row.dataset.idx=idx;
    row.addEventListener('dragstart',e=>{ layerDragData={fr,idx}; row.classList.add('dragging-layer'); e.dataTransfer.effectAllowed='move'; });
    row.addEventListener('dragend',()=>{ layerDragData=null; document.querySelectorAll('.lp-row').forEach(r=>r.classList.remove('dragging-layer','drag-over-top','drag-over-bot')); });
    row.addEventListener('dragover',e=>{ e.preventDefault(); if(!layerDragData||layerDragData.fr!==fr||layerDragData.idx===idx) return; document.querySelectorAll('.lp-row').forEach(r=>r.classList.remove('drag-over-top','drag-over-bot')); row.classList.add(layerDragData.idx<idx?'drag-over-bot':'drag-over-top'); });
    row.addEventListener('dragleave',()=>row.classList.remove('drag-over-top','drag-over-bot'));
    row.addEventListener('drop',e=>{ e.preventDefault(); if(!layerDragData||layerDragData.fr!==fr||layerDragData.idx===idx) return; fr.layers.splice(idx,0,fr.layers.splice(layerDragData.idx,1)[0]); snapshot(); renderPage(); });
    row.addEventListener('click',()=>{ selectedLayerId=layer.id; renderPage(); });

    const thumb=document.createElement('div'); thumb.className='lp-thumb';
    const ti=document.createElement('img'); ti.src=layer.src; ti.style.cssText='width:100%;height:100%;object-fit:cover;display:block;'; thumb.appendChild(ti);
    const grip=document.createElement('span'); grip.className='lp-grip'; grip.textContent='⠿';
    const name=document.createElement('div'); name.className='lp-name'; name.textContent=layer.name;
    const eye=document.createElement('button'); eye.className='lp-eye'+(layer.hidden?' off':''); eye.textContent=layer.hidden?'○':'●';
    eye.addEventListener('click',e=>{ e.stopPropagation(); layer.hidden=!layer.hidden; renderPage(); });
    const del=document.createElement('button'); del.className='lp-del'; del.textContent='✕';
    del.addEventListener('click',e=>{ e.stopPropagation(); fr.layers.splice(idx,1); if(selectedLayerId===layer.id)selectedLayerId=null; snapshot(); renderPage(); });
    row.append(thumb,grip,name,eye,del); list.appendChild(row);

    if(selectedLayerId===layer.id){
      const pr=document.createElement('div'); pr.className='lp-parallax';
      const pSpan=document.createElement('span'); pSpan.className='pval'; pSpan.textContent=layer.parallax;
      pr.innerHTML='<label>Параллакс</label>';
      const pIn=document.createElement('input'); pIn.type='range'; pIn.min=0; pIn.max=100; pIn.step=1; pIn.value=layer.parallax;
      pIn.addEventListener('input',()=>{ layer.parallax=parseInt(pIn.value); pSpan.textContent=layer.parallax; });
      pr.appendChild(pIn); pr.appendChild(pSpan); list.appendChild(pr);

      const tb=document.createElement('div'); tb.className='lp-transform';
      tb.appendChild(Object.assign(document.createElement('div'),{className:'lp-transform-title',textContent:'Трансформация'}));
      const grid=document.createElement('div'); grid.className='lp-t-grid';
      const mkC=(label,unit,val,cls,step,min,max,cb)=>{
        const cell=document.createElement('div'); cell.className='lp-t-cell';
        const lbl=document.createElement('div'); lbl.className='lp-t-label'; lbl.textContent=`${label} ${unit}`;
        const inp=document.createElement('input'); inp.type='number'; inp.className=`lp-t-inp ${cls}`; inp.dataset.lid=layer.id;
        inp.value=step<1?val.toFixed(2):Math.round(val); inp.step=step; inp.min=min; inp.max=max;
        inp.addEventListener('input',()=>{ const v=parseFloat(inp.value)||0; cb(v); const img=document.querySelector(`.layer-item[data-lid="${layer.id}"] img`); if(img) applyImgTransform(img,layer); });
        cell.append(lbl,inp); return cell;
      };
      grid.appendChild(mkC('X','px',layer.tx,'t-tx',1,-9999,9999,v=>layer.tx=v));
      grid.appendChild(mkC('Y','px',layer.ty,'t-ty',1,-9999,9999,v=>layer.ty=v));
      grid.appendChild(mkC('Масштаб','×',layer.scale,'t-sc',0.01,0.01,50,v=>layer.scale=Math.max(0.01,v)));
      grid.appendChild(mkC('Угол','°',layer.rotate,'t-ro',1,-360,360,v=>layer.rotate=v));
      tb.appendChild(grid);
      const rst=document.createElement('button'); rst.className='lp-reset'; rst.textContent='↺ Сбросить';
      rst.addEventListener('click',()=>{ layer.tx=0;layer.ty=0;layer.scale=1;layer.rotate=0; snapshot(); renderPage(); });
      tb.appendChild(rst); list.appendChild(tb);
    }
  });

  panel.appendChild(list);
  const addBtn=document.createElement('button'); addBtn.className='lp-add'; addBtn.textContent='+ добавить слой';
  addBtn.addEventListener('click',()=>openUpload(fr.id));
  panel.appendChild(addBtn);
  frameEl.appendChild(panel);
}

// ═══════════════════════════════════════════════
// FILE UPLOAD ──
// ═══════════════════════════════════════════════
function openUpload(frameId){ pendingUpload=frameId; document.getElementById('file-input').click(); }

document.getElementById('file-input').addEventListener('change',e=>{
  const files=Array.from(e.target.files);
  if(!files.length||!pendingUpload) return;
  const page=S.pages[S.currentPage];
  const fr=page.frames.find(f=>f.id===pendingUpload);
  if(!fr){ pendingUpload=null; e.target.value=''; return; }
  let loaded=0;
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      const layer=mkLayer(ev.target.result,file.name.replace(/\.[^.]+$/,''));
      fr.layers.push(layer); selectedLayerId=layer.id; activeLayers=fr.id;
      if(++loaded===files.length){ pendingUpload=null; e.target.value=''; snapshot(); renderPage(); }
    };
    reader.readAsDataURL(file);
  });
});