import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20022';

type Params = {
  slug: string[];
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const endpoint = `/api/auth/${slug.join('/')}`;

    // Read the request body
    const body = await request.json();
    console.log('[Auth Proxy POST]', endpoint, 'Body:', JSON.stringify(body));

    // Forward to backend
    const backendResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.headers.get('origin') || 'http://localhost:3000',
      },
      body: JSON.stringify(body),
    });

    console.log('[Auth Proxy POST] Response status:', backendResponse.status);

    // Read the response body
    const responseBody = await backendResponse.text();
    console.log('[Auth Proxy POST] Response body:', responseBody.substring(0, 500));

    // Parse and strip redirect fields from the response to prevent
    // Better Auth's client redirect plugin from doing a full page reload.
    // The client handles redirect logic itself based on user roles.
    let finalBody = responseBody;
    try {
      const parsed = JSON.parse(responseBody);
      if (parsed.redirect !== undefined) {
        delete parsed.redirect;
        delete parsed.url;
        finalBody = JSON.stringify(parsed);
      }
    } catch {
      // Not JSON, leave as-is
    }

    // Create a new response with the body
    const response = new NextResponse(finalBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Forward ALL Set-Cookie headers (there can be multiple)
    const setCookies = backendResponse.headers.getSetCookie();
    console.log('[Auth Proxy POST] Set-Cookie headers count:', setCookies.length);
    for (const cookie of setCookies) {
      response.headers.append('set-cookie', cookie);
    }

    const setAuthToken = backendResponse.headers.get('set-auth-token');
    if (setAuthToken) {
      response.headers.set('set-auth-token', setAuthToken);
    }

    return response;
  } catch (error) {
    console.error('[Auth Proxy POST] Error:', error);
    return NextResponse.json(
      {
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const endpoint = `/api/auth/${slug.join('/')}`;
    const queryString = request.nextUrl.search;

    console.log('[Auth Proxy GET]', endpoint + queryString);

    const backendResponse = await fetch(`${BACKEND_URL}${endpoint}${queryString}`, {
      method: 'GET',
    });

    console.log('[Auth Proxy GET] Response status:', backendResponse.status);

    // Read response body
    const responseBody = await backendResponse.text();
    console.log('[Auth Proxy GET] Response body:', responseBody.substring(0, 500));

    // Create new response
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const setCookie = backendResponse.headers.get('set-cookie');
    const setAuthToken = backendResponse.headers.get('set-auth-token');

    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }
    if (setAuthToken) {
      response.headers.set('set-auth-token', setAuthToken);
    }

    return response;
  } catch (error) {
    console.error('[Auth Proxy GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
