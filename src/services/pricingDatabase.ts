/**
 * Pricing Database for VoltEstimate Pro
 * Local pricing data - no API calls required
 */

import type { DeviceType, SystemType } from '../shared/types';

// Device pricing catalog
export interface DevicePricing {
  type: DeviceType;
  name: string;
  unitPrice: number;
  category: string;
  laborHours: number;
  description: string;
}

// System pricing configuration
export interface SystemPricing {
  system: SystemType;
  laborRate: number; // $/hour
  overheadPercent: number;
  profitMargin: number;
  devices: DevicePricing[];
}

// Fire Alarm System Pricing
export const fireSystemPricing: SystemPricing = {
  system: 'fire',
  laborRate: 85,
  overheadPercent: 15,
  profitMargin: 20,
  devices: [
    {
      type: 'smoke-detector',
      name: 'Addressable Smoke Detector',
      unitPrice: 145,
      laborHours: 0.75,
      category: 'Detection',
      description: 'Intelligent photoelectric smoke detector'
    },
    {
      type: 'heat-detector',
      name: 'Addressable Heat Detector',
      unitPrice: 125,
      laborHours: 0.75,
      category: 'Detection',
      description: 'Fixed temperature/rate-of-rise heat detector'
    },
    {
      type: 'co-detector',
      name: 'CO Detector',
      unitPrice: 195,
      laborHours: 1.0,
      category: 'Detection',
      description: 'Carbon monoxide detector with alarm'
    },
    {
      type: 'pull-station',
      name: 'Manual Pull Station',
      unitPrice: 85,
      laborHours: 1.5,
      category: 'Initiating',
      description: 'Addressable manual fire alarm pull station'
    },
    {
      type: 'strobe',
      name: 'Strobe Light',
      unitPrice: 125,
      laborHours: 1.25,
      category: 'Notification',
      description: 'Wall/ceiling mount strobe, 15/30/75/110 cd'
    },
    {
      type: 'horn',
      name: 'Horn/Strobe Combo',
      unitPrice: 165,
      laborHours: 1.5,
      category: 'Notification',
      description: 'Addressable horn/strobe combination unit'
    }
  ]
};

// CCTV System Pricing
export const cctvSystemPricing: SystemPricing = {
  system: 'cctv',
  laborRate: 75,
  overheadPercent: 15,
  profitMargin: 20,
  devices: [
    {
      type: 'camera',
      name: 'Dome Camera (IP)',
      unitPrice: 385,
      laborHours: 2.5,
      category: 'Cameras',
      description: '4MP indoor dome camera with IR'
    },
    {
      type: 'camera',
      name: 'Bullet Camera (IP)',
      unitPrice: 425,
      laborHours: 3.0,
      category: 'Cameras',
      description: '4MP outdoor bullet camera with IR'
    },
    {
      type: 'camera',
      name: 'PTZ Camera (IP)',
      unitPrice: 1850,
      laborHours: 4.5,
      category: 'Cameras',
      description: 'Pan/tilt/zoom camera with 30x optical zoom'
    }
  ]
};

// Access Control System Pricing
export const accessSystemPricing: SystemPricing = {
  system: 'access',
  laborRate: 80,
  overheadPercent: 15,
  profitMargin: 20,
  devices: [
    {
      type: 'card-reader',
      name: 'Card Reader (Prox)',
      unitPrice: 245,
      laborHours: 2.0,
      category: 'Readers',
      description: 'Proximity card reader with keypad'
    },
    {
      type: 'card-reader',
      name: 'Card Reader (Smart)',
      unitPrice: 325,
      laborHours: 2.5,
      category: 'Readers',
      description: 'Multi-technology smart card reader'
    },
    {
      type: 'door-contact',
      name: 'Door Contact',
      unitPrice: 45,
      laborHours: 1.0,
      category: 'Sensors',
      description: 'Surface mount magnetic door contact'
    },
    {
      type: 'motion-sensor',
      name: 'PIR Motion Sensor',
      unitPrice: 125,
      laborHours: 1.5,
      category: 'Sensors',
      description: 'Passive infrared motion detector'
    }
  ]
};

// Pricing database export
export const pricingDatabase = {
  fire: fireSystemPricing,
  cctv: cctvSystemPricing,
  access: accessSystemPricing
};

// Get device pricing by type and system
export function getDevicePricing(deviceType: DeviceType, system: SystemType): DevicePricing | undefined {
  const systemPricing = pricingDatabase[system];
  if (!systemPricing) return undefined;
  
  // Find best match for device type
  return systemPricing.devices.find(d => d.type === deviceType) || 
         systemPricing.devices[0];
}

// Get system pricing configuration
export function getSystemPricing(system: SystemType): SystemPricing {
  return pricingDatabase[system];
}

// Calculate total cost with markup
export function calculateTotalCost(
  materialCost: number, 
  laborCost: number, 
  overheadPercent: number = 15, 
  profitMargin: number = 20
): {
  subtotal: number;
  overhead: number;
  profit: number;
  total: number;
} {
  const subtotal = materialCost + laborCost;
  const overhead = subtotal * (overheadPercent / 100);
  const profit = (subtotal + overhead) * (profitMargin / 100);
  const total = subtotal + overhead + profit;
  
  return {
    subtotal,
    overhead,
    profit,
    total
  };
}

// Additional material costs (per project)
export const additionalMaterials = {
  conduit: {
    name: 'Conduit & Wire',
    unitPrice: 2.50, // per foot
    quantityPerDevice: 25 // average feet per device
  },
  junctionBox: {
    name: 'Junction Boxes',
    unitPrice: 15,
    quantityPerDevice: 0.3 // 1 box per 3 devices
  },
  hardware: {
    name: 'Mounting Hardware',
    unitPrice: 8,
    quantityPerDevice: 1
  }
};

// Engineering and project management rates
export const projectRates = {
  engineering: {
    rate: 125,
    hoursPerDevice: 0.25
  },
  projectManagement: {
    rate: 100,
    hoursPerDevice: 0.15
  },
  testing: {
    rate: 85,
    hoursPerDevice: 0.5
  }
};

// Default tax rate
export const defaultTaxRate = 0.08; // 8%
