
const SUPABASE_URL = "https://mwyzondwsvdtidligfoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eXpvbmR3c3ZkdGlkbGlnZm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzU4OTcsImV4cCI6MjEwNjg1MTg5N30.LVFCYhIqMXJcKsRe8UqIdwtlzeKUElWV5_FcqlTwWWk";


const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
