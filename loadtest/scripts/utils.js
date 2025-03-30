const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const { getAuthToken } = require('./auth');

//==============================================================================
// CONSTANTS AND SHARED UTILITIES
//==============================================================================

const TEST_FILES_DIR = path.join(__dirname, '..', 'test-files');

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

//==============================================================================
// FILE HANDLING UTILITIES
//==============================================================================

// Get the MIME type for a file extension
function getMimeType(filename) {
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

  return mimeTypes[ext] || 'application/octet-stream';
}

// Add files to form data
function addFilesToForm(form, attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return 0;
  }

  // Process files synchronously to avoid memory issues
  for (const file of attachments) {
    const filename = path.basename(file);

    // Read file as buffer instead of stream
    const fileBuffer = fs.readFileSync(file);

    // Get MIME type
    const mimeType = getMimeType(filename);

    // Create Blob with the correct MIME type
    const fileBlob = new Blob([fileBuffer], { type: mimeType });

    // Add to form - always use 'files' as the field name
    form.append('files', fileBlob, filename);
  }

  console.log(`Added ${attachments.length} files to form data`);
  return attachments.length;
}

// Generate attachment list with configurable max count
function generateAttachments(userContext, events, done, maxCount) {
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

    // Randomly decide how many files to attach (1-maxCount)
    const count = Math.floor(Math.random() * maxCount) + 1;

    // Randomly select files
    const selectedFiles = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * files.length);
      selectedFiles.push(files[randomIndex]);
    }

    userContext.vars.attachments = selectedFiles;
    console.log(`Selected ${selectedFiles.length} files for attachment`);

    return done();
  } catch (error) {
    console.error('Error generating attachments:', error);
    return done(error);
  }
}

// Generate file attachments for discussions (max 4)
function generateFileAttachments(userContext, events, done) {
  return generateAttachments(userContext, events, done, 4);
}

// Generate comment attachments (max 2)
function generateCommentAttachments(userContext, events, done) {
  return generateAttachments(userContext, events, done, 2);
}

//==============================================================================
// TEST SETUP UTILITIES
//==============================================================================

// Load discussion IDs for testing
async function fetchAndSaveDiscussionIds(authorId = null) {
  try {
    if (authorId) {
      console.log(`Pre-fetching discussion IDs for author ${authorId}...`);
    } else {
      console.log('Pre-fetching all discussion IDs...');
    }

    // Get auth token
    const token = await getAuthToken({});
    if (!token) {
      throw new Error('Authentication failed while pre-fetching discussion IDs');
    }

    // Build URL - add authorId parameter if specified
    let url = 'http://localhost:3000/api/v1/discussions?limit=100&sortOrder=ASC&sortBy=commentCount';
    if (authorId) {
      url += `&authorId=${authorId}`;
    }

    // Fetch discussions
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} while pre-fetching discussion IDs`);
    }

    const data = await response.json();

    // Extract IDs
    let discussionIds = [];
    if (data.data && data.data.items && Array.isArray(data.data.items)) {
      discussionIds = data.data.items.map((item) => item.id);
      console.log(`Found ${discussionIds.length} discussion IDs${authorId ? ` for author ${authorId}` : ''}`);
    } else {
      console.warn('Unexpected API response format, no discussion IDs found');
    }

    // Save to file
    const outputDir = path.join(__dirname, '..', 'test-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use different filename based on whether we're filtering by author
    const filename = 'discussion-ids.json';
    const outputFile = path.join(outputDir, filename);
    fs.writeFileSync(outputFile, JSON.stringify(discussionIds, null, 2));

    console.log(`Saved ${discussionIds.length} discussion IDs to ${outputFile}`);
    return discussionIds;
  } catch (error) {
    console.error(`Error pre-fetching discussion IDs${authorId ? ` for author ${authorId}` : ''}:`, error);
    return [];
  }
}

function loadDiscussionIds(userContext, events, done) {
  try {
    const filePath = path.join(__dirname, '..', 'test-data', 'discussion-ids.json');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('No cached discussion IDs found, fetching new ones...');

      // Fetch IDs asynchronously
      fetchAndSaveDiscussionIds()
        .then((ids) => {
          if (ids.length === 0) {
            // Fallback to hardcoded IDs if we couldn't fetch any
            userContext.vars.discussionIds = [1, 2, 3, 4, 5];
            console.log('Using fallback discussion IDs:', userContext.vars.discussionIds);
          } else {
            userContext.vars.discussionIds = ids;
          }
          done();
        })
        .catch((error) => {
          console.error('Error fetching discussion IDs:', error);
          userContext.vars.discussionIds = [1, 2, 3, 4, 5];
          console.log('Using fallback discussion IDs due to error');
          done();
        });
      return;
    }

    // Load from file
    const ids = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    userContext.vars.discussionIds = ids;

    return done();
  } catch (error) {
    console.error('Error loading discussion IDs:', error);
    userContext.vars.discussionIds = [1, 2, 3, 4, 5]; // Fallback
    return done();
  }
}

function preFetchAllDiscussions(userContext, events, done) {
  console.log('Pre-fetching all discussions without author filter...');

  fetchAndSaveDiscussionIds(null)
    .then(() => {
      console.log('Completed pre-fetching all discussions');
      return done();
    })
    .catch((error) => {
      console.error(`Error pre-fetching discussions: ${error.message}`);
      return done(error);
    });
}

function preFetchDiscussionsByAuthor(userContext, events, done) {
  const authorId = userContext.vars.targetAuthorId;
  console.log(`Pre-fetching discussions by author ID ${authorId}`);

  fetchAndSaveDiscussionIds(authorId)
    .then(() => {
      console.log(`Completed pre-fetching discussions for author ${authorId}`);
      return done();
    })
    .catch((error) => {
      console.error(`Error pre-fetching discussions: ${error.message}`);
      return done(error);
    });
}

// WebSocket simulation
async function joinDiscussionRoom(userContext, events, done) {
  try {
    const discussionId = userContext.vars.discussionId;
    if (!discussionId) {
      console.log('No discussion ID available, skipping room join');
      return done();
    }

    console.log(`Attempting to join discussion room: ${discussionId}`);

    // For load testing purposes, simply simulate joining
    userContext.vars.joinedRoom = discussionId;

    if (typeof done === 'function') {
      return done();
    }
    return;
  } catch (error) {
    console.error('Error joining discussion room:', error);
    if (typeof done === 'function') {
      return done(error);
    }
  }
}

// Capture timestamp for end-to-end latency measurement
function captureTimestamp(userContext, events, done) {
  const timestamp = Date.now();
  userContext.vars.timestamp = timestamp;
  return done();
}

module.exports = {
  TEST_FILES_DIR,
  UTILS,
  getMimeType,
  addFilesToForm,
  generateFileAttachments,
  generateCommentAttachments,
  fetchAndSaveDiscussionIds,
  loadDiscussionIds,
  preFetchAllDiscussions,
  preFetchDiscussionsByAuthor,
  joinDiscussionRoom,
  captureTimestamp,
};
