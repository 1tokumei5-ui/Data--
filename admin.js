let state = { roomTypes: [], rooms: [], customers: [], bookings: [] };

document.addEventListener('DOMContentLoaded', () => { initNavigation(); refreshAllData(); });

function refreshAllData() { loadDashboardStats(); loadRoomTypes(); loadRooms(); loadCustomers(); loadBookings(); }

function initNavigation() {
  const navButtons = document.querySelectorAll('.admin-nav button');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => showView(btn.getAttribute('data-view')));
  });
}

window.showView = function(viewName) {
  document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
  const navBtn = document.querySelector(`.admin-nav button[data-view="${viewName}"]`);
  if(navBtn) navBtn.classList.add('active');
  document.getElementById('view-' + viewName).classList.add('active');
}

function formatDate(dateStr) {
  if(!dateStr) return '-';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

// โหลดข้อมูล Dashboard
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
  } catch (err) {}
}

// โหลดประเภทห้อง
async function loadRoomTypes() {
  const { data } = await supabase.from('room_types').select('*').order('room_type_id');
  state.roomTypes = data || [];
  const tbody = document.getElementById('tbl-room-types'); if(!tbody) return; tbody.innerHTML = '';
  state.roomTypes.forEach(type => {
    tbody.innerHTML += `<tr><td class="mono">${type.room_type_id}</td><td><strong>${type.room_type_name}</strong></td><td>${type.description || '-'}</td><td>${type.max_guest} ท่าน</td><td>${type.facilities || '-'}</td><td><button class="btn btn-ghost btn-sm" onclick="openRoomTypeModal(${type.room_type_id})">แก้ไข</button></td></tr>`;
  });
}

// โหลดห้องพัก
async function loadRooms() {
  const { data } = await supabase.from('rooms').select('*, room_types(*)').order('room_number');
  state.rooms = data || [];
  const tbody = document.getElementById('tbl-rooms'); if(!tbody) return; tbody.innerHTML = '';
  state.rooms.forEach(room => {
    const typeName = room.room_types ? room.room_types.room_type_name : '-';
    const isAvail = room.room_status === 'available';
    tbody.innerHTML += `<tr><td class="mono">${room.room_id}</td><td><strong style="color:var(--primary); font-size:1.1rem;">${room.room_number}</strong></td><td>${typeName}</td><td>${room.floor || '-'}</td><td>฿${Number(room.price_per_night).toLocaleString()}</td><td><span style="color: ${isAvail ? 'var(--primary)' : 'red'};">${isAvail ? 'ว่าง' : 'ไม่ว่าง'}</span></td><td><button class="btn btn-ghost btn-sm" onclick="openRoomModal(${room.room_id})">แก้ไข</button></td></tr>`;
  });
}

// โหลดลูกค้า
async function loadCustomers() {
  const { data } = await supabase.from('customers').select('*, bookings(booking_details(rooms(room_number)))').order('customer_id', { ascending: false });
  state.customers = data || [];
  const tbody = document.getElementById('tbl-customers'); if(!tbody) return; tbody.innerHTML = '';
  state.customers.forEach(c => {
    let bookedRooms = '-';
    if(c.bookings && c.bookings.length > 0) {
      const rooms = [];
      c.bookings.forEach(b => { if(b.booking_details) b.booking_details.forEach(bd => { if(bd.rooms && bd.rooms.room_number) rooms.push(bd.rooms.room_number); }); });
      if(rooms.length > 0) bookedRooms = [...new Set(rooms)].join(', ');
    }
    const regDate = c.register_date ? formatDate(c.register_date) : '-';
    tbody.innerHTML += `<tr><td class="mono">${c.customer_id}</td><td><strong>${c.first_name || ''} ${c.last_name || ''}</strong></td><td>${c.phone || '-'}</td><td>${c.email || '-'}</td><td><span class="eyebrow" style="color:var(--primary);">${bookedRooms}</span></td><td>${regDate}</td><td><button class="btn btn-primary btn-sm" onclick="viewCustomerDetails(${c.customer_id})">รายละเอียด</button> <button class="btn btn-ghost btn-sm" style="color:red;" onclick="deleteData('customers', 'customer_id', ${c.customer_id})">ลบ</button></td></tr>`;
  });
}

