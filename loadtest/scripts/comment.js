const { UTILS, addFilesToForm } = require('./utils');
const { getAuthToken } = require('./auth');

//==============================================================================
// COMMENT TEST DATA
//==============================================================================

// Comment templates with placeholders
const COMMENT_TEMPLATES = [
  'I completely agree with your point about {{topic}}. Have you considered {{suggestion}}?',
  'This is really interesting. I had a similar experience with {{topic}} when I tried {{suggestion}}.',
  "Great discussion! I think {{topic}} is crucial, but we shouldn't overlook {{suggestion}}.",
  "I'm not sure I agree with your assessment of {{topic}}. In my experience, {{suggestion}} works better.",
  "Thanks for bringing up {{topic}}. It's an important issue that needs more {{suggestion}}.",
];

// Comment topics
const COMMENT_TOPICS = [
  'performance optimization',
  'architecture patterns',
  'dependency management',
  'testing strategies',
  'caching mechanisms',
  'error handling',
  'security concerns',
];

// Suggestion options
const COMMENT_SUGGESTIONS = [
  'parallel processing',
  'modular design',
  'versioning',
  'integration tests',
  'distributed caching',
  'circuit breakers',
  'input validation',
];

// Reply templates
const REPLY_TEMPLATES = [
  "Thanks for your response! I'd like to clarify my point about {{topic}}.",
  "That's a good point. I'd add that {{topic}} also affects the overall system design.",
  "I've tried your suggestion and found that {{topic}} still needs some improvement.",
  'Interesting perspective. Have you looked at how {{topic}} is implemented in other frameworks?',
  'I appreciate your feedback. My concern is specifically about {{topic}} in high-load scenarios.',
];

// Reply topics
const REPLY_TOPICS = [
  'error propagation',
  'state management',
  'API design',
  'resource utilization',
  'concurrency patterns',
  'graceful degradation',
  'fault tolerance',
];

//==============================================================================
// COMMENT HELPERS
//==============================================================================

function generateCommentData(userContext, events, done) {
  try {
    // Select random template and fill in placeholders
    let template = UTILS.randomItem(COMMENT_TEMPLATES);
    const topic = UTILS.randomItem(COMMENT_TOPICS);
    const suggestion = UTILS.randomItem(COMMENT_SUGGESTIONS);

    const content = template.replace('{{topic}}', topic).replace('{{suggestion}}', suggestion);

    // Add some randomness to make content unique
    const uniqueId = UTILS.uniqueId();
    const commentContent = `${content}\n\nRef: ${uniqueId}`;

    // Store in context
    userContext.vars.commentContent = commentContent;

    // Default parentId to null (top-level comment)
    userContext.vars.parentId = null;

    return done();
  } catch (error) {
    console.error('Error generating comment data:', error);
    return done(error);
  }
}

function generateReplyData(userContext, events, done) {
  try {
    // Select random template and fill in placeholders
    let template = UTILS.randomItem(REPLY_TEMPLATES);
    const topic = UTILS.randomItem(REPLY_TOPICS);

    const content = template.replace('{{topic}}', topic);

    // Add some randomness to make content unique
    const uniqueId = UTILS.uniqueId();
    const replyContent = `${content}\n\nRef: ${uniqueId}`;

    // Store in context
    userContext.vars.replyContent = replyContent;

    return done();
  } catch (error) {
    console.error('Error generating reply data:', error);
    return done(error);
  }
}

// Check if we have a valid discussion ID and select one if we have multiple
function checkDiscussionId(userContext, events, done) {
  const discussionIds = userContext.vars.discussionIds;

  if (!discussionIds || discussionIds.length === 0) {
    // If no discussions found, use a fallback ID
    userContext.vars.discussionId = 1;
  } else if (Array.isArray(discussionIds)) {
    // If it's an array, pick a random ID
    const randomIndex = Math.floor(Math.random() * discussionIds.length);
    userContext.vars.discussionId = discussionIds[randomIndex];
  } else {
    // If it's already a single value, use it directly
    userContext.vars.discussionId = discussionIds;
  }

  return done();
}

// Check if we have a valid comment ID for replies
function checkCommentId(userContext, events, done) {
  const commentIds = userContext.vars.commentIds;

  if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
    // If no comments found, set parentId to null (make a top-level comment instead)
    userContext.vars.commentId = null;
    console.log('No comments found for discussion, will create top-level comment instead');
  } else {
    // Use the captured comment ID
    userContext.vars.commentId = commentIds;
  }

  return done();
}

// Create a comment with file attachments using FormData
async function createCommentWithAttachments(userContext, events, done) {
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

    // Get comment data from context
    const { commentContent, discussionId, parentId, attachments } = userContext.vars;

    // Create a new FormData instance
    const form = new FormData();

    // Add comment data
    form.append('content', commentContent.trim());
    if (parentId) {
      form.append('parentId', parentId);
    }
    form.append('clientRequestTime', clientRequestTime.toString());

    // Add file attachments
    addFilesToForm(form, attachments);

    // Send the request
    const startTime = Date.now();

    const response = await fetch(`http://localhost:3000/api/v1/discussions/${discussionId}/comments`, {
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
      userContext.vars.commentId = responseBody.data.id;
    }

    // Custom reporting of metrics to Artillery
    events.emit('counter', 'requests.total', 1);
    events.emit('counter', `responses.${statusCode}`, 1);
    events.emit('response', responseTime, statusCode, undefined, 'POST', `/discussions/${discussionId}/comments`);

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
    console.error('Error creating comment with attachments:', error);

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
  generateCommentData,
  generateReplyData,
  checkDiscussionId,
  checkCommentId,
  createCommentWithAttachments,
};
