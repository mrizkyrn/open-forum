/**
 * Artillery Load Test Helper Functions
 * Provides authentication and data generation for discussion creation tests
 */

const fs = require('fs');
const path = require('path');

//==============================================================================
// AUTHENTICATION HELPERS
//==============================================================================

const TEST_FILES_DIR = path.join(__dirname, '..', 'test-files');

let tokenCache = new Map();

function getRandomUserId(context) {
  // Use context-specific user if already assigned (for consistency in a scenario)
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

//==============================================================================
// CONTENT GENERATION
//==============================================================================

const DATA = {
  // Discussion topics with realistic structure
  topics: [
    'How to implement authentication in NestJS?',
    'Best practices for database optimization',
    'Solving memory leaks in Node.js applications',
    'Effective state management in React',
    'Understanding TypeScript generics',
    'Implementing real-time features with WebSockets',
    'Building scalable microservices architecture',
    'Optimizing Docker containers for production',
    'Testing strategies for REST APIs',
    'Handling file uploads in web applications',
  ],

  // Tag sets matching the topics
  tagSets: [
    ['nestjs', 'authentication', 'jwt'],
    ['database', 'optimization', 'sql'],
    ['javascript', 'memory', 'debugging'],
    ['react', 'redux', 'state-management'],
    ['typescript', 'generics', 'types'],
    ['websockets', 'real-time', 'socket.io'],
    ['microservices', 'architecture', 'scaling'],
    ['docker', 'kubernetes', 'devops'],
    ['testing', 'jest', 'api'],
    ['file-upload', 'multer', 'cloud-storage'],
  ],

  // Discussion body templates for more realistic content
  bodyTemplates: [
    "I've been working on this for days and can't figure it out. Has anyone successfully implemented this?",
    'Looking for best practices and recommendations from more experienced developers.',
    "I'm new to this technology and would appreciate any guidance or resources.",
    'Our team is debating the best approach. What has worked well in production environments?',
    "I've read conflicting information online. What's the current recommended way to handle this?",
  ],
};

const UTILS = {
  randomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz ';
    return Array(length)
      .fill(0)
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join('');
  },

  randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  uniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
};

function generateDiscussionData(userContext, events, done) {
  try {
    // Select a random topic and matching tag set
    const topicIndex = Math.floor(Math.random() * DATA.topics.length);
    const topic = DATA.topics[topicIndex];
    const tagSet = DATA.tagSets[topicIndex];

    // Create unique content with better structure
    const timestamp = new Date().toISOString();
    const body = UTILS.randomItem(DATA.bodyTemplates);
    const uniqueId = UTILS.uniqueId();

    const content = `${topic}\n\n${body}\n\nAdditional details: ${UTILS.randomString(20)}\n\nRef: ${uniqueId} (${timestamp})`;

    // Randomly decide if anonymous (30% chance)
    const isAnonymous = Math.random() > 0.7;

    // Choose a random space ID between 1 and 3
    const spaceId = Math.floor(Math.random() * 3) + 1;

    // Set the values in user context
    userContext.vars.content = content;
    userContext.vars.isAnonymous = isAnonymous;
    userContext.vars.tags = tagSet;
    userContext.vars.spaceId = spaceId;

    return done();
  } catch (error) {
    console.error('Error generating discussion data:', error);
    return done(error);
  }
}

function generateFileAttachments(userContext, events, done) {
  try {
    if (!fs.existsSync(TEST_FILES_DIR)) {
      console.error(`Test files directory not found: ${TEST_FILES_DIR}`);
      userContext.vars.attachments = [];
      return done();
    }

    // Get all files from the directory
    const files = fs
      .readdirSync(TEST_FILES_DIR)
      .filter((file) => !file.startsWith('.')) // Skip hidden files
      .map((file) => path.join(TEST_FILES_DIR, file));

    if (files.length === 0) {
      console.warn('No test files found in the directory');
      userContext.vars.attachments = [];
      return done();
    }

    // Randomly decide how many files to attach (1-4)
    const count = Math.floor(Math.random() * 4) + 1;

    // Randomly select files
    const selectedFiles = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * files.length);
      selectedFiles.push(files[randomIndex]);
    }

    userContext.vars.attachments = selectedFiles;

    return done();
  } catch (error) {
    console.error('Error generating file attachments:', error);
    return done(error);
  }
}

