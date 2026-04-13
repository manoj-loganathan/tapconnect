
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    const { data, error } = await supabase.from('taps').select('*').limit(1)
    if (error) {
        console.error(error)
        return
    }
    console.log('Columns in taps:', Object.keys(data[0] || {}))
}

checkColumns()
