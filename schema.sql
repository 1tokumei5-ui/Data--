-- =========================================================
-- 1. สร้างตารางที่จำเป็นก่อน (ลบของเดิมถ้ามี เพื่อเคลียร์ข้อมูล)
-- =========================================================
drop table if exists rooms cascade;
drop table if exists room_types cascade;

-- สร้างตารางประเภทห้อง
create table room_types (
  room_type_id   bigint generated always as identity primary key,
  room_type_name varchar not null,
  description    text,
  max_guest      int4,
  facilities     text
);

-- สร้างตารางห้องพัก
create table rooms (
  room_id         bigint generated always as identity primary key,
  room_number     varchar unique not null,
  room_type_id    bigint references room_types(room_type_id) on delete set null,
  floor           int4,
  price_per_night numeric(10,2) not null,
  room_status     varchar not null default 'available'
);

-- เปิดสิทธิ์ให้หน้าเว็บ VS Code เข้าถึงข้อมูลได้ (RLS)
alter table room_types enable row level security;
alter table rooms enable row level security;
create policy "public full access" on room_types for all using (true) with check (true);
create policy "public full access" on rooms for all using (true) with check (true);


-- =========================================================
-- 2. ใส่ข้อมูลประเภทห้องพัก (8 ประเภท)
-- =========================================================
INSERT INTO room_types (room_type_name, description, max_guest, facilities) VALUES
('Superior Room', 'ห้องพักเริ่มต้น ตกแต่งสไตล์มินิมอลโทนสว่าง พร้อมสิ่งอำนวยความสะดวกครบครัน', 2, 'Wi-Fi, Smart TV, Rain Shower, Mini Bar'),
('Deluxe Garden View', 'ห้องพักกว้างขวางวิวสวนร่มรื่น มีระเบียงส่วนตัวสำหรับนั่งเล่นพักผ่อน', 2, 'Wi-Fi, Smart TV, Balcony, Rain Shower, Coffee Machine'),
('Deluxe Ocean View', 'ห้องพักวิวทะเลอันดามันแบบพาโนรามา พร้อมอ่างอาบน้ำริมระเบียง', 2, 'Wi-Fi, Smart TV, Balcony, Bathtub, Coffee Machine'),
('Premier Pool Access', 'ห้องพักชั้นล่างติดสระว่ายน้ำ สามารถลงสระได้โดยตรงจากระเบียงห้อง', 2, 'Pool Access, Wi-Fi, Smart TV, Bathtub, Espresso Machine'),
('Executive Suite', 'ห้องสวีทหรูพร้อมห้องนั่งเล่นแยกเป็นสัดส่วน พื้นที่กว้างขวาง เหมาะสำหรับการพักผ่อนยาวนาน', 3, 'Living Area, Wi-Fi, 2 Smart TVs, Bathtub, Premium Amenities'),
('Family Two-Bedroom Suite', 'ห้องสวีท 2 ห้องนอนสำหรับครอบครัว พร้อมพื้นที่รับประทานอาหารและมุมเด็กเล่น', 4, '2 Bedrooms, Dining Area, Wi-Fi, Bathtub, Kids Amenities'),
('Oceanfront Pool Villa', 'วิลล่าส่วนตัวริมหาด พร้อมสระว่ายน้ำส่วนตัวและพื้นที่อาบแดด', 2, 'Private Pool, Oceanfront, Wi-Fi, Butler Service, Bathtub'),
('Aureline Signature Villa', 'วิลล่าหรูสูงสุด 2 ห้องนอน สระว่ายน้ำส่วนตัวขนาดใหญ่ และบริการส่วนตัว 24 ชั่วโมง', 4, 'Private Pool, Butler 24/7, Private Dining, Luxury Amenities');


-- =========================================================
-- 3. ใส่ข้อมูลห้องพัก (24 ห้อง)
-- =========================================================
INSERT INTO rooms (room_number, room_type_id, floor, price_per_night, room_status) VALUES
-- ชั้น 1: Superior, Garden View & Pool Access
('101', 1, 1, 2500.00, 'available'),
('102', 1, 1, 2500.00, 'occupied'),
('103', 1, 1, 2500.00, 'available'),
('104', 2, 1, 3200.00, 'available'),
('105', 2, 1, 3200.00, 'maintenance'),
('106', 4, 1, 4800.00, 'available'),
('107', 4, 1, 4800.00, 'occupied'),
('108', 4, 1, 4800.00, 'available'),

