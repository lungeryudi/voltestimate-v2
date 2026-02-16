import React, { useState } from 'react';
import type { Device, DeviceType, SystemType } from '../../types';
import { X, Edit2, Check, RotateCw } from 'lucide-react';

interface DeviceInfoPopupProps {
  device: Device;
  onClose: () => void;
  onUpdate: (updates: Partial<Device>) => void;
}

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  'smoke-detector': 'Smoke Detector',
  'heat-detector': 'Heat Detector',
  'co-detector': 'CO Detector',
  'pull-station': 'Pull Station',
  'strobe': 'Strobe',
  'horn': 'Horn',
  'camera': 'Camera',
  'card-reader': 'Card Reader',
  'door-contact': 'Door Contact',
  'motion-sensor': 'Motion Sensor'
};

const SYSTEM_COLORS: Record<SystemType, string> = {
  'fire': 'bg-red-100 text-red-700 border-red-200',
  'cctv': 'bg-blue-100 text-blue-700 border-blue-200',
  'access': 'bg-green-100 text-green-700 border-green-200'
};

export const DeviceInfoPopup: React.FC<DeviceInfoPopupProps> = ({
  device,
  onClose,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(device.name);
  const [editedRotation, setEditedRotation] = useState(device.rotation);
  
  const handleSave = () => {
    onUpdate({ name: editedName, rotation: editedRotation });
    setIsEditing(false);
  };
  
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium border ${SYSTEM_COLORS[device.system]}`}>
              {device.system.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Device Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm font-medium text-gray-800">{device.name}</p>
            )}
          </div>
          
          {/* Device Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <p className="text-sm text-gray-700">{DEVICE_TYPE_LABELS[device.type]}</p>
          </div>
          
          {/* Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">X Position</label>
              <p className="text-sm text-gray-700">{device.x.toFixed(1)}"</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Y Position</label>
              <p className="text-sm text-gray-700">{device.y.toFixed(1)}"</p>
            </div>
          </div>
          
          {/* Rotation */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Rotation</label>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editedRotation}
                  onChange={(e) => setEditedRotation(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min={0}
                  max={359}
                />
                <span className="text-sm text-gray-500">degrees</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-700">{device.rotation}°</p>
              </div>
            )}
          </div>
          
          {/* Conflicts */}
          {device.conflicts.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <label className="block text-xs font-medium text-red-700 mb-2">
                Conflicts ({device.conflicts.length})
              </label>
              <ul className="space-y-1">
                {device.conflicts.map(conflict => (
                  <li key={conflict.id} className="text-xs text-red-600">
                    • {conflict.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Properties */}
          {Object.keys(device.properties).length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Properties</label>
              <div className="bg-gray-50 rounded-md p-2">
                {Object.entries(device.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs py-1">
                    <span className="text-gray-500">{key}:</span>
                    <span className="text-gray-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedName(device.name);
                  setEditedRotation(device.rotation);
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceInfoPopup;
