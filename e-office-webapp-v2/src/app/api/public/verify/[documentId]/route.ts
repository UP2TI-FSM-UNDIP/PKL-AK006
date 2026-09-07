import { NextRequest, NextResponse } from 'next/server';

/**
 * Public API route for document verification
 * This endpoint does NOT require authentication
 * 
 * @param request - The incoming request
 * @param params - Route parameters containing documentId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'ID dokumen tidak valid' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20022';
    const endpoint = `${backendUrl}/public/verify/${documentId}`;
    
    console.log('[Verify API] Fetching from:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[Verify API] Backend status:', response.status);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      console.error('[Verify API] Non-JSON response from backend:', text);
      return NextResponse.json(
        {
          success: false,
          message: `Dokumen tidak ditemukan atau server mengalami gangguan (Status: ${response.status})`
        },
        { status: response.status === 200 ? 404 : response.status }
      );
    }
  } catch (error) {
    console.error('[Verify API] Exception:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat memverifikasi dokumen. Silakan coba lagi.'
      },
      { status: 500 }
    );
  }
}
