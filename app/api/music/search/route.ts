import { NextRequest, NextResponse } from 'next/server';
import { searchTracks } from '@/lib/itunes';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  const validation = searchSchema.safeParse(searchParams);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid search parameters' }, { status: 400 });
  }

  const { q: query, limit } = validation.data;

  try {
    const tracks = await searchTracks(query, limit);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
