// ============================================================
// AURELINE HOTEL — Supabase connection
// ============================================================
// วิธีตั้งค่า (ทำครั้งเดียว แล้วใช้ได้ทั้ง 3 หน้า):
// 1) เข้า https://supabase.com/dashboard -> เลือกโปรเจกต์ของคุณ
// 2) เมนูซ้าย -> Project Settings -> Data API
//    - คัดลอกค่า "Project URL"        -> วางแทนที่ SUPABASE_URL
// 3) เมนูซ้าย -> Project Settings -> API Keys
//    - คัดลอกค่า "anon public" key    -> วางแทนที่ SUPABASE_KEY
// 4) อย่าลืมรัน schema.sql ใน SQL Editor ก่อน เพื่อสร้างตารางทั้งหมด
// ============================================================

const SUPABASE_URL = "https://lorpscmmzjctefozqpjc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcnBzY21tempjdGVmb3pxcGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzQxNDgsImV4cCI6MjEwMTQxMDE0OH0.kXww6ML5IIuKlAAAIPqwFSC-oI0ZSp3buWbILUoal4g";

// หมายเหตุ: ตัวแปร global ชื่อ `supabase` มาจาก CDN script ที่ import ไว้ใน <head>
// เราตั้งชื่อ client ของเราว่า `db` เพื่อไม่ให้ชนกับ namespace เดิม
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
