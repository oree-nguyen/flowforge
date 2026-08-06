/**
 * FlowForge In-Browser Asset Cache Manager
 * Uses Cache API (caches.open) + Fetch + Blob URL mapping.
 * Strictly loads assets into browser memory/storage — NO file downloads triggered.
 */

const CACHE_NAME = 'flowforge-assets-v1';

// In-memory ObjectURL map for fast synchronous retrieval
const objectUrlMap = new Map<string, string>();

/**
 * Preload a list of asset URLs into Cache API.
 * Includes a safety timeout to prevent hanging infinitely on network error.
 */
export async function preloadAssets(
  urls: string[],
  onProgress?: (loadedCount: number, totalCount: number) => void
): Promise<void> {
  if (!urls || urls.length === 0) return;

  const total = urls.length;
  let loaded = 0;

  // 15-second safety fallback timeout
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.warn('[AssetCache] Preload safety timeout reached (15s). Proceeding...');
      resolve();
    }, 15000);
  });

  const preloadPromise = (async () => {
    try {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        urls.map(async (url) => {
          try {
            // Check if asset already exists in Cache API
            let response = await cache.match(url);

            if (!response) {
              // Fetch from network and store in Cache API
              response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response.clone());
              }
            }

            if (response && response.ok) {
              // Create Blob URL for instant memory access
              const blob = await response.blob();
              if (blob.size > 0) {
                const blobUrl = URL.createObjectURL(blob);
                objectUrlMap.set(url, blobUrl);
              }
            }
          } catch (err) {
            console.warn(`[AssetCache] Failed to cache asset: ${url}`, err);
          } finally {
            loaded++;
            if (onProgress) onProgress(loaded, total);
          }
        })
      );
    } catch (e) {
      console.error('[AssetCache] Cache API initialization error:', e);
    }
  })();

  // Race between preload and safety timeout
  await Promise.race([preloadPromise, timeoutPromise]);
}

/**
 * Retrieve a cached Blob URL for an asset, or fallback to the original URL if not cached.
 */
export function getCachedUrl(originalUrl: string): string {
  return objectUrlMap.get(originalUrl) || originalUrl;
}

/**
 * Async helper to get cached Blob URL directly from Cache API if not in memory.
 */
export async function getCachedBlobUrlAsync(originalUrl: string): Promise<string> {
  if (objectUrlMap.has(originalUrl)) {
    return objectUrlMap.get(originalUrl)!;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(originalUrl);
    if (response && response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      objectUrlMap.set(originalUrl, blobUrl);
      return blobUrl;
    }
  } catch (e) {
    console.warn('[AssetCache] Cache lookup error for:', originalUrl, e);
  }

  return originalUrl;
}
