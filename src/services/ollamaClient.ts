/**
 * Ollama Client
 * Simple client for localhost:11434 Ollama API
 */

const OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen2.5-coder:7b';

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaClient {
  private host: string;

  constructor(host: string = OLLAMA_HOST) {
    this.host = host;
  }

  /**
   * Generate text using Ollama
   */
  async generate(
    prompt: string,
    model: string = DEFAULT_MODEL,
    options?: OllamaGenerateRequest['options']
  ): Promise<string> {
    const response = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          ...options
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data: OllamaGenerateResponse = await response.json();
    return data.response;
  }

  /**
   * Generate with multimodal (image + text)
   * Ollama supports vision models for image analysis
   */
  async generateWithImage(
    prompt: string,
    imageBase64: string,
    model: string = 'llava:7b',
    options?: OllamaGenerateRequest['options']
  ): Promise<string> {
    const response = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        images: [imageBase64],
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          ...options
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data: OllamaGenerateResponse = await response.json();
    return data.response;
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.host}/api/tags`);
    
    if (!response.ok) {
      throw new Error('Failed to list models');
    }

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  }
}

// Singleton instance
export const ollamaClient = new OllamaClient();

export default OllamaClient;
