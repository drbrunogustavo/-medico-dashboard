import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://dnieitrfrjboswlfxzjw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuaWVpdHJmcmpib3N3bGZ4emp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDg2NzQsImV4cCI6MjA5MzQyNDY3NH0.6ZLpwHG2RkzhXjt1LegPgtcMAv0GfyslLPfNkqu0DkY'
)