/**
 * Simplified Socket.IO Latency Monitor
 * Measures end-to-end real-time latency from server processing to client notification
 */
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
  outputDir: path.join(__dirname, '..', 'results', 'latency', testName),
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
const latencyResults = new Map(); // discussionId -> result object

//==============================================================================
// AUTHENTICATION
//==============================================================================

/**
 * Get auth token for Socket.IO connection
 */
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

/**
 * Connect to Socket.IO server and set up listeners
 */
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

    return socket;
  } catch (error) {
    console.error(`Failed to connect: ${error.message}`);
    setTimeout(connectSocket, 10000);
  }
}

//==============================================================================
// EVENT HANDLERS
//==============================================================================

/**
 * Handle incoming 'newDiscussion' events from Socket.IO
 */
function handleNewDiscussionEvent(data) {
  try {
    const clientReceiveTime = Date.now();
    console.log(`📨 Received event: ${JSON.stringify(data)}`);

    // Extract discussion ID
    let discussionId;
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
      console.warn(`❓ No discussion ID in event data:`, data);
      return;
    }

    // Ensure numeric format if possible
    discussionId = !isNaN(discussionId) ? Number(discussionId) : discussionId;

    // Check for server timestamp in the event data
    let serverTimestamp = data.serverTimestamp;

    if (!serverTimestamp) {
      console.warn(`❌ No server timestamp in event for discussion #${discussionId}`);
      return;
    }

    // Handle ISO string timestamp format
    if (typeof serverTimestamp === 'string') {
      try {
        // Convert ISO string to timestamp
        serverTimestamp = new Date(serverTimestamp).getTime();
        console.log(`🕒 Parsed timestamp: ${serverTimestamp} from "${data.serverTimestamp}"`);
      } catch (error) {
        console.error(`❌ Error parsing timestamp: ${error.message}`);
        return;
      }
    }

    // Calculate end-to-end real-time latency
    const realtimeLatency = clientReceiveTime - serverTimestamp;

    console.log(`⏱️ END-TO-END REAL-TIME LATENCY: ${realtimeLatency}ms for discussion #${discussionId}`);

    // Store latency result
    latencyResults.set(discussionId, {
      discussionId,
      serverTimestamp,
      clientReceiveTime,
      realtimeLatency,
      originalTimestamp: data.serverTimestamp, // Store original for debugging
    });

    // Save updated results
    saveLatencyResults();
  } catch (error) {
    console.error(`Error handling event: ${error.message}`);
  }
}

//==============================================================================
// RESULT STORAGE
//==============================================================================

/**
 * Save latency results to file
 */
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

// Print stats periodically
setInterval(() => {
  const count = latencyResults.size;
  if (count > 0) {
    const latencies = Array.from(latencyResults.values()).map((r) => r.realtimeLatency);
    const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
    console.log(`📊 Total measurements: ${count}, Average end-to-end real-time latency: ${avg.toFixed(2)}ms`);
  }
}, 30000);

// Start the monitor
console.log('🚀 Starting End-to-End Real-Time Latency Monitor...');
connectSocket();
