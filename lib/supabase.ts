// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Substitua com suas chaves do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient<any>, {
  get(_t, prop) {
    if (!_client) _client = getClient();
    return (_client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Types
export interface MCCEquipment {
  id: number;
  discipline: 'EIA' | 'MEC' | 'TUB';
  area: string;
  subsystem_code: string;
  subsystem_name: string;
  tag: string;
  equipment_name: string;
  infra: number;
  cable_laying: number;
  connection: number;
  gate1_status: string;
  tests: number;
  walkdown_punch_list: string;
  gate2_status: string;
  backlog_status: string;
  planned_date: string | null;
  scheduled_date: string | null;
  week_project: string | null;
  created_at: string;
  updated_at: string;
}

export interface SummaryByDiscipline {
  discipline: string;
  total_equipment: number;
  completed_gate1: number;
  completed_gate2: number;
  released_for_commissioning: number;
}

// Fetch all equipment
export async function fetchAllEquipment(): Promise<MCCEquipment[]> {
  const { data, error } = await supabase
    .from('mcc_equipment')
    .select('*')
    .order('tag', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch equipment by discipline
export async function fetchEquipmentByDiscipline(
  discipline: 'EIA' | 'MEC' | 'TUB'
): Promise<MCCEquipment[]> {
  const { data, error } = await supabase
    .from('mcc_equipment')
    .select('*')
    .eq('discipline', discipline)
    .order('tag', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch summary
export async function fetchSummary(): Promise<SummaryByDiscipline[]> {
  const { data, error } = await supabase
    .from('v_summary_by_discipline')
    .select('*')
    .order('discipline', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Update equipment (partial update)
export async function updateEquipment(
  id: number,
  updates: Partial<MCCEquipment>
): Promise<MCCEquipment> {
  const { data, error } = await supabase
    .from('mcc_equipment')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Create new equipment
export async function createEquipment(
  equipment: Omit<MCCEquipment, 'id' | 'created_at' | 'updated_at'>
): Promise<MCCEquipment> {
  const { data, error } = await supabase
    .from('mcc_equipment')
    .insert([equipment])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete equipment
export async function deleteEquipment(id: number): Promise<void> {
  const { error } = await supabase
    .from('mcc_equipment')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
