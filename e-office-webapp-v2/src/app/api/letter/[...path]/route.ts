import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20022';

type Params = {
  path: string[];
};

// Helper to get auth headers from request (Bearer token + cookies fallback)
async function getAuthHeaders(request: NextRequest): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward Authorization header (Bearer token) if present
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Also forward cookies as fallback
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { path } = await params;
    const endpoint = `/letter/${path.join('/')}`;
    const queryString = request.nextUrl.search;

    console.log('[Letter API Proxy GET]', endpoint + queryString);

    const headers = await getAuthHeaders(request);

    const backendResponse = await fetch(`${BACKEND_URL}${endpoint}${queryString}`, {
      method: 'GET',
      headers,
    });

    const responseBody = await backendResponse.text();
    console.log('[Letter API Proxy GET] Response status:', backendResponse.status, responseBody.substring(0, 100));

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Letter API Proxy GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'API request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { path } = await params;
    const endpoint = `/letter/${path.join('/')}`;

    console.log('[Letter API Proxy POST]', endpoint);

    const headers = await getAuthHeaders(request);

    let body: string | undefined;
    try {
      const jsonBody = await request.json();
      body = JSON.stringify(jsonBody);
      console.log('[Letter API Proxy POST] Body:', body.substring(0, 200));
    } catch {
      // No body or not JSON
    }

    const backendResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });

    const responseBody = await backendResponse.text();
    console.log('[Letter API Proxy POST] Response status:', backendResponse.status);

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Letter API Proxy POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'API request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { path } = await params;
    const endpoint = `/letter/${path.join('/')}`;

    console.log('[Letter API Proxy PUT]', endpoint);

    const headers = await getAuthHeaders(request);

    let body: string | undefined;
    try {
      const jsonBody = await request.json();
      body = JSON.stringify(jsonBody);
    } catch {
      // No body or not JSON
    }

    const backendResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body,
    });

    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Letter API Proxy PUT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'API request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { path } = await params;
    const endpoint = `/letter/${path.join('/')}`;

    console.log('[Letter API Proxy DELETE]', endpoint);

    const headers = await getAuthHeaders(request);

    const backendResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Letter API Proxy DELETE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'API request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
