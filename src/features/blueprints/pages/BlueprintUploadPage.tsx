/**
 * Blueprint Upload Page
 * Fresh implementation with drag-drop and PDF support
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, File, X, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useStore } from '../../../shared/lib/store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyzeBlueprintAndPlaceDevices, placementsToDevices } from '../../../services/devicePlacementAI';
import { pdfToImage } from '../../../services/pdfProcessor';
import type { PlacementDevice } from '../../../services/devicePlacementAI';

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'pdf' | 'image';
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
} as const;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function BlueprintUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const { projects, blueprints, addDevice } = useStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdFromUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSystemType, setSelectedSystemType] = useState<SystemType>('fire');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
      return { valid: false, error: 'Only PDF, JPEG, PNG, and WebP files are supported' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }
    return { valid: true };
  };

  const processFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const processed: UploadFile[] = Array.from(newFiles).map(file => {
      const validation = validateFile(file);
      
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES] || 'pdf',
        status: validation.valid ? 'pending' : 'error',
        progress: 0,
        error: validation.error,
      };
    });

    setFiles(prev => [...prev, ...processed]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = ''; // Reset input
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const simulateUpload = async (file: UploadFile): Promise<void> => {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, progress: i, status: i === 100 ? 'processing' : 'uploading' }
          : f
      ));
    }
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFiles(prev => prev.map(f => 
      f.id === file.id 
        ? { ...f, status: 'complete', progress: 100 }
        : f
    ));
  };

  const handleUpload = async () => {
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }

    const validFiles = files.filter(f => f.status === 'pending');
    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    // Upload files sequentially
    for (const file of validFiles) {
      await simulateUpload(file);
    }

    setIsUploading(false);
    
    // Navigate after all uploads complete
    setTimeout(() => {
      navigate('/blueprints');
    }, 1000);
  };

  const canUpload = files.some(f => f.status === 'pending') && selectedProjectId && !isUploading;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Blueprints</h1>
          <p className="mt-2 text-gray-600">
            Upload architectural drawings for AI analysis and device placement
          </p>
        </div>

        {/* Project Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              No projects found. Create a project first.
            </p>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className={`
            w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4
            ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          
          <p className="text-lg font-medium text-gray-900 mb-1">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse from your computer
          </p>
          <p className="text-xs text-gray-400">
            Supports PDF, JPEG, PNG, WebP (max 50MB)
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-900">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {files.map(file => (
                <div key={file.id} className="px-6 py-4 flex items-center gap-4">
                  {/* File Icon */}
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${file.type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'}
                  `}>
                    {file.type === 'pdf' ? (
                      <FileText className="w-5 h-5 text-red-600" />
                    ) : (
                      <File className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    
                    {/* Progress Bar */}
                    {file.status === 'uploading' || file.status === 'processing' ? (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              file.status === 'processing' 
                                ? 'bg-amber-500 animate-pulse' 
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {file.status === 'processing' ? 'AI analyzing...' : `Uploading ${file.progress}%`}
                        </p>
                      </div>
                    ) : file.status === 'complete' ? (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Analysis complete
                      </p>
                    ) : file.status === 'error' ? (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {file.error}
                      </p>
                    ) : null}
                  </div>

                  {/* Status / Remove */}
                  <div className="flex items-center gap-2">
                    {file.status === 'complete' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : file.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        disabled={isUploading}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {files.length > 0 && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Add More Files
            </button>
            <button
              onClick={handleUpload}
              disabled={!canUpload}
              className={`
                flex-1 px-6 py-3 rounded-lg font-medium text-white
                transition-all duration-200 flex items-center justify-center gap-2
                ${canUpload 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30' 
                  : 'bg-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Start Upload & Analysis</>
              )}
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">PDF Support</h4>
            <p className="text-sm text-gray-500 mt-1">
              Upload multi-page PDFs with automatic page detection
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <Loader2 className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">AI Analysis</h4>
            <p className="text-sm text-gray-500 mt-1">
              Automatic room detection and wall identification
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">Smart Placement</h4>
            <p className="text-sm text-gray-500 mt-1">
              NFPA-compliant device placement suggestions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
