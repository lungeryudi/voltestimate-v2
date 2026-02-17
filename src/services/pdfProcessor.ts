/**
 * PDF Processor
 * Converts PDF files to images for AI analysis
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFPage {
  pageNumber: number;
  imageData: string; // base64 PNG
  width: number;
  height: number;
}

/**
 * Convert a PDF file to an array of page images
 */
export async function pdfToImages(pdfFile: File): Promise<PDFPage[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: PDFPage[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to create canvas context');
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // White background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({
      canvasContext: context,
      viewport
    }).promise;
    
    const imageData = canvas.toDataURL('image/png');
    
    pages.push({
      pageNumber: i,
      imageData,
      width: viewport.width,
      height: viewport.height
    });
    
    // Cleanup
    page.cleanup();
  }
  
  return pages;
}

/**
 * Convert a PDF file to a single image (first page only)
 * Returns base64 string without data URL prefix
 */
export async function pdfToImage(pdfFile: File): Promise<string> {
  const pages = await pdfToImages(pdfFile);
  
  if (pages.length === 0) {
    throw new Error('PDF has no pages');
  }
  
  // Return first page, strip data URL prefix
  return pages[0].imageData.replace(/^data:image\/\w+;base64,/, '');
}

/**
 * Convert image file to base64
 */
export async function imageToBase64(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).replace(/^data:image\/\w+;base64,/, '');
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Convert any file (PDF or image) to base64 image
 */
export async function fileToImageBase64(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return pdfToImage(file);
  } else if (file.type.startsWith('image/')) {
    return imageToBase64(file);
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
}

/**
 * Resize image if it's too large for AI processing
 */
export function resizeImageIfNeeded(
  base64Image: string,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      
      // Check if resizing is needed
      if (width <= maxWidth && height <= maxHeight) {
        resolve(base64Image);
        return;
      }
      
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, ''));
    };
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64Image}`;
  });
}