/**
 * Creates a discussion with file attachments using FormData
 * This replaces the standard Artillery HTTP request with a custom one
 */
async function createDiscussionWithAttachments(userContext, events, done) {
  try {
    // Get authentication token
    const token = await getAuthToken(userContext);
    if (!token) {
      if (typeof done === 'function') {
        return done(new Error('Authentication failed'));
      }
      throw new Error('Authentication failed');
    }

    // Get discussion data from context
    const { content, isAnonymous, tags, spaceId, attachments } = userContext.vars;

    // Create a new FormData instance
    const form = new FormData();

    // Add discussion data
    form.append('content', content.trim());
    form.append('isAnonymous', isAnonymous);
    form.append('spaceId', spaceId);

    // Add tags
    if (Array.isArray(tags) && tags.length > 0) {
      tags.forEach((tag) => form.append('tags', tag));
    }

    // Add file attachments
    if (Array.isArray(attachments) && attachments.length > 0) {
      // Process files synchronously to avoid memory issues
      for (const file of attachments) {
        const filename = path.basename(file);

        // Read file as buffer instead of stream
        const fileBuffer = fs.readFileSync(file);

        // Determine MIME type based on extension (critical fix)
        let mimeType = 'application/octet-stream'; // Default fallback
        const ext = path.extname(filename).toLowerCase();

        // Map extensions to MIME types
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.ppt': 'application/vnd.ms-powerpoint',
          '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '.zip': 'application/zip',
          '.rar': 'application/x-rar-compressed',
          '.txt': 'text/plain',
        };

        if (mimeTypes[ext]) {
          mimeType = mimeTypes[ext];
        }

        // Create Blob with the correct MIME type
        const fileBlob = new Blob([fileBuffer], { type: mimeType });

        // FIXED: Changed 'files' to 'attachments' to match server expectation
        form.append('files', fileBlob, filename);
      }
      console.log(`Added ${attachments.length} files to form data`);
    }

    // Send the request
    const startTime = Date.now();

    const response = await fetch('http://localhost:3000/api/v1/discussions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Parse the response
    const responseBody = await response.json();
    const statusCode = response.status;

    // Store data in context for later use
    userContext.vars.statusCode = statusCode;
    userContext.vars.responseBody = responseBody;

    if (responseBody.data && responseBody.data.id) {
      userContext.vars.discussionId = responseBody.data.id;
    }

    // Custom reporting of metrics to Artillery
    events.emit('counter', 'requests.total', 1);
    events.emit('counter', `responses.${statusCode}`, 1);
    events.emit('response', responseTime, statusCode, undefined, 'POST', '/discussions');

    if (statusCode >= 200 && statusCode < 300) {
      events.emit('counter', 'requests.succeeded', 1);
    } else {
      events.emit('counter', 'requests.failed', 1);
      console.error(`Request failed with status ${statusCode}: ${JSON.stringify(responseBody)}`);
    }

    // FIXED: Check if done is a function before calling it
    if (typeof done === 'function') {
      done();
    }
    return;
  } catch (error) {
    console.error('Error creating discussion with attachments:', error);

    // Report metrics on error
    if (events && typeof events.emit === 'function') {
      events.emit('counter', 'requests.failed', 1);
    }

    // FIXED: Check if done is a function before calling it
    if (typeof done === 'function') {
      done(error);
    } else {
      throw error; // Re-throw if no callback
    }
  }
}

//==============================================================================
// MODULE EXPORTS
//==============================================================================

module.exports = {
  // Auth functions
  getAuthToken,
  setAuthHeader,

  // Helper utilities (exposed for potential use in custom functions)
  $randomString: UTILS.randomString,
  $randomItem: UTILS.randomItem,

  // Data generation for discussions
  generateDiscussionData,

  // File attachment generation
  generateFileAttachments,
  createDiscussionWithAttachments,
};
