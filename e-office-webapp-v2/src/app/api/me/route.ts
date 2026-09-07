import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20022';

    // Build headers for backend request
    const headers: Record<string, string> = {};

    // Forward Authorization header (Bearer token) if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('[Me API] Using Bearer token auth');
    }

    // Also forward cookies as fallback
    const cookieHeader = request.headers.get('cookie') || '';
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    console.log('[Me API] Fetching from:', `${backendUrl}/me`);
    const response = await fetch(`${backendUrl}/me`, {
      method: 'GET',
      headers,
    });

    console.log('[Me API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Me API] Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: response.status }
      );
    }

    const userData = await response.json();
    console.log('[Me API] User data received successfully');

    return NextResponse.json(userData);
  } catch (error) {
    console.error('[Me API] Exception:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
