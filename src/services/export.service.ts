import { Axios } from '@/base-axios';
import { toast } from '@/utils/toast';

export interface ExportPdfParams {
  resource: string;
  filters?: Record<string, any>;
  search?: string;
  sort?: { field: string; direction: 'asc' | 'desc' };
  mode?: 'all' | 'current';
  page?: number;
  pageSize?: number;
  filename?: string;
}

export interface ExportPdfResponse {
  isAsync: boolean;
  jobId?: string;
  exportId?: string;
  totalRecords?: number;
  message?: string;
}

/**
 * Trigger browser file download from Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Centralized API client for PDF Exports
 */
export async function exportToPdf(params: ExportPdfParams): Promise<ExportPdfResponse | null> {
  try {
    const response = await Axios.post('/exports/pdf', params, {
      responseType: 'blob',
    });

    const contentType = String(response.headers['content-type'] || '');

    // Check if server returned a JSON response for async job
    if (contentType.includes('application/json')) {
      const text = await (response.data as Blob).text();
      const json = JSON.parse(text);
      return json as ExportPdfResponse;
    }

    // Direct binary PDF stream
    const contentDisposition = String(response.headers['content-disposition'] || '');
    let filename = params.filename;

    if (!filename && contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    if (!filename) {
      const dateStr = new Date().toISOString().split('T')[0];
      filename = `${params.resource.toLowerCase()}-${dateStr}.pdf`;
    }

    triggerBlobDownload(response.data as Blob, filename);
    return { isAsync: false };
  } catch (err: any) {
    let errorMsg = 'Failed to generate PDF export. Please try again.';
    if (err?.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        if (json.message) errorMsg = json.message;
      } catch {
        // Fallback
      }
    } else if (err?.response?.data?.message) {
      errorMsg = err.response.data.message;
    }
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Download completed export by exportId
 */
export async function downloadExportFile(exportId: string, filename?: string) {
  try {
    const response = await Axios.get(`/exports/pdf/download/${exportId}`, {
      responseType: 'blob',
    });

    const safeFilename = filename || `export-${exportId.slice(0, 8)}.pdf`;
    triggerBlobDownload(response.data as Blob, safeFilename);
    toast.success('PDF document downloaded successfully.');
  } catch (err: any) {
    toast.error('Failed to download the generated PDF file.');
    throw err;
  }
}
