/**
 * Core types for VoltEstimate Pro
 */

export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  value: number;
  conflictCount: number;
  blueprints: Blueprint[];
}

export interface Blueprint {
  id: string;
  projectId: string;
  name: string;
  url: string;
  scale: number;
  devices: Device[];
  rooms: Room[];
  width: number;
  height: number;
}

export interface Room {
  id: string;
  name: string;
  type: 'office' | 'kitchen' | 'hallway' | 'stairwell' | 'storage' | 'other';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DeviceType = 'smoke-detector' | 'heat-detector' | 'co-detector' | 'pull-station' | 'strobe' | 'horn' | 'camera' | 'card-reader' | 'door-contact' | 'motion-sensor';
export type SystemType = 'fire' | 'cctv' | 'access';

export interface Device {
  id: string;
  type: DeviceType;
  system: SystemType;
  x: number;
  y: number;
  name: string;
  rotation: number;
  properties: Record<string, any>;
  conflicts: Conflict[];
}

export interface Conflict {
  id: string;
  deviceId: string;
  type: 'overlap' | 'nfpa-spacing' | 'wall-proximity' | 'outside-boundary' | 'coverage-gap';
  severity: 'error' | 'warning';
  message: string;
  relatedDeviceId?: string;
  suggestion?: string;
  autoFix?: () => { x: number; y: number };
}

export interface Estimate {
  id: string;
  projectId: string;
  projectName: string;
  client: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'sent';
  createdAt: Date;
  updatedAt: Date;
  total: number;
  laborHours: number;
  lineItems: EstimateLineItem[];
}

export interface EstimateLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  check: (device: Device, context: ValidationContext) => Conflict | null;
}

export interface ValidationContext {
  devices: Device[];
  rooms: Room[];
  blueprint: Blueprint;
}
