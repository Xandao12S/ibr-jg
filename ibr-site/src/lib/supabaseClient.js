// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// SUBSTITUA PELOS SEUS DADOS REAIS DO PAINEL DO SUPABASE:
const SUPABASE_URL = 'https://dpikgrkhivolwnfhgcqd.supabase.co' 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaWtncmtoaXZvbHduZmhnY3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMDQwMzksImV4cCI6MjA5OTU4MDAzOX0.pQmoeGXNmpwaLin0XP-Lnxl08Ro3NTxH3_7mnKyRZG4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
