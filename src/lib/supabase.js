import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// 🔴 REEMPLAZA CON TUS DATOS DE SUPABASE 🔴
const supabaseUrl = 'https://fatvluxgbsolvwgbmuaj.supabase.co';
const supabaseAnonKey = 'sb_publishable_xUaOaOntX775B4dja58pfg_CeWDAxWL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
