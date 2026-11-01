// ═══════════════════════════════════════════════
// PREVIEW ──
// ═══════════════════════════════════════════════
document.getElementById('btn-preview-toggle').addEventListener('click',openPreview);
document.getElementById('btn-confirm').addEventListener('click',openPreview);
document.getElementById('btn-close-preview').addEventListener('click',()=>document.getElementById('preview-overlay').classList.remove('visible'));

function openPreview(){
  const cont=document.getElementById('preview-pages'); cont.innerHTML='';
  const pg0=S.pages[0]; const scale=Math.min(1,(window.innerWidth-80)/pageW(pg0));
  S.pages.forEach(pg=>{
    const pw=pageW(pg),ph=pageH(pg);
    const p=document.createElement('div'); p.className='preview-page';
    p.style.cssText=`width:${pw*scale}px;height:${ph*scale}px;background:${S.borderColor};`;
    pg.frames.forEach(fr=>{
      const fel=document.createElement('div'); fel.className='preview-frame';
      const b=S.borderWidth,sw=S.strokeWidth;
      fel.style.cssText=`left:${fr.x*scale}px;top:${fr.y*scale}px;width:${fr.w*scale}px;height:${fr.h*scale}px;background:${S.borderColor};`;
      
      const bTop = (fr.borderWidths && fr.borderWidths.top !== undefined) ? fr.borderWidths.top : b;
      const bBottom = (fr.borderWidths && fr.borderWidths.bottom !== undefined) ? fr.borderWidths.bottom : b;
      const bLeft = (fr.borderWidths && fr.borderWidths.left !== undefined) ? fr.borderWidths.left : b;
      const bRight = (fr.borderWidths && fr.borderWidths.right !== undefined) ? fr.borderWidths.right : b;

      const inner=document.createElement('div');
      inner.style.cssText=`position:absolute;left:${bLeft*scale}px;top:${bTop*scale}px;right:${bRight*scale}px;bottom:${bBottom*scale}px;overflow:hidden;background:${S.pageBg};`;
      const vis=fr.layers.filter(l=>!l.hidden);
      vis.forEach(layer=>{
        const lel=document.createElement('div'); lel.className='preview-layer'; lel.dataset.parallax=layer.parallax;
        const img=document.createElement('img'); img.src=layer.src; img.draggable=false;
        img.style.cssText=`max-width:100%;max-height:100%;object-fit:contain;display:block;transform:translate(${layer.tx*scale}px,${layer.ty*scale}px) scale(${layer.scale}) rotate(${layer.rotate}deg);transform-origin:center center;`;
        lel.appendChild(img); inner.appendChild(lel);
      });
      
      const swTop = (fr.strokeWidths && fr.strokeWidths.top !== undefined) ? fr.strokeWidths.top : sw;
      const swBottom = (fr.strokeWidths && fr.strokeWidths.bottom !== undefined) ? fr.strokeWidths.bottom : sw;
      const swLeft = (fr.strokeWidths && fr.strokeWidths.left !== undefined) ? fr.strokeWidths.left : sw;
      const swRight = (fr.strokeWidths && fr.strokeWidths.right !== undefined) ? fr.strokeWidths.right : sw;

      if (swTop > 0) {
        const s = document.createElement('div');
        s.style.cssText = `position:absolute;left:0;right:0;top:0;height:${swTop*scale}px;background:${S.strokeColor};pointer-events:none;z-index:99;`;
        inner.appendChild(s);
      }
      if (swBottom > 0) {
        const s = document.createElement('div');
        s.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:${swBottom*scale}px;background:${S.strokeColor};pointer-events:none;z-index:99;`;
        inner.appendChild(s);
      }
      if (swLeft > 0) {
        const s = document.createElement('div');
        s.style.cssText = `position:absolute;left:0;top:0;bottom:0;width:${swLeft*scale}px;background:${S.strokeColor};pointer-events:none;z-index:99;`;
        inner.appendChild(s);
      }
      if (swRight > 0) {
        const s = document.createElement('div');
        s.style.cssText = `position:absolute;right:0;top:0;bottom:0;width:${swRight*scale}px;background:${S.strokeColor};pointer-events:none;z-index:99;`;
        inner.appendChild(s);
      }

      inner.addEventListener('mousemove',e=>{
        const r=inner.getBoundingClientRect();
        const dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);
        inner.querySelectorAll('.preview-layer').forEach((lel,i)=>{ const pv=parseInt(lel.dataset.parallax)||0,d=(i+1)/(vis.length+1); lel.style.transform=`translate(${dx*pv*d*-1}px,${dy*pv*d*-1}px)`; });
      });
      inner.addEventListener('mouseleave',()=>inner.querySelectorAll('.preview-layer').forEach(lel=>lel.style.transform=''));
      fel.appendChild(inner); p.appendChild(fel);
    });
    cont.appendChild(p);
  });
  document.getElementById('preview-overlay').classList.add('visible');
}

// ═══════════════════════════════════════════════
// EXPORT ──
// ═══════════════════════════════════════════════
document.getElementById('btn-export').addEventListener('click',exportHTML);
document.getElementById('btn-export2').addEventListener('click',exportHTML);

function exportHTML(){
  const pagesHTML=S.pages.map(pg=>{
    const pw=pageW(pg),ph=pageH(pg);
    const frHTML=pg.frames.map(fr=>{
      const b=S.borderWidth,sw=S.strokeWidth;
      const vis=fr.layers.filter(l=>!l.hidden);
      const lHTML=vis.map(l=>`<div class="pl" data-p="${l.parallax}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:transform .08s ease-out;will-change:transform;"><img src="${l.src}" draggable="false" style="max-width:100%;max-height:100%;object-fit:contain;display:block;transform:translate(${l.tx}px,${l.ty}px) scale(${l.scale}) rotate(${l.rotate}deg);transform-origin:center center;"></div>`).join('');
      
      const bTop = (fr.borderWidths && fr.borderWidths.top !== undefined) ? fr.borderWidths.top : b;
      const bBottom = (fr.borderWidths && fr.borderWidths.bottom !== undefined) ? fr.borderWidths.bottom : b;
      const bLeft = (fr.borderWidths && fr.borderWidths.left !== undefined) ? fr.borderWidths.left : b;
      const bRight = (fr.borderWidths && fr.borderWidths.right !== undefined) ? fr.borderWidths.right : b;

      const swTop = (fr.strokeWidths && fr.strokeWidths.top !== undefined) ? fr.strokeWidths.top : sw;
      const swBottom = (fr.strokeWidths && fr.strokeWidths.bottom !== undefined) ? fr.strokeWidths.bottom : sw;
      const swLeft = (fr.strokeWidths && fr.strokeWidths.left !== undefined) ? fr.strokeWidths.left : sw;
      const swRight = (fr.strokeWidths && fr.strokeWidths.right !== undefined) ? fr.strokeWidths.right : sw;

      let localStrokesHTML = '';
      if (swTop > 0) localStrokesHTML += `<div style="position:absolute;left:0;right:0;top:0;height:${swTop}px;background:${S.strokeColor};pointer-events:none;z-index:99;"></div>`;
      if (swBottom > 0) localStrokesHTML += `<div style="position:absolute;left:0;right:0;bottom:0;height:${swBottom}px;background:${S.strokeColor};pointer-events:none;z-index:99;"></div>`;
      if (swLeft > 0) localStrokesHTML += `<div style="position:absolute;left:0;top:0;bottom:0;width:${swLeft}px;background:${S.strokeColor};pointer-events:none;z-index:99;"></div>`;
      if (swRight > 0) localStrokesHTML += `<div style="position:absolute;right:0;top:0;bottom:0;width:${swRight}px;background:${S.strokeColor};pointer-events:none;z-index:99;"></div>`;

      return `<div style="position:absolute;left:${fr.x}px;top:${fr.y}px;width:${fr.w}px;height:${fr.h}px;background:${S.borderColor};"><div class="pf" style="position:absolute;left:${bLeft}px;top:${bTop}px;right:${bRight}px;bottom:${bBottom}px;overflow:hidden;background:${S.pageBg};">${lHTML}${localStrokesHTML}</div></div>`;
    }).join('');
    return `<div class="pp" style="position:relative;width:${pw}px;height:${ph}px;flex-shrink:0;background:${S.borderColor};">${frHTML}</div>`;
  }).join('\n');

  const js=`document.querySelectorAll('.pf').forEach(f=>{const ls=f.querySelectorAll('.pl'),n=ls.length;f.addEventListener('mousemove',e=>{const r=f.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);ls.forEach((l,i)=>{const p=parseInt(l.dataset.p)||0,d=(i+1)/(n+1);l.style.transform=\`translate(\${dx*p*d*-1}px,\${dy*p*d*-1}px)\`;});});f.addEventListener('mouseleave',()=>ls.forEach(l=>l.style.transform=''));});`;

  const html=`<!DOCTYPE html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VIBECOMIX</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#090807;display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:40px;min-height:100vh}</style></head><body>\n${pagesHTML}\n<script>${js}<\/script>\n</body></html>`;

  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
  a.download='vibecomix.html'; a.click();
}