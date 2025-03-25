import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Supabase 설정 - 실제 프로젝트의 값으로 교체해야 합니다
const SUPABASE_URL = 'https://rkpeiqnrtbpwuaxymwkr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcGVpcW5ydGJwd3VheHltd2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NTg0OTksImV4cCI6MjA1ODAzNDQ5OX0.K5AN-YLXmO02oAhvsoO6WOY1ehLxX30kner_TbKAHuA';

// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 