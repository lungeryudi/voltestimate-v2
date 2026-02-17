/**
 * Estimate Engine for VoltEstimate Pro
 * Core pricing logic - local processing, no API calls
 */

import type { 
  Device, 
  DeviceType, 
  SystemType, 
  Estimate, 
  EstimateLineItem,
  Blueprint,
  Project
} from '../shared/types';
import { 
  getDevicePricing, 
  getSystemPricing,
  additionalMaterials,
  projectRates
} from './pricingDatabase';

// Group devices by system and type
export function groupDevicesByCategory(devices: Device[]): Map<string, Device[]> {
  const groups = new Map<string, Device[]>();
  
  for (const device of devices) {
    const key = `${device.system}:${device.type}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(device);
  }
  
  return groups;
}

// Calculate labor hours for a specific trade/system
export function calculateLaborHours(devices: Device[], system: SystemType): number {
  const systemDevices = devices.filter(d => d.system === system);
  const systemPricing = getSystemPricing(system);
  
  let totalHours = 0;
  
  for (const device of systemDevices) {
    const devicePricing = getDevicePricing(device.type, system);
    if (devicePricing) {
      totalHours += devicePricing.laborHours;
    }
  }
  
  return totalHours;
}

// Calculate material cost for line items
export function calculateMaterialCost(lineItems: EstimateLineItem[]): number {
  return lineItems
    .filter(item => item.category !== 'Labor' && item.category !== 'Engineering')
    .reduce((sum, item) => sum + item.total, 0);
}

// Generate line items from devices
export function generateLineItems(devices: Device[]): EstimateLineItem[] {
  const lineItems: EstimateLineItem[] = [];
  const groupedDevices = groupDevicesByCategory(devices);
  
  // Generate device line items
  for (const [key, deviceGroup] of groupedDevices) {
    const [system, deviceType] = key.split(':') as [SystemType, DeviceType];
    const devicePricing = getDevicePricing(deviceType, system);
    
    if (devicePricing && deviceGroup.length > 0) {
      lineItems.push({
        id: `li-${system}-${deviceType}`,
        category: getCategoryName(system),
        description: `${devicePricing.name} - ${devicePricing.description}`,
        quantity: deviceGroup.length,
        unitPrice: devicePricing.unitPrice,
        total: deviceGroup.length * devicePricing.unitPrice
      });
    }
  }
  
  // Add additional materials
  const totalDeviceCount = devices.length;
  
  if (totalDeviceCount > 0) {
    // Conduit and wire
    const conduitFeet = totalDeviceCount * additionalMaterials.conduit.quantityPerDevice;
    lineItems.push({
      id: 'li-conduit',
      category: 'Materials',
      description: `${additionalMaterials.conduit.name} - EMT conduit with low-voltage wiring`,
      quantity: Math.ceil(conduitFeet / 10) * 10, // Round to nearest 10
      unitPrice: additionalMaterials.conduit.unitPrice,
      total: Math.ceil(conduitFeet / 10) * 10 * additionalMaterials.conduit.unitPrice
    });
    
    // Junction boxes
    const junctionBoxCount = Math.ceil(totalDeviceCount * additionalMaterials.junctionBox.quantityPerDevice);
    lineItems.push({
      id: 'li-junction-boxes',
      category: 'Materials',
      description: `${additionalMaterials.junctionBox.name} - 4" square with cover`,
      quantity: junctionBoxCount,
      unitPrice: additionalMaterials.junctionBox.unitPrice,
      total: junctionBoxCount * additionalMaterials.junctionBox.unitPrice
    });
    
    // Mounting hardware
    lineItems.push({
      id: 'li-hardware',
      category: 'Materials',
      description: `${additionalMaterials.hardware.name} - Screws, anchors, brackets`,
      quantity: totalDeviceCount,
      unitPrice: additionalMaterials.hardware.unitPrice,
      total: totalDeviceCount * additionalMaterials.hardware.unitPrice
    });
  }
  
  // Add labor line items by system
  const systems: SystemType[] = ['fire', 'cctv', 'access'];
  for (const system of systems) {
    const systemDevices = devices.filter(d => d.system === system);
    if (systemDevices.length > 0) {
      const laborHours = calculateLaborHours(devices, system);
      const systemPricing = getSystemPricing(system);
      
      if (laborHours > 0) {
        lineItems.push({
          id: `li-labor-${system}`,
          category: 'Labor',
          description: `${getSystemName(system)} Installation Labor - ${laborHours.toFixed(1)} hours @ $${systemPricing.laborRate}/hr`,
          quantity: laborHours,
          unitPrice: systemPricing.laborRate,
          total: laborHours * systemPricing.laborRate
        });
      }
    }
  }
  
  // Add engineering and project management
  if (totalDeviceCount > 0) {
    const engHours = totalDeviceCount * projectRates.engineering.hoursPerDevice;
    lineItems.push({
      id: 'li-engineering',
      category: 'Engineering',
      description: `System Design & Engineering - ${engHours.toFixed(1)} hours @ $${projectRates.engineering.rate}/hr`,
      quantity: engHours,
      unitPrice: projectRates.engineering.rate,
      total: engHours * projectRates.engineering.rate
    });
    
    const pmHours = totalDeviceCount * projectRates.projectManagement.hoursPerDevice;
    lineItems.push({
      id: 'li-pm',
      category: 'Engineering',
      description: `Project Management - ${pmHours.toFixed(1)} hours @ $${projectRates.projectManagement.rate}/hr`,
      quantity: pmHours,
      unitPrice: projectRates.projectManagement.rate,
      total: pmHours * projectRates.projectManagement.rate
    });
    
    const testHours = totalDeviceCount * projectRates.testing.hoursPerDevice;
    lineItems.push({
      id: 'li-testing',
      category: 'Engineering',
      description: `Testing & Commissioning - ${testHours.toFixed(1)} hours @ $${projectRates.testing.rate}/hr`,
      quantity: testHours,
      unitPrice: projectRates.testing.rate,
      total: testHours * projectRates.testing.rate
    });
  }
  
  return lineItems;
}

