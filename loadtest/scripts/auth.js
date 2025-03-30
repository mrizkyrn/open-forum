//==============================================================================
// AUTHENTICATION HELPERS
//==============================================================================

let tokenCache = new Map();

function getRandomUserId(context) {
  // Use context-specific user if already assigned
  if (context && context.vars && context.vars.userId) {
    return context.vars.userId;
  }

  // Generate new random user ID in the specified range (1-50)
  const userNumber = Math.floor(Math.random() * 50) + 1;
  const userId = `2110511${userNumber.toString().padStart(3, '0')}`;

  // Store in context if available
  if (context && context.vars) {
    context.vars.userId = userId;
  }

  return userId;
}

async function getAuthToken(context) {
  // Get user ID - either from context or generate a random one
  const userId = getRandomUserId(context);

  // Check for cached valid token
  if (tokenCache.has(userId)) {
    const { token, expiry } = tokenCache.get(userId);
    if (expiry > Date.now()) {
      return token;
    }
  }

  try {
    // Get a new token with fetch
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userId,
        password: 'password123',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the token for 15 minutes
    const token = data.data.accessToken;
    tokenCache.set(userId, {
      token,
      expiry: Date.now() + 15 * 60 * 1000,
    });

    return token;
  } catch (error) {
    console.error(`Failed to get auth token for user ${userId}:`, error.message);
    return null;
  }
}

function setAuthHeader(requestParams, context, ee, next) {
  getAuthToken(context)
    .then((token) => {
      if (!token) {
        console.error('Authentication failed: No token received');
        return next(new Error('Authentication failed'));
      }

      // Set the Authorization header
      requestParams.headers = requestParams.headers || {};
      requestParams.headers.Authorization = `Bearer ${token}`;

      return next();
    })
    .catch((error) => {
      console.error('Error in setAuthHeader:', error);
      next(error);
    });
}

module.exports = {
  getRandomUserId,
  getAuthToken,
  setAuthHeader,
};
