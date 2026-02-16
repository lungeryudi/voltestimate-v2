import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Blueprint, Device } from '../../types';
import { useStore } from '../../stores';
import { ConflictOverlay, ConflictListPanel } from './ConflictOverlay';
import { DeviceInfoPopup } from './DeviceInfoPopup';
import { validateAllDevices } from '../../utils/validation';
import { 
  ZoomIn, ZoomOut, Move, RotateCcw, Layers, 
  Flame, Video, Lock, X, AlertTriangle 
} from 'lucide-react';

interface BlueprintViewerProps {
  blueprint: Blueprint;
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({ blueprint }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    zoom, pan, setZoom, setPan, resetView,
    visibleLayers, toggleLayer,
    showConflictPanel, setShowConflictPanel,
    updateDevice, setConflicts, autoFixConflict,
    blueprints, setSelectedBlueprint
  } = useStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [draggingDevice, setDraggingDevice] = useState<string | null>(null);
  const [localBlueprint, setLocalBlueprint] = useState(blueprint);
  
  // Update local blueprint when store changes
  useEffect(() => {
    const updated = blueprints.find(b => b.id === blueprint.id);
    if (updated) {
      setLocalBlueprint(updated);
    }
  }, [blueprints, blueprint.id]);
  
  // Run validation on mount and when devices change
  useEffect(() => {
    const conflicts = validateAllDevices(localBlueprint);
    setConflicts(conflicts);
  }, [localBlueprint.devices, setConflicts]);
  
  // Zoom handlers
  const handleZoomIn = () => setZoom(zoom * 1.2);
  const handleZoomOut = () => setZoom(zoom / 1.2);
  
  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'rect') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && !draggingDevice) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, draggingDevice, dragStart, setPan]);
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingDevice(null);
  };
  
  // Device drag handlers
  const handleDeviceMouseDown = (e: React.MouseEvent, device: Device) => {
    e.stopPropagation();
    setDraggingDevice(device.id);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleDeviceMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingDevice && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const newX = (e.clientX - rect.left - pan.x) / zoom;
      const newY = (e.clientY - rect.top - pan.y) / zoom;
      
      updateDevice(blueprint.id, draggingDevice, { x: newX, y: newY });
    }
  }, [draggingDevice, blueprint.id, zoom, pan, updateDevice]);
  
  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
  };
  
  // Filter devices by visible layers
  const visibleDevices = localBlueprint.devices.filter(d => visibleLayers[d.system]);
  const devicesWithConflicts = localBlueprint.devices.filter(d => d.conflicts.length > 0);
  
  const conflictCount = devicesWithConflicts.reduce((sum, d) => sum + d.conflicts.length, 0);
  
  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-100 overflow-hidden">
      {/* Blueprint Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleDeviceMouseMove(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Background */}
          <rect
            x={0}
            y={0}
            width={blueprint.width}
            height={blueprint.height}
            fill="white"
            stroke="#e5e7eb"
            strokeWidth={2}
          />
          
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect
            x={0}
            y={0}
            width={blueprint.width}
            height={blueprint.height}
            fill="url(#grid)"
          />
          
          {/* Rooms */}
          {localBlueprint.rooms.map(room => (
            <g key={room.id}>
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill="rgba(59, 130, 246, 0.05)"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-blue-500 pointer-events-none"
                style={{ fontSize: '12px' }}
              >
                {room.name}
              </text>
            </g>
          ))}
          
          {/* Devices */}
          {visibleDevices.map(device => (
            <g
              key={device.id}
              transform={`translate(${device.x}, ${device.y}) rotate(${device.rotation})`}
              className="cursor-pointer hover:opacity-80"
              onMouseDown={(e) => handleDeviceMouseDown(e, device)}
              onClick={() => handleDeviceClick(device)}
            >
              {/* Device icon based on type */}
              <DeviceIcon device={device} />
              
              {/* Device label */}
              <text
                y={20}
                textAnchor="middle"
                className="text-xs fill-gray-700 pointer-events-none"
                style={{ fontSize: '10px' }}
              >
                {device.name}
              </text>
            </g>
          ))}
          
          {/* Conflict Overlay */}
          <ConflictOverlay
            devices={localBlueprint.devices}
            scale={zoom}
            onAutoFix={autoFixConflict}
            onDeviceClick={handleDeviceClick}
          />
        </g>
      </svg>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-gray-600" />
        </button>
        <div className="h-px bg-gray-200 my-1" />
        <button
          onClick={resetView}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* Layer Toggles */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Layers</span>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visibleLayers.fire}
              onChange={() => toggleLayer('fire')}
              className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
            />
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">Fire Alarm</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visibleLayers.cctv}
              onChange={() => toggleLayer('cctv')}
              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
            />
            <Video className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">CCTV</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visibleLayers.access}
              onChange={() => toggleLayer('access')}
              className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
            />
            <Lock className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Access Control</span>
          </label>
        </div>
      </div>
      
      {/* Validation Badge */}
      {conflictCount > 0 && (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-700">
            {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} detected
          </span>
        </div>
      )}
      
      {/* Conflict List Panel */}
      <ConflictListPanel
        devices={localBlueprint.devices}
        onConflictClick={(device, conflict) => {
          setSelectedDevice(device);
          // Center view on device
          const newPan = {
            x: -device.x * zoom + (containerRef.current?.clientWidth || 0) / 2,
            y: -device.y * zoom + (containerRef.current?.clientHeight || 0) / 2
          };
          setPan(newPan);
        }}
        onAutoFix={autoFixConflict}
        isOpen={showConflictPanel}
        onToggle={() => setShowConflictPanel(!showConflictPanel)}
      />
      
      {/* Device Info Popup */}
      {selectedDevice && (
        <DeviceInfoPopup
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onUpdate={(updates) => {
            updateDevice(blueprint.id, selectedDevice.id, updates);
            setSelectedDevice({ ...selectedDevice, ...updates });
          }}
        />
      )}
      
      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow px-3 py-1">
        <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

// Device Icon Component
const DeviceIcon: React.FC<{ device: Device }> = ({ device }) => {
  const size = 16;
  const color = device.system === 'fire' ? '#ef4444' : 
                device.system === 'cctv' ? '#3b82f6' : '#22c55e';
  
  switch (device.type) {
    case 'smoke-detector':
      return (
        <g>
          <circle cx={0} cy={0} r={size/2} fill={color} stroke="white" strokeWidth={2} />
          <circle cx={0} cy={0} r={size/4} fill="white" />
        </g>
      );
    case 'camera':
      return (
        <g>
          <rect x={-size/2} y={-size/2} width={size} height={size} rx={2} fill={color} stroke="white" strokeWidth={2} />
          <circle cx={0} cy={0} r={size/4} fill="white" />
        </g>
      );
    case 'card-reader':
      return (
        <g>
          <rect x={-size/2} y={-size/3} width={size} height={size*0.66} rx={2} fill={color} stroke="white" strokeWidth={2} />
          <rect x={-size/6} y={-size/6} width={size/3} height={size/3} fill="white" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx={0} cy={0} r={size/2} fill={color} stroke="white" strokeWidth={2} />
        </g>
      );
  }
};

export default BlueprintViewer;
