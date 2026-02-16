/**
 * AI Vision Engine - Multi-modal AI integration for blueprint analysis
 * Supports Kimi K2.5 (primary) and GPT-4o Vision (fallback)
 */

import type { Point, Polygon } from '../shared/types';

// Re-export for backward compatibility
export type { Point, Polygon };

export interface AIAnalysisResult {
  rooms: DetectedRoom[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  obstacles: Obstacle[];
  scale: ScaleInfo;
  confidence: number;
  processingTime: number;
}

export interface DetectedRoom {
  id: string;
  name: string;
  type: RoomType;
  polygon: Polygon;
  area: number;
  ceilingHeight?: number;
  confidence: number;
}

export type RoomType = 
  | 'office' 
  | 'hallway' 
  | 'stairwell' 
  | 'storage' 
  | 'kitchen' 
  | 'server-room'
  | 'conference'
  | 'restroom'
  | 'lobby'
  | 'warehouse'
  | 'retail'
  | 'classroom'
  | 'laboratory'
  | 'electrical-room'
  | 'mechanical-room'
  | 'other';

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  type: 'interior' | 'exterior' | 'fire-rated';
}

export interface Door {
  id: string;
  position: Point;
  width: number;
  swing: 'left' | 'right' | 'double';
  type: 'interior' | 'exterior' | 'fire';
}

export interface Window {
  id: string;
  position: Point;
  width: number;
  height: number;
}

export interface Obstacle {
  id: string;
  type: 'column' | 'beam' | 'fixture' | 'equipment';
  position: Point;
  dimensions: { width: number; height: number; depth?: number };
}

export interface ScaleInfo {
  detected: boolean;
  pixelsPerUnit: number;
  unit: 'ft' | 'm' | 'in';
  confidence: number;
  referencePoints?: { pixel: Point; real: Point }[];
}

export interface VisionEngineConfig {
  primaryModel: 'kimi-k2.5' | 'gpt-4o-vision';
  fallbackEnabled: boolean;
  confidenceThreshold: number;
  maxRetries: number;
  timeoutMs: number;
}

const DEFAULT_CONFIG: VisionEngineConfig = {
  primaryModel: 'kimi-k2.5',
  fallbackEnabled: true,
  confidenceThreshold: 0.7,
  maxRetries: 3,
  timeoutMs: 60000
};

/**
 * Main AI Vision Engine class
 * Processes blueprint images and extracts structural information
 */
export class AIVisionEngine {
  private config: VisionEngineConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<VisionEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze a blueprint image using AI vision models
   */
  async analyzeBlueprint(imageData: string | File): Promise<AIAnalysisResult> {
    const startTime = performance.now();
    
    try {
      this.abortController = new AbortController();
      
      // Convert image to base64 if needed
      const base64Image = await this.prepareImage(imageData);
      
      // Try primary model first
      let result = await this.analyzeWithModel(base64Image, this.config.primaryModel);
      
      // Fall back to secondary model if needed
      if (!result && this.config.fallbackEnabled) {
        const fallbackModel = this.config.primaryModel === 'kimi-k2.5' 
          ? 'gpt-4o-vision' 
          : 'kimi-k2.5';
        result = await this.analyzeWithModel(base64Image, fallbackModel);
      }
      
      if (!result) {
        throw new Error('AI analysis failed with all available models');
      }

      const processingTime = performance.now() - startTime;
      
      return {
        ...result,
        processingTime
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Analyze with a specific AI model
   */
  private async analyzeWithModel(
    base64Image: string, 
    model: string
  ): Promise<Omit<AIAnalysisResult, 'processingTime'> | null> {
    const maxRetries = this.config.maxRetries;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (model === 'kimi-k2.5') {
          return await this.callKimiK25(base64Image);
        } else {
          return await this.callGPT4oVision(base64Image);
        }
      } catch (error) {
        if (attempt === maxRetries - 1) return null;
        await this.delay(1000 * (attempt + 1)); // Exponential backoff
      }
    }
    
    return null;
  }

  /**
   * Call Kimi K2.5 Vision API
   */
  private async callKimiK25(base64Image: string): Promise<Omit<AIAnalysisResult, 'processingTime'>> {
    const response = await fetch('/api/ai/kimi-k2.5/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Image,
        prompt: this.getAnalysisPrompt(),
        response_format: { type: 'json_object' }
      }),
      signal: this.abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseAIResponse(data);
  }

