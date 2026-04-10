import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'tapconnect'
  }
})

async function checkSchema() {
  const { data, error } = await supabase
    .from('nfc_cards')
    .select('*, employees(*), taps(*)')
    .limit(1)
  
  console.log(JSON.stringify({ data, error }, null, 2))
}

checkSchema()
