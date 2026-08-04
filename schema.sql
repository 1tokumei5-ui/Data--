-- ============================================================
-- AURELINE HOTEL — Database Schema (สอดคล้องกับ ER Model)
-- นำโค้ดนี้ไปรันใน Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ลบตารางเดิม (ถ้ามี) เพื่อให้รันซ้ำได้โดยไม่ error
drop table if exists booking_details cascade;
drop table if exists payments cascade;
drop table if exists bookings cascade;
drop table if exists discounts cascade;
drop table if exists members cascade;
drop table if exists rooms cascade;
drop table if exists room_types cascade;
drop table if exists customers cascade;

-- ลูกค้า
create table customers (
  customer_id   bigint generated always as identity primary key,
  first_name    varchar not null,
  last_name     varchar not null,
  phone         varchar,
  email         varchar unique,
  register_date date default current_date
);

-- ประเภทห้องพัก
create table room_types (
  room_type_id   bigint generated always as identity primary key,
  room_type_name varchar not null,
  description    text,
  max_guest      int4,
  facilities     text
);

-- ห้องพัก
create table rooms (
  room_id         bigint generated always as identity primary key,
  room_number     varchar unique not null,
  room_type_id    bigint references room_types(room_type_id) on delete set null,
  floor           int4,
  price_per_night numeric(10,2) not null,
  room_status     varchar not null default 'available' -- available | occupied | maintenance
);

-- สมาชิก (ต่อยอดจาก ER model)
create table members (
  member_id    bigint generated always as identity primary key,
  customer_id  bigint references customers(customer_id) on delete cascade,
  member_level varchar default 'Silver',
  point        int4 default 0,
  join_date    date default current_date
);

-- ส่วนลด (ต่อยอดจาก ER model)
create table discounts (
  discount_id    bigint generated always as identity primary key,
  discount_name  varchar not null,
  discount_value numeric(10,2) not null,
  start_date     date,
  end_date       date
);

-- การจอง (หัวบิล)
create table bookings (
  booking_id     bigint generated always as identity primary key,
  customer_id    bigint references customers(customer_id) on delete cascade,
  booking_date   date default current_date,
  check_in       date not null,
  check_out      date not null,
  guest_count    int4 default 1,
  booking_status varchar not null default 'pending' -- pending | confirmed | checked_in | checked_out | cancelled
);

-- รายละเอียดการจอง (รายการห้องต่อบิล)
create table booking_details (
  booking_detail_id bigint generated always as identity primary key,
  booking_id        bigint references bookings(booking_id) on delete cascade,
  room_id           bigint references rooms(room_id),
  price_per_night   numeric(10,2),
  total_nights      int4,
  total_price       numeric(10,2)
);

-- การชำระเงิน (ต่อยอดจาก ER model)
create table payments (
  payment_id     bigint generated always as identity primary key,
  booking_id     bigint references bookings(booking_id) on delete cascade,
  discount_id    bigint references discounts(discount_id),
  payment_date   timestamp default now(),
  amount         numeric(10,2),
  payment_method varchar,
  payment_status varchar default 'pending',
  payment_slip   text
);

-- ============================================================
-- เปิดสิทธิ์เข้าถึงข้อมูลแบบสาธารณะ (สำหรับงานเดโม/การบ้าน)
-- ⚠️ ใน production จริงควรตั้งค่า RLS Policy ให้รัดกุมกว่านี้
-- ============================================================
alter table customers       enable row level security;
alter table room_types      enable row level security;
alter table rooms           enable row level security;
alter table members         enable row level security;
alter table discounts       enable row level security;
alter table bookings        enable row level security;
alter table booking_details enable row level security;
alter table payments        enable row level security;

create policy "public full access" on customers       for all using (true) with check (true);
create policy "public full access" on room_types      for all using (true) with check (true);
create policy "public full access" on rooms            for all using (true) with check (true);
create policy "public full access" on members          for all using (true) with check (true);
create policy "public full access" on discounts        for all using (true) with check (true);
create policy "public full access" on bookings          for all using (true) with check (true);
create policy "public full access" on booking_details   for all using (true) with check (true);
create policy "public full access" on payments          for all using (true) with check (true);

-- ============================================================
-- ข้อมูลตัวอย่าง (Seed data)
-- ============================================================
insert into room_types (room_type_name, description, max_guest, facilities) values
('Deluxe Garden', 'ห้องสวยวิวสวน กว้างขวาง โทนอบอุ่น', 2, 'Wi-Fi, Mini Bar, Rain Shower'),
('Executive Suite', 'สวีทหรู พร้อมห้องนั่งเล่นแยกสัดส่วน', 3, 'Wi-Fi, Lounge, Bathtub, Balcony'),
('Ocean View Villa', 'วิลล่าส่วนตัววิวทะเล พร้อมสระว่ายน้ำในตัว', 4, 'Private Pool, Wi-Fi, Butler Service');

insert into rooms (room_number, room_type_id, floor, price_per_night, room_status) values
('101', 1, 1, 3200.00, 'available'),
('102', 1, 1, 3200.00, 'available'),
('205', 2, 2, 6800.00, 'available'),
('206', 2, 2, 6800.00, 'occupied'),
('301', 3, 3, 15800.00, 'available');
