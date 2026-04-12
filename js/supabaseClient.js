import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'

export const supabase = createClient(supabaseUrl, supabaseKey)