// โหลดการจอง
async function loadBookings() {
  const { data } = await supabase.from('bookings').select('*, customers(*), booking_details(rooms(room_number))').order('booking_id', { ascending: false });
  state.bookings = data || [];
  const tbody = document.getElementById('tbl-bookings'); if(!tbody) return; tbody.innerHTML = '';
  state.bookings.forEach(b => {
    const cName = b.customers ? `${b.customers.first_name} ${b.customers.last_name}` : '-';
    let roomNo = '-';
    if(b.booking_details) roomNo = b.booking_details.filter(bd=>bd.rooms).map(bd=>bd.rooms.room_number).join(', ');
    tbody.innerHTML += `<tr><td class="mono">BK000${b.booking_id}</td><td>${cName}</td><td><strong style="color:var(--primary);">${roomNo}</strong></td><td>${formatDate(b.check_in)}</td><td>${formatDate(b.check_out)}</td><td>${b.guest_count}</td><td>${b.booking_status === 'pending' ? 'รอยืนยัน' : b.booking_status}</td><td><button class="btn btn-primary btn-sm" onclick="viewBookingDetails(${b.booking_id})">รายละเอียด</button> <button class="btn btn-ghost btn-sm" style="color:red;" onclick="deleteData('bookings', 'booking_id', ${b.booking_id})">ลบ</button></td></tr>`;
  });
}

