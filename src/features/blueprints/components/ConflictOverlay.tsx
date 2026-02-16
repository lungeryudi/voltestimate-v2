import { useState, useMemo } from 'react';
import type { Device, Conflict } from '../../../shared/types';
import { AlertTriangle, AlertCircle, X, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

interface ConflictOverlayProps {
  devices: Device[];
  scale: number;
  onAutoFix: (conflictId: string) => void;
  onDeviceClick: (device: Device) => void;
}

interface ConflictTooltipProps {
  conflict: Conflict;
  device: Device;
  onClose: () => void;
  onAutoFix: () => void;
}

const ConflictTooltip: React.FC<ConflictTooltipProps> = ({ conflict, onClose, onAutoFix }) => {
  return (
    <div className="absolute z-50 bg-white rounded-lg shadow-xl border border-red-200 p-3 min-w-64 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {conflict.severity === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
          <span className={`font-semibold text-sm ${
            conflict.severity === 'error' ? 'text-red-600' : 'text-amber-600'
          }`}>
            {conflict.severity === 'error' ? 'Error' : 'Warning'}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="mb-2">
        <p className="text-sm text-gray-700">{conflict.message}</p>
      </div>
      
      {conflict.suggestion && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
          <span className="font-medium">Suggestion:</span> {conflict.suggestion}
        </div>
      )}
      
      {conflict.autoFix && (
        <button
          onClick={onAutoFix}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Wrench className="w-4 h-4" />
          Auto-Fix Position
        </button>
      )}
    </div>
  );
};

interface DeviceHaloProps {
  device: Device;
  scale: number;
  onDeviceClick: (device: Device) => void;
  onAutoFix: (conflictId: string) => void;
}

const DeviceHalo: React.FC<DeviceHaloProps> = ({ device, scale, onDeviceClick, onAutoFix }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeConflict, setActiveConflict] = useState<Conflict | null>(null);
  
  const hasErrors = device.conflicts.some(c => c.severity === 'error');
  
  if (device.conflicts.length === 0) return null;
  
  const haloSize = 40 / scale;
  const pulseAnimation = hasErrors ? 'animate-pulse' : '';
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (device.conflicts.length === 1) {
      setActiveConflict(device.conflicts[0]);
      setShowTooltip(true);
    } else {
      setActiveConflict(device.conflicts[0]);
      setShowTooltip(true);
    }
    onDeviceClick(device);
  };
  
  return (
    <g className="conflict-halo" style={{ cursor: 'pointer' }}>
      {/* Red glowing halo */}
      <circle
        cx={device.x}
        cy={device.y}
        r={haloSize}
        fill="none"
        stroke={hasErrors ? '#ef4444' : '#f59e0b'}
        strokeWidth={3 / scale}
        className={`${pulseAnimation} drop-shadow-lg`}
        style={{
          filter: `drop-shadow(0 0 ${8 / scale}px ${hasErrors ? '#ef4444' : '#f59e0b'})`,
          animation: 'glow 1.5s ease-in-out infinite alternate'
        }}
        onClick={handleClick}
      />
      
      {/* Inner circle for emphasis */}
      <circle
        cx={device.x}
        cy={device.y}
        r={haloSize * 0.7}
        fill={hasErrors ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}
        onClick={handleClick}
      />
      
      {/* Warning icon */}
      <foreignObject
        x={device.x - (12 / scale)}
        y={device.y - (12 / scale)}
        width={24 / scale}
        height={24 / scale}
        onClick={handleClick}
      >
        <div className="flex items-center justify-center w-full h-full">
          {hasErrors ? (
            <AlertCircle className="w-full h-full text-red-500" />
          ) : (
            <AlertTriangle className="w-full h-full text-amber-500" />
          )}
        </div>
      </foreignObject>
      
      {/* Tooltip */}
      {showTooltip && activeConflict && (
        <foreignObject
          x={device.x + haloSize + 10}
          y={device.y - 50}
          width={300}
          height={200}
        >
          <ConflictTooltip
            conflict={activeConflict}
            device={device}
            onClose={() => setShowTooltip(false)}
            onAutoFix={() => {
              onAutoFix(activeConflict.id);
              setShowTooltip(false);
            }}
          />
        </foreignObject>
      )}
    </g>
  );
};

export const ConflictOverlay: React.FC<ConflictOverlayProps> = ({
  devices,
  scale,
  onAutoFix,
  onDeviceClick
}) => {
  const devicesWithConflicts = useMemo(() => 
    devices.filter(d => d.conflicts.length > 0),
    [devices]
  );
  
  return (
    <g className="conflict-overlay">
      {devicesWithConflicts.map(device => (
        <DeviceHalo
          key={device.id}
          device={device}
          scale={scale}
          onDeviceClick={onDeviceClick}
          onAutoFix={onAutoFix}
        />
      ))}
    </g>
  );
};

// Conflict List Panel Component
interface ConflictListPanelProps {
  devices: Device[];
  onConflictClick: (device: Device, conflict: Conflict) => void;
  onAutoFix: (conflictId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ConflictListPanel: React.FC<ConflictListPanelProps> = ({
  devices,
  onConflictClick,
  onAutoFix,
  isOpen,
  onToggle
}) => {
  const allConflicts = useMemo(() => {
    const conflicts: Array<{ device: Device; conflict: Conflict }> = [];
    for (const device of devices) {
      for (const conflict of device.conflicts) {
        conflicts.push({ device, conflict });
      }
    }
    return conflicts;
  }, [devices]);
  
  const errorCount = allConflicts.filter(c => c.conflict.severity === 'error').length;
  const warningCount = allConflicts.filter(c => c.conflict.severity === 'warning').length;
  
  if (allConflicts.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-3 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full" />
        <span className="text-sm font-medium text-green-700">No conflicts detected</span>
      </div>
    );
  }
  
  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl transition-all duration-300 ${
      isOpen ? 'w-96 max-h-96' : 'w-auto'
    }`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {errorCount > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
          <span className="font-semibold text-gray-800">
            {allConflicts.length} Conflict{allConflicts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
              {errorCount} Error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
              {warningCount} Warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      
      {/* Conflict List */}
      {isOpen && (
        <div className="overflow-y-auto max-h-80">
          {allConflicts.map(({ device, conflict }) => (
            <div
              key={conflict.id}
              className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => onConflictClick(device, conflict)}
            >
              <div className="flex items-start gap-2">
                {conflict.severity === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{device.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{conflict.message}</p>
                  {conflict.autoFix && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAutoFix(conflict.id);
                      }}
                      className="mt-2 text-xs flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                    >
                      <Wrench className="w-3 h-3" />
                      Auto-Fix
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConflictOverlay;
