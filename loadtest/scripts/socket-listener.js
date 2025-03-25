const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

//==============================================================================
// CONFIGURATION
//==============================================================================

const args = process.argv.slice(2);
const testName = args[0] || 'default';
const phaseName = args[1] || 'all';
const CONFIG = {
  socketUrl: 'http://localhost:3000/events',
  auth: {
    username: '2110511091',
    password: 'password123',
  },
  outputDir: path.join(__dirname, '..', 'results', 'e2e-latency', testName),
  resultsFile: `${phaseName}-${Date.now()}.json`,
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

//==============================================================================
// STATE MANAGEMENT
//==============================================================================

// Store results for analysis
const latencyResults = new Map();

//==============================================================================
// AUTHENTICATION
//==============================================================================

async function getAuthToken() {
  try {
    console.log('Authenticating to API...');

    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CONFIG.auth),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully authenticated');
    return data.data.accessToken;
  } catch (error) {
    console.error(`Authentication error: ${error.message}`);
    throw error;
  }
}

//==============================================================================
// SOCKET CONNECTION
//==============================================================================

async function connectSocket() {
  try {
    // Get authentication token
    const token = await getAuthToken();

    console.log(`Connecting to Socket.IO server: ${CONFIG.socketUrl}`);

    // Connect to socket server with auth token
    const socket = io(CONFIG.socketUrl, {
      transports: ['websocket'],
      auth: { token },
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log(`✅ Connected to Socket.IO server (ID: ${socket.id})`);
      console.log('Listening for real-time events...');
    });

    socket.on('connect_error', (error) => {
      console.error(`❌ Connection error: ${error.message}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`⚠️ Disconnected: ${reason}`);
      setTimeout(() => socket.connect(), 5000);
    });

    // Set up listener for new discussion events
    socket.on('newDiscussion', handleNewDiscussionEvent);
    socket.on('newComment', handleNewCommentEvent);

    return socket;
  } catch (error) {
    console.error(`Failed to connect: ${error.message}`);
    setTimeout(connectSocket, 10000);
  }
}

//==============================================================================
// EVENT HANDLERS
//==============================================================================

function handleNewDiscussionEvent(data) {
  try {
    const clientReceiveTime = Date.now();
    console.log(`📨 Received event data:`, data);

    // Extract discussion ID from event data
    let discussionId; // Declare variable first

    if (typeof data === 'object') {
      if (data.discussionId !== undefined) {
        discussionId = data.discussionId;
      } else if (data.id !== undefined) {
        discussionId = data.id;
      } else if (data.discussion && data.discussion.id !== undefined) {
        discussionId = data.discussion.id;
      }
    }

    if (!discussionId) {
      console.warn(`❓ No discussion ID found in event data:`, data);
      return;
    }

    // Ensure numeric format if possible
    if (!isNaN(discussionId)) {
      discussionId = Number(discussionId);
    }

    // Look for client request timestamp in the event data
    let clientRequestTime = null;

    if (data.clientRequestTime !== undefined) {
      clientRequestTime = data.clientRequestTime;
    } else if (data.meta && data.meta.clientRequestTime !== undefined) {
      clientRequestTime = data.meta.clientRequestTime;
    }

    if (!clientRequestTime) {
      console.warn(`❌ No client request timestamp in event for discussion #${discussionId}`, data);
      return;
    }

    // Convert to number if it's a string
    if (typeof clientRequestTime === 'string') {
      clientRequestTime = parseInt(clientRequestTime, 10);
    }

    // Calculate true end-to-end latency
    const e2eLatency = clientReceiveTime - clientRequestTime;

    console.log(`⏱️ END-TO-END LATENCY: ${e2eLatency}ms for discussion #${discussionId}`);

    // Store latency result
    latencyResults.set(discussionId, {
      discussionId,
      clientRequestTime,
      clientReceiveTime,
      e2eLatency,
    });

    // Save updated results
    saveLatencyResults();
  } catch (error) {
    console.error(`Error handling event: ${error.message}`, error);
  }
}

function handleNewCommentEvent(data) {
  try {
    const clientReceiveTime = Date.now();
    console.log(`📨 Received comment event:`, data);

    // Extract discussion and comment IDs
    let discussionId = data.discussionId;
    let commentId = data.commentId;

    if (!discussionId || !commentId) {
      console.warn(`❓ Missing IDs in comment event data:`, data);
      return;
    }

    // Ensure numeric format
    if (!isNaN(discussionId)) discussionId = Number(discussionId);
    if (!isNaN(commentId)) commentId = Number(commentId);

    // Look for client request timestamp
    let clientRequestTime = null;

    if (data.clientRequestTime !== undefined) {
      clientRequestTime = data.clientRequestTime;
    } else if (data.meta && data.meta.clientRequestTime !== undefined) {
      clientRequestTime = data.meta.clientRequestTime;
    }

    if (!clientRequestTime) {
      console.warn(`❌ No client request timestamp in comment event:`, data);
      return;
    }

    // Convert to number if string
    if (typeof clientRequestTime === 'string') {
      clientRequestTime = parseInt(clientRequestTime, 10);
    }

    // Calculate end-to-end latency
    const e2eLatency = clientReceiveTime - clientRequestTime;

    console.log(`⏱️ COMMENT E2E LATENCY: ${e2eLatency}ms for comment #${commentId} on discussion #${discussionId}`);

    // Create a unique key using both IDs
    const resultKey = `comment-${commentId}-${discussionId}`;

    // Store latency result
    latencyResults.set(resultKey, {
      discussionId,
      commentId,
      clientRequestTime,
      clientReceiveTime,
      e2eLatency,
      isReply: data.isReply || false,
    });

    // Save updated results
    saveLatencyResults();
  } catch (error) {
    console.error(`Error handling comment event: ${error.message}`, error);
  }
}

//==============================================================================
// RESULT STORAGE
//==============================================================================

function saveLatencyResults() {
  try {
    const resultsFilePath = path.join(CONFIG.outputDir, CONFIG.resultsFile);
    const results = Array.from(latencyResults.values());
    fs.writeFileSync(resultsFilePath, JSON.stringify(results, null, 2));
    console.log(`💾 Saved ${results.length} real-time latency measurements`);
  } catch (error) {
    console.error(`Error saving results: ${error.message}`);
  }
}

//==============================================================================
// MAIN EXECUTION
//==============================================================================

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Socket.IO latency monitor...');
  saveLatencyResults();
  process.exit(0);
});

// Start the monitor
console.log('🚀 Starting End-to-End Real-Time Latency Monitor...');
connectSocket();
