// ==========================================
// ตัวแปรเก็บข้อมูล (State)
// ==========================================
let state = {
  roomTypes: [],
  rooms: [],
  customers: [],
  bookings: []
};

// ==========================================
// เริ่มต้นการทำงานเมื่อโหลดหน้าเว็บ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  refreshAllData();
});

function refreshAllData() {
  loadDashboardStats();
  loadRoomTypes();
  loadRooms();
  loadCustomers();
  loadBookings();
}

// ==========================================
// ระบบเมนูซ้ายมือ (Sidebar Navigation)
// ==========================================
function initNavigation() {
  const navButtons = document.querySelectorAll('.admin-nav button');
  const views = document.querySelectorAll('.admin-view');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.getAttribute('data-view')).classList.add('active');
    });
  });
}

// ==========================================
// 1. โหลดข้อมูลภาพรวม (Dashboard)
// ==========================================
async function loadDashboardStats() {
  try {
    const { count: available } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('room_status', 'available');
    const { count: occupied } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('room_status', 'occupied');
    const { count: bookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
    const { count: customers } = await supabase.from('customers').select('*', { count: 'exact', head: true });

    document.getElementById('stat-available').textContent = available || 0;
    document.getElementById('stat-occupied').textContent = occupied || 0;
    document.getElementById('stat-bookings').textContent = bookings || 0;
    document.getElementById('stat-customers').textContent = customers || 0;
  } catch (err) { console.error('Error loading stats:', err); }
}

// ==========================================
// 2. ระบบประเภทห้องพัก (Room Types)
// ==========================================
async function loadRoomTypes() {
  const { data } = await supabase.from('room_types').select('*').order('room_type_id');
  state.roomTypes = data || [];
  const tbody = document.getElementById('tbl-room-types');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  state.roomTypes.forEach(type => {
    tbody.innerHTML += `
      <tr>
        <td class="mono">${type.room_type_id}</td>
        <td><strong>${type.room_type_name}</strong></td>
        <td>${type.description || '-'}</td>
        <td>${type.max_guest} ท่าน</td>
        <td>${type.facilities || '-'}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="openRoomTypeModal(${type.room_type_id})">แก้ไข</button>
          <button class="btn btn-ghost btn-sm" style="color:red;" onclick="deleteData('room_types', 'room_type_id', ${type.room_type_id})">ลบ</button>
        </td>
      </tr>`;
  });
}

window.openRoomTypeModal = function(id = null) {
  const item = state.roomTypes.find(x => x.room_type_id == id) || {};
  const html = `
    <form onsubmit="saveRoomType(event, ${id})">
      <div class="field"><label>ชื่อประเภทห้อง</label><input type="text" id="rt_name" required value="${item.room_type_name || ''}"></div>
      <div class="field"><label>รายละเอียด</label><input type="text" id="rt_desc" value="${item.description || ''}"></div>
      <div class="form-row">
        <div class="field"><label>ผู้เข้าพักสูงสุด</label><input type="number" id="rt_max" required value="${item.max_guest || 2}"></div>
        <div class="field"><label>สิ่งอำนวยความสะดวก</label><input type="text" id="rt_fac" value="${item.facilities || ''}"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">บันทึกข้อมูล</button>
    </form>`;
  openModal(id ? 'แก้ไขประเภทห้อง' : 'เพิ่มประเภทห้องใหม่', html);
}

window.saveRoomType = async function(e, id) {
  e.preventDefault();
  const data = {
    room_type_name: document.getElementById('rt_name').value,
    description: document.getElementById('rt_desc').value,
    max_guest: document.getElementById('rt_max').value,
    facilities: document.getElementById('rt_fac').value
  };
  try {
    if(id) await supabase.from('room_types').update(data).eq('room_type_id', id);
    else await supabase.from('room_types').insert([data]);
    closeModal(); loadRoomTypes();
  } catch (err) { alert(err.message); }
}

// ==========================================
// 3. ระบบห้องพัก (Rooms)
// ==========================================
async function loadRooms() {
  const { data } = await supabase.from('rooms').select('*, room_types(*)').order('room_number');
  state.rooms = data || [];
  const tbody = document.getElementById('tbl-rooms');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  state.rooms.forEach(room => {
    const typeName = room.room_types ? room.room_types.room_type_name : '-';
    const isAvail = room.room_status === 'available';
    tbody.innerHTML += `
      <tr>
        <td class="mono">${room.room_id}</td>
        <td><strong style="color:var(--primary); font-size:1.1rem;">${room.room_number}</strong></td>
        <td>${typeName}</td>
        <td>${room.floor || '-'}</td>
        <td>฿${Number(room.price_per_night).toLocaleString()}</td>
        <td><span style="color: ${isAvail ? 'var(--primary)' : 'red'}; font-weight:500;">${isAvail ? 'ว่าง' : 'ไม่ว่าง'}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="openRoomModal(${room.room_id})">แก้ไข</button>
          <button class="btn btn-ghost btn-sm" style="color:red;" onclick="deleteData('rooms', 'room_id', ${room.room_id})">ลบ</button>
        </td>
      </tr>`;
  });
}

window.openRoomModal = function(id = null) {
  const item = state.rooms.find(x => x.room_id == id) || {};
  let typeOptions = state.roomTypes.map(t => `<option value="${t.room_type_id}" ${item.room_type_id == t.room_type_id ? 'selected' : ''}>${t.room_type_name}</option>`).join('');
  const html = `
    <form onsubmit="saveRoom(event, ${id})">
      <div class="form-row">
        <div class="field"><label>เลขห้อง</label><input type="text" id="r_no" required value="${item.room_number || ''}"></div>
        <div class="field"><label>ประเภท</label><select id="r_type">${typeOptions}</select></div>
      </div>
      <div class="form-row">
        <div class="field"><label>ชั้น</label><input type="number" id="r_floor" value="${item.floor || 1}"></div>
        <div class="field"><label>ราคาต่อคืน</label><input type="number" id="r_price" required value="${item.price_per_night || 0}"></div>
      </div>
      <div class="field"><label>สถานะ</label>
        <select id="r_status">
          <option value="available" ${item.room_status == 'available' ? 'selected' : ''}>ว่าง (Available)</option>
          <option value="occupied" ${item.room_status == 'occupied' ? 'selected' : ''}>ไม่ว่าง (Occupied)</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">บันทึกข้อมูล</button>
    </form>`;
  openModal(id ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพักใหม่', html);
}

window.saveRoom = async function(e, id) {
  e.preventDefault();
  const data = {
    room_number: document.getElementById('r_no').value,
    room_type_id: document.getElementById('r_type').value,
    floor: document.getElementById('r_floor').value,
    price_per_night: document.getElementById('r_price').value,
    room_status: document.getElementById('r_status').value
  };
  try {
    if(id) await supabase.from('rooms').update(data).eq('room_id', id);
    else await supabase.from('rooms').insert([data]);
    closeModal(); loadRooms(); loadDashboardStats();
  } catch (err) { alert(err.message); }
}

// ==========================================
// 4. ระบบลูกค้า (Customers)
// ==========================================
async function loadCustomers() {
  const { data } = await supabase.from('customers').select('*, bookings(booking_details(rooms(room_number)))').order('customer_id', { ascending: false });
  state.customers = data || [];
  const tbody = document.getElementById('tbl-customers');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  state.customers.forEach(c => {
    let bookedRooms = '-';
    if(c.bookings && c.bookings.length > 0) {
      const rooms = [];
      c.bookings.forEach(b => {
        if(b.booking_details) b.booking_details.forEach(bd => { if(bd.rooms && bd.rooms.room_number) rooms.push(bd.rooms.room_number); });
      });
      if(rooms.length > 0) bookedRooms = [...new Set(rooms)].join(', ');
    }
    
    // ดึงวันที่จาก register_date ตามฐานข้อมูลจริงของคุณ
    const regDate = c.register_date || '-';
    
    tbody.innerHTML += `
      <tr>
        <td class="mono">${c.customer_id}</td>
        <td><strong>${c.first_name} ${c.last_name}</strong></td>
        <td>${c.phone || '-'}</td>
        <td>${c.email || '-'}</td>
        <td><span class="eyebrow" style="color:var(--primary); font-size:0.95rem;">${bookedRooms}</span></td>
        <td>${regDate}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="openCustomerModal(${c.customer_id})">แก้ไข</button>
          <button class="btn btn-ghost btn-sm" style="color:red;" onclick="deleteData('customers', 'customer_id', ${c.customer_id})">ลบ</button>
        </td>
      </tr>`;
  });
}

window.openCustomerModal = function(id = null) {
  const item = state.customers.find(x => x.customer_id == id) || {};
  const html = `
    <form onsubmit="saveCustomer(event, ${id})">
      <div class="form-row">
        <div class="field"><label>ชื่อ</label><input type="text" id="c_fname" required value="${item.first_name || ''}"></div>
        <div class="field"><label>นามสกุล</label><input type="text" id="c_lname" required value="${item.last_name || ''}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>เบอร์โทรศัพท์</label><input type="text" id="c_phone" value="${item.phone || ''}"></div>
        <div class="field"><label>อีเมล</label><input type="email" id="c_email" value="${item.email || ''}"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">บันทึกข้อมูล</button>
    </form>`;
  openModal(id ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่', html);
}

window.saveCustomer = async function(e, id) {
  e.preventDefault();
  
  // สร้างวันที่ปัจจุบัน (YYYY-MM-DD) สำหรับลูกค้าใหม่
  const today = new Date().toISOString().split('T')[0];
  
  const data = {
    first_name: document.getElementById('c_fname').value,
    last_name: document.getElementById('c_lname').value,
    phone: document.getElementById('c_phone').value,
    email: document.getElementById('c_email').value
  };
  
  try {
    if(id) {
      await supabase.from('customers').update(data).eq('customer_id', id);
    } else {
      // เพิ่ม register_date สำหรับลูกค้าใหม่
      data.register_date = today;
      await supabase.from('customers').insert([data]);
    }
    closeModal(); loadCustomers(); loadDashboardStats();
  } catch (err) { alert(err.message); }
}

// ==========================================
// 5. ระบบการจอง (Bookings)
// ==========================================
async function loadBookings() {
  const { data } = await supabase.from('bookings').select('*, customers(*), booking_details(rooms(room_number))').order('booking_id', { ascending: false });
  state.bookings = data || [];
  const tbody = document.getElementById('tbl-bookings');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  state.bookings.forEach(b => {
    const cName = b.customers ? `${b.customers.first_name} ${b.customers.last_name}` : '-';
    let roomNo = '-';
    if(b.booking_details) roomNo = b.booking_details.filter(bd=>bd.rooms).map(bd=>bd.rooms.room_number).join(', ');
    
    tbody.innerHTML += `
      <tr>
        <td class="mono">${b.booking_id}</td>
        <td>${cName}</td>
        <td><strong style="color:var(--primary);">${roomNo}</strong></td>
        <td>${b.check_in}</td>
        <td>${b.check_out}</td>
        <td>${b.guest_count}</td>
        <td>${b.booking_status}</td>
        <td>
          <button class="btn btn-ghost btn-sm" style="color:red;" onclick="deleteData('bookings', 'booking_id', ${b.booking_id})">ลบ</button>
        </td>
      </tr>`;
  });
}

// ให้แจ้งเตือนว่าการจองใหม่ควรทำผ่านหน้าเว็บลูกค้า
window.openBookingModal = function() {
  openModal('ทำรายการจอง', '<p class="muted" style="text-align:center; padding: 20px;">กรุณาทำรายการจองผ่านทาง <b>หน้าเว็บของลูกค้า (Booking Page)</b> <br>เพื่อให้ระบบตรวจสอบห้องว่างและคำนวณราคาได้อย่างถูกต้องครับ</p>');
}

// ==========================================
// ระบบ Modal พื้นฐาน และ ระบบลบข้อมูล
// ==========================================
function openModal(title, htmlContent) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = htmlContent;
  document.getElementById('modal-backdrop').classList.add('active');
}

function closeModal() { 
  document.getElementById('modal-backdrop').classList.remove('active'); 
}

window.deleteData = async function(table, idColumn, idValue) {
  if(!confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?')) return;
  try {
    const { error } = await supabase.from(table).delete().eq(idColumn, idValue);
    if (error) throw error;
    refreshAllData();
  } catch (err) {
    alert('ไม่สามารถลบได้ เนื่องจากมีข้อมูลอื่นผูกอยู่ (เช่น ลูกค้าคนนี้มีรายการจองค้างอยู่)');
    console.error(err);
  }
}
