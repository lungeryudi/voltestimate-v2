import { create } from 'zustand';
import type { Project, Blueprint, Device, Estimate, Conflict, Room, SystemType } from '../types';

interface AppState {
  // Projects
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  
  // Blueprints
  blueprints: Blueprint[];
  selectedBlueprint: Blueprint | null;
  setSelectedBlueprint: (blueprint: Blueprint | null) => void;
  updateDevice: (blueprintId: string, deviceId: string, updates: Partial<Device>) => void;
  addDevice: (blueprintId: string, device: Device) => void;
  removeDevice: (blueprintId: string, deviceId: string) => void;
  
  // View State
  zoom: number;
  pan: { x: number; y: number };
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;
  
  // Layer Toggles
  visibleLayers: Record<SystemType, boolean>;
  toggleLayer: (system: SystemType) => void;
  
  // Conflicts
  conflicts: Conflict[];
  setConflicts: (conflicts: Conflict[]) => void;
  autoFixConflict: (conflictId: string) => void;
  
  // Estimates
  estimates: Estimate[];
  selectedEstimate: Estimate | null;
  setSelectedEstimate: (estimate: Estimate | null) => void;
  updateEstimate: (id: string, updates: Partial<Estimate>) => void;
  
  // UI State
  showConflictPanel: boolean;
  setShowConflictPanel: (show: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Projects
  projects: [],
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
    blueprints: state.blueprints.filter(b => b.projectId !== id),
    estimates: state.estimates.filter(e => e.projectId !== id)
  })),
  duplicateProject: (id) => {
    const state = get();
    const project = state.projects.find(p => p.id === id);
    if (!project) return;
    
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      name: `${project.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      conflictCount: 0,
      blueprints: []
    };
    
    // Duplicate blueprints
    const projectBlueprints = state.blueprints.filter(b => b.projectId === id);
    const newBlueprints = projectBlueprints.map(bp => ({
      ...bp,
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: newProject.id,
      devices: bp.devices.map(d => ({
        ...d,
        id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conflicts: []
      }))
    }));
    
    set((state) => ({
      projects: [...state.projects, newProject],
      blueprints: [...state.blueprints, ...newBlueprints]
    }));
  },
  
  // Blueprints
  blueprints: [],
  selectedBlueprint: null,
  setSelectedBlueprint: (blueprint) => set({ selectedBlueprint: blueprint }),
  updateDevice: (blueprintId, deviceId, updates) => set((state) => ({
    blueprints: state.blueprints.map(bp => {
      if (bp.id !== blueprintId) return bp;
      return {
        ...bp,
        devices: bp.devices.map(d => d.id === deviceId ? { ...d, ...updates } : d)
      };
    })
  })),
  addDevice: (blueprintId, device) => set((state) => ({
    blueprints: state.blueprints.map(bp => {
      if (bp.id !== blueprintId) return bp;
      return { ...bp, devices: [...bp.devices, device] };
    })
  })),
  removeDevice: (blueprintId, deviceId) => set((state) => ({
    blueprints: state.blueprints.map(bp => {
      if (bp.id !== blueprintId) return bp;
      return { ...bp, devices: bp.devices.filter(d => d.id !== deviceId) };
    })
  })),
  
  // View State
  zoom: 1,
  pan: { x: 0, y: 0 },
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  setPan: (pan) => set({ pan }),
  resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
  
  // Layer Toggles
  visibleLayers: { fire: true, cctv: true, access: true },
  toggleLayer: (system) => set((state) => ({
    visibleLayers: { ...state.visibleLayers, [system]: !state.visibleLayers[system] }
  })),
  
  // Conflicts
  conflicts: [],
  setConflicts: (conflicts) => set({ conflicts }),
  autoFixConflict: (conflictId) => {
    const state = get();
    const conflict = state.conflicts.find(c => c.id === conflictId);
    if (!conflict || !conflict.autoFix) return;
    
    const newPosition = conflict.autoFix();
    if (state.selectedBlueprint) {
      get().updateDevice(state.selectedBlueprint.id, conflict.deviceId, newPosition);
    }
  },
  
  // Estimates
  estimates: [],
  selectedEstimate: null,
  setSelectedEstimate: (estimate) => set({ selectedEstimate: estimate }),
  updateEstimate: (id, updates) => set((state) => ({
    estimates: state.estimates.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e)
  })),
  
  // UI State
  showConflictPanel: true,
  setShowConflictPanel: (show) => set({ showConflictPanel: show })
}));
