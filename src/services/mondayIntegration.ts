/**
 * Monday.com Integration Service
 * Handles OAuth, token management, and GraphQL API operations
 */

import { supabase } from './supabase';
import type { Project } from '../shared/types';
import type { Estimate } from '../shared/types';

// Monday.com OAuth configuration
const MONDAY_CLIENT_ID = import.meta.env.VITE_MONDAY_CLIENT_ID;
const MONDAY_REDIRECT_URI = import.meta.env.VITE_MONDAY_REDIRECT_URI || `${import.meta.env.VITE_APP_URL}/auth/monday/callback`;
const MONDAY_AUTH_URL = 'https://auth.monday.com/oauth2/authorize';
const MONDAY_TOKEN_URL = 'https://auth.monday.com/oauth2/token';
const MONDAY_API_URL = 'https://api.monday.com/v2';

export interface MondayTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
}

export interface MondayConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get Monday.com OAuth authorization URL
 */
export function getMondayAuthUrl(): string {
  if (!MONDAY_CLIENT_ID) {
    throw new Error('Monday.com Client ID not configured');
  }

  const params = new URLSearchParams({
    client_id: MONDAY_CLIENT_ID,
    redirect_uri: MONDAY_REDIRECT_URI,
    scope: 'boards:read boards:write workspaces:read workspaces:write',
    response_type: 'code'
  });

  return `${MONDAY_AUTH_URL}?${params.toString()}`;
}

/**
 * Connect Monday.com - returns OAuth URL for redirect
 */
export async function connectMonday(): Promise<string> {
  return getMondayAuthUrl();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeMondayCode(code: string): Promise<MondayTokens> {
  if (!MONDAY_CLIENT_ID) {
    throw new Error('Monday.com Client ID not configured');
  }

  const response = await fetch(MONDAY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: MONDAY_CLIENT_ID,
      redirect_uri: MONDAY_REDIRECT_URI,
      code
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Monday.com token exchange failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in 
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined
  };
}

/**
 * Save Monday.com connection to database
 */
export async function saveMondayConnection(userId: string, tokens: MondayTokens): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .upsert({
      user_id: userId,
      provider: 'monday',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expires_at || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,provider' });

  if (error) throw error;
}

/**
 * Get stored Monday.com connection
 */
export async function getMondayConnection(userId: string): Promise<MondayConnection | null> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'monday')
    .single();

  if (error || !data) return null;
  return data as MondayConnection;
}

/**
 * Check if Monday.com is connected
 */
export async function isMondayConnected(userId: string): Promise<boolean> {
  const connection = await getMondayConnection(userId);
  return !!connection && !!connection.access_token;
}

/**
 * Disconnect Monday.com
 */
export async function disconnectMonday(userId: string): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'monday');

  if (error) throw error;
}

/**
 * Get valid access token (Monday tokens are typically long-lived)
 */
async function getValidAccessToken(userId: string): Promise<string> {
  const connection = await getMondayConnection(userId);
  
  if (!connection) {
    throw new Error('Monday.com not connected');
  }

  return connection.access_token;
}

/**
 * Make GraphQL request to Monday.com API
 */
async function mondayApiRequest(
  userId: string,
  query: string,
  variables?: Record<string, any>
): Promise<any> {
  const accessToken = await getValidAccessToken(userId);

  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Monday.com API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Monday.com GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

/**
 * Get user's boards
 */
export async function getMondayBoards(userId: string): Promise<any[]> {
  const query = `
    query {
      boards {
        id
        name
        type
        state
      }
    }
  `;

  const result = await mondayApiRequest(userId, query);
  return result.boards || [];
}

/**
 * Create a board for projects if it doesn't exist
 */
export async function getOrCreateProjectsBoard(userId: string): Promise<string> {
  const boards = await getMondayBoards(userId);
  const projectsBoard = boards.find((b: any) => b.name === 'VoltEstimate Projects');
  
  if (projectsBoard) {
    return projectsBoard.id;
  }

  // Create new board
  const query = `
    mutation {
      create_board(
        board_name: "VoltEstimate Projects"
        board_kind: public
      ) {
        id
      }
    }
  `;

  const result = await mondayApiRequest(userId, query);
  return result.create_board.id;
}

/**
 * Sync project to Monday.com board
 */
export async function syncProjectToMonday(userId: string, project: Project): Promise<string> {
  const boardId = await getOrCreateProjectsBoard(userId);

  // Create item in board
  const query = `
    mutation {
      create_item(
        board_id: ${boardId}
        item_name: "${project.name.replace(/"/g, '\\"')}"
        column_values: "${JSON.stringify({
          text: project.client,
          status: { label: project.status }
        }).replace(/"/g, '\\"')}"
      ) {
        id
      }
    }
  `;

  const result = await mondayApiRequest(userId, query);
  const itemId = result.create_item.id;

  // Log sync
  await logSync(userId, 'monday', 'project', project.id, itemId, 'success');

  return itemId;
}

/**
 * Create board item with project and estimate details
 */
export async function createMondayBoardItem(
  userId: string,
  project: Project,
  estimate: Estimate
): Promise<string> {
  const boardId = await getOrCreateProjectsBoard(userId);

  const query = `
    mutation {
      create_item(
        board_id: ${boardId}
        item_name: "${project.name.replace(/"/g, '\\"')}"
        column_values: "${JSON.stringify({
          text: project.client,
          status: { label: estimate.status },
          numbers: estimate.total
        }).replace(/"/g, '\\"')}"
      ) {
        id
      }
    }
  `;

  const result = await mondayApiRequest(userId, query);
  const itemId = result.create_item.id;

  // Add subitems for line items if any
  if (estimate.lineItems && estimate.lineItems.length > 0) {
    for (const lineItem of estimate.lineItems) {
      await createMondaySubitem(userId, itemId, lineItem);
    }
  }

  // Log sync
  await logSync(userId, 'monday', 'estimate', estimate.id, itemId, 'success');

  return itemId;
}

/**
 * Create subitem for estimate line item
 */
async function createMondaySubitem(
  userId: string,
  parentItemId: string,
  lineItem: { category: string; description: string; quantity: number; unitPrice: number; total: number }
): Promise<void> {
  const query = `
    mutation {
      create_subitem(
        parent_item_id: ${parentItemId}
        item_name: "${lineItem.description.replace(/"/g, '\\"')}"
        column_values: "${JSON.stringify({
          text: lineItem.category,
          numbers: lineItem.total
        }).replace(/"/g, '\\"')}"
      ) {
        id
      }
    }
  `;

  await mondayApiRequest(userId, query);
}

/**
 * Update Monday.com item status
 */
export async function updateMondayItemStatus(
  userId: string,
  itemId: string,
  status: string
): Promise<void> {
  const query = `
    mutation {
      change_column_value(
        item_id: ${itemId}
        column_id: "status"
        value: "{\\"label\\":\\"${status}\\"}"
      ) {
        id
      }
    }
  `;

  await mondayApiRequest(userId, query);
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
