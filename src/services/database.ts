/**
 * Database service layer
 * Typed database operations using Supabase
 */

import { supabase } from './supabase';

// Project operations
export async function getProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) return null;
  return data;
}

export async function createProject(project: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create project');
  return data;
}

export async function updateProject(
  projectId: string, 
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update project');
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}

// Blueprint operations
export async function getBlueprints(projectId: string) {
  const { data, error } = await supabase
    .from('blueprints')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createBlueprint(blueprint: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('blueprints')
    .insert(blueprint)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create blueprint');
  return data;
}

export async function updateBlueprint(
  blueprintId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('blueprints')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', blueprintId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update blueprint');
  return data;
}

export async function deleteBlueprint(blueprintId: string): Promise<void> {
  const { error } = await supabase
    .from('blueprints')
    .delete()
    .eq('id', blueprintId);

  if (error) throw error;
}

// Device operations
export async function getDevices(blueprintId: string) {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('blueprint_id', blueprintId);

  if (error) throw error;
  return data || [];
}

export async function createDevice(device: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('devices')
    .insert(device)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create device');
  return data;
}

export async function updateDevice(
  deviceId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('devices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', deviceId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update device');
  return data;
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', deviceId);

  if (error) throw error;
}

// Room operations
export async function getRooms(blueprintId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('blueprint_id', blueprintId);

  if (error) throw error;
  return data || [];
}

export async function createRoom(room: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('rooms')
    .insert(room)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create room');
  return data;
}

// Estimate operations
export async function getEstimates(projectId: string) {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createEstimate(estimate: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('estimates')
    .insert(estimate)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create estimate');
  return data;
}

export async function updateEstimate(
  estimateId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('estimates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', estimateId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update estimate');
  return data;
}
