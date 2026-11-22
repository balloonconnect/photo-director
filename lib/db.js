import { createClient } from '@supabase/supabase-js';

let client;
function sb() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw Object.assign(new Error('Storage is not configured (SUPABASE_URL / SUPABASE_ANON_KEY).'), { status: 503 });
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

async function rpc(fn, args) {
  const { data, error } = await sb().rpc(fn, args);
  if (error) throw Object.assign(new Error('Storage error: ' + error.message), { status: 502 });
  return data;
}

export const getGear = (device) => rpc('pd_get_gear', { p_device: device });
export const setGear = (device, gear) => rpc('pd_set_gear', { p_device: device, p_gear: gear });
export const listPlans = (device) => rpc('pd_list_plans', { p_device: device });
export const getPlan = (device, id) => rpc('pd_get_plan', { p_device: device, p_id: id });
export const addPlan = (device, plan) => rpc('pd_add_plan', { p_device: device, p_plan: plan });
export const updatePlan = (device, id, plan) => rpc('pd_update_plan', { p_device: device, p_id: id, p_plan: plan });
export const deletePlan = (device, id) => rpc('pd_delete_plan', { p_device: device, p_id: id });
export const hit = (device, devLimit, globalLimit) => rpc('pd_hit', { p_device: device, p_dev_limit: devLimit, p_global_limit: globalLimit });
