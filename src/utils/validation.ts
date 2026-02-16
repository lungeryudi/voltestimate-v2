import type { Device, Blueprint, Conflict, Room, ValidationContext } from '../types';

// NFPA 72 spacing requirements (in feet)
const NFPA_SPACING = {
  'smoke-detector': 30,
  'heat-detector': 25,
  'co-detector': 15,
  'pull-station': 200, // Travel distance
  'strobe': 100, // Visibility distance
  'horn': 100,
  'camera': 0, // No specific requirement
  'card-reader': 0,
  'door-contact': 0,
  'motion-sensor': 0
};

// Minimum distance from walls (in inches)
const MIN_WALL_DISTANCE = 4;

// Device overlap radius (in inches)
const OVERLAP_RADIUS = 12;

export function validateDevice(device: Device, context: ValidationContext): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Check for overlapping devices
  const overlapConflict = checkOverlap(device, context);
  if (overlapConflict) conflicts.push(overlapConflict);
  
  // Check NFPA spacing for fire devices
  const nfpaConflict = checkNFPASpacing(device, context);
  if (nfpaConflict) conflicts.push(nfpaConflict);
  
  // Check wall proximity
  const wallConflict = checkWallProximity(device, context);
  if (wallConflict) conflicts.push(wallConflict);
  
  // Check if device is outside room boundaries
  const boundaryConflict = checkBoundary(device, context);
  if (boundaryConflict) conflicts.push(boundaryConflict);
  
  return conflicts;
}

function checkOverlap(device: Device, context: ValidationContext): Conflict | null {
  for (const otherDevice of context.devices) {
    if (otherDevice.id === device.id) continue;
    if (otherDevice.system !== device.system) continue;
    
    const distance = Math.sqrt(
      Math.pow(device.x - otherDevice.x, 2) + 
      Math.pow(device.y - otherDevice.y, 2)
    );
    
    if (distance < OVERLAP_RADIUS) {
      return {
        id: `conflict-${device.id}-overlap-${otherDevice.id}`,
        deviceId: device.id,
        type: 'overlap',
        severity: 'error',
        message: `Device overlaps with ${otherDevice.name}`,
        relatedDeviceId: otherDevice.id,
        suggestion: `Move device away from ${otherDevice.name}`,
        autoFix: () => {
          const angle = Math.atan2(device.y - otherDevice.y, device.x - otherDevice.x);
          return {
            x: otherDevice.x + Math.cos(angle) * (OVERLAP_RADIUS + 2),
            y: otherDevice.y + Math.sin(angle) * (OVERLAP_RADIUS + 2)
          };
        }
      };
    }
  }
  return null;
}

function checkNFPASpacing(device: Device, context: ValidationContext): Conflict | null {
  if (device.system !== 'fire') return null;
  if (!NFPA_SPACING[device.type]) return null;
  
  const requiredSpacing = NFPA_SPACING[device.type] * 12; // Convert to inches
  let nearestDevice: Device | null = null;
  let minDistance = Infinity;
  
  for (const otherDevice of context.devices) {
    if (otherDevice.id === device.id) continue;
    if (otherDevice.system !== 'fire') continue;
    if (otherDevice.type !== device.type) continue;
    
    const distance = Math.sqrt(
      Math.pow(device.x - otherDevice.x, 2) + 
      Math.pow(device.y - otherDevice.y, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestDevice = otherDevice;
    }
  }
  
  if (nearestDevice && minDistance > requiredSpacing) {
    return {
      id: `conflict-${device.id}-nfpa`,
      deviceId: device.id,
      type: 'nfpa-spacing',
      severity: 'warning',
      message: `${device.name} is ${(minDistance / 12).toFixed(1)}ft from nearest ${nearestDevice.name}, exceeding NFPA 72 maximum of ${NFPA_SPACING[device.type]}ft`,
      relatedDeviceId: nearestDevice.id,
      suggestion: `Add a ${device.type} between these devices`,
      autoFix: null // Can't auto-fix, needs new device
    };
  }
  
  return null;
}

function checkWallProximity(device: Device, context: ValidationContext): Conflict | null {
  // Find the room this device is in
  const room = findContainingRoom(device, context.rooms);
  if (!room) return null;
  
  // Calculate distance to nearest wall
  const distLeft = device.x - room.x;
  const distRight = (room.x + room.width) - device.x;
  const distTop = device.y - room.y;
  const distBottom = (room.y + room.height) - device.y;
  
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);
  
  if (minDist < MIN_WALL_DISTANCE) {
    const wallName = minDist === distLeft ? 'left' : 
                     minDist === distRight ? 'right' : 
                     minDist === distTop ? 'top' : 'bottom';
    
    return {
      id: `conflict-${device.id}-wall`,
      deviceId: device.id,
      type: 'wall-proximity',
      severity: 'error',
      message: `${device.name} is too close to ${wallName} wall (${minDist.toFixed(1)}" < ${MIN_WALL_DISTANCE}")`,
      suggestion: `Move device at least ${MIN_WALL_DISTANCE} inches from walls`,
      autoFix: () => {
        let newX = device.x;
        let newY = device.y;
        
        if (minDist === distLeft) newX = room.x + MIN_WALL_DISTANCE + 1;
        else if (minDist === distRight) newX = room.x + room.width - MIN_WALL_DISTANCE - 1;
        else if (minDist === distTop) newY = room.y + MIN_WALL_DISTANCE + 1;
        else if (minDist === distBottom) newY = room.y + room.height - MIN_WALL_DISTANCE - 1;
        
        return { x: newX, y: newY };
      }
    };
  }
  
  return null;
}

function checkBoundary(device: Device, context: ValidationContext): Conflict | null {
  const room = findContainingRoom(device, context.rooms);
  
  if (!room) {
    return {
      id: `conflict-${device.id}-boundary`,
      deviceId: device.id,
      type: 'outside-boundary',
      severity: 'error',
      message: `${device.name} is placed outside all room boundaries`,
      suggestion: 'Move device inside a room',
      autoFix: null // Can't auto-fix, user must place manually
    };
  }
  
  return null;
}

function findContainingRoom(device: Device, rooms: Room[]): Room | null {
  for (const room of rooms) {
    if (
      device.x >= room.x &&
      device.x <= room.x + room.width &&
      device.y >= room.y &&
      device.y <= room.y + room.height
    ) {
      return room;
    }
  }
  return null;
}

export function validateAllDevices(blueprint: Blueprint): Conflict[] {
  const allConflicts: Conflict[] = [];
  const context: ValidationContext = {
    devices: blueprint.devices,
    rooms: blueprint.rooms,
    blueprint
  };
  
  for (const device of blueprint.devices) {
    const conflicts = validateDevice(device, context);
    device.conflicts = conflicts;
    allConflicts.push(...conflicts);
  }
  
  return allConflicts;
}

export function getConflictStats(conflicts: Conflict[]) {
  return {
    total: conflicts.length,
    errors: conflicts.filter(c => c.severity === 'error').length,
    warnings: conflicts.filter(c => c.severity === 'warning').length,
    byType: conflicts.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
}