  /**
   * Call GPT-4o Vision API
   */
  private async callGPT4oVision(base64Image: string): Promise<Omit<AIAnalysisResult, 'processingTime'>> {
    const response = await fetch('/api/ai/gpt-4o-vision/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-vision-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert architectural blueprint analyzer. Extract room boundaries, walls, doors, windows, and scale information accurately.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: this.getAnalysisPrompt() },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
            ]
          }
        ],
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      }),
      signal: this.abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`GPT-4o Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseAIResponse(JSON.parse(data.choices[0].message.content));
  }

  /**
   * Get the analysis prompt for AI models
   */
  private getAnalysisPrompt(): string {
    return `Analyze this architectural blueprint image and extract the following information in JSON format:

1. ROOMS: Identify all rooms with:
   - Room type (office, hallway, stairwell, storage, kitchen, server-room, conference, restroom, lobby, warehouse, retail, classroom, laboratory, electrical-room, mechanical-room)
   - Polygon boundaries as array of {x, y} coordinates (in pixels)
   - Estimated area in square feet
   - Confidence score (0-1)

2. WALLS: Identify all walls with:
   - Start and end points {x, y}
   - Thickness in pixels
   - Type (interior, exterior, fire-rated)

3. DOORS: Identify all doors with:
   - Position {x, y}
   - Width in pixels
   - Swing direction (left, right, double)
   - Type (interior, exterior, fire)

4. WINDOWS: Identify all windows with:
   - Position {x, y}
   - Width and height in pixels

5. OBSTACLES: Identify columns, beams, and fixtures with:
   - Type (column, beam, fixture, equipment)
   - Position {x, y}
   - Dimensions

6. SCALE: Detect any scale annotations or dimension lines to determine:
   - Pixels per unit (ft/m/in)
   - Unit of measurement
   - Reference points if visible

