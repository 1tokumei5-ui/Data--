// ============================================================
// AURELINE HOTEL — Staff Console (admin.js)
// CRUD เต็มรูปแบบ: Create, Read, Update, Delete ผ่าน Supabase
// ============================================================

let cache = { roomTypes: [], rooms: [], customers: [], bookings: [] };

/* ---------------- toast ---------------- */
function toast(message, type = "info") {
  const stack = document.getElementById("toast-stack");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------------- nav switching ---------------- */
document.getElementById("admin-nav").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]");
  if (!btn) return;
  document.querySelectorAll(".admin-nav button").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".admin-view").forEach(v => v.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
});

/* ---------------- modal helpers ---------------- */
const backdrop = document.getElementById("modal-backdrop");
function openModal(title, bodyHtml) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = bodyHtml;
  backdrop.classList.add("open");
}
function closeModal() { backdrop.classList.remove("open"); }
backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });

/* ============================================================
   ROOM TYPES
   ============================================================ */
async function loadRoomTypes() {
  const { data, error } = await db.from("room_types").select("*").order("room_type_id");
  if (error) { toast("โหลดประเภทห้องไม่สำเร็จ: " + error.message, "error"); return; }
  cache.roomTypes = data || [];
  renderRoomTypes();
}
function renderRoomTypes() {
  const tbody = document.getElementById("tbl-room-types");
  if (!cache.roomTypes.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">ยังไม่มีประเภทห้องพัก</td></tr>`;
    return;
  }
  tbody.innerHTML = cache.roomTypes.map(rt => `
    <tr>
      <td class="mono">${rt.room_type_id}</td>
      <td><strong>${escapeHtml(rt.room_type_name)}</strong></td>
      <td class="muted">${escapeHtml(rt.description || "-")}</td>
      <td>${rt.max_guest ?? "-"}</td>
      <td class="muted">${escapeHtml(rt.facilities || "-")}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="openRoomTypeModal(${rt.room_type_id})">แก้ไข</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRoomType(${rt.room_type_id})">ลบ</button>
      </td>
    </tr>`).join("");
}
function openRoomTypeModal(id = null) {
  const rt = id ? cache.roomTypes.find(r => r.room_type_id === id) : null;
  openModal(rt ? "แก้ไขประเภทห้อง" : "เพิ่มประเภทห้อง", `
    <form id="form-room-type">
      <div class="field"><label>ชื่อประเภทห้อง</label>
        <input name="room_type_name" required value="${rt ? escapeAttr(rt.room_type_name) : ""}"></div>
      <div class="field"><label>รายละเอียด</label>
        <textarea name="description">${rt ? escapeHtml(rt.description || "") : ""}</textarea></div>
      <div class="form-row">
        <div class="field"><label>ผู้เข้าพักสูงสุด</label>
          <input type="number" min="1" name="max_guest" value="${rt ? rt.max_guest ?? "" : ""}"></div>
        <div class="field"><label>สิ่งอำนวยความสะดวก</label>
          <input name="facilities" value="${rt ? escapeAttr(rt.facilities || "") : ""}"></div>
      </div>
      <button class="btn btn-primary btn-block" type="submit">${rt ? "บันทึกการแก้ไข" : "เพิ่มประเภทห้อง"}</button>
    </form>`);
  document.getElementById("form-room-type").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      room_type_name: f.get("room_type_name"),
      description: f.get("description"),
      max_guest: f.get("max_guest") ? Number(f.get("max_guest")) : null,
      facilities: f.get("facilities"),
    };
    const q = rt ? db.from("room_types").update(payload).eq("room_type_id", id)
                 : db.from("room_types").insert(payload);
    const { error } = await q;
    if (error) return toast("บันทึกไม่สำเร็จ: " + error.message, "error");
    toast(rt ? "แก้ไขประเภทห้องแล้ว" : "เพิ่มประเภทห้องแล้ว", "success");
    closeModal(); loadRoomTypes(); loadRooms();
  });
}
async function deleteRoomType(id) {
  if (!confirm("ลบประเภทห้องนี้? ห้องที่ผูกกับประเภทนี้จะไม่ถูกลบ แต่จะไม่มีประเภทอ้างอิง")) return;
  const { error } = await db.from("room_types").delete().eq("room_type_id", id);
  if (error) return toast("ลบไม่สำเร็จ: " + error.message, "error");
  toast("ลบประเภทห้องแล้ว", "success");
  loadRoomTypes(); loadRooms();
}

