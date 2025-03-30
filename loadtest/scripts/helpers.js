//==============================================================================
// LOAD TEST HELPERS - MAIN EXPORTS FILE
//==============================================================================

// Import from modular utils
const auth = require('./auth');
const utils = require('./utils');
const discussion = require('./discussion');
const comment = require('./comment');

// Re-export everything
module.exports = {
  // Auth functions
  getAuthToken: auth.getAuthToken,
  setAuthHeader: auth.setAuthHeader,
  getRandomUserId: auth.getRandomUserId,

  // Utility functions
  $randomString: utils.UTILS.randomString,
  $randomItem: utils.UTILS.randomItem,
  captureTimestamp: utils.captureTimestamp,

  // Discussion functions
  generateDiscussionData: discussion.generateDiscussionData,
  createDiscussionWithAttachments: discussion.createDiscussionWithAttachments,

  // File attachment functions
  generateFileAttachments: utils.generateFileAttachments,
  generateCommentAttachments: utils.generateCommentAttachments,

  // WebSocket functions
  joinDiscussionRoom: utils.joinDiscussionRoom,

  // Test setup helpers
  fetchAndSaveDiscussionIds: utils.fetchAndSaveDiscussionIds,
  loadDiscussionIds: utils.loadDiscussionIds,
  preFetchAllDiscussions: utils.preFetchAllDiscussions,
  preFetchDiscussionsByAuthor: utils.preFetchDiscussionsByAuthor,

  // Comment functions
  generateCommentData: comment.generateCommentData,
  generateReplyData: comment.generateReplyData,
  checkDiscussionId: comment.checkDiscussionId,
  checkCommentId: comment.checkCommentId,
  createCommentWithAttachments: comment.createCommentWithAttachments,
};
