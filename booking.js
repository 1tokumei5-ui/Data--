// ============================================================
// AURELINE HOTEL — booking.js
// สร้างลูกค้า (ถ้ายังไม่มี) + การจอง + รายละเอียดการจอง (Create)
// ============================================================

let availableRooms = [];
const params = new URLSearchParams(location.search);
const preselectRoomId = params.get("room_id");

function toast(message, type = "info") {
  const stack = document.getElementById("toast-stack");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

async function loadAvailableRooms() {
  const { data, error } = await db
    .from("rooms")
    .select("*, room_types(room_type_name)")
    .eq("room_status", "available")
    .order("price_per_night");

  const select = document.getElementById("select-room");
  if (error) {
    select.innerHTML = `<option value="">โหลดห้องไม่สำเร็จ</option>`;
    toast("โหลดรายการห้องไม่สำเร็จ: " + error.message, "error");
    return;
  }
  availableRooms = data || [];
  select.innerHTML = availableRooms.map(r =>
    `<option value="${r.room_id}" ${String(r.room_id) === preselectRoomId ? "selected" : ""}>
      ห้อง ${r.room_number} — ${r.room_types?.room_type_name || ""} (฿${Number(r.price_per_night).toLocaleString()}/คืน)
    </option>`).join("");
  onRoomOrDateChange();
}

/* ---------------- stepper navigation ---------------- */
function goToStep(n) {
  document.querySelectorAll(".form-step").forEach(s => s.classList.remove("active"));
  document.getElementById(`step-${n}`).classList.add("active");
  document.querySelectorAll(".step").forEach(s => {
    const step = Number(s.dataset.step);
    s.classList.toggle("active", step === n);
    s.classList.toggle("done", step < n);
  });
  if (n === 3) renderSummary();
}

function validateStep1() {
  const form = document.getElementById("booking-form");
  return form.first_name.value && form.last_name.value && form.phone.value && form.email.value;
}

function validateStep2() {
  const form = document.getElementById("booking-form");
  if (!form.room_id.value) return toast("กรุณาเลือกห้องพัก", "error");
  if (!form.check_in.value || !form.check_out.value) return toast("กรุณาเลือกวันที่เข้าพัก", "error");
  if (new Date(form.check_out.value) <= new Date(form.check_in.value)) {
    return toast("วันเช็คเอาท์ต้องอยู่หลังวันเช็คอิน", "error");
  }
  goToStep(3);
}

function getNights() {
  const form = document.getElementById("booking-form");
  const ci = form.check_in.value, co = form.check_out.value;
  if (!ci || !co) return 0;
  const nights = Math.round((new Date(co) - new Date(ci)) / 86400000);
  return nights > 0 ? nights : 0;
}

function onRoomOrDateChange() {
  const form = document.getElementById("booking-form");
  const room = availableRooms.find(r => String(r.room_id) === form.room_id.value);
  const nights = getNights();
  const preview = document.getElementById("price-preview");
  if (room && nights > 0) {
    preview.textContent = `${nights} คืน × ฿${Number(room.price_per_night).toLocaleString()} = ฿${(nights * room.price_per_night).toLocaleString()}`;
  } else {
    preview.textContent = "";
  }
}

function renderSummary() {
  const form = document.getElementById("booking-form");
  const room = availableRooms.find(r => String(r.room_id) === form.room_id.value);
  const nights = getNights();
  const total = room ? nights * room.price_per_night : 0;
  document.getElementById("booking-summary").innerHTML = `
    <div class="summary-row"><span>ผู้เข้าพัก</span><strong>${form.first_name.value} ${form.last_name.value}</strong></div>
    <div class="summary-row"><span>ติดต่อ</span><strong>${form.phone.value} · ${form.email.value}</strong></div>
    <div class="summary-row"><span>ห้องพัก</span><strong>ห้อง ${room?.room_number || "-"} (${room?.room_types?.room_type_name || "-"})</strong></div>
    <div class="summary-row"><span>เช็คอิน — เช็คเอาท์</span><strong>${form.check_in.value} → ${form.check_out.value}</strong></div>
    <div class="summary-row"><span>จำนวนคืน</span><strong>${nights} คืน</strong></div>
    <div class="summary-row total"><span>ยอดชำระโดยประมาณ</span><strong>฿${total.toLocaleString()}</strong></div>
  `;
}

/* ---------------- submit ---------------- */
document.getElementById("booking-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังบันทึก…";

  try {
    const room = availableRooms.find(r => String(r.room_id) === form.room_id.value);
    const nights = getNights();
    if (!room || nights <= 0) throw new Error("ข้อมูลห้องหรือวันที่ไม่ถูกต้อง");

    // 1) หาลูกค้าจากอีเมล ถ้าไม่พบให้สร้างใหม่
    let customerId;
    const { data: existing, error: findErr } = await db
      .from("customers").select("customer_id").eq("email", form.email.value).maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      customerId = existing.customer_id;
    } else {
      const { data: newCustomer, error: custErr } = await db
        .from("customers")
        .insert({
          first_name: form.first_name.value,
          last_name: form.last_name.value,
          phone: form.phone.value,
          email: form.email.value,
        })
        .select("customer_id")
        .single();
      if (custErr) throw custErr;
      customerId = newCustomer.customer_id;
    }

    // 2) สร้างการจอง (bookings)
    const { data: booking, error: bookErr } = await db
      .from("bookings")
      .insert({
        customer_id: customerId,
        check_in: form.check_in.value,
        check_out: form.check_out.value,
        guest_count: Number(form.guest_count.value),
        booking_status: "pending",
      })
      .select("booking_id")
      .single();
    if (bookErr) throw bookErr;

    // 3) สร้างรายละเอียดการจอง (booking_details)
    const totalPrice = nights * Number(room.price_per_night);
    const { error: detailErr } = await db.from("booking_details").insert({
      booking_id: booking.booking_id,
      room_id: room.room_id,
      price_per_night: room.price_per_night,
      total_nights: nights,
      total_price: totalPrice,
    });
    if (detailErr) throw detailErr;

    // 4) อัปเดตสถานะห้องเป็นไม่ว่าง
    await db.from("rooms").update({ room_status: "occupied" }).eq("room_id", room.room_id);

    document.getElementById("success-detail").textContent =
      `หมายเลขการจอง #${booking.booking_id} — ห้อง ${room.room_number} ยอดรวม ฿${totalPrice.toLocaleString()} (สถานะ: รอยืนยัน)`;
    document.querySelectorAll(".form-step").forEach(s => s.classList.remove("active"));
    document.getElementById("step-success").classList.add("active");
    document.querySelector(".stepper").style.display = "none";

  } catch (err) {
    toast("จองไม่สำเร็จ: " + err.message, "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "ยืนยันการจอง";
  }
});

loadAvailableRooms();
