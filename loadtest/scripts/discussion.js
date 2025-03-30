const { UTILS, addFilesToForm } = require('./utils');
const { getAuthToken } = require('./auth');

//==============================================================================
// DISCUSSION TEST DATA
//==============================================================================

// Discussion topics with realistic structure
const TOPICS = [
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
];

// Tag sets matching the topics
const TAG_SETS = [
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
];

// Discussion body templates for more realistic content
const BODY_TEMPLATES = [
  "I've been working on this for days and can't figure it out. Has anyone successfully implemented this?",
  'Looking for best practices and recommendations from more experienced developers.',
  "I'm new to this technology and would appreciate any guidance or resources.",
  'Our team is debating the best approach. What has worked well in production environments?',
  "I've read conflicting information online. What's the current recommended way to handle this?",
];

//==============================================================================
// DISCUSSION HELPERS
//==============================================================================

function generateDiscussionData(userContext, events, done) {
  try {
    // Select a random topic and matching tag set
    const topicIndex = Math.floor(Math.random() * TOPICS.length);
    const topic = TOPICS[topicIndex];
    const tagSet = TAG_SETS[topicIndex];

    // Create unique content with better structure
    const timestamp = new Date().toISOString();
    const body = UTILS.randomItem(BODY_TEMPLATES);
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

async function createDiscussionWithAttachments(userContext, events, done) {
  try {
    // Record client request timestamp
    const clientRequestTime = Date.now();
    userContext.vars.timestamp = clientRequestTime;

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
    form.append('clientRequestTime', clientRequestTime.toString());

    // Add tags
    if (Array.isArray(tags) && tags.length > 0) {
      tags.forEach((tag) => form.append('tags', tag));
    }

    // Add file attachments
    addFilesToForm(form, attachments);

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

    if (typeof done === 'function') {
      done();
    }
  } catch (error) {
    console.error('Error creating discussion with attachments:', error);

    // Report metrics on error
    if (events && typeof events.emit === 'function') {
      events.emit('counter', 'requests.failed', 1);
    }

    if (typeof done === 'function') {
      done(error);
    } else {
      throw error;
    }
  }
}

module.exports = {
  generateDiscussionData,
  createDiscussionWithAttachments,
};
