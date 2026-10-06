// 1. นำ URL และ Anon Key จากโปรเจกต์ Supabase ของคุณมาใส่ตรงนี้
const supabaseUrl = 'https://mwyzondwsvdtidligfoe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eXpvbmR3c3ZkdGlkbGlnZm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzU4OTcsImV4cCI6MjEwNjg1MTg5N30.LVFCYhIqMXJcKsRe8UqIdwtlzeKUElWV5_FcqlTwWWk';

const clientInstance = window.supabase.createClient(supabaseUrl, supabaseKey);

// ปล่อยตัวแปรออกไปให้ไฟล์อื่นๆ (index.js, booking.js, admin.js) เรียกใช้งานได้
// รองรับทั้งคนที่เขียนโค้ดเรียก db และ supabase
window.db = clientInstance;
window.supabase = clientInstance;
