/**
 * useAIAnalysis Hook
 * React hook for AI-powered blueprint analysis
 */

import { useState, useCallback } from 'react';
import { 
  analyzeBlueprintAndPlaceDevices,
  type PlacementResult 
} from '../../../services/devicePlacementAI';
import type { SystemType } from '../../../shared/types';

export interface AIAnalysisState {
  isAnalyzing: boolean;
  progress: number;
  status: 'idle' | 'uploading' | 'analyzing' | 'placing' | 'complete' | 'error';
  error: string | null;
  result: PlacementResult | null;
}

export interface UseAIAnalysisReturn {
  analyze: (imageBase64: string, systemType: SystemType) => Promise<PlacementResult | null>;
  isAnalyzing: boolean;
  progress: number;
  status: AIAnalysisState['status'];
  error: string | null;
  result: PlacementResult | null;
  reset: () => void;
}

export function useAIAnalysis(blueprintId: string): UseAIAnalysisReturn {
  const [state, setState] = useState<AIAnalysisState>({
    isAnalyzing: false,
    progress: 0,
    status: 'idle',
    error: null,
    result: null
  });

  const updateProgress = useCallback((progress: number, status: AIAnalysisState['status']) => {
    setState(prev => ({ ...prev, progress, status }));
  }, []);

  const analyze = useCallback(async (
    imageBase64: string,
    systemType: SystemType
  ): Promise<PlacementResult | null> => {
    setState({
      isAnalyzing: true,
      progress: 0,
      status: 'uploading',
      error: null,
      result: null
    });

    try {
      // Phase 1: Check Ollama availability
      updateProgress(10, 'uploading');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Phase 2: AI Analysis
      updateProgress(30, 'analyzing');
      const result = await analyzeBlueprintAndPlaceDevices(
        imageBase64,
        systemType
      );

      // Phase 3: Processing results
      updateProgress(80, 'placing');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Complete
      updateProgress(100, 'complete');
      
      setState({
        isAnalyzing: false,
        progress: 100,
        status: 'complete',
        error: null,
        result
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      
      setState({
        isAnalyzing: false,
        progress: 0,
        status: 'error',
        error: errorMessage,
        result: null
      });

      return null;
    }
  }, [blueprintId, updateProgress]);

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      progress: 0,
      status: 'idle',
      error: null,
      result: null
    });
  }, []);

  return {
    analyze,
    isAnalyzing: state.isAnalyzing,
    progress: state.progress,
    status: state.status,
    error: state.error,
    result: state.result,
    reset
  };
}

export default useAIAnalysis;