-- ชั้น 2: Deluxe Garden & Deluxe Ocean
('201', 2, 2, 3200.00, 'available'),
('202', 2, 2, 3200.00, 'available'),
('203', 2, 2, 3200.00, 'occupied'),
('204', 3, 2, 3800.00, 'available'),
('205', 3, 2, 3800.00, 'available'),
('206', 3, 2, 3800.00, 'occupied'),

-- ชั้น 3: Deluxe Ocean & Executive Suite
('301', 3, 3, 3800.00, 'available'),
('302', 3, 3, 3800.00, 'available'),
('303', 3, 3, 3800.00, 'maintenance'),
('304', 5, 3, 6800.00, 'available'),
('305', 5, 3, 6800.00, 'occupied'),

-- ชั้น 4: Family Suite & Executive Suite
('401', 6, 4, 8500.00, 'available'),
('402', 6, 4, 8500.00, 'available'),
('403', 5, 4, 6800.00, 'available'),

-- โซนวิลล่าส่วนตัว (แยกจากตัวอาคารหลัก)
('V01', 7, 1, 12500.00, 'available'),
('V02', 7, 1, 12500.00, 'occupied'),
('V03', 7, 1, 12500.00, 'available'),
('V88', 8, 1, 28000.00, 'available');

-- ============================================================
-- 1. ลบตารางเดิมทิ้ง (ถ้ามี) เพื่อสร้างใหม่ให้สมบูรณ์
-- ============================================================
drop table if exists booking_details cascade;
drop table if exists bookings cascade;
drop table if exists rooms cascade;
drop table if exists room_types cascade;
drop table if exists customers cascade;

-- ============================================================
-- 2. สร้างโครงสร้างตารางทั้ง 5 ตารางหลัก
-- ============================================================
-- ตารางลูกค้า
create table customers (
  customer_id   bigint generated always as identity primary key,
  first_name    varchar not null,
  last_name     varchar not null,
  phone         varchar,
  email         varchar unique,
  register_date date default current_date
);

-- ตารางประเภทห้องพัก
create table room_types (
  room_type_id   bigint generated always as identity primary key,
  room_type_name varchar not null,
  description    text,
  max_guest      int4,
  facilities     text
);

-- ตารางห้องพัก
create table rooms (
  room_id         bigint generated always as identity primary key,
  room_number     varchar unique not null,
  room_type_id    bigint references room_types(room_type_id) on delete set null,
  floor           int4,
  price_per_night numeric(10,2) not null,
  room_status     varchar not null default 'available'
);

-- ตารางการจอง (หัวบิล)
create table bookings (
  booking_id     bigint generated always as identity primary key,
  customer_id    bigint references customers(customer_id) on delete cascade,
  booking_date   date default current_date,
  check_in       date not null,
  check_out      date not null,
  guest_count    int4 default 1,
  booking_status varchar not null default 'pending'
);

-- ตารางรายละเอียดการจอง
create table booking_details (
  booking_detail_id bigint generated always as identity primary key,
  booking_id        bigint references bookings(booking_id) on delete cascade,
  room_id           bigint references rooms(room_id),
  price_per_night   numeric(10,2),
  total_nights      int4,
  total_price       numeric(10,2)
);

-- ============================================================
-- 3. เปิดสิทธิ์ให้ดึงข้อมูลจากหน้าเว็บได้ (สำคัญมาก)
-- ============================================================
alter table customers enable row level security;
alter table room_types enable row level security;
alter table rooms enable row level security;
alter table bookings enable row level security;
alter table booking_details enable row level security;

create policy "public full access" on customers for all using (true) with check (true);
create policy "public full access" on room_types for all using (true) with check (true);
create policy "public full access" on rooms for all using (true) with check (true);
create policy "public full access" on bookings for all using (true) with check (true);
create policy "public full access" on booking_details for all using (true) with check (true);