// รายละเอียดการจอง
window.viewBookingDetails = async function(bookingId) {
  try {
    const { data: booking, error } = await supabase.from('bookings').select('*, customers(*), booking_details(rooms(room_number, price_per_night, room_type_id))').eq('booking_id', bookingId).single();
    if (error) throw error;
    let rType = 'ไม่ระบุ'; let rNo = '-'; let rPrice = 0;
    if (booking.booking_details && booking.booking_details[0] && booking.booking_details[0].rooms) {
      const room = booking.booking_details[0].rooms; rNo = room.room_number; rPrice = room.price_per_night;
      const rtObj = state.roomTypes.find(rt => rt.room_type_id == room.room_type_id); if(rtObj) rType = rtObj.room_type_name;
    }
    const diffDays = Math.ceil(Math.abs(new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)) || 1;
    const cName = booking.customers ? `${booking.customers.first_name} ${booking.customers.last_name}` : '-';
    const cPhone = booking.customers ? booking.customers.phone : '-';
    const bStatus = booking.booking_status === 'pending' ? 'รอยืนยัน' : 'ยืนยันแล้ว';
    const statusClass = booking.booking_status === 'pending' ? 'status-pending' : 'status-confirmed';

    document.getElementById('det-id').textContent = `BK000${booking.booking_id}`;
    document.getElementById('det-name').textContent = cName; document.getElementById('det-phone').textContent = cPhone;
    document.getElementById('det-checkin').textContent = formatDate(booking.check_in); document.getElementById('det-checkout').textContent = formatDate(booking.check_out);
    document.getElementById('det-status').textContent = bStatus; document.getElementById('det-status').className = `status-badge ${statusClass}`;
    document.getElementById('det-roomtype').textContent = `ห้อง ${rType}`; document.getElementById('det-roomno').textContent = rNo;
    document.getElementById('det-price').textContent = Number(rPrice).toLocaleString(); document.getElementById('det-nights').textContent = `${diffDays} คืน`;
    document.getElementById('det-total').textContent = `${Number(rPrice * diffDays).toLocaleString()} บาท`;
    document.getElementById('det-img').src = ["https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&w=400&q=80", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&w=400&q=80"][booking.booking_id % 2];
    
    document.getElementById('join-c-name').textContent = cName; document.getElementById('join-c-phone').textContent = cPhone;
    document.getElementById('join-r-type').textContent = rType; document.getElementById('join-r-no').textContent = rNo;
    document.getElementById('join-r-price').textContent = `${Number(rPrice).toLocaleString()} บาท/คืน`;
    document.getElementById('join-b-in').textContent = formatDate(booking.check_in); document.getElementById('join-b-out').textContent = formatDate(booking.check_out);
    document.getElementById('join-b-status').textContent = bStatus;
    showView('booking-details');
  } catch (err) { alert('ไม่สามารถดึงข้อมูลรายละเอียดได้'); }
}

// รายละเอียดลูกค้า
window.viewCustomerDetails = async function(customerId) {
  try {
    const { data: customer, error } = await supabase.from('customers').select('*, bookings(*, booking_details(rooms(room_number, price_per_night)))').eq('customer_id', customerId).single();
    if (error) throw error;
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    document.getElementById('det-c-id').textContent = customer.customer_id;
    document.getElementById('det-c-name').textContent = fullName;
    document.getElementById('det-c-initial').textContent = fullName ? fullName.charAt(0).toUpperCase() : '?';
    document.getElementById('det-c-phone').textContent = customer.phone || '-';
    document.getElementById('det-c-email').textContent = customer.email || '-';
    document.getElementById('det-c-reg').textContent = customer.register_date ? formatDate(customer.register_date) : '-';
    document.getElementById('det-c-total-bookings').textContent = `${(customer.bookings || []).length} รายการ`;
    document.getElementById('btn-edit-customer').onclick = () => openCustomerModal(customer.customer_id);

    const tbody = document.getElementById('tbl-customer-booking-history'); tbody.innerHTML = '';
    if ((customer.bookings || []).length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">ไม่มีประวัติการจองห้องพัก</td></tr>';
    } else {
      customer.bookings.sort((a, b) => b.booking_id - a.booking_id).forEach(b => {
        let rNo = '-'; let rPrice = 0;
        if (b.booking_details && b.booking_details[0] && b.booking_details[0].rooms) { rNo = b.booking_details[0].rooms.room_number; rPrice = b.booking_details[0].rooms.price_per_night; }
        const diffDays = Math.ceil(Math.abs(new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)) || 1;
        const statusHTML = b.booking_status === 'pending' ? '<span class="status-badge status-pending">รอยืนยัน</span>' : '<span class="status-badge status-confirmed">ยืนยันแล้ว</span>';
        tbody.innerHTML += `<tr><td class="mono">BK000${b.booking_id}</td><td><strong style="color:var(--primary);">${rNo}</strong></td><td>${formatDate(b.check_in)}</td><td>${formatDate(b.check_out)}</td><td>${statusHTML}</td><td>${Number(rPrice * diffDays).toLocaleString()} บาท</td><td><button class="btn btn-ghost btn-sm" onclick="viewBookingDetails(${b.booking_id})">ดูรายละเอียด</button></td></tr>`;
      });
    }
    showView('customer-details');
  } catch (err) { alert('ไม่สามารถดึงข้อมูลรายละเอียดลูกค้าได้'); }
}

// ฟังก์ชัน CRUD และ Modal
function openModal(title, html) { document.getElementById('modal-title').textContent = title; document.getElementById('modal-body').innerHTML = html; document.getElementById('modal-backdrop').classList.add('active'); }
function closeModal() { document.getElementById('modal-backdrop').classList.remove('active'); }

window.openRoomTypeModal = function(id = null) {
  const item = state.roomTypes.find(x => x.room_type_id == id) || {};
  openModal(id ? 'แก้ไขประเภทห้อง' : 'เพิ่มประเภทห้องใหม่', `<form onsubmit="saveRoomType(event, ${id})"><div class="field"><label>ชื่อประเภทห้อง</label><input type="text" id="rt_name" required value="${item.room_type_name || ''}"></div><div class="field"><label>รายละเอียด</label><input type="text" id="rt_desc" value="${item.description || ''}"></div><div class="form-row"><div class="field"><label>ผู้เข้าพักสูงสุด</label><input type="number" id="rt_max" required value="${item.max_guest || 2}"></div><div class="field"><label>สิ่งอำนวยความสะดวก</label><input type="text" id="rt_fac" value="${item.facilities || ''}"></div></div><button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">บันทึกข้อมูล</button></form>`);
}
window.saveRoomType = async function(e, id) { e.preventDefault(); try { const d = {room_type_name: document.getElementById('rt_name').value, description: document.getElementById('rt_desc').value, max_guest: document.getElementById('rt_max').value, facilities: document.getElementById('rt_fac').value}; if(id) await supabase.from('room_types').update(d).eq('room_type_id', id); else await supabase.from('room_types').insert([d]); closeModal(); loadRoomTypes(); } catch(err) {alert(err.message);} }

window.openRoomModal = function(id = null) {
  const item = state.rooms.find(x => x.room_id == id) || {};
  openModal(id ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพักใหม่', `<form onsubmit="saveRoom(event, ${id})"><div class="form-row"><div class="field"><label>เลขห้อง</label><input type="text" id="r_no" required value="${item.room_number || ''}"></div><div class="field"><label>ประเภท</label><select id="r_type">${state.roomTypes.map(t => `<option value="${t.room_type_id}" ${item.room_type_id == t.room_type_id ? 'selected' : ''}>${t.room_type_name}</option>`).join('')}</select></div></div><div class="form-row"><div class="field"><label>ชั้น</label><input type="number" id="r_floor" value="${item.floor || 1}"></div><div class="field"><label>ราคาต่อคืน</label><input type="number" id="r_price" required value="${item.price_per_night || 0}"></div></div><div class="field"><label>สถานะ</label><select id="r_status"><option value="available" ${item.room_status == 'available' ? 'selected' : ''}>ว่าง</option><option value="occupied" ${item.room_status == 'occupied' ? 'selected' : ''}>ไม่ว่าง</option></select></div><button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">บันทึกข้อมูล</button></form>`);
}
window.saveRoom = async function(e, id) { e.preventDefault(); try { const d = {room_number: document.getElementById('r_no').value, room_type_id: document.getElementById('r_type').value, floor: document.getElementById('r_floor').value, price_per_night: document.getElementById('r_price').value, room_status: document.getElementById('r_status').value}; if(id) await supabase.from('rooms').update(d).eq('room_id', id); else await supabase.from('rooms').insert([d]); closeModal(); loadRooms(); loadDashboardStats();} catch(err) {alert(err.message);} }

window.openCustomerModal = function(id = null) {
  const item = state.customers.find(x => x.customer_id == id) || {};
  openModal(id ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่', `<form onsubmit="saveCustomer(event, ${id})"><div class="form-row"><div class="field"><label>ชื่อ</label><input type="text" id="c_fname" required value="${item.first_name || ''}"></div><div class="field"><label>นามสกุล</label><input type="text" id="c_lname" required value="${item.last_name || ''}"></div></div><div class="form-row"><div class="field"><label>เบอร์โทรศัพท์</label><input type="text" id="c_phone" value="${item.phone || ''}"></div><div class="field"><label>อีเมล</label><input type="email" id="c_email" value="${item.email || ''}"></div></div><button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">บันทึกข้อมูล</button></form>`);
}
window.saveCustomer = async function(e, id) { e.preventDefault(); try { const d = {first_name: document.getElementById('c_fname').value, last_name: document.getElementById('c_lname').value, phone: document.getElementById('c_phone').value, email: document.getElementById('c_email').value}; if(id) { await supabase.from('customers').update(d).eq('customer_id', id); } else { d.register_date = new Date().toISOString().split('T')[0]; await supabase.from('customers').insert([d]); } closeModal(); loadCustomers(); loadDashboardStats(); if(id) viewCustomerDetails(id); } catch(err) {alert(err.message);} }

window.openBookingModal = function() { openModal('แจ้งเตือน', '<p class="muted" style="text-align:center; padding: 20px;">กรุณาทำรายการจองผ่านหน้าเว็บหลัก เพื่อความถูกต้องของการตัดสต๊อกห้อง</p>'); }
window.deleteData = async function(table, idColumn, idValue) { if(!confirm('แน่ใจหรือไม่ที่จะลบข้อมูลนี้?')) return; try { const {error} = await supabase.from(table).delete().eq(idColumn, idValue); if(error) throw error; refreshAllData(); } catch(err) { alert('ข้อมูลถูกผูกใช้งานอยู่ (ติด Foreign Key)'); } }
