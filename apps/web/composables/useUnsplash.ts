interface UnsplashPhoto {
  id: string
  urls: { raw: string; full: string; regular: string; small: string; thumb: string }
  blur_hash: string | null
  alt_description: string | null
  description: string | null
  user: { name: string; username: string; links: { html: string } }
  links: { html: string; download_location: string }
}

interface SearchOptions {
  query: string
  page?: number
  perPage?: number
  orientation?: 'landscape' | 'portrait' | 'squarish'
}

interface RandomPhotoOptions {
  query?: string
  orientation?: 'landscape' | 'portrait' | 'squarish'
  count?: number
}

export const useUnsplash = () => {
  const config = useRuntimeConfig()
  const accessKey = config.public.unsplashAccessKey
  const baseUrl = 'https://api.unsplash.com'
  const headers = { 'Authorization': `Client-ID ${accessKey}`, 'Accept-Version': 'v1' }

  const searchPhotos = async (options: SearchOptions): Promise<UnsplashPhoto[]> => {
    if (!accessKey) return []

    const params = new URLSearchParams({
      query: options.query,
      page: String(options.page || 1),
      per_page: String(options.perPage || 10),
      ...(options.orientation && { orientation: options.orientation }),
    })

    try {
      const response = await $fetch<{ results: UnsplashPhoto[] }>(`${baseUrl}/search/photos?${params}`, { headers })
      return response.results
    } catch { return [] }
  }

  const getRandomPhoto = async (options: RandomPhotoOptions = {}): Promise<UnsplashPhoto | UnsplashPhoto[] | null> => {
    if (!accessKey) return null

    const params = new URLSearchParams({
      ...(options.query && { query: options.query }),
      ...(options.orientation && { orientation: options.orientation }),
      ...(options.count && { count: String(options.count) }),
    })

    try {
      return await $fetch<UnsplashPhoto | UnsplashPhoto[]>(`${baseUrl}/photos/random?${params}`, { headers })
    } catch { return null }
  }

  // required by unsplash api guidelines
  const trackDownload = async (downloadLocation: string): Promise<void> => {
    if (!accessKey || !downloadLocation) return
    try { await $fetch(downloadLocation, { headers }) } catch {}
  }

  const buildImageUrl = (rawUrl: string, options: { width?: number; height?: number; quality?: number } = {}): string => {
    const url = new URL(rawUrl)
    if (options.width) url.searchParams.set('w', String(options.width))
    if (options.height) url.searchParams.set('h', String(options.height))
    if (options.quality) url.searchParams.set('q', String(options.quality))
    url.searchParams.set('auto', 'format')
    return url.toString()
  }

  return { searchPhotos, getRandomPhoto, trackDownload, buildImageUrl }
}

export type { UnsplashPhoto, SearchOptions, RandomPhotoOptions }