/* ============================================================
   ROOMS
   ============================================================ */
async function loadRooms() {
  const { data, error } = await db.from("rooms").select("*, room_types(room_type_name)").order("room_id");
  if (error) { toast("โหลดห้องพักไม่สำเร็จ: " + error.message, "error"); return; }
  cache.rooms = data || [];
  renderRooms();
  updateDashboardStats();
}
function renderRooms() {
  const tbody = document.getElementById("tbl-rooms");
  if (!cache.rooms.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">ยังไม่มีห้องพัก</td></tr>`;
    return;
  }
  tbody.innerHTML = cache.rooms.map(r => `
    <tr>
      <td class="mono">${r.room_id}</td>
      <td><strong>${escapeHtml(r.room_number)}</strong></td>
      <td class="muted">${escapeHtml(r.room_types?.room_type_name || "-")}</td>
      <td>${r.floor ?? "-"}</td>
      <td>฿${Number(r.price_per_night).toLocaleString()}</td>
      <td><span class="badge badge-${r.room_status}">${roomStatusLabel(r.room_status)}</span></td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="openRoomModal(${r.room_id})">แก้ไข</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRoom(${r.room_id})">ลบ</button>
      </td>
    </tr>`).join("");
}
function roomStatusLabel(s) {
  return { available: "ว่าง", occupied: "ไม่ว่าง", maintenance: "ปิดปรับปรุง" }[s] || s;
}
function openRoomModal(id = null) {
  const r = id ? cache.rooms.find(x => x.room_id === id) : null;
  const typeOptions = cache.roomTypes.map(rt =>
    `<option value="${rt.room_type_id}" ${r?.room_type_id === rt.room_type_id ? "selected" : ""}>${escapeHtml(rt.room_type_name)}</option>`
  ).join("");
  openModal(r ? "แก้ไขห้องพัก" : "เพิ่มห้องพัก", `
    <form id="form-room">
      <div class="form-row">
        <div class="field"><label>เลขห้อง</label>
          <input name="room_number" required value="${r ? escapeAttr(r.room_number) : ""}"></div>
        <div class="field"><label>ชั้น</label>
          <input type="number" name="floor" value="${r ? r.floor ?? "" : ""}"></div>
      </div>
      <div class="field"><label>ประเภทห้อง</label>
        <select name="room_type_id" required>${typeOptions || '<option value="">— ยังไม่มีประเภทห้อง —</option>'}</select></div>
      <div class="form-row">
        <div class="field"><label>ราคา/คืน (บาท)</label>
          <input type="number" step="0.01" min="0" name="price_per_night" required value="${r ? r.price_per_night : ""}"></div>
        <div class="field"><label>สถานะ</label>
          <select name="room_status">
            <option value="available" ${r?.room_status === "available" ? "selected" : ""}>ว่าง</option>
            <option value="occupied" ${r?.room_status === "occupied" ? "selected" : ""}>ไม่ว่าง</option>
            <option value="maintenance" ${r?.room_status === "maintenance" ? "selected" : ""}>ปิดปรับปรุง</option>
          </select></div>
      </div>
      <button class="btn btn-primary btn-block" type="submit">${r ? "บันทึกการแก้ไข" : "เพิ่มห้องพัก"}</button>
    </form>`);
  document.getElementById("form-room").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      room_number: f.get("room_number"),
      floor: f.get("floor") ? Number(f.get("floor")) : null,
      room_type_id: Number(f.get("room_type_id")),
      price_per_night: Number(f.get("price_per_night")),
      room_status: f.get("room_status"),
    };
    const q = r ? db.from("rooms").update(payload).eq("room_id", id) : db.from("rooms").insert(payload);
    const { error } = await q;
    if (error) return toast("บันทึกไม่สำเร็จ: " + error.message, "error");
    toast(r ? "แก้ไขห้องพักแล้ว" : "เพิ่มห้องพักแล้ว", "success");
    closeModal(); loadRooms();
  });
}
async function deleteRoom(id) {
  if (!confirm("ลบห้องพักนี้?")) return;
  const { error } = await db.from("rooms").delete().eq("room_id", id);
  if (error) return toast("ลบไม่สำเร็จ (อาจมีการจองผูกอยู่): " + error.message, "error");
  toast("ลบห้องพักแล้ว", "success");
  loadRooms();
}

/* ============================================================
   CUSTOMERS
   ============================================================ */
