/**
 * Server Resource Monitor
 * Tracks system and Node.js metrics during load tests
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

//==============================================================================
// CONFIGURATION
//==============================================================================

// Get command line arguments with defaults
const args = process.argv.slice(2);
const CONFIG = {
  testName: args[0] || 'default',
  phaseName: args[1] || 'default',
  durationSec: parseInt(args[2] || '60', 10),
  sampleInterval: 1000, // Sample every second
};

// Derive file paths
const BASE_DIR = path.join(__dirname, '..');
const RESULTS_DIR = path.join(BASE_DIR, 'results', 'metrics', CONFIG.testName);
const OUTPUT_FILE = path.join(RESULTS_DIR, `${CONFIG.phaseName}-${Date.now()}.csv`);

// CSV header definition
const CSV_HEADER = [
  'timestamp',
  'cpu_load',
  'memory_used_mb',
  'memory_total_mb',
  'memory_percent',
  'heap_used_mb',
  'heap_total_mb',
  'external_memory_mb',
  'active_handles',
  'active_requests',
].join(',');

//==============================================================================
// RESOURCE MONITOR CLASS
//==============================================================================

/**
 * ResourceMonitor class for tracking system and application metrics
 */
class ResourceMonitor {
  constructor(config) {
    this.config = config;
    this.sampleCount = 0;
    this.maxSamples = Math.ceil((config.durationSec * 1000) / config.sampleInterval);
    this.lastCpuInfo = this.getCpuInfo();
    this.interval = null;
    this.startTime = Date.now();
  }

  /**
   * Initialize the monitoring system
   */
  initialize() {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(RESULTS_DIR)) {
        fs.mkdirSync(RESULTS_DIR, { recursive: true });
      }

      // Initialize output file with header
      fs.writeFileSync(OUTPUT_FILE, `${CSV_HEADER}\n`);

      // Display start message
      this.printStartMessage();

      // Register signal handlers for clean shutdown
      this.registerSignalHandlers();

      return true;
    } catch (error) {
      console.error('Failed to initialize monitoring:', error.message);
      return false;
    }
  }

  /**
   * Start monitoring resources at regular intervals
   */
  start() {
    if (!this.initialize()) {
      return;
    }

    this.interval = setInterval(() => {
      try {
        this.recordMetrics();
        this.updateProgress();

        // Auto-stop after test duration
        this.sampleCount++;
        if (this.sampleCount >= this.maxSamples) {
          this.stop();
        }
      } catch (error) {
        console.error('Error during monitoring:', error.message);
      }
    }, this.config.sampleInterval);
  }

  /**
   * Stop monitoring and clean up
   */
  stop() {
    clearInterval(this.interval);
    const elapsedSec = Math.round((Date.now() - this.startTime) / 1000);

    console.log('\n');
    console.log('═════════════════════════════════════════');
    console.log(`Monitoring complete (${elapsedSec} seconds)`);
    console.log(`Collected ${this.sampleCount} samples`);
    console.log(`Metrics saved to: ${OUTPUT_FILE}`);
    console.log('═════════════════════════════════════════');

    process.exit(0);
  }

  /**
   * Register handlers for process termination signals
   */
  registerSignalHandlers() {
    // Handle graceful shutdown
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, () => {
        console.log(`\nReceived ${signal}, shutting down...`);
        this.stop();
      });
    });
  }

  /**
   * Record all system metrics to the output file
   */
  recordMetrics() {
    const timestamp = new Date().toISOString();
    const metrics = {
      cpu: this.getCpuUsage(),
      memory: this.getMemoryUsage(),
      process: this.getProcessMetrics(),
      node: this.getNodeMetrics(),
    };

    // Format metrics as CSV line
    const line = [
      timestamp,
      metrics.cpu.usagePercent,
      metrics.memory.usedMB.toFixed(2),
      metrics.memory.totalMB.toFixed(2),
      metrics.memory.usagePercent.toFixed(2),
      metrics.process.heapUsedMB.toFixed(2),
      metrics.process.heapTotalMB.toFixed(2),
      metrics.process.externalMB.toFixed(2),
      metrics.node.activeHandles,
      metrics.node.activeRequests,
    ].join(',');

    // Append to file
    fs.appendFileSync(OUTPUT_FILE, `${line}\n`);
  }

  /**
   * Get CPU info for usage calculation
   * @returns {Object} Idle and total CPU time
   */
  getCpuInfo() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    }

    return { idle, total };
  }

  /**
   * Calculate CPU usage percentage
   * @returns {Object} CPU usage metrics
   */
  getCpuUsage() {
    const currentInfo = this.getCpuInfo();
    const idleDiff = currentInfo.idle - this.lastCpuInfo.idle;
    const totalDiff = currentInfo.total - this.lastCpuInfo.total;

    const usagePercent = totalDiff ? parseFloat(((1 - idleDiff / totalDiff) * 100).toFixed(2)) : 0;

    // Update reference for next calculation
    this.lastCpuInfo = currentInfo;

    return { usagePercent };
  }

  /**
   * Get system memory usage metrics
   * @returns {Object} Memory usage metrics
   */
  getMemoryUsage() {
    const totalMB = os.totalmem() / (1024 * 1024);
    const freeMB = os.freemem() / (1024 * 1024);
    const usedMB = totalMB - freeMB;
    const usagePercent = (usedMB / totalMB) * 100;

    return { totalMB, freeMB, usedMB, usagePercent };
  }

  /**
   * Get Node.js process memory metrics
   * @returns {Object} Process memory metrics
   */
  getProcessMetrics() {
    const memUsage = process.memoryUsage();

    return {
      heapUsedMB: memUsage.heapUsed / (1024 * 1024),
      heapTotalMB: memUsage.heapTotal / (1024 * 1024),
      externalMB: memUsage.external / (1024 * 1024),
      rssMB: memUsage.rss / (1024 * 1024),
    };
  }

  /**
   * Get Node.js resource metrics
   * @returns {Object} Node.js resource metrics
   */
  getNodeMetrics() {
    return {
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length,
    };
  }

  /**
   * Print initial monitoring information
   */
  printStartMessage() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║               LOAD TEST RESOURCE MONITOR               ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`Test name:     ${CONFIG.testName}`);
    console.log(`Phase:         ${CONFIG.phaseName}`);
    console.log(`Duration:      ${CONFIG.durationSec} seconds`);
    console.log(`Sample rate:   Every ${CONFIG.sampleInterval}ms`);
    console.log(`Output file:   ${OUTPUT_FILE}`);
    console.log('─────────────────────────────────────────────────────────');
    console.log('Monitoring started... Press Ctrl+C to stop');
  }

  /**
   * Update progress indicator in console
   */
  updateProgress() {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    const percent = Math.min(100, Math.round((elapsed / this.config.durationSec) * 100));
    const width = 30;
    const chars = Math.round(width * (percent / 100));

    const bar = '█'.repeat(chars) + '░'.repeat(width - chars);

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`Progress: [${bar}] ${percent}% (${elapsed}/${this.config.durationSec}s)`);
  }
}

//==============================================================================
// MAIN EXECUTION
//==============================================================================

// Create and start the monitor
const monitor = new ResourceMonitor(CONFIG);
monitor.start();
