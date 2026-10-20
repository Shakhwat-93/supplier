/**
 * Image storage & resolution service
 * Abstraction layer for Cloudflare R2
 */

export interface IImageStorageService {
  resolveUrl(keyOrUrl: string): string;
  uploadImage(file: File, side: 'front' | 'back'): Promise<{ url: string; storageKey: string }>;
}

class R2ImageStorageService implements IImageStorageService {
  resolveUrl(keyOrUrl: string): string {
    if (!keyOrUrl) return '';
    // If it's already a full signed URL, data URL, or blob URL, return as-is
    if (
      keyOrUrl.startsWith('data:') ||
      keyOrUrl.startsWith('http://') ||
      keyOrUrl.startsWith('https://') ||
      keyOrUrl.startsWith('blob:')
    ) {
      return keyOrUrl;
    }
    return keyOrUrl;
  }

  async uploadImage(file: File, side: 'front' | 'back'): Promise<{ url: string; storageKey: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;

          // Attempt secure upload via R2 backend endpoint
          const response = await fetch('/api/r2/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              base64Data,
              side,
            }),
          });

          if (!response.ok) {
            throw new Error(`Upload endpoint failed with status ${response.status}`);
          }

          const data = await response.json();
          if (data.url && data.storageKey) {
            resolve({
              url: data.url,
              storageKey: data.storageKey,
            });
            return;
          }

          throw new Error('Invalid response from upload server');
        } catch (err) {
          console.warn('R2 upload failed, falling back to local base64:', err);
          // Graceful fallback to local base64 so user flow is never interrupted
          const base64 = e.target?.result as string;
          resolve({
            url: base64,
            storageKey: `local/cards/${Date.now()}-${side}-${file.name}`,
          });
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}

export const imageStorage = new R2ImageStorageService();
