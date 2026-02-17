/**
 * Device Placement AI
 * Core placement logic using Ollama for intelligent device positioning
 */

import { ollamaClient } from './ollamaClient';
import type { Device, DeviceType, SystemType, Room } from '../shared/types';

// Vision-capable model for image analysis
const VISION_MODEL = 'llava:7b';

export interface PlacementDevice {
  id: string;
  type: DeviceType;
  system: SystemType;
  x: number;
  y: number;
  name: string;
  rotation: number;
  roomId?: string;
  confidence: number;
  reasoning: string;
}

export interface PlacementResult {
  devices: PlacementDevice[];
  detectedRooms: Room[];
  processingTime: number;
  confidence: number;
}

const DEVICE_PLACEMENT_PROMPT = `You are an expert in NFPA 72 compliance and security system design.

Analyze this floor plan image and identify rooms, then suggest optimal device placements.

RULES FOR SMOKE DETECTORS (Fire Alarm System):
- Maximum spacing: 30 feet between detectors
- Minimum distance from walls: 4 inches (0.33 feet)
- Maximum distance from walls: 15 feet
- Place on ceilings, centered in rooms when possible
- Avoid corners closer than 4 inches to both walls
- Add detectors in hallways every 30 feet

RULES FOR CAMERAS (CCTV System):
- Position for maximum coverage
- Height: 8-10 feet for facial recognition, 12+ feet for general surveillance
- Avoid blind spots
- Cover all entry/exit points

RULES FOR CARD READERS (Access Control):
- Mount at 42-48 inches height
- Position 6-12 inches from door frame
- Install on secure side of door

For each device, provide:
1. Device type: "smoke-detector", "heat-detector", "camera", "card-reader", or "motion-sensor"
2. System type: "fire", "cctv", or "access"
3. Position coordinates (x, y as percentages 0-100 of image dimensions)
4. Which room it belongs to
5. Brief reasoning for placement

RESPOND ONLY with a JSON object in this exact format:
{
  "rooms": [
    {
      "id": "room-1",
      "name": "Office 101",
      "type": "office",
      "x": 10,
      "y": 10,
      "width": 200,
      "height": 150
    }
  ],
  "devices": [
    {
      "id": "smoke-1",
      "type": "smoke-detector",
      "system": "fire",
      "x": 50.0,
      "y": 50.0,
      "name": "Smoke Detector - Main Office",
      "rotation": 0,
      "roomId": "room-1",
      "confidence": 0.95,
      "reasoning": "Centered in office for optimal coverage per NFPA 72"
    }
  ]
}

IMPORTANT:
- Use PERCENTAGE coordinates (0.0 to 100.0) relative to image dimensions
- Return ONLY valid JSON, no markdown, no explanations outside JSON`;

/**
 * Analyze a blueprint image and generate device placements
 */
export async function analyzeBlueprintAndPlaceDevices(
  imageBase64: string,
  systemType: SystemType,
  blueprintWidth: number = 1000,
  blueprintHeight: number = 800
): Promise<PlacementResult> {
  const startTime = performance.now();
  
  try {
    // Check if Ollama is available
    const isAvailable = await ollamaClient.isAvailable();
    if (!isAvailable) {
      throw new Error('Ollama is not running on localhost:11434. Please start Ollama first.');
    }
    
    // Generate placement recommendations using vision model
    const response = await ollamaClient.generateWithImage(
      DEVICE_PLACEMENT_PROMPT,
      imageBase64,
      VISION_MODEL,
      { temperature: 0.1, max_tokens: 4000 }
    );
    
    // Parse the JSON response
    const parsed = parseAIResponse(response);
    
    // Filter devices by requested system type
    const filteredDevices = parsed.devices.filter(d => 
      systemType === 'fire' ? d.system === 'fire' :
      systemType === 'cctv' ? d.system === 'cctv' :
      systemType === 'access' ? d.system === 'access' :
      true
    );
    
    // Convert percentage coordinates to pixels
    const devicesWithPixels = filteredDevices.map(d => ({
      ...d,
      x: (d.x / 100) * blueprintWidth,
      y: (d.y / 100) * blueprintHeight
    }));
    
    // Detect and resolve conflicts
    const devicesWithConflicts = await detectConflicts(devicesWithPixels, parsed.rooms, blueprintWidth, blueprintHeight);
    
    const processingTime = performance.now() - startTime;
    
    return {
      devices: devicesWithConflicts,
      detectedRooms: parsed.rooms,
      processingTime,
      confidence: calculateOverallConfidence(devicesWithConflicts)
    };
    
  } catch (error) {
    console.error('AI analysis failed:', error);
    
    // Fallback to rule-based placement if AI fails
    console.warn('Falling back to rule-based placement');
    return generateFallbackPlacement(systemType, blueprintWidth, blueprintHeight);
  }
}

/**
 * Parse AI response, handling various formats
 */
