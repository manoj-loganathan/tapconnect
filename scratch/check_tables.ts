import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = 'https://ujioysyaozrsabbmehyj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqaW95c3lhb3pyc2FiYm1laHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzI1MzksImV4cCI6MjA5MDIwODUzOX0.lppfjWgzTTWuieohG8pWr4sgGuz2s73Gs8lODCm6uds'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    const { data: tables, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)
    
    console.log('Org columns:', Object.keys(tables?.[0] || {}))

    // Try picking a random table name to see if it exists
    const { error: auditError } = await supabase.from('audit_logs').select('*').limit(1)
    console.log('audit_logs exists?', !auditError)

    const { error: activityError } = await supabase.from('activity').select('*').limit(1)
    console.log('activity exists?', !activityError)
}

checkTables()