Return ONLY valid JSON matching this structure:
{
  "rooms": [...],
  "walls": [...],
  "doors": [...],
  "windows": [...],
  "obstacles": [...],
  "scale": {...},
  "confidence": 0.95
}`;
  }

  /**
   * Parse and validate AI response
   */
  private parseAIResponse(data: any): Omit<AIAnalysisResult, 'processingTime'> {
    // Validate required fields
    if (!data.rooms || !Array.isArray(data.rooms)) {
      throw new Error('Invalid AI response: missing rooms array');
    }

    // Filter rooms by confidence threshold
    const validRooms = data.rooms.filter(
      (r: any) => (r.confidence || 0) >= this.config.confidenceThreshold
    );

    return {
      rooms: validRooms.map((r: any, idx: number) => ({
        id: r.id || `room-${idx}`,
        name: r.name || `Room ${idx + 1}`,
        type: r.type || 'other',
        polygon: r.polygon || { points: [] },
        area: r.area || 0,
        ceilingHeight: r.ceilingHeight,
        confidence: r.confidence || 0.5
      })),
      walls: (data.walls || []).map((w: any, idx: number) => ({
        id: w.id || `wall-${idx}`,
        start: w.start || { x: 0, y: 0 },
        end: w.end || { x: 0, y: 0 },
        thickness: w.thickness || 6,
        type: w.type || 'interior'
      })),
      doors: (data.doors || []).map((d: any, idx: number) => ({
        id: d.id || `door-${idx}`,
        position: d.position || { x: 0, y: 0 },
        width: d.width || 36,
        swing: d.swing || 'right',
        type: d.type || 'interior'
      })),
      windows: (data.windows || []).map((w: any, idx: number) => ({
        id: w.id || `window-${idx}`,
        position: w.position || { x: 0, y: 0 },
        width: w.width || 48,
        height: w.height || 36
      })),
      obstacles: (data.obstacles || []).map((o: any, idx: number) => ({
        id: o.id || `obstacle-${idx}`,
        type: o.type || 'fixture',
        position: o.position || { x: 0, y: 0 },
        dimensions: o.dimensions || { width: 12, height: 12 }
      })),
      scale: {
        detected: data.scale?.detected || false,
        pixelsPerUnit: data.scale?.pixelsPerUnit || 10,
        unit: data.scale?.unit || 'ft',
        confidence: data.scale?.confidence || 0.5,
        referencePoints: data.scale?.referencePoints
      },
      confidence: data.confidence || 0.5
    };
  }

  /**
   * Prepare image for AI processing
   */
  private async prepareImage(imageData: string | File): Promise<string> {
    if (typeof imageData === 'string') {
      // Already base64, strip data URL prefix if present
      return imageData.replace(/^data:image\/\w+;base64,/, '');
    }

    // Convert File to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).replace(/^data:image\/\w+;base64,/, '');
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageData);
    });
  }

  /**
   * Detect scale from user calibration points
   */
  detectScaleFromCalibration(
    point1: Point, 
    point2: Point, 
    realDistance: number,
    unit: 'ft' | 'm' | 'in'
  ): ScaleInfo {
    const pixelDistance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );

    return {
      detected: true,
      pixelsPerUnit: pixelDistance / realDistance,
      unit,
      confidence: 1.0,
      referencePoints: [
        { pixel: point1, real: { x: 0, y: 0 } },
        { pixel: point2, real: { x: realDistance, y: 0 } }
      ]
    };
  }

  /**
   * Convert pixel coordinates to real-world units
   */
  pixelsToRealWorld(pixels: number, scale: ScaleInfo): number {
    return pixels / scale.pixelsPerUnit;
  }

  /**
   * Convert real-world units to pixel coordinates
   */
  realWorldToPixels(units: number, scale: ScaleInfo): number {
    return units * scale.pixelsPerUnit;
  }

  /**
   * Cancel ongoing analysis
   */
  cancel(): void {
    this.abortController?.abort();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Room classification helper
 */
export function classifyRoomType(
  roomName: string, 
  area: number,
  _adjacentRooms: string[]
): RoomType {
  const nameLower = roomName.toLowerCase();
  
  // Direct keyword matching
  if (nameLower.includes('office')) return 'office';
  if (nameLower.includes('hall') || nameLower.includes('corridor')) return 'hallway';
  if (nameLower.includes('stair')) return 'stairwell';
  if (nameLower.includes('storage') || nameLower.includes('closet')) return 'storage';
  if (nameLower.includes('kitchen') || nameLower.includes('break')) return 'kitchen';
  if (nameLower.includes('server') || nameLower.includes('data')) return 'server-room';
  if (nameLower.includes('conference') || nameLower.includes('meeting')) return 'conference';
  if (nameLower.includes('restroom') || nameLower.includes('bathroom')) return 'restroom';
  if (nameLower.includes('lobby') || nameLower.includes('reception')) return 'lobby';
  if (nameLower.includes('warehouse')) return 'warehouse';
  if (nameLower.includes('retail') || nameLower.includes('store')) return 'retail';
  if (nameLower.includes('class') || nameLower.includes('lecture')) return 'classroom';
  if (nameLower.includes('lab')) return 'laboratory';
  if (nameLower.includes('electrical')) return 'electrical-room';
  if (nameLower.includes('mechanical') || nameLower.includes('hvac')) return 'mechanical-room';
  
  // Area-based heuristics
  if (area > 5000) return 'warehouse';
  if (area < 50) return 'storage';
  
  return 'other';
}

/**
 * Singleton instance for common use
 */
export const aiVisionEngine = new AIVisionEngine();

export default AIVisionEngine;
