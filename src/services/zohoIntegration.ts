/**
 * Zoho CRM Integration Service
 * Handles OAuth, token management, and API operations
 */

import { supabase } from './supabase';
import type { Project } from '../shared/types';
import type { Estimate } from '../shared/types';

// Zoho OAuth configuration
const ZOHO_CLIENT_ID = import.meta.env.VITE_ZOHO_CLIENT_ID;
const ZOHO_REDIRECT_URI = import.meta.env.VITE_ZOHO_REDIRECT_URI || `${import.meta.env.VITE_APP_URL}/auth/zoho/callback`;
const ZOHO_AUTH_URL = 'https://accounts.zoho.com/oauth/v2/auth';
const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
const ZOHO_API_BASE = 'https://www.zohoapis.com/crm/v2';

export interface ZohoTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface ZohoConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get Zoho OAuth authorization URL
 */
export function getZohoAuthUrl(): string {
  if (!ZOHO_CLIENT_ID) {
    throw new Error('Zoho Client ID not configured');
  }

  const params = new URLSearchParams({
    client_id: ZOHO_CLIENT_ID,
    redirect_uri: ZOHO_REDIRECT_URI,
    scope: 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });

  return `${ZOHO_AUTH_URL}?${params.toString()}`;
}

/**
 * Connect Zoho - returns OAuth URL for redirect
 */
export async function connectZoho(): Promise<string> {
  return getZohoAuthUrl();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeZohoCode(code: string): Promise<ZohoTokens> {
  if (!ZOHO_CLIENT_ID) {
    throw new Error('Zoho Client ID not configured');
  }

  const response = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ZOHO_CLIENT_ID,
      redirect_uri: ZOHO_REDIRECT_URI,
      code
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Zoho token exchange failed: ${error.error}`);
  }

  const data = await response.json();
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  };
}

/**
 * Save Zoho connection to database
 */
export async function saveZohoConnection(userId: string, tokens: ZohoTokens): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .upsert({
      user_id: userId,
      provider: 'zoho',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,provider' });

  if (error) throw error;
}

/**
 * Get stored Zoho connection
 */
export async function getZohoConnection(userId: string): Promise<ZohoConnection | null> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'zoho')
    .single();

  if (error || !data) return null;
  return data as ZohoConnection;
}

/**
 * Check if Zoho is connected
 */
export async function isZohoConnected(userId: string): Promise<boolean> {
  const connection = await getZohoConnection(userId);
  return !!connection && !!connection.access_token;
}

/**
 * Disconnect Zoho
 */
export async function disconnectZoho(userId: string): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'zoho');

  if (error) throw error;
}

/**
 * Refresh Zoho access token
 */
export async function refreshZohoToken(refreshToken: string): Promise<ZohoTokens> {
  if (!ZOHO_CLIENT_ID) {
    throw new Error('Zoho Client ID not configured');
  }

  const response = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID,
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Zoho token');
  }

  const data = await response.json();
  
  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Keep existing refresh token
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  };
}

/**
 * Get valid access token (refresh if needed)
 */
async function getValidAccessToken(userId: string): Promise<string> {
  const connection = await getZohoConnection(userId);
  
  if (!connection) {
    throw new Error('Zoho not connected');
  }

  // Check if token is expired or about to expire (5 min buffer)
  const expiresAt = new Date(connection.expires_at).getTime();
  const now = Date.now();
  
  if (expiresAt - now < 5 * 60 * 1000) {
    // Token expired, refresh it
    const newTokens = await refreshZohoToken(connection.refresh_token);
    await saveZohoConnection(userId, newTokens);
    return newTokens.access_token;
  }

  return connection.access_token;
}

/**
 * Make authenticated request to Zoho API
 */
async function zohoApiRequest(
  userId: string, 
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> {
  const accessToken = await getValidAccessToken(userId);
  
  const response = await fetch(`${ZOHO_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Zoho API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Sync project to Zoho as Account
 */
export async function syncProjectToZoho(userId: string, project: Project): Promise<string> {
  const accountData = {
    data: [{
      Account_Name: project.client,
      Billing_Street: project.address,
      Description: `Project: ${project.name}`,
      Industry: 'Construction/Security Systems'
    }]
  };

  const result = await zohoApiRequest(userId, '/Accounts', {
    method: 'POST',
    body: JSON.stringify(accountData)
  });

  // Log sync
  await logSync(userId, 'zoho', 'project', project.id, result.data[0].details.id, 'success');

  return result.data[0].details.id;
}

/**
 * Sync estimate to Zoho as Deal
 */
export async function syncEstimateToZoho(
  userId: string, 
  project: Project, 
  estimate: Estimate
): Promise<string> {
  // First, get or create the account
  const accounts = await zohoApiRequest(userId, `/Accounts/search?criteria=Account_Name:equals:${encodeURIComponent(project.client)}`);
  let accountId: string;

  if (accounts.data && accounts.data.length > 0) {
    accountId = accounts.data[0].id;
  } else {
    accountId = await syncProjectToZoho(userId, project);
  }

  // Create deal
  const dealData = {
    data: [{
      Deal_Name: `${project.name} - Estimate`,
      Account_Name: { id: accountId },
      Amount: estimate.total,
      Stage: 'Qualification',
      Description: `Security system estimate for ${project.name}`,
      Closing_Date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }]
  };

  const result = await zohoApiRequest(userId, '/Deals', {
    method: 'POST',
    body: JSON.stringify(dealData)
  });

  const dealId = result.data[0].details.id;

  // Log sync
  await logSync(userId, 'zoho', 'estimate', estimate.id, dealId, 'success');

  return dealId;
}

/**
 * Log sync operation
 */
async function logSync(
  userId: string,
  provider: string,
  entityType: string,
  entityId: string,
  externalId: string,
  status: 'success' | 'error'
): Promise<void> {
  await supabase
    .from('sync_logs')
    .insert({
      user_id: userId,
      provider,
      entity_type: entityType,
      entity_id: entityId,
      external_id: externalId,
      status,
      created_at: new Date().toISOString()
    });
}

/**
 * Get sync logs for user
 */
export async function getSyncLogs(userId: string, provider?: string): Promise<any[]> {
  let query = supabase
    .from('sync_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
