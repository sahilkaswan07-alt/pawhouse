/* ===== petbox.js =====
   Handles everything on this pet's page EXCEPT the Firestore vaccine sync,
   which lives in the separate js/petbox-sync.js module (loaded with
   type="module" in petbox.html) — that's where it belongs, since this file
   is loaded as a plain script and can't contain `import` statements. */












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
 
  /* ===== PET ID — read from window.PET_ID, which each pet's own HTML page
     sets in a tiny inline <script> tag right before this file is loaded,
     e.g.  <script>window.PET_ID = 'monty';</script>
     This is what makes it possible to use this ONE shared petbox.js file
     for every pet, instead of duplicating hundreds of lines of JS per pet
     (which is how the last bug happened). Falls back to 'bruno' only if a
     page forgets to set it. ===== */
  const PET_ID = window.PET_ID || 'bruno';

  /* ===== STATUS PERSISTENCE — saved per item-id so a click survives a
     reload, and so home.html (reading this same key) can drop that
     reminder from its bell/badge too. ===== */
  const STATUS_STORE_KEY = `pawhouse_status_${PET_ID}`;

  function loadStatusOverrides() {
    try {
      const raw = localStorage.getItem(STATUS_STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveStatusOverride(itemId, data) {
    try {
      const all = loadStatusOverrides();
      all[itemId] = data;
      localStorage.setItem(STATUS_STORE_KEY, JSON.stringify(all));
    } catch (e) { /* storage unavailable — change won't persist across reloads */ }
  }

  // Runs once on page load, before the reminder bell/popup are computed,
  // so any previously-saved status (e.g. marked Done last visit) is back
  // in place immediately instead of resetting to the hardcoded HTML state.
  function applyStatusOverrides() {
    const overrides = loadStatusOverrides();
    document.querySelectorAll('tr[data-item-id]').forEach(row => {
      const saved = overrides[row.dataset.itemId];
      if (!saved) return;
      const pill = row.querySelector('.status-pill');
      const dateCell = row.querySelector('.col-date');
      if (!pill) return;
      pill.classList.remove('done', 'due', 'miss');
      pill.classList.add(saved.cls);
      pill.textContent = saved.cls === 'done' ? 'Done' : (saved.cls === 'miss' ? 'Missed' : 'Due');
      pill.title = saved.cls === 'done' ? 'Tap to update' : 'Tap to mark as done';
      if (saved.due) row.setAttribute('data-due', saved.due);
      if (dateCell && saved.dateText) dateCell.textContent = saved.dateText;
    });
  }

  /* ===== STATUS PILL — tap to mark done / undo ===== */
  function cycleStatus(el) {
    const row = el.closest('tr');
    const dateCell = row ? row.querySelector('.col-date') : null;
    let newCls, newDue, newDateText;
    if (el.classList.contains('done')) {
      // Undo — revert back to Due
      el.classList.remove('done');
      el.classList.add('due');
      el.textContent = 'Due';
      el.title = 'Tap to mark as done';
      newCls = 'due';
      newDue = row ? row.getAttribute('data-due') : null;
      newDateText = dateCell ? dateCell.textContent : null;
    } else {
      // Mark as Done — stamp today's date
      el.classList.remove('due', 'miss');
      el.classList.add('done');
      el.textContent = 'Done';
      el.title = 'Tap to update';
      newCls = 'done';
      if (dateCell) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        newDateText = `${dd} ${months[today.getMonth()]} ${today.getFullYear()}`;
        dateCell.textContent = newDateText;
        // Keep the hidden due-date in sync so a completed item stops triggering reminders
        newDue = today.toISOString().slice(0, 10);
        if (row) row.setAttribute('data-due', newDue);
      }
    }
    // Persist this change — survives reload, and lets home.html pick it up too
    if (row && row.dataset.itemId) {
      saveStatusOverride(row.dataset.itemId, { cls: newCls, due: newDue, dateText: newDateText });
    }
    // Keep the bell badge in sync whenever a status changes
    renderReminderBell();
  }

  /* ===== REMINDER BELL + POPUP — vaccine / deworming due & missed alerts =====
     Works like a cart badge: the bell shows a count of items needing attention.
     Tapping it opens a popup listing each one. If something is due TODAY,
     the popup also opens automatically once per day. */

  const REMINDER_TYPE_META = {
    vaccination: { icon: '💉', label: 'Vaccination' },
    deworming:   { icon: '🐛', label: 'Deworming' }
  };

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatReminderDate(iso) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
  }

  // Collects every vaccination/deworming row that isn't marked "Done"
  function collectReminderItems() {
    const rows = document.querySelectorAll('tr[data-remind-type][data-due]');
    const today = todayISO();
    const items = [];
    rows.forEach(row => {
      const pill = row.querySelector('.status-pill');
      if (!pill || pill.classList.contains('done')) return; // ignore completed items
      const nameCell = row.querySelector('td');
      const type = row.dataset.remindType;
      const meta = REMINDER_TYPE_META[type] || { icon: '📌', label: type };
      const due = row.dataset.due;
      const isMissed = pill.classList.contains('miss') || (due && due < today);
      items.push({
        type,
        icon: meta.icon,
        label: meta.label,
        name: nameCell ? nameCell.textContent.trim() : meta.label,
        due,
        isDueToday: due === today,
        isMissed
      });
    });
    // Soonest / most overdue first
    items.sort((a, b) => (a.due || '').localeCompare(b.due || ''));
    return items;
  }

  // NOTE: home.html now reads the same STATUS_STORE_KEY (pawhouse_status_<petId>)
  // written by saveStatusOverride() above to know which items are Done —
  // no separate summary key needed here anymore.

  /* ===== SCHEDULE TABLE — built from the shared pet-schedules.js data =====
     Fills the Vaccination / Deworming tables from window.PET_SCHEDULES
     (loaded via pet-schedules.js, see that file) instead of relying on
     hand-typed <tr> rows in this pet's HTML. This is also exactly what
     home.html reads to build its bell, so the two can never fall out of
     sync — edit a due date once, in pet-schedules.js, and it updates
     everywhere. If a pet has no entry in pet-schedules.js yet, whatever
     rows are already hardcoded in the HTML are left alone. */
  function buildScheduleRow(item, type) {
    const cls = item.status === 'done' ? 'done' : (item.status === 'miss' ? 'miss' : 'due');
    const label = cls === 'done' ? 'Done' : (cls === 'miss' ? 'Missed' : 'Due');
    const title = cls === 'done' ? 'Tap to update' : 'Tap to mark as done';
    return `<tr data-remind-type="${type}" data-due="${item.due}" data-item-id="${item.id}">
      <td>${item.name}</td>
      <td><span class="status-pill ${cls}" onclick="cycleStatus(this)" title="${title}">${label}</span></td>
      <td class="col-date">${formatReminderDate(item.due)}</td>
    </tr>`;
  }

  function renderScheduleTables() {
    const data = window.PET_SCHEDULES && window.PET_SCHEDULES[PET_ID];
    if (!data) return; // no shared data for this pet yet — keep hardcoded HTML rows as-is
    const vaxBody = document.getElementById('vaxTbody');
    const dewBody = document.getElementById('dewTbody');
    if (vaxBody && data.vaccination) {
      vaxBody.innerHTML = data.vaccination.map(item => buildScheduleRow(item, 'vaccination')).join('');
    }
    if (dewBody && data.deworming) {
      dewBody.innerHTML = data.deworming.map(item => buildScheduleRow(item, 'deworming')).join('');
    }
  }

  function renderReminderBell() {
    const items = collectReminderItems();
    const bell = document.getElementById('reminderBell');
    const badge = document.getElementById('reminderBadge');

    if (!bell || !badge) return items;

    if (items.length > 0) {
      badge.style.display = 'flex';
      badge.textContent = items.length > 9 ? '9+' : String(items.length);
      bell.classList.toggle('has-due', items.some(i => i.isDueToday || i.isMissed));
    } else {
      badge.style.display = 'none';
      bell.classList.remove('has-due');
    }
    return items;
  }

  function renderReminderModalContent(items) {
    const sub = document.getElementById('reminderModalSub');
    const list = document.getElementById('reminderModalList');
    if (!sub || !list) return;

    if (items.length === 0) {
      sub.textContent = "You're all caught up — nothing due right now.";
      list.innerHTML = '<div class="reminder-empty">🎉 No pending vaccinations or deworming.</div>';
      return;
    }

    sub.textContent = `${items.length} item${items.length > 1 ? 's' : ''} need${items.length > 1 ? '' : 's'} your attention.`;
    list.innerHTML = items.map(item => `
      <div class="reminder-item">
        <div class="reminder-item-icon">${item.icon}</div>
        <div class="reminder-item-info">
          <div class="reminder-item-name">${item.label}: ${item.name}</div>
          <div class="reminder-item-date">${item.isMissed ? 'Was due' : 'Due'} ${formatReminderDate(item.due)}</div>
        </div>
        <div class="reminder-item-status ${item.isMissed ? 'miss' : 'due'}">${item.isMissed ? 'Missed' : 'Due'}</div>
      </div>
    `).join('');
  }

  function openReminderModal() {
    const items = collectReminderItems();
    renderReminderModalContent(items);
    document.getElementById('reminderModalOverlay').classList.add('open');
  }

  function closeReminderModal() {
    document.getElementById('reminderModalOverlay').classList.remove('open');
  }

  // Auto-popup: if something is due TODAY (or already missed) and we haven't
  // shown it yet today, pop it open automatically like a cart confirmation.
  function maybeAutoShowReminder() {
    const items = collectReminderItems();
    const urgent = items.filter(i => i.isDueToday || i.isMissed);
    if (urgent.length === 0) return;

    const shownKey = `pawhouse_reminder_shown_${PET_ID}_${todayISO()}`;
    if (localStorage.getItem(shownKey)) return; // already shown today

    renderReminderModalContent(items);
    document.getElementById('reminderModalOverlay').classList.add('open');
    try { localStorage.setItem(shownKey, '1'); } catch (e) { /* ignore */ }
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeReminderModal(); });

  renderScheduleTables(); // build rows from pet-schedules.js (if this pet has an entry there)
  applyStatusOverrides(); // restore any previously-saved Done state before counting
  renderReminderBell();
  // Slight delay so it doesn't collide with the page's entrance animation
  setTimeout(maybeAutoShowReminder, 600);

  /* ===== FOOTER YEAR ===== */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ===== OWNER GALLERY UPLOAD — 1 photo every 15 days ===== */
  // (PET_ID is declared once, near the top of this file, above.)
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