async function loadCustomers() {
  const { data, error } = await db.from("customers").select("*").order("customer_id");
  if (error) { toast("โหลดลูกค้าไม่สำเร็จ: " + error.message, "error"); return; }
  cache.customers = data || [];
  renderCustomers();
  updateDashboardStats();
}
function renderCustomers() {
  const tbody = document.getElementById("tbl-customers");
  if (!cache.customers.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">ยังไม่มีลูกค้าในระบบ</td></tr>`;
    return;
  }
  tbody.innerHTML = cache.customers.map(c => `
    <tr>
      <td class="mono">${c.customer_id}</td>
      <td><strong>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</strong></td>
      <td class="muted">${escapeHtml(c.phone || "-")}</td>
      <td class="muted">${escapeHtml(c.email || "-")}</td>
      <td class="muted">${c.register_date || "-"}</td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="openCustomerModal(${c.customer_id})">แก้ไข</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCustomer(${c.customer_id})">ลบ</button>
      </td>
    </tr>`).join("");
}
function openCustomerModal(id = null) {
  const c = id ? cache.customers.find(x => x.customer_id === id) : null;
  openModal(c ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า", `
    <form id="form-customer">
      <div class="form-row">
        <div class="field"><label>ชื่อ</label><input name="first_name" required value="${c ? escapeAttr(c.first_name) : ""}"></div>
        <div class="field"><label>นามสกุล</label><input name="last_name" required value="${c ? escapeAttr(c.last_name) : ""}"></div>
      </div>
      <div class="field"><label>เบอร์โทร</label><input name="phone" value="${c ? escapeAttr(c.phone || "") : ""}"></div>
      <div class="field"><label>อีเมล</label><input type="email" name="email" value="${c ? escapeAttr(c.email || "") : ""}"></div>
      <button class="btn btn-primary btn-block" type="submit">${c ? "บันทึกการแก้ไข" : "เพิ่มลูกค้า"}</button>
    </form>`);
  document.getElementById("form-customer").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = { first_name: f.get("first_name"), last_name: f.get("last_name"), phone: f.get("phone"), email: f.get("email") };
    const q = c ? db.from("customers").update(payload).eq("customer_id", id) : db.from("customers").insert(payload);
    const { error } = await q;
    if (error) return toast("บันทึกไม่สำเร็จ: " + error.message, "error");
    toast(c ? "แก้ไขลูกค้าแล้ว" : "เพิ่มลูกค้าแล้ว", "success");
    closeModal(); loadCustomers();
  });
}
async function deleteCustomer(id) {
  if (!confirm("ลบลูกค้ารายนี้?")) return;
  const { error } = await db.from("customers").delete().eq("customer_id", id);
  if (error) return toast("ลบไม่สำเร็จ (อาจมีการจองผูกอยู่): " + error.message, "error");
  toast("ลบลูกค้าแล้ว", "success");
  loadCustomers();
}

/* ============================================================
   BOOKINGS
   ============================================================ */
async function loadBookings() {
  const { data, error } = await db.from("bookings").select("*, customers(first_name,last_name)").order("booking_id", { ascending: false });
  if (error) { toast("โหลดการจองไม่สำเร็จ: " + error.message, "error"); return; }
  cache.bookings = data || [];
  renderBookings();
  updateDashboardStats();
}
function renderBookings() {
  const tbody = document.getElementById("tbl-bookings");
  if (!cache.bookings.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">ยังไม่มีการจอง</td></tr>`;
    return;
  }
  tbody.innerHTML = cache.bookings.map(b => `
    <tr>
      <td class="mono">${b.booking_id}</td>
      <td>${b.customers ? escapeHtml(b.customers.first_name + " " + b.customers.last_name) : "-"}</td>
      <td class="muted">${b.check_in}</td>
      <td class="muted">${b.check_out}</td>
      <td>${b.guest_count}</td>
      <td><span class="badge badge-${b.booking_status}">${bookingStatusLabel(b.booking_status)}</span></td>
      <td class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="openBookingModal(${b.booking_id})">แก้ไข</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBooking(${b.booking_id})">ลบ</button>
      </td>
    </tr>`).join("");
}
function bookingStatusLabel(s) {
  return { pending: "รอยืนยัน", confirmed: "ยืนยันแล้ว", checked_in: "เช็คอินแล้ว", checked_out: "เช็คเอาท์แล้ว", cancelled: "ยกเลิก" }[s] || s;
}
function openBookingModal(id = null) {
  const b = id ? cache.bookings.find(x => x.booking_id === id) : null;
  const customerOptions = cache.customers.map(c =>
    `<option value="${c.customer_id}" ${b?.customer_id === c.customer_id ? "selected" : ""}>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</option>`
  ).join("");
  openModal(b ? "แก้ไขการจอง" : "เพิ่มการจอง", `
    <form id="form-booking">
      <div class="field"><label>ลูกค้า</label>
        <select name="customer_id" required>${customerOptions || '<option value="">— ยังไม่มีลูกค้า —</option>'}</select></div>
      <div class="form-row">
        <div class="field"><label>เช็คอิน</label><input type="date" name="check_in" required value="${b ? b.check_in : ""}"></div>
        <div class="field"><label>เช็คเอาท์</label><input type="date" name="check_out" required value="${b ? b.check_out : ""}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>จำนวนผู้เข้าพัก</label><input type="number" min="1" name="guest_count" value="${b ? b.guest_count : 1}"></div>
        <div class="field"><label>สถานะการจอง</label>
          <select name="booking_status">
            ${["pending","confirmed","checked_in","checked_out","cancelled"].map(s =>
              `<option value="${s}" ${b?.booking_status === s ? "selected" : ""}>${bookingStatusLabel(s)}</option>`).join("")}
          </select></div>
      </div>
      <button class="btn btn-primary btn-block" type="submit">${b ? "บันทึกการแก้ไข" : "เพิ่มการจอง"}</button>
    </form>`);
  document.getElementById("form-booking").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      customer_id: Number(f.get("customer_id")),
      check_in: f.get("check_in"),
      check_out: f.get("check_out"),
      guest_count: Number(f.get("guest_count")),
      booking_status: f.get("booking_status"),
    };
    const q = b ? db.from("bookings").update(payload).eq("booking_id", id) : db.from("bookings").insert(payload);
    const { error } = await q;
    if (error) return toast("บันทึกไม่สำเร็จ: " + error.message, "error");

    // ถ้าเปลี่ยนสถานะเป็นยกเลิก/เช็คเอาท์แล้ว ให้ปรับห้องที่เกี่ยวข้องกลับเป็นว่าง
    if (b && ["cancelled", "checked_out"].includes(payload.booking_status)) {
      const { data: details } = await db.from("booking_details").select("room_id").eq("booking_id", id);
      const roomIds = [...new Set((details || []).map(d => d.room_id).filter(Boolean))];
      if (roomIds.length) await db.from("rooms").update({ room_status: "available" }).in("room_id", roomIds);
    }

    toast(b ? "แก้ไขการจองแล้ว" : "เพิ่มการจองแล้ว", "success");
    closeModal(); loadBookings(); loadRooms();
  });
}
async function deleteBooking(id) {
  if (!confirm("ลบการจองนี้? รายละเอียดห้องที่ผูกกับการจองนี้จะถูกลบด้วย และห้องที่เกี่ยวข้องจะถูกปรับกลับเป็นว่าง")) return;

  // หา room_id ที่ผูกกับการจองนี้ไว้ก่อน เพื่อเอาไปปรับสถานะห้องคืนทีหลัง
  const { data: details } = await db.from("booking_details").select("room_id").eq("booking_id", id);
  const roomIds = [...new Set((details || []).map(d => d.room_id).filter(Boolean))];

  const { error } = await db.from("bookings").delete().eq("booking_id", id);
  if (error) return toast("ลบไม่สำเร็จ: " + error.message, "error");

  if (roomIds.length) {
    await db.from("rooms").update({ room_status: "available" }).in("room_id", roomIds);
  }

  toast("ลบการจองแล้ว และปรับห้องที่เกี่ยวข้องเป็นว่างแล้ว", "success");
  loadBookings();
  loadRooms();
}

/* ---------------- dashboard ---------------- */
function updateDashboardStats() {
  document.getElementById("stat-available").textContent = cache.rooms.filter(r => r.room_status === "available").length;
  document.getElementById("stat-occupied").textContent = cache.rooms.filter(r => r.room_status === "occupied").length;
  document.getElementById("stat-bookings").textContent = cache.bookings.length;
  document.getElementById("stat-customers").textContent = cache.customers.length;
}

/* ---------------- utils ---------------- */
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
function escapeAttr(str) { return escapeHtml(str); }

/* ---------------- boot ---------------- */
(async function init() {
  await loadRoomTypes();
  await loadCustomers();
  await loadRooms();
  await loadBookings();
})();
