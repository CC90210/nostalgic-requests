const ITUNES_API_BASE = 'https://itunes.apple.com';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  artworkUrlLarge: string;
  duration: number; // in seconds
  previewUrl: string;
  itunesUrl: string;
  genre: string;
}

export async function searchTracks(query: string, limit: number = 20): Promise<Track[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    term: query,
    entity: 'song',
    limit: limit.toString(),
    country: 'CA', // Canada
  });

  try {
    const response = await fetch(`${ITUNES_API_BASE}/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }

    const data = await response.json();

    return data.results.map((track: any) => ({
      id: track.trackId.toString(),
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName || 'Unknown Album',
      artworkUrl: track.artworkUrl100,
      artworkUrlLarge: track.artworkUrl100.replace('100x100', '500x500'),
      duration: Math.floor(track.trackTimeMillis / 1000),
      previewUrl: track.previewUrl || '',
      itunesUrl: track.trackViewUrl,
      genre: track.primaryGenreName || 'Unknown',
    }));
  } catch (error) {
    console.error('iTunes search error:', error);
    return [];
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
