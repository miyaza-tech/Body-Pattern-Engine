import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase 설정
// 1. https://supabase.com 에서 무료 계정 생성
// 2. 새 프로젝트 생성
// 3. Settings > API에서 URL과 anon key 복사
// 4. .env 파일에 추가 (아래 형식)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Supabase 연결 여부 확인
export const isSupabaseConfigured = () => {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};

// 설정이 없으면 더미 클라이언트 생성하지 않음
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);