// Generate complete estimate from project
export function generateEstimate(
  project: Project,
  blueprints: Blueprint[]
): Estimate {
  // Collect all devices from all blueprints
  const allDevices = blueprints.flatMap(bp => bp.devices);
  
  // Generate line items
  const lineItems = generateLineItems(allDevices);
  
  // Calculate totals
  const materialCost = calculateMaterialCost(lineItems);
  const laborCost = lineItems
    .filter(item => item.category === 'Labor')
    .reduce((sum, item) => sum + item.total, 0);
  
  // Get average overhead and profit margins from systems used
  const systemsUsed = new Set(allDevices.map(d => d.system));
  let totalOverhead = 0;
  let totalProfit = 0;
  let systemCount = 0;
  
  for (const system of systemsUsed) {
    const pricing = getSystemPricing(system);
    totalOverhead += pricing.overheadPercent;
    totalProfit += pricing.profitMargin;
    systemCount++;
  }
  
  const avgOverhead = systemCount > 0 ? totalOverhead / systemCount : 15;
  const avgProfit = systemCount > 0 ? totalProfit / systemCount : 20;
  
  // Calculate final totals with markup
  const costBreakdown = calculateTotalCost(materialCost, laborCost, avgOverhead, avgProfit);
  
  // Calculate total labor hours
  const totalLaborHours = allDevices.reduce((sum, device) => {
    const pricing = getDevicePricing(device.type, device.system);
    return sum + (pricing?.laborHours || 0);
  }, 0);
  
  // Add overhead and profit as line items
  const finalLineItems: EstimateLineItem[] = [
    ...lineItems,
    {
      id: 'li-overhead',
      category: 'Overhead',
      description: `Project Overhead (${avgOverhead.toFixed(0)}%)`,
      quantity: 1,
      unitPrice: costBreakdown.overhead,
      total: costBreakdown.overhead
    },
    {
      id: 'li-profit',
      category: 'Profit',
      description: `Profit Margin (${avgProfit.toFixed(0)}%)`,
      quantity: 1,
      unitPrice: costBreakdown.profit,
      total: costBreakdown.profit
    }
  ];
  
  return {
    id: `est-${Date.now()}`,
    projectId: project.id,
    projectName: project.name,
    client: project.client,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    total: costBreakdown.total,
    laborHours: totalLaborHours,
    lineItems: finalLineItems
  };
}

// Helper functions
function getCategoryName(system: SystemType): string {
  const names: Record<SystemType, string> = {
    fire: 'Fire Alarm',
    cctv: 'CCTV',
    access: 'Access Control'
  };
  return names[system] || system;
}

function getSystemName(system: SystemType): string {
  return getCategoryName(system);
}

// Recalculate estimate totals when line items change
export function recalculateEstimate(estimate: Estimate): Estimate {
  const newTotal = estimate.lineItems.reduce((sum, item) => sum + item.total, 0);
  
  return {
    ...estimate,
    total: newTotal,
    updatedAt: new Date()
  };
}

// Update line item quantity and recalculate
export function updateLineItemQuantity(
  estimate: Estimate,
  lineItemId: string,
  newQuantity: number
): Estimate {
  const updatedLineItems = estimate.lineItems.map(item => {
    if (item.id === lineItemId) {
      return {
        ...item,
        quantity: newQuantity,
        total: newQuantity * item.unitPrice
      };
    }
    return item;
  });
  
  return recalculateEstimate({
    ...estimate,
    lineItems: updatedLineItems
  });
}

// Update line item unit price and recalculate
export function updateLineItemPrice(
  estimate: Estimate,
  lineItemId: string,
  newUnitPrice: number
): Estimate {
  const updatedLineItems = estimate.lineItems.map(item => {
    if (item.id === lineItemId) {
      return {
        ...item,
        unitPrice: newUnitPrice,
        total: item.quantity * newUnitPrice
      };
    }
    return item;
  });
  
  return recalculateEstimate({
    ...estimate,
    lineItems: updatedLineItems
  });
}
