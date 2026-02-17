/**
 * AI Analysis Pipeline Types
 * Core types for the AI analysis system
 */

import type { SystemType, DeviceType } from '../../../shared/types';

// ============================================
// GEOMETRY & SPATIAL TYPES
// ============================================

export interface Point2D {
  x: number;
  y: number;
}

export interface Vector2D {
  dx: number;
  dy: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface LineSegment {
  start: Point2D;
  end: Point2D;
}

export interface Polygon {
  vertices: Point2D[];
  id: string;
}

// ============================================
// ROOM DETECTION TYPES
// ============================================

export interface DetectedWall {
  id: string;
  segment: LineSegment;
  thickness: number;
  type: 'interior' | 'exterior' | 'partition';
  confidence: number; // 0-1
}

export interface DetectedOpening {
  id: string;
  position: Point2D;
  width: number;
  type: 'door' | 'window' | 'opening';
  wallId: string;
  confidence: number;
}

export interface DetectedRoom {
  id: string;
  polygon: Polygon;
  boundingBox: BoundingBox;
  area: number; // square feet
  perimeter: number; // feet
  type: RoomType;
  walls: string[]; // wall IDs
  openings: string[]; // opening IDs
  center: Point2D;
  confidence: number;
  // Room characteristics
  ceilingHeight?: number;
  hasHazardousMaterials: boolean;
  occupancyType?: string;
}

export type RoomType = 
  | 'office'
  | 'corridor'
  | 'stairwell'
  | 'elevator-shaft'
  | 'mechanical-room'
  | 'electrical-room'
  | 'storage'
  | 'restroom'
  | 'kitchen'
  | 'conference'
  | 'lobby'
  | 'parking'
  | 'unknown';

// ============================================
// COVERAGE ANALYSIS TYPES
// ============================================

export interface CoverageZone {
  id: string;
  center: Point2D;
  radius: number; // coverage radius in feet
  system: SystemType;
  deviceType: DeviceType;
  effectiveArea: number; // actual coverage area
  overlapWith: string[]; // zone IDs this overlaps with
  gaps: Polygon[]; // uncovered areas within radius
}

export interface CoverageGrid {
  width: number;
  height: number;
  cellSize: number; // feet per cell
  cells: CoverageCell[][];
}

export interface CoverageCell {
  x: number;
  y: number;
  coveredBy: string[]; // zone IDs covering this cell
  systems: SystemType[];
  coverageQuality: number; // 0-1 based on signal strength/distance
}

export interface CoverageAnalysis {
  totalArea: number;
  coveredArea: number;
  coveragePercent: number;
  gaps: Polygon[];
  overlaps: OverlapRegion[];
  recommendations: string[];
}

export interface OverlapRegion {
  id: string;
  polygon: Polygon;
  area: number;
  systems: SystemType[];
  severity: 'optimal' | 'acceptable' | 'excessive';
}

// ============================================
// CODE COMPLIANCE TYPES
// ============================================

export type CodeStandard = 'NFPA-72' | 'NEC-70' | 'IBC' | 'ADA' | 'LOCAL';

export interface CodeRequirement {
  id: string;
  standard: CodeStandard;
  section: string;
  description: string;
  appliesTo: SystemType[];
  roomTypes?: RoomType[];
  // Placement rules
  maxSpacing?: number; // feet
  maxAreaPerDevice?: number; // square feet
  minDistanceToWall?: number; // feet
  maxDistanceToWall?: number; // feet
  minHeight?: number; // feet above floor
  maxHeight?: number; // feet above floor
  // Special conditions
  requiresLineOfSight?: boolean;
  requiresHighCeiling?: boolean;
  requiresHazardousRating?: boolean;
}

export interface ComplianceCheck {
  requirement: CodeRequirement;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedDevices: string[];
  suggestedFix?: PlacementSuggestion;
}

export interface PlacementSuggestion {
  action: 'move' | 'add' | 'remove' | 'replace';
  deviceId?: string;
  newPosition?: Point2D;
  reason: string;
  confidence: number;
}

// ============================================
// DEVICE PLACEMENT TYPES
// ============================================

export interface PlacementCandidate {
  id: string;
  position: Point2D;
  roomId: string;
  system: SystemType;
  deviceType: DeviceType;
  // Placement quality metrics
  coverageScore: number; // 0-1
  complianceScore: number; // 0-1
  efficiencyScore: number; // 0-1 (minimal overlap)
  accessibilityScore: number; // 0-1 (ease of maintenance)
  overallScore: number; // weighted composite
  // Analysis
  coverageZone: CoverageZone;
  complianceChecks: ComplianceCheck[];
  conflicts: PredictedConflict[];
}

export interface DevicePlacementPlan {
  system: SystemType;
  deviceType: DeviceType;
  placements: PlacementCandidate[];
  totalCoverage: number; // percentage
  estimatedCost: number;
  complianceRating: 'excellent' | 'good' | 'fair' | 'poor';
}

// ============================================
// CONFLICT PREDICTION TYPES
// ============================================

export interface PredictedConflict {
  id: string;
  type: ConflictType;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  position: Point2D;
  // Related entities
  affectedDeviceIds: string[];
  affectedRoomIds: string[];
  affectedZones: string[];
  // Prediction metadata
  confidence: number; // 0-1
  detectionSource: 'geometry' | 'code' | 'coverage' | 'interference';
  // Resolution
  suggestedResolutions: ResolutionOption[];
}

export type ConflictType =
  | 'insufficient-coverage'
  | 'overlapping-devices'
  | 'code-violation'
  | 'wall-obstruction'
  | 'door-interference'
  | 'height-violation'
  | 'spacing-violation'
  | 'accessibility-issue'
  | 'system-interference'
  | 'maintenance-access';

export interface ResolutionOption {
  id: string;
  action: 'move-device' | 'add-device' | 'remove-device' | 'change-type' | 'accept-risk';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'quick' | 'moderate' | 'complex';
  resultingScore: number; // predicted score after resolution
}

// ============================================
// MULTI-SYSTEM COORDINATION
// ============================================

export interface SystemCoordination {
  fireSystem: SystemPlan;
  cctvSystem: SystemPlan;
  accessSystem: SystemPlan;
  // Cross-system analysis
  sharedInfrastructure: SharedInfrastructure[];
  interferencePoints: InterferencePoint[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface SystemPlan {
  system: SystemType;
  devices: PlacementCandidate[];
  coverageAnalysis: CoverageAnalysis;
  complianceStatus: ComplianceCheck[];
}

export interface SharedInfrastructure {
  id: string;
  type: 'conduit' | 'cable-tray' | 'junction-box' | 'backboard';
  position: Point2D;
  servingSystems: SystemType[];
  costSavings: number;
}

export interface InterferencePoint {
  id: string;
  position: Point2D;
  systems: SystemType[];
  type: 'cable-crossing' | 'signal-interference' | 'physical-collision';
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface OptimizationOpportunity {
  id: string;
  description: string;
  type: 'cost-reduction' | 'coverage-improvement' | 'compliance-enhancement';
  potentialSavings: number; // dollar amount or percentage
  implementation: string;
}

// ============================================
// AI PIPELINE RESULT
// ============================================

export interface AIAnalysisResult {
  blueprintId: string;
  // Detection results
  rooms: DetectedRoom[];
  walls: DetectedWall[];
  openings: DetectedOpening[];
  // Placement plans
  placementPlans: DevicePlacementPlan[];
  // Analysis
  coverageAnalysis: CoverageAnalysis;
  complianceChecks: ComplianceCheck[];
  predictedConflicts: PredictedConflict[];
  // Multi-system
  systemCoordination?: SystemCoordination;
  // Metadata
  processingTime: number; // milliseconds
  confidence: number; // overall confidence 0-1
  aiModelVersion: string;
  generatedAt: Date;
}

// ============================================
// PIPELINE CONFIGURATION
// ============================================

export interface AIPipelineConfig {
  // Detection settings
  roomDetectionSensitivity: number; // 0-1
  wallDetectionThreshold: number;
  minRoomArea: number; // square feet
  
  // Coverage settings
  coverageTarget: number; // 0-1 (percentage)
  maxOverlapRatio: number; // 0-1
  cellSize: number; // feet
  
  // Code compliance
  activeStandards: CodeStandard[];
  strictMode: boolean;
  
  // Optimization
  optimizeFor: 'coverage' | 'cost' | 'compliance' | 'balanced';
  maxIterations: number;
  
  // Multi-system
  enableCoordination: boolean;
  enableInfrastructureSharing: boolean;
}

export const DEFAULT_PIPELINE_CONFIG: AIPipelineConfig = {
  roomDetectionSensitivity: 0.8,
  wallDetectionThreshold: 0.7,
  minRoomArea: 50,
  coverageTarget: 0.98,
  maxOverlapRatio: 0.3,
  cellSize: 1,
  activeStandards: ['NFPA-72', 'NEC-70'],
  strictMode: true,
  optimizeFor: 'balanced',
  maxIterations: 100,
  enableCoordination: true,
  enableInfrastructureSharing: true,
};
