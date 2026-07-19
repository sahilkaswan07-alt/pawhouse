



















/* ===== BACKGROUND CANVAS ===== */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  const FOCAL = 560;
  const COLS = [[244,162,77],[224,123,123],[201,111,208],[100,160,255]];
  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function mkRing(i){ const col=COLS[i%COLS.length]; return {radius:180+i*70,tilt:(i*0.6)+Math.random()*0.4,spin:(Math.random()-.5)*0.012+0.004,rot:Math.random()*Math.PI*2,points:64,col,nodeOffset:Math.random()*Math.PI*2}; }
  let rings=[];
  function init(){ rings=Array.from({length:6},(_,i)=>mkRing(i)); }
  let mouse={tx:0,ty:0.25}, camRotY=0, camRotX=0.25;
  function project3D(x,y,z){ const cosY=Math.cos(camRotY),sinY=Math.sin(camRotY); let x1=x*cosY-z*sinY,z1=x*sinY+z*cosY; const cosX=Math.cos(camRotX),sinX=Math.sin(camRotX); let y1=y*cosX-z1*sinX,z2=y*sinX+z1*cosX; const scale=FOCAL/(FOCAL+z2+500); return{sx:W*.5+x1*scale,sy:H*.5+y1*scale,scale,z:z2}; }
  function drawBlobs(t){ [{cx:W*.30+Math.sin(t*.30)*110,cy:H*.42+Math.cos(t*.20)*75,r:320,col:'244,162,77',a:.07},{cx:W*.72+Math.cos(t*.25)*90,cy:H*.60+Math.sin(t*.32)*65,r:250,col:'201,111,208',a:.07},{cx:W*.52+Math.sin(t*.18)*70,cy:H*.24+Math.cos(t*.22)*55,r:190,col:'100,160,255',a:.05}].forEach(({cx,cy,r,col,a})=>{ const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,`rgba(${col},${a})`); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }); }
  function drawVignette(){ const g=ctx.createRadialGradient(W/2,H/2,H*.06,W/2,H/2,H*.80); g.addColorStop(0,'rgba(13,15,20,0)'); g.addColorStop(1,'rgba(13,15,20,.85)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  let t=0;
  function animate(){ requestAnimationFrame(animate); t+=.007; camRotY+=(mouse.tx-camRotY)*.02; camRotX+=(mouse.ty-camRotX)*.02; ctx.fillStyle='#0d0f14'; ctx.fillRect(0,0,W,H); drawBlobs(t); const drawables=[]; rings.forEach(ring=>{ ring.rot+=ring.spin; const pts=[]; for(let p=0;p<=ring.points;p++){ const a=(p/ring.points)*Math.PI*2; const rx=Math.cos(a)*ring.radius,ry=Math.sin(a)*ring.radius*Math.sin(ring.tilt),rz=Math.sin(a)*ring.radius*Math.cos(ring.tilt); const cs=Math.cos(ring.rot),sn=Math.sin(ring.rot); pts.push(project3D(rx*cs-rz*sn,ry,rx*sn+rz*cs)); } const avgZ=pts.reduce((s,p)=>s+p.z,0)/pts.length; drawables.push({ring,pts,avgZ}); const na=ring.nodeOffset+t*1.3; const nrx=Math.cos(na)*ring.radius,nry=Math.sin(na)*ring.radius*Math.sin(ring.tilt),nrz=Math.sin(na)*ring.radius*Math.cos(ring.tilt); const cs=Math.cos(ring.rot),sn=Math.sin(ring.rot); const node=project3D(nrx*cs-nrz*sn,nry,nrx*sn+nrz*cs); drawables.push({node,ring,avgZ:node.z,isNode:true}); }); drawables.sort((a,b)=>a.avgZ-b.avgZ); drawables.forEach(d=>{ if(d.isNode){ const{node,ring}=d; const depth=Math.max(0,Math.min(1,(node.z+500)/900)); const r=3+depth*4,alpha=.25+depth*.6; const halo=ctx.createRadialGradient(node.sx,node.sy,0,node.sx,node.sy,r*4); halo.addColorStop(0,`rgba(${ring.col[0]},${ring.col[1]},${ring.col[2]},${(alpha*.5).toFixed(3)})`); halo.addColorStop(1,'transparent'); ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(node.sx,node.sy,r*4,0,Math.PI*2); ctx.fill(); ctx.fillStyle=`rgba(255,255,255,${alpha.toFixed(3)})`; ctx.beginPath(); ctx.arc(node.sx,node.sy,Math.max(r,1),0,Math.PI*2); ctx.fill(); } else { const{ring,pts}=d; const depth=Math.max(0,Math.min(1,(d.avgZ+500)/900)); ctx.beginPath(); ctx.strokeStyle=`rgba(${ring.col[0]},${ring.col[1]},${ring.col[2]},${(.08+depth*.22).toFixed(3)})`; ctx.lineWidth=.8+depth*1.2; pts.forEach((p,idx)=>idx===0?ctx.moveTo(p.sx,p.sy):ctx.lineTo(p.sx,p.sy)); ctx.stroke(); } }); drawVignette(); }
  window.addEventListener('mousemove',e=>{ mouse.tx=((e.clientX/W)-.5)*0.6; mouse.ty=0.25+((e.clientY/H)-.5)*0.4; });
  window.addEventListener('mouseleave',()=>{ mouse.tx=0; mouse.ty=0.25; });
  resize(); init(); animate();
  window.addEventListener('resize',()=>{ resize(); init(); });
 
  /* ===== STATUS PILL — tap to mark done / undo ===== */
  function cycleStatus(el) {
    const row = el.closest('tr');
    const dateCell = row ? row.querySelector('.col-date') : null;
    if (el.classList.contains('done')) {
      // Undo — revert back to Due
      el.classList.remove('done');
      el.classList.add('due');
      el.textContent = 'Due';
      el.title = 'Tap to mark as done';
    } else {
      // Mark as Done — stamp today's date
      el.classList.remove('due', 'miss');
      el.classList.add('done');
      el.textContent = 'Done';
      el.title = 'Tap to update';
      if (dateCell) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        dateCell.textContent = `${dd} ${months[today.getMonth()]} ${today.getFullYear()}`;
        // Keep the hidden due-date in sync so a completed item stops triggering reminders
        if (row) {
          const iso = today.toISOString().slice(0, 10);
          row.setAttribute('data-due', iso);
        }
      }
    }
  }

  /* ===== FOOTER YEAR ===== */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ===== OWNER GALLERY UPLOAD — 1 photo every 15 days ===== */
  // Change this if you reuse this file for another pet, so each pet's
  // upload history + cooldown is tracked separately in the browser.
  const PET_ID = 'bruno';
  const UPLOAD_COOLDOWN_DAYS = 15;
  const UPLOAD_COOLDOWN_MS = UPLOAD_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const LS_PHOTOS_KEY = `pawhouse_gallery_${PET_ID}`;
  const LS_LAST_UPLOAD_KEY = `pawhouse_gallery_last_${PET_ID}`;

  function getStoredPhotos() {
    try {
      return JSON.parse(localStorage.getItem(LS_PHOTOS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function getLastUploadTime() {
    const raw = localStorage.getItem(LS_LAST_UPLOAD_KEY);
    return raw ? parseInt(raw, 10) : 0;
  }

  function msUntilNextUpload() {
    const elapsed = Date.now() - getLastUploadTime();
    return Math.max(0, UPLOAD_COOLDOWN_MS - elapsed);
  }

  function formatDaysRemaining(ms) {
    const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
    return days <= 1 ? 'tomorrow' : `in ${days} days`;
  }

  function showGalleryToast(message) {
    const toast = document.getElementById('galleryToast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showGalleryToast._t);
    showGalleryToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function renderStoredPhotos() {
    const grid = document.getElementById('galleryGrid');
    const tile = document.getElementById('uploadTile');
    const fileInput = document.getElementById('galleryFileInput');
    const photos = getStoredPhotos();
    photos.forEach(p => {
      const img = document.createElement('img');
      img.src = p.src;
      img.alt = 'Bruno memory';
      img.onclick = () => openLightbox(img.src);
      grid.insertBefore(img, tile);
    });
    updateUploadTileState();
  }

  function updateUploadTileState() {
    const tile = document.getElementById('uploadTile');
    const label = document.getElementById('uploadLabel');
    const sub = document.getElementById('uploadSub');
    const note = document.getElementById('galleryNote');
    const remaining = msUntilNextUpload();

    if (remaining > 0) {
      tile.classList.add('locked');
      label.textContent = 'Come back soon';
      sub.textContent = `Next photo ${formatDaysRemaining(remaining)}`;
      note.textContent = `You've already added a memory recently — you can upload your next photo ${formatDaysRemaining(remaining)}.`;
    } else {
      tile.classList.remove('locked');
      label.textContent = 'Add a Memory';
      sub.textContent = '1 photo every 15 days';
      note.textContent = '';
    }
  }

  function handleUploadTileClick() {
    if (msUntilNextUpload() > 0) {
      showGalleryToast(`You can add your next memory ${formatDaysRemaining(msUntilNextUpload())} 🐾`);
      return;
    }
    document.getElementById('galleryFileInput').click();
  }

  function handleGalleryUpload(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (msUntilNextUpload() > 0) {
      showGalleryToast(`You can add your next memory ${formatDaysRemaining(msUntilNextUpload())} 🐾`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      showGalleryToast('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Downscale before saving so localStorage doesn't fill up with huge images
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1000;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const scale = MAX_DIM / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvasEl = document.createElement('canvas');
        canvasEl.width = width;
        canvasEl.height = height;
        canvasEl.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvasEl.toDataURL('image/jpeg', 0.82);

        const photos = getStoredPhotos();
        photos.push({ src: dataUrl, date: Date.now() });
        try {
          localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(photos));
          localStorage.setItem(LS_LAST_UPLOAD_KEY, String(Date.now()));
        } catch (err) {
          showGalleryToast('Storage is full — please remove old photos to add new ones.');
          return;
        }

        const grid = document.getElementById('galleryGrid');
        const tile = document.getElementById('uploadTile');
        const newImg = document.createElement('img');
        newImg.src = dataUrl;
        newImg.alt = 'Bruno memory';
        newImg.onclick = () => openLightbox(newImg.src);
        grid.insertBefore(newImg, tile);

        updateUploadTileState();
        showGalleryToast('Memory added! 🐾 See you again in 15 days.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  renderStoredPhotos();
  setInterval(updateUploadTileState, 60 * 60 * 1000); // refresh lock state hourly

  /* ===== BCS (BODY CONDITION SCORE) — monthly 5-question check-in ===== */
  const BCS_COOLDOWN_DAYS = 30;
  const BCS_COOLDOWN_MS = BCS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const LS_BCS_KEY = `pawhouse_bcs_${PET_ID}`;
  const LS_BCS_LAST_KEY = `pawhouse_bcs_last_${PET_ID}`;

  const BCS_TABLE = {
    1: { cat: 'Emaciated',           desc: 'Bones clearly visible, no body fat' },
    2: { cat: 'Very Thin',           desc: 'Minimal fat, severe muscle loss' },
    3: { cat: 'Thin',                desc: 'Ribs obvious, slight fat cover' },
    4: { cat: 'Lean',                desc: 'Ribs easily felt, visible waist' },
    5: { cat: 'Ideal',               desc: 'Ribs palpable, waist & abdominal tuck present' },
    6: { cat: 'Slightly Overweight', desc: 'Slight fat over ribs, waist less obvious' },
    7: { cat: 'Overweight',          desc: 'Difficult to feel ribs, no clear waist' },
    8: { cat: 'Obese',               desc: 'Heavy fat deposits, abdominal distension' },
    9: { cat: 'Grossly Obese',       desc: 'Massive fat deposits, no waist, marked fat' }
  };

  const bcsAnswers = {}; // { "1": 4.5, "2": 2, ... }

  function selectBcsOpt(btn) {
    const qDiv = btn.closest('.bcs-q');
    const qNum = qDiv.dataset.q;
    qDiv.querySelectorAll('.bcs-opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    bcsAnswers[qNum] = parseFloat(btn.dataset.score);

    const submitBtn = document.getElementById('bcsSubmitBtn');
    const answeredCount = Object.keys(bcsAnswers).length;
    if (answeredCount >= 5) {
      submitBtn.disabled = false;
      submitBtn.textContent = "See This Month's Result";
    } else {
      submitBtn.disabled = true;
      submitBtn.textContent = `Answer all 5 to see this month's result (${answeredCount}/5)`;
    }
  }

  function getBcsHistory() {
    try {
      return JSON.parse(localStorage.getItem(LS_BCS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function getBcsLastTime() {
    const raw = localStorage.getItem(LS_BCS_LAST_KEY);
    return raw ? parseInt(raw, 10) : 0;
  }

  function msUntilNextBcs() {
    const elapsed = Date.now() - getBcsLastTime();
    return Math.max(0, BCS_COOLDOWN_MS - elapsed);
  }

  function formatBcsDate(ts) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatBcsDaysRemaining(ms) {
    const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
    return days <= 1 ? 'tomorrow' : `in ${days} days`;
  }

  function submitBcs() {
    if (Object.keys(bcsAnswers).length < 5) return;
    const values = Object.values(bcsAnswers);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const bcs = Math.min(9, Math.max(1, Math.round(avg)));

    const entry = { date: Date.now(), bcs };
    const history = getBcsHistory();
    history.push(entry);
    try {
      localStorage.setItem(LS_BCS_KEY, JSON.stringify(history));
      localStorage.setItem(LS_BCS_LAST_KEY, String(Date.now()));
    } catch (e) { /* storage full — result still shows for this session */ }

    renderBcsState();
  }

  function renderBcsResult(entry) {
    const info = BCS_TABLE[entry.bcs];
    const idealNote = entry.bcs >= 4 && entry.bcs <= 5
      ? "That's within the ideal range (4–5) for a healthy adult dog or cat. Keep it up! 🐾"
      : "The ideal BCS for a healthy adult dog or cat is 4–5. Consider mentioning this to your vet at the next visit.";
    return `
      <div class="bcs-result-card">
        <div class="bcs-result-num">${entry.bcs}</div>
        <div class="bcs-result-info">
          <div class="bcs-result-cat">${info.cat}</div>
          <div class="bcs-result-desc">${info.desc}</div>
        </div>
      </div>
      <div class="bcs-note">${idealNote} Checked on ${formatBcsDate(entry.date)}.</div>
    `;
  }

  function renderBcsHistory() {
    const history = getBcsHistory();
    const wrap = document.getElementById('bcsHistoryWrap');
    if (history.length < 2) { wrap.innerHTML = ''; return; }
    const rows = history.slice().reverse().slice(0, 6).map(e => {
      const info = BCS_TABLE[e.bcs];
      return `<div class="bcs-history-row"><span>${formatBcsDate(e.date)}</span><span>BCS ${e.bcs} <span class="bcs-h-cat">— ${info.cat}</span></span></div>`;
    }).join('');
    wrap.innerHTML = `<div class="bcs-history"><div class="bcs-history-title">Past Check-ins</div>${rows}</div>`;
  }

  function highlightBcsRefRow(bcs) {
    document.querySelectorAll('#bcsRefTable tr').forEach(tr => tr.classList.remove('current-row'));
    const row = document.querySelector(`#bcsRefTable tr[data-bcs="${bcs}"]`);
    if (row) row.classList.add('current-row');
  }

  function renderBcsState() {
    const quizWrap = document.getElementById('bcsQuizWrap');
    const resultWrap = document.getElementById('bcsResultWrap');
    const history = getBcsHistory();
    const remaining = msUntilNextBcs();

    renderBcsHistory();

    if (remaining > 0 && history.length > 0) {
      // Locked until next month — show latest result + countdown
      const latest = history[history.length - 1];
      quizWrap.style.display = 'none';
      resultWrap.style.display = 'block';
      resultWrap.innerHTML = renderBcsResult(latest) +
        `<div class="bcs-locked-msg">Next monthly check-in available ${formatBcsDaysRemaining(remaining)}.</div>`;
      highlightBcsRefRow(latest.bcs);
    } else {
      // Quiz available
      quizWrap.style.display = 'block';
      resultWrap.style.display = 'none';
      document.querySelectorAll('.bcs-opt.selected').forEach(b => b.classList.remove('selected'));
      Object.keys(bcsAnswers).forEach(k => delete bcsAnswers[k]);
      const submitBtn = document.getElementById('bcsSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = "Answer all 5 to see this month's result (0/5)";
      highlightBcsRefRow(0);
    }
  }

  renderBcsState();
 
  /* ===== LIGHTBOX ===== */
  function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('open');
  }
  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });