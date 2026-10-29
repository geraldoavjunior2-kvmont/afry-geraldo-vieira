// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  released_to_commissioning: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  equipment_id: number | null;
  equipment_tag: string | null;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
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

// Update equipment — routes to correct underlying tables
export async function updateEquipment(
  id: number,
  updates: Partial<MCCEquipment>
): Promise<void> {
  const client = getClient();

  // Gate 1 fields
  const g1 = pickFields(updates, ['infra', 'cable_laying', 'connection']);
  if (Object.keys(g1).length > 0) {
    const { error } = await client
      .from('gate1_mechanical_completion')
      .update(g1)
      .eq('equipment_id', id);
    if (error) throw error;
  }

  // Gate 2 fields (tests_megger_hipot_loop = tests in view)
  const g2: Record<string, unknown> = {};
  if (updates.tests !== undefined) g2['tests_megger_hipot_loop'] = updates.tests;
  if (updates.walkdown_punch_list !== undefined) g2['walkdown_punch_list'] = updates.walkdown_punch_list;
  if (Object.keys(g2).length > 0) {
    const { error } = await client
      .from('gate2_handover')
      .update(g2)
      .eq('equipment_id', id);
    if (error) throw error;
  }

  // Equipment base fields
  const eq = pickFields(updates, ['planned_date', 'scheduled_date', 'week_project']);
  if (Object.keys(eq).length > 0) {
    const { error } = await client
      .from('equipment')
      .update({ ...eq, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  // Log the change
  await logActivity('UPDATE', id, updates.tag || null, Object.keys(updates).join(','), null, null);
}

// Create new equipment
export async function createEquipment(
  discipline: 'EIA' | 'MEC' | 'TUB',
  tag: string,
  name: string,
  subsystem_id?: number
): Promise<number> {
  const client = getClient();

  // Get discipline_id
  const { data: disc } = await client
    .from('disciplines')
    .select('id')
    .eq('name', discipline)
    .single();
  if (!disc) throw new Error('Disciplina não encontrada');

  // Default subsystem if not provided
  const { data: ss } = await client
    .from('subsystems')
    .select('id')
    .limit(1)
    .single();

  const { data: eq, error: eqErr } = await client
    .from('equipment')
    .insert({ discipline_id: disc.id, subsystem_id: subsystem_id || ss?.id || 7, tag, name })
    .select('id')
    .single();
  if (eqErr) throw eqErr;

  const newId: number = eq.id;

  // Gate 1
  await client.from('gate1_mechanical_completion').insert({ equipment_id: newId, infra: 0, cable_laying: 0, connection: 0 });
  // Gate 2
  await client.from('gate2_handover').insert({ equipment_id: newId, tests_megger_hipot_loop: 0, walkdown_punch_list: 'NOK' });
  // Backlog
  await client.from('backlog_status').insert({ equipment_id: newId });

  await logActivity('INSERT', newId, tag, null, null, null);
  return newId;
}

// Delete equipment
export async function deleteEquipment(id: number, tag: string): Promise<void> {
  const client = getClient();
  await logActivity('DELETE', id, tag, null, null, null);
  await client.from('backlog_status').delete().eq('equipment_id', id);
  await client.from('gate2_handover').delete().eq('equipment_id', id);
  await client.from('gate1_mechanical_completion').delete().eq('equipment_id', id);
  const { error } = await client.from('equipment').delete().eq('id', id);
  if (error) throw error;
}

// Fetch activity log
export async function fetchActivityLog(limit = 100): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Internal helpers
async function logActivity(
  action: string,
  equipment_id: number | null,
  equipment_tag: string | null,
  field_changed: string | null,
  old_value: string | null,
  new_value: string | null
) {
  try {
    await supabase.from('activity_log').insert({
      action,
      equipment_id,
      equipment_tag,
      field_changed,
      old_value,
      new_value,
    });
  } catch {
    // log errors are non-fatal
  }
}

function pickFields<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {};
  for (const k of keys) {
    if (k in obj) result[k] = obj[k];
  }
  return result;
}