-- ============================================================
-- 4. ใส่ข้อมูลห้องพักตั้งต้น (8 ประเภท / 24 ห้อง)
-- ============================================================
INSERT INTO room_types (room_type_name, description, max_guest, facilities) VALUES
('Superior Room', 'ห้องพักเริ่มต้น', 2, 'Wi-Fi, Smart TV'),
('Deluxe Garden View', 'วิวสวน', 2, 'Wi-Fi, Balcony'),
('Deluxe Ocean View', 'วิวทะเล', 2, 'Wi-Fi, Bathtub'),
('Premier Pool Access', 'ติดสระว่ายน้ำ', 2, 'Pool Access'),
('Executive Suite', 'ห้องสวีทหรู', 3, 'Living Area'),
('Family Two-Bedroom Suite', '2 ห้องนอน', 4, '2 Bedrooms'),
('Oceanfront Pool Villa', 'วิลล่าริมหาด', 2, 'Private Pool'),
('Aureline Signature Villa', 'วิลล่าหรูสูงสุด', 4, 'Private Pool, Butler');

INSERT INTO rooms (room_number, room_type_id, floor, price_per_night, room_status) VALUES
('101', 1, 1, 2500.00, 'available'), ('102', 1, 1, 2500.00, 'available'), ('103', 1, 1, 2500.00, 'available'),
('104', 2, 1, 3200.00, 'available'), ('105', 2, 1, 3200.00, 'available'), ('106', 4, 1, 4800.00, 'available'),
('201', 2, 2, 3200.00, 'available'), ('202', 2, 2, 3200.00, 'available'), ('203', 2, 2, 3200.00, 'available'),
('204', 3, 2, 3800.00, 'available'), ('205', 3, 2, 3800.00, 'available'), ('206', 3, 2, 3800.00, 'available'),
('301', 3, 3, 3800.00, 'available'), ('302', 3, 3, 3800.00, 'available'), ('304', 5, 3, 6800.00, 'available'),
('305', 5, 3, 6800.00, 'available'), ('401', 6, 4, 8500.00, 'available'), ('402', 6, 4, 8500.00, 'available'),
('403', 5, 4, 6800.00, 'available'), ('V01', 7, 1, 12500.00, 'available'),('V02', 7, 1, 12500.00, 'available'),
('V03', 7, 1, 12500.00, 'available'), ('V88', 8, 1, 28000.00, 'available');

-- 1. INSERT: เพิ่มลูกค้าและการจอง
INSERT INTO customers (first_name, last_name, phone, email) VALUES ('มาริโอ้', 'เมาเร่อ', '0891112222', 'mario@email.com');
INSERT INTO bookings (customer_id, check_in, check_out, guest_count, booking_status) VALUES (1, '2026-11-10', '2026-11-12', 2, 'confirmed');
INSERT INTO booking_details (booking_id, room_id, price_per_night, total_nights, total_price) VALUES (1, 21, 12500.00, 2, 25000.00);
UPDATE rooms SET room_status = 'occupied' WHERE room_id = 21;

-- 2. UPDATE: แก้ไขวันที่เข้าพักและชื่อลูกค้า
UPDATE bookings SET check_in = '2026-12-01', check_out = '2026-12-05' WHERE booking_id = 1;
UPDATE customers SET first_name = 'ณเดชน์', last_name = 'คูกิมิยะ' WHERE customer_id = 1;

-- 3. SELECT ... WHERE: ค้นหาห้องว่าง
SELECT r.room_number, rt.room_type_name, r.price_per_night 
FROM rooms r JOIN room_types rt ON r.room_type_id = rt.room_type_id 
WHERE r.room_status = 'available' AND rt.room_type_name ILIKE '%Ocean%';

SELECT b.booking_id, c.first_name || ' ' || c.last_name AS customer_name, r.room_number, bd.total_price 
FROM bookings b
JOIN customers c ON b.customer_id = c.customer_id
JOIN booking_details bd ON b.booking_id = bd.booking_id
JOIN rooms r ON bd.room_id = r.room_id;
