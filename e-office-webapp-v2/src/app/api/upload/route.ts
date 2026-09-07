import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20022';

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload API Proxy POST] Starting upload proxy');

    // 1. Get auth headers
    const headers: Record<string, string> = {};
    const authHeader = request.headers.get('authorization');
    if (authHeader) headers['Authorization'] = authHeader;
    
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    // 2. Get form data from the request
    const formData = await request.formData();
    
    console.log('[Upload API Proxy POST] Forwarding to:', `${BACKEND_URL}/upload`);

    // 3. Forward to backend
    // Note: We don't set Content-Type header manually, 
    // fetch will set it correctly for FormData with the boundary
    const backendResponse = await fetch(`${BACKEND_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const status = backendResponse.status;
    const contentType = backendResponse.headers.get('content-type');
    
    console.log('[Upload API Proxy POST] Backend status:', status);

    if (contentType && contentType.includes('application/json')) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status });
    } else {
      const text = await backendResponse.text();
      console.error('[Upload API Proxy POST] Non-JSON response from backend:', text);
      return new NextResponse(text, { 
        status,
        headers: { 'Content-Type': contentType || 'text/plain' }
      });
    }
  } catch (error) {
    console.error('[Upload API Proxy POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during upload proxy',
      },
      { status: 500 }
    );
  }
}
