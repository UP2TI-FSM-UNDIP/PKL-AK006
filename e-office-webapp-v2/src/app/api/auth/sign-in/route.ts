import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Auth proxy - Request body:', body);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20022';
    const response = await fetch(`${backendUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    console.log('Auth proxy - Response status:', response.status);
    const data = await response.json();
    console.log('Auth proxy - Response data:', data);

    // Forward the set-cookie header if it exists
    const setCookies = response.headers.getSetCookie();
    const setAuthToken = response.headers.get('set-auth-token');

    const result = NextResponse.json(data, { status: response.status });

    if (setCookies && setCookies.length > 0) {
      setCookies.forEach(cookie => {
        result.headers.append('set-cookie', cookie);
      });
    }
    if (setAuthToken) {
      result.headers.set('set-auth-token', setAuthToken);
    }

    return result;
  } catch (error) {
    console.error('Auth proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Authentication failed',
        message: errorMessage,
        details: String(error)
      },
      { status: 500 }
    );
  }
}

