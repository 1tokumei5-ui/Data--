// เก็บข้อมูลไว้ในหน่วยความจำ
let allRooms = [];
let roomTypes = [];

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
document.addEventListener('DOMContentLoaded', async () => {
  await loadRoomTypes();
  await loadRooms();
  updateHeroStats();
});

// 1. โหลดประเภทห้องพัก (สำหรับ Dropdown และใช้อ้างอิงชื่อประเภท)
async function loadRoomTypes() {
  try {
    const { data, error } = await supabase.from('room_types').select('*');
    if (error) throw error;
    
    roomTypes = data || [];
    const filterSelect = document.getElementById('filter-type');
    
    roomTypes.forEach(type => {
      const option = document.createElement('option');
      // เก็บ ID ประเภทห้องเพื่อใช้จับคู่
      const typeId = type.id || type.room_type_id;
      option.value = typeId;
      
      option.textContent = type.type_name || type.name || type.room_type_name || 'ไม่ระบุประเภท';
      filterSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading room types:', err);
  }
}

// 2. โหลดข้อมูลห้องพักทั้งหมด
async function loadRooms() {
  try {
    // พยายาม Join ข้อมูลก่อน ถ้าไม่ติดเดี๋ยวเราจะไปจับคู่เองใน renderRooms
    const { data, error } = await supabase.from('rooms').select(`*, room_types(*)`);
    if (error) throw error;
    
    allRooms = data || [];
    
    // เรียงลำดับตามเลขห้อง
    allRooms.sort((a, b) => {
       const numA = a.room_number || a.room_no || 0;
       const numB = b.room_number || b.room_no || 0;
       return String(numA).localeCompare(String(numB));
    });
    
    renderRooms();
  } catch (err) {
    console.error('Error loading rooms:', err);
  }
}

// 3. วาดการ์ดแสดงห้องพัก
function renderRooms() {
  const grid = document.getElementById('rooms-grid');
  const filterValue = document.getElementById('filter-type').value;
  grid.innerHTML = '';
  
  let filteredRooms = allRooms;
  if (filterValue) {
    filteredRooms = allRooms.filter(room => room.room_type_id == filterValue);
  }
  
  if (filteredRooms.length === 0) {
    grid.innerHTML = '<p class="muted" style="grid-column: 1/-1; text-align:center;">ไม่พบห้องพักที่พร้อมให้บริการ</p>';
    return;
  }
  
  // ชุดรูปภาพธีมทะเลหรูหรา (8 สไตล์ สำหรับประเภทห้องที่ไม่ซ้ำกัน)
  const luxuryImages = [
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  filteredRooms.forEach((room, index) => {
    // 💡 การจับคู่ประเภทห้อง: ค้นหาข้อมูลจาก roomTypes ที่โหลดมาตอนแรกด้วย room_type_id
    // วิธีนี้รับประกันว่าชื่อประเภทห้องจะขึ้นแน่นอน แม้ว่าระบบ Join ของ Supabase จะหาไม่เจอก็ตาม
    const rtManual = roomTypes.find(t => t.id == room.room_type_id || t.room_type_id == room.room_type_id) || {};
    const rtJoin = room.room_types || {};
    
    // ดึงชื่อและรายละเอียดประเภทห้อง
    const typeName = rtJoin.type_name || rtManual.type_name || rtJoin.name || rtManual.name || rtJoin.room_type_name || rtManual.room_type_name || 'ไม่ระบุประเภท';
    const maxGuests = rtJoin.max_guests || rtManual.max_guests || rtJoin.capacity || rtManual.capacity || '-';
    const amenities = rtJoin.amenities || rtManual.amenities || rtJoin.description || rtManual.description || '';
    
    // ดึงราคา สถานะ และเลขห้อง จากตาราง rooms โดยตรง
    const price = room.price_per_night || 0; 
    const isAvailable = room.room_status === 'available';
    const roomIdentifier = room.room_number || '?';

    // 💡 เลือกรูปภาพจาก Array โดยใช้ room_type_id เป็นตัวกำหนด
    // ทำให้ห้องประเภทเดียวกัน (เช่น Superior) จะได้รูปเดียวกันเสมอ และต่างประเภทก็จะได้รูปที่ต่างกัน
    const typeIdForImage = room.room_type_id || index;
    const imageUrl = luxuryImages[typeIdForImage % luxuryImages.length];

    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      <img src="${imageUrl}" class="room-card-img" alt="${typeName}">
      <div class="room-card-body">
        <span class="eyebrow">ห้อง ${roomIdentifier} | ชั้น ${room.floor || '-'}</span>
        <h3>${typeName}</h3>
        <p class="muted" style="font-size: 0.9rem; margin-bottom: 16px;">
          พักสูงสุด ${maxGuests} ท่าน <br>${amenities}
        </p>
        <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: var(--primary); font-size: 1.25rem;">฿${Number(price).toLocaleString()}</strong>
            <span class="muted" style="font-size: 0.8rem;">/ คืน</span>
          </div>
          ${isAvailable 
            ? `<a href="booking.html?room_id=${room.room_id}" class="btn btn-primary btn-sm">จองห้องนี้</a>` 
            : `<button class="btn btn-ghost btn-sm" disabled style="opacity: 0.5;">ไม่ว่าง</button>`}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 4. อัปเดตตัวเลขแบนเนอร์ด้านบน
function updateHeroStats() {
  const availableCount = allRooms.filter(room => room.room_status === 'available').length;
  
  document.getElementById('hs-available').textContent = availableCount;
  document.getElementById('hs-types').textContent = roomTypes.length;
}