function parseAIResponse(response: string): { rooms: Room[]; devices: PlacementDevice[] } {
  // Try to extract JSON from response
  let jsonStr = response;
  
  // Look for JSON in code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }
  
  // Try to find JSON object directly
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    return {
      rooms: parsed.rooms || [],
      devices: (parsed.devices || []).map((d: any, idx: number) => ({
        id: d.id || `device-${idx}-${Date.now()}`,
        type: d.type || 'smoke-detector',
        system: d.system || 'fire',
        x: typeof d.x === 'number' ? d.x : 50,
        y: typeof d.y === 'number' ? d.y : 50,
        name: d.name || `${d.type || 'Device'} ${idx + 1}`,
        rotation: d.rotation || 0,
        roomId: d.roomId,
        confidence: d.confidence || 0.7,
        reasoning: d.reasoning || 'AI recommended placement'
      }))
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.log('Raw response:', response);
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Detect conflicts between devices and with boundaries
 */
async function detectConflicts(
  devices: PlacementDevice[],
  rooms: Room[],
  blueprintWidth: number,
  blueprintHeight: number
): Promise<PlacementDevice[]> {
  const MIN_SPACING: Record<DeviceType, number> = {
    'smoke-detector': 30 * 10, // 30ft in pixels (assuming ~10 pixels/ft)
    'heat-detector': 30 * 10,
    'co-detector': 30 * 10,
    'pull-station': 5 * 10,
    'strobe': 50 * 10,
    'horn': 50 * 10,
    'camera': 20 * 10,
    'card-reader': 3 * 10,
    'door-contact': 3 * 10,
    'motion-sensor': 30 * 10
  };
  
  return devices.map((device, idx) => {
    const conflicts: string[] = [];
    const minSpacing = MIN_SPACING[device.type] || 100;
    
    // Check spacing with other devices of same type
    devices.forEach((other, otherIdx) => {
      if (idx === otherIdx) return;
      if (other.type !== device.type) return;
      
      const distance = Math.sqrt(
        Math.pow(device.x - other.x, 2) + 
        Math.pow(device.y - other.y, 2)
      );
      
      if (distance < minSpacing) {
        conflicts.push(`Too close to ${other.name} (${Math.round(distance)}px, min ${minSpacing}px)`);
      }
    });
    
    // Check wall proximity (4 inch minimum)
    const wallBuffer = 4 * 10; // 4 inches in pixels
    if (device.x < wallBuffer) {
      conflicts.push(`Too close to left wall (${Math.round(device.x)}px, min ${wallBuffer}px)`);
    }
    if (device.x > blueprintWidth - wallBuffer) {
      conflicts.push(`Too close to right wall`);
    }
    if (device.y < wallBuffer) {
      conflicts.push(`Too close to top wall`);
    }
    if (device.y > blueprintHeight - wallBuffer) {
      conflicts.push(`Too close to bottom wall`);
    }
    
    // Update confidence based on conflicts
    const confidence = Math.max(0.3, device.confidence - (conflicts.length * 0.1));
    
    return {
      ...device,
      confidence,
      reasoning: conflicts.length > 0 
        ? `${device.reasoning} [CONFLICTS: ${conflicts.join('; ')}]`
        : device.reasoning
    };
  });
}

/**
 * Calculate overall placement confidence
 */
function calculateOverallConfidence(devices: PlacementDevice[]): number {
  if (devices.length === 0) return 0;
  const avgConfidence = devices.reduce((sum, d) => sum + d.confidence, 0) / devices.length;
  return Math.round(avgConfidence * 100) / 100;
}

/**
 * Fallback rule-based placement when AI fails
 */
function generateFallbackPlacement(
  systemType: SystemType,
  width: number,
  height: number
): PlacementResult {
  const devices: PlacementDevice[] = [];
  const gridSize = systemType === 'fire' ? 30 * 10 : 20 * 10; // pixels
  
  const deviceType: DeviceType = 
    systemType === 'fire' ? 'smoke-detector' :
    systemType === 'cctv' ? 'camera' :
    'card-reader';
  
  const namePrefix = 
    systemType === 'fire' ? 'Smoke' :
    systemType === 'cctv' ? 'Camera' :
    'Card Reader';
  
  let id = 1;
  for (let x = gridSize; x < width - gridSize; x += gridSize) {
    for (let y = gridSize; y < height - gridSize; y += gridSize) {
      // Offset every other row for better coverage
      const xOffset = (y / gridSize) % 2 === 0 ? 0 : gridSize / 2;
      
      devices.push({
        id: `fallback-${id}`,
        type: deviceType,
        system: systemType,
        x: x + xOffset,
        y: y,
        name: `${namePrefix} ${id}`,
        rotation: 0,
        confidence: 0.5,
        reasoning: 'Fallback grid-based placement (AI unavailable)'
      });
      
      id++;
      if (id > 50) break; // Limit fallback devices
    }
  }
  
  return {
    devices,
    detectedRooms: [],
    processingTime: 0,
    confidence: 0.5
  };
}

/**
 * Convert placement devices to full Device objects
 */
export function placementsToDevices(
  placements: PlacementDevice[],
  blueprintId: string
): Device[] {
  return placements.map(p => ({
    id: p.id,
    type: p.type,
    system: p.system,
    x: p.x,
    y: p.y,
    name: p.name,
    rotation: p.rotation,
    properties: {
      aiConfidence: p.confidence,
      aiReasoning: p.reasoning,
      roomId: p.roomId
    },
    conflicts: []
  }));
}
