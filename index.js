// ============================================================
// AURELINE HOTEL — index.js
// อ่านรายการห้องว่าง (Read) พร้อมข้อมูลประเภทห้องแบบ join
// ============================================================

let allRooms = [];

async function loadRooms() {
  const { data, error } = await db
    .from("rooms")
    .select("*, room_types(room_type_name, description, max_guest, facilities)")
    .eq("room_status", "available")
    .order("price_per_night");

  if (error) {
    document.getElementById("rooms-grid").innerHTML =
      `<p class="muted">โหลดข้อมูลไม่สำเร็จ: ${escapeHtml(error.message)}<br>ตรวจสอบว่าตั้งค่า SUPABASE_URL / SUPABASE_KEY ใน supabaseClient.js แล้วหรือยัง</p>`;
    return;
  }

  allRooms = data || [];
  populateTypeFilter();
  renderRooms();
  updateHeroStats();
}

function populateTypeFilter() {
  const select = document.getElementById("filter-type");
  const seen = new Map();
  allRooms.forEach(r => {
    if (r.room_types) seen.set(r.room_types.room_type_name, true);
  });
  select.innerHTML = `<option value="">ทุกประเภทห้อง</option>` +
    [...seen.keys()].map(name => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`).join("");
}

function renderRooms() {
  const grid = document.getElementById("rooms-grid");
  const filter = document.getElementById("filter-type").value;
  const rooms = filter ? allRooms.filter(r => r.room_types?.room_type_name === filter) : allRooms;

  if (!rooms.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <span class="eyebrow">ไม่พบห้องว่าง</span>ลองเปลี่ยนตัวกรอง หรือกลับมาดูใหม่อีกครั้ง
      </div>`;
    return;
  }

  grid.innerHTML = rooms.map(r => {
    const rt = r.room_types || {};
    const facilities = (rt.facilities || "").split(",").map(f => f.trim()).filter(Boolean).slice(0, 4);
    return `
    <article class="room-card">
      <div class="room-tag-number">${escapeHtml(r.room_number)}</div>
      <div class="room-tag-floor">${r.floor ? `ชั้น ${r.floor}` : ""}</div>
      <h3>${escapeHtml(rt.room_type_name || "ห้องพัก")}</h3>
      <p class="desc">${escapeHtml(rt.description || "")}</p>
      <div class="room-facilities">
        ${rt.max_guest ? `<span class="chip">พัก ${rt.max_guest} ท่าน</span>` : ""}
        ${facilities.map(f => `<span class="chip">${escapeHtml(f)}</span>`).join("")}
      </div>
      <div class="room-price"><strong>฿${Number(r.price_per_night).toLocaleString()}</strong><span>/ คืน</span></div>
      <a class="btn btn-primary btn-block" href="booking.html?room_id=${r.room_id}">จองห้องนี้</a>
    </article>`;
  }).join("");
}

function updateHeroStats() {
  document.getElementById("hs-available").textContent = allRooms.length;
  const types = new Set(allRooms.map(r => r.room_types?.room_type_name).filter(Boolean));
  document.getElementById("hs-types").textContent = types.size;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
function escapeAttr(str) { return escapeHtml(str); }

loadRooms();
