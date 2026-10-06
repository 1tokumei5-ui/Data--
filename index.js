let allRooms = [];
let roomTypes = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadRoomTypes();
  await loadRooms();
  updateHeroStats();
});

async function loadRoomTypes() {
  try {
    const { data, error } = await supabase.from('room_types').select('*');
    if (error) throw error;
    
    roomTypes = data || [];
    const filterSelect = document.getElementById('filter-type');
    
    roomTypes.forEach(type => {
      const option = document.createElement('option');
      // อ้างอิง ID จากตาราง room_types
      const typeId = type.room_type_id || type.id;
      option.value = typeId;
      // อ้างอิงชื่อประเภทจากคอลัมน์ room_type_name
      option.textContent = type.room_type_name || 'ไม่ระบุประเภท';
      filterSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading room types:', err);
  }
}

async function loadRooms() {
  try {
    const { data, error } = await supabase.from('rooms').select(`*, room_types(*)`);
    if (error) throw error;
    
    allRooms = data || [];
    allRooms.sort((a, b) => {
       const numA = a.room_number || 0;
       const numB = b.room_number || 0;
       return String(numA).localeCompare(String(numB));
    });
    
    renderRooms();
  } catch (err) {
    console.error('Error loading rooms:', err);
  }
}

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
    const rtManual = roomTypes.find(t => t.room_type_id == room.room_type_id) || {};
    const rtJoin = room.room_types || {};
    
    // ดึงข้อมูลตามชื่อคอลัมน์ในตาราง room_types โดยตรง
    const typeName = rtJoin.room_type_name || rtManual.room_type_name || 'ไม่ระบุประเภท';
    const maxGuests = rtJoin.max_guest || rtManual.max_guest || '-';
    
    // รวมคอลัมน์ description และ facilities เข้าด้วยกันให้แสดงผลสวยงาม
    const desc = rtJoin.description || rtManual.description || '';
    const facs = rtJoin.facilities || rtManual.facilities || '';
    const amenities = `${desc} <br> <span style="font-size: 0.8rem; color: var(--accent);">${facs}</span>`;
    
    const price = room.price_per_night || 0; 
    const isAvailable = room.room_status === 'available';
    const roomIdentifier = room.room_number || '?';

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

function updateHeroStats() {
  const availableCount = allRooms.filter(room => room.room_status === 'available').length;
  document.getElementById('hs-available').textContent = availableCount;
  document.getElementById('hs-types').textContent = roomTypes.length;
}
