import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import * as https from 'https';

/**
 * Generate HTTP response with standard headers
 */
function response(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL ?? "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

/**
 * Exchange Cognito authorization code for JWT tokens
 * POST /auth/exchange
 * Body: { code: string, redirectUri: string }
 * Returns: { idToken: string, accessToken: string }
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // Only allow POST
  if (event.requestContext.http.method !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { code, redirectUri } = body;

    if (!code) {
      return response(400, { error: 'Authorization code is required' });
    }

    if (!redirectUri) {
      return response(400, { error: 'Redirect URI is required' });
    }

    // Get Cognito configuration from environment
    const cognitoDomain = process.env.COGNITO_DOMAIN || 'ecommerce-nishchal.auth.ap-south-1.amazoncognito.com';
    const clientId = process.env.COGNITO_CLIENT_ID || '1i6c99jh9lqm56v8gv1rka5eeu';
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;
    const tokenEndpoint = `https://${cognitoDomain}/oauth2/token`;

    if (!clientSecret) {
      console.error('COGNITO_CLIENT_SECRET not configured');
      return response(500, { error: 'OAuth configuration error' });
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens({
      endpoint: tokenEndpoint,
      clientId,
      clientSecret,
      code,
      redirectUri,
    });

    // Extract user information from ID token
    const user = parseIdToken(tokens.id_token);

    return response(200, {
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      user: {
        userId: user.sub,
        email: user.email,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    console.error('Token exchange error:', error);

    if (error instanceof TokenExchangeError) {
      return response(401, { error: error.message });
    }

    return response(500, { error: 'Failed to exchange authorization code for tokens' });
  }
}

interface ExchangeParams {
  endpoint: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}

interface TokenResponse {
  id_token: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

class TokenExchangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenExchangeError';
  }
}

/**
 * Exchange Cognito authorization code for tokens via HTTPS
 */
function exchangeCodeForTokens(params: ExchangeParams): Promise<TokenResponse> {
  return new Promise((resolve, reject) => {
    const { endpoint, clientId, clientSecret, code, redirectUri } = params;

    // Prepare request body
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }).toString();

    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (res.statusCode !== 200) {
            const errorMsg = parsed.error_description || parsed.error || 'Token exchange failed';
            reject(new TokenExchangeError(errorMsg));
            return;
          }

          resolve(parsed as TokenResponse);
        } catch (err) {
          reject(new TokenExchangeError(`Failed to parse token response: ${err}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new TokenExchangeError(`HTTP request failed: ${err.message}`));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Decode ID token (base64 JWT) to extract claims
 * Note: This does NOT verify the signature - that should be done on frontend or via AWS
 */
function parseIdToken(idToken: string): Record<string, any> {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (2nd part)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (err) {
    console.warn('Failed to parse ID token:', err);
    return {};
  }
}
