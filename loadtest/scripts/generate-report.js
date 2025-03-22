/**
 * Artillery Load Test Report Generator
 * Generates Markdown summary reports from Artillery JSON output and resource metrics
 */
const fs = require('fs');
const path = require('path');

//==============================================================================
// REPORT GENERATOR CLASS
//==============================================================================

class TestReportGenerator {
  /**
   * Creates a new test report generator instance
   * @param {string} testName - Name of the test
   * @param {string} phaseName - Phase name (or 'all')
   */
  constructor(testName, phaseName) {
    this.testName = testName || 'default';
    this.phaseName = phaseName || 'all';

    // Setup paths
    this.basePath = path.join(__dirname, '..');
    this.paths = {
      reports: path.join(this.basePath, 'results', 'reports', this.testName),
      metrics: path.join(this.basePath, 'results', 'metrics', this.testName),
      output: path.join(this.basePath, 'results', 'summary', this.testName),
    };

    // Initialize data containers
    this.reportData = null;
    this.metricsData = null;
    this.artilleryMetrics = null;
    this.resourceMetrics = null;
    this.outputFiles = [];
  }

  /**
   * Ensures all necessary directories exist
   */
  ensureDirectoriesExist() {
    Object.values(this.paths).forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Finds the most recent file with a given prefix
   * @param {string} directory - Directory to search
   * @param {string} prefix - File name prefix
   * @returns {string|null} Most recent file name or null
   */
  findLatestFile(directory, prefix) {
    try {
      const files = fs
        .readdirSync(directory)
        .filter((file) => file.startsWith(prefix))
        .map((file) => ({
          name: file,
          time: fs.statSync(path.join(directory, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      return files.length > 0 ? files[0].name : null;
    } catch (error) {
      console.error(`Error finding latest file: ${error.message}`);
      return null;
    }
  }

  /**
   * Loads the report data from JSON file
   * @returns {boolean} Success status
   */
  loadReportData() {
    try {
      const reportPrefix = this.phaseName !== 'all' ? `${this.phaseName}-report` : 'report';
      const reportFile = this.findLatestFile(this.paths.reports, reportPrefix);

      if (!reportFile) {
        throw new Error(`No report file found for test: ${this.testName}, phase: ${this.phaseName}`);
      }

      console.log(`Using report file: ${reportFile}`);
      this.reportData = JSON.parse(fs.readFileSync(path.join(this.paths.reports, reportFile)));
      return true;
    } catch (error) {
      console.error(`Failed to load report data: ${error.message}`);
      return false;
    }
  }

  /**
   * Loads metrics data from CSV file
   * @returns {boolean} Success status
   */
  loadMetricsData() {
    try {
      const metricsPrefix = this.phaseName !== 'all' ? this.phaseName : '';
      const metricsFile = this.findLatestFile(this.paths.metrics, metricsPrefix);

      if (!metricsFile) {
        console.log('No metrics file found, resource usage will not be included');
        return false;
      }

      console.log(`Using metrics file: ${metricsFile}`);
      const metricsContent = fs.readFileSync(path.join(this.paths.metrics, metricsFile), 'utf-8');
      const lines = metricsContent.trim().split('\n');
      const headers = lines[0].split(',');

      this.metricsData = lines.slice(1).map((line) => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header] = header === 'timestamp' ? values[index] : parseFloat(values[index]);
        });
        return row;
      });

      return true;
    } catch (error) {
      console.error(`Warning: Could not load metrics data: ${error.message}`);
      return false;
    }
  }

  /**
   * Loads real-time latency data from JSON file
   * @returns {boolean} Success status
   */
  loadRealTimeLatencyData() {
    try {
      // Look for latency data in the latency directory
      const latencyDir = path.join(this.basePath, 'results', 'latency', this.testName);

      if (!fs.existsSync(latencyDir)) {
        // Try generic latency directory if test-specific doesn't exist
        const genericLatencyDir = path.join(this.basePath, 'results', 'latency');
        if (!fs.existsSync(genericLatencyDir)) {
          console.log('No latency directory found, real-time latency will not be included');
          return false;
        }

        // Find the latest latency file in the generic directory
        const latencyFile = this.findLatestFile(genericLatencyDir, '');
        if (!latencyFile) {
          console.log('No latency file found, real-time latency will not be included');
          return false;
        }

        console.log(`Using latency file: ${latencyFile}`);
        this.latencyData = JSON.parse(fs.readFileSync(path.join(genericLatencyDir, latencyFile)));
        return true;
      }

      // Find the latest latency file in the test-specific directory
      const latencyFile = this.findLatestFile(latencyDir, '');
      if (!latencyFile) {
        console.log('No latency file found, real-time latency will not be included');
        return false;
      }

      console.log(`Using latency file: ${latencyFile}`);
      this.latencyData = JSON.parse(fs.readFileSync(path.join(latencyDir, latencyFile)));
      return true;
    } catch (error) {
      console.error(`Warning: Could not load real-time latency data: ${error.message}`);
      return false;
    }
  }

  /**
   * Extracts key metrics from Artillery report
   */
  processArtilleryMetrics() {
    try {
      if (!this.reportData) {
        throw new Error('No report data loaded');
      }

      const { aggregate = {}, firstMetricAt } = this.reportData;
      const { counters = {}, summaries = {}, rates = {} } = aggregate;

      // Get response time data or use defaults
      const latencies = summaries['http.response_time'] || {};
      const rps = rates['http.request_rate'] || {};

      // Setup metrics structure with safe defaults
      this.artilleryMetrics = {
        timestamp: new Date(firstMetricAt || Date.now()).toISOString(),
        scenarios: {
          created: counters['vusers.created'] || 0,
          completed: counters['vusers.completed'] || 0,
          success: 0,
        },
        requests: {
          total: counters['http.requests'] || 0,
          completed: (counters['http.requests'] || 0) - (counters['http.errors'] || 0),
          failed: counters['http.errors'] || 0,
          success_rate: 0,
        },
        responses: {
          latencies: {
            min: latencies.min || 0,
            max: latencies.max || 0,
            median: latencies.median || 0,
            p75: latencies.p75 || 0,
            p90: latencies.p90 || 0,
            p95: latencies.p95 || 0,
            p99: latencies.p99 || 0,
            avg: latencies.mean || 0,
          },
          rps: {
            mean: typeof rps === 'number' ? rps : rps.mean || 0,
            max: typeof rps === 'number' ? rps : rps.max || 0,
            count: typeof rps === 'number' ? 0 : rps.count || 0,
          },
        },
        endpoints: {},
        codes: {},
      };

      // Calculate success rates
      const { scenarios, requests } = this.artilleryMetrics;
      scenarios.success = scenarios.created ? (scenarios.completed / scenarios.created) * 100 : 100;

      requests.success_rate = requests.total ? ((requests.total - requests.failed) / requests.total) * 100 : 100;

      // Extract HTTP status codes
      Object.entries(counters).forEach(([key, value]) => {
        if (key.startsWith('http.codes.')) {
          const code = key.replace('http.codes.', '');
          this.artilleryMetrics.codes[code] = value;
        }
      });

      // Extract per-endpoint metrics
      if (summaries) {
        Object.entries(summaries).forEach(([key, value]) => {
          if (key.startsWith('plugins.metrics-by-endpoint.response_time.')) {
            const endpoint = key.replace('plugins.metrics-by-endpoint.response_time.', '');
            this.artilleryMetrics.endpoints[endpoint] = value;
          }
        });
      }

      return true;
    } catch (error) {
      console.error(`Error processing Artillery metrics: ${error.message}`);
      return false;
    }
  }

  /**
   * Processes resource monitoring data
   */
  processResourceMetrics() {
    try {
      if (!this.metricsData || this.metricsData.length === 0) {
        return false;
      }

      // Helper function to safely get min/max/avg from array
      const calcStats = (data, field) => {
        const values = data.map((row) => row[field]).filter((v) => !isNaN(v));
        if (values.length === 0) return { min: 0, max: 0, avg: 0 };

        return {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        };
      };

      // Calculate stats for each metric
      this.resourceMetrics = {
        cpu: calcStats(this.metricsData, 'cpu_load'),
        memory: calcStats(this.metricsData, 'memory_percent'),
        heap: calcStats(this.metricsData, 'heap_used_mb'),
      };

      return true;
    } catch (error) {
      console.error(`Warning: Error processing resource metrics: ${error.message}`);
      return false;
    }
  }

  processRealTimeLatencyMetrics() {
    try {
      if (!this.latencyData || this.latencyData.length === 0) {
        return false;
      }

      // Extract latency values
      const latencies = this.latencyData
        .map((item) => item.realtimeLatency)
        .filter((l) => typeof l === 'number' && !isNaN(l))
        .sort((a, b) => a - b);

      if (latencies.length === 0) {
        console.log('No valid real-time latency values found');
        return false;
      }

      // Calculate percentiles
      const getPercentile = (arr, p) => {
        const index = Math.floor(arr.length * (p / 100));
        return arr[index];
      };

      this.realTimeLatencyMetrics = {
        count: latencies.length,
        min: latencies[0],
        max: latencies[latencies.length - 1],
        median: getPercentile(latencies, 50),
        p75: getPercentile(latencies, 75),
        p90: getPercentile(latencies, 90),
        p95: getPercentile(latencies, 95),
        p99: getPercentile(latencies, 99),
        avg: latencies.reduce((sum, val) => sum + val, 0) / latencies.length,
      };

      return true;
    } catch (error) {
      console.error(`Warning: Error processing real-time latency metrics: ${error.message}`);
      return false;
    }
  }

  /**
   * Generates markdown report from processed metrics
   * @returns {Object} Report path and content
   */
  generateMarkdownReport() {
    try {
      if (!this.artilleryMetrics) {
        throw new Error('No metrics data available');
      }

      const reportId = `${this.phaseName}-${Date.now()}`;

      // Format helper function
      const fmt = (num) => {
        if (typeof num !== 'number') return 'N/A';
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
      };

      // Build report title based on phase info
      const title =
        this.phaseName !== 'all'
          ? `# Load Test Summary Report: ${this.testName} (${this.phaseName} phase)`
          : `# Load Test Summary Report: ${this.testName}`;

      // Build Markdown report sections
      const sections = {
        overview: `## 📊 Test Overview

\`\`\`
Test Date:          ${new Date().toLocaleDateString()}
Phase:              ${this.phaseName}
Total Requests:     ${fmt(this.artilleryMetrics.requests.total)}
Request Rate:       ${fmt(this.artilleryMetrics.responses.rps.mean)} req/sec (avg)
Virtual Users:      ${fmt(this.artilleryMetrics.scenarios.created)}
Successful Requests: ${this.artilleryMetrics.requests.success_rate.toFixed(1)}%
\`\`\``,

        responseTimes: `## 📈 Response Time Summary

| Metric | Value |
|--------|-------|
| Min    | ${fmt(this.artilleryMetrics.responses.latencies.min)} ms |
| Median (p50) | ${fmt(this.artilleryMetrics.responses.latencies.median)} ms |
| p75    | ${fmt(this.artilleryMetrics.responses.latencies.p75)} ms |
| p90    | ${fmt(this.artilleryMetrics.responses.latencies.p90)} ms |
| p95    | ${fmt(this.artilleryMetrics.responses.latencies.p95)} ms |
| p99    | ${fmt(this.artilleryMetrics.responses.latencies.p99)} ms |
| Max    | ${fmt(this.artilleryMetrics.responses.latencies.max)} ms |
| Avg    | ${fmt(this.artilleryMetrics.responses.latencies.avg)} ms |`,

        throughput: `## 🚦 Throughput

| Metric | Value |
|--------|-------|
| Avg Request Rate | ${fmt(this.artilleryMetrics.responses.rps.mean)} req/sec |
| Peak Request Rate | ${fmt(this.artilleryMetrics.responses.rps.max)} req/sec |
| Total Requests | ${fmt(this.artilleryMetrics.requests.total)} |
| Completed Scenarios | ${fmt(this.artilleryMetrics.scenarios.completed)} |`,

        realTimeLatency: this.realTimeLatencyMetrics
          ? `## ⚡ Real-Time Latency Summary

| Metric | Value |
|--------|-------|
| Min    | ${fmt(this.realTimeLatencyMetrics.min)} ms |
| Median (p50) | ${fmt(this.realTimeLatencyMetrics.median)} ms |
| p75    | ${fmt(this.realTimeLatencyMetrics.p75)} ms |
| p90    | ${fmt(this.realTimeLatencyMetrics.p90)} ms |
| p95    | ${fmt(this.realTimeLatencyMetrics.p95)} ms |
| p99    | ${fmt(this.realTimeLatencyMetrics.p99)} ms |
| Max    | ${fmt(this.realTimeLatencyMetrics.max)} ms |
| Avg    | ${fmt(this.realTimeLatencyMetrics.avg)} ms |
| Total Measurements | ${fmt(this.realTimeLatencyMetrics.count)} |`
          : '',

        resources: this.resourceMetrics
          ? `## 📉 Resource Utilization

| Resource | Average | Peak |
|----------|---------|------|
| CPU      | ${this.resourceMetrics.cpu.avg.toFixed(1)}% | ${this.resourceMetrics.cpu.max.toFixed(1)}% |
| Memory   | ${this.resourceMetrics.memory.avg.toFixed(1)}% | ${this.resourceMetrics.memory.max.toFixed(1)}% |
| Heap     | ${this.resourceMetrics.heap.avg.toFixed(1)} MB | ${this.resourceMetrics.heap.max.toFixed(1)} MB |`
          : '',

        endpoints: `## 🔍 Endpoint Performance

| Endpoint | Count | Median (ms) | p95 (ms) | p99 (ms) |
|----------|-------|-------------|----------|----------|
${Object.entries(this.artilleryMetrics.endpoints)
  .map(([endpoint, data]) => `| \`${endpoint}\` | ${fmt(data.count)} | ${fmt(data.median)} | ${fmt(data.p95)} | ${fmt(data.p99)} |`)
  .join('\n')}`,

        analysis: `## 💡 Analysis

${
  this.artilleryMetrics.responses.latencies.p95 < 50
    ? '- **Excellent performance**: 95% of requests complete in under 50ms'
    : this.artilleryMetrics.responses.latencies.p95 < 200
    ? '- **Good performance**: 95% of requests complete in under 200ms'
    : this.artilleryMetrics.responses.latencies.p95 < 500
    ? '- **Acceptable performance**: 95% of requests complete in under 500ms'
    : '- **Performance needs improvement**: 95% of requests take more than 500ms'
}

${
  this.artilleryMetrics.requests.failed > 0
    ? `- **${this.artilleryMetrics.requests.failed} failed requests**: Review error responses to identify issues`
    : '- **No failed requests**: All requests completed successfully'
}

${
  this.realTimeLatencyMetrics
    ? this.realTimeLatencyMetrics.p95 < 50
      ? '\n- **Excellent real-time performance**: 95% of real-time updates arrive in under 50ms'
      : this.realTimeLatencyMetrics.p95 < 100
      ? '\n- **Good real-time performance**: 95% of real-time updates arrive in under 100ms'
      : this.realTimeLatencyMetrics.p95 < 200
      ? '\n- **Acceptable real-time performance**: 95% of real-time updates arrive in under 200ms'
      : '\n- **Real-time performance needs improvement**: 95% of real-time updates take more than 200ms'
    : ''
}

${
  this.resourceMetrics && this.resourceMetrics.cpu.max > 70
    ? '- **High CPU usage**: Peak CPU usage exceeded 70%, consider scaling resources'
    : this.resourceMetrics
    ? '- **CPU usage acceptable**: System has adequate CPU resources'
    : ''
}

${
  this.resourceMetrics && this.resourceMetrics.memory.avg > 75
    ? '- **High memory usage**: Average memory usage exceeded 75%, consider scaling memory'
    : this.resourceMetrics
    ? '- **Memory usage acceptable**: System has adequate memory'
    : ''
}`,

        conclusion: `## 📝 Conclusion

${
  this.artilleryMetrics.responses.latencies.p95 < 100 && this.artilleryMetrics.requests.failed === 0
    ? 'The system performed excellently under load, with fast response times and no errors.'
    : this.artilleryMetrics.responses.latencies.p95 < 300 && this.artilleryMetrics.requests.success_rate > 99
    ? 'The system performed well under load, with good response times and minimal errors.'
    : 'The system showed some performance issues under load that may require optimization.'
}

${
  this.resourceMetrics && (this.resourceMetrics.cpu.max > 80 || this.resourceMetrics.memory.max > 80)
    ? 'Resource monitoring indicates potential bottlenecks that may require scaling the infrastructure.'
    : this.resourceMetrics
    ? 'Resource monitoring shows adequate system capacity for the current load.'
    : 'Resource utilization data not available.'
}`,
      };

      // Assemble the full report
      const markdown = [
        title,
        sections.overview,
        sections.responseTimes,
        sections.throughput,
        sections.realTimeLatency,
        sections.resources,
        sections.endpoints,
        sections.analysis,
        sections.conclusion,
      ]
        .filter(Boolean)
        .join('\n\n');

      // Write to file
      const mdPath = path.join(this.paths.output, `${reportId}.md`);
      fs.writeFileSync(mdPath, markdown);
      this.outputFiles.push(mdPath);

      return { mdPath, markdown };
    } catch (error) {
      console.error(`Error generating report: ${error.message}`);
      return { mdPath: null, markdown: null };
    }
  }

  /**
   * Prints summary statistics to console
   */
  printSummary() {
    if (!this.artilleryMetrics) return;

    console.log('\n══════════ LOAD TEST SUMMARY ══════════');

    // Main statistics
    console.log('\n📊 Key Metrics:');
    console.log(
      `• Requests: ${this.artilleryMetrics.requests.total} total, ` +
        `${this.artilleryMetrics.requests.failed} failed ` +
        `(${this.artilleryMetrics.requests.success_rate.toFixed(1)}% success)`
    );
    console.log(
      `• 'Response Time: ${this.artilleryMetrics.responses.latencies.median} ms median, ` + `${this.artilleryMetrics.responses.latencies.p95} ms p95`
    );
    console.log(`• Throughput: ${this.artilleryMetrics.responses.rps.mean.toFixed(1)} req/sec average`);

    // Resource metrics (if available)
    if (this.resourceMetrics) {
      console.log('\n📈 Resource Usage:');
      console.log(`• CPU: ${this.resourceMetrics.cpu.avg.toFixed(1)}% avg, ` + `${this.resourceMetrics.cpu.max.toFixed(1)}% peak`);
      console.log(`• Memory: ${this.resourceMetrics.memory.avg.toFixed(1)}% avg, ` + `${this.resourceMetrics.memory.max.toFixed(1)}% peak`);
    }

    // Output files
    console.log('\n📄 Generated Reports:');
    this.outputFiles.forEach((file) => {
      console.log(`• ${file}`);
    });

    console.log('\n══════════════════════════════════════');
  }

  /**
   * Prints a preview of the markdown report
   * @param {string} markdown - Markdown content
   * @param {number} lines - Number of lines to preview
   */
  printReportPreview(markdown, lines = 15) {
    if (!markdown) return;

    console.log('\n----- REPORT PREVIEW -----\n');
    const previewLines = markdown.split('\n').slice(0, lines);
    console.log(previewLines.join('\n'));
    console.log('\n...(see full report in file)');
  }

  /**
   * Main method to generate the complete report
   */
  async generateReport() {
    console.log(`Generating summary report for test: ${this.testName}`);
    console.log(`Phase: ${this.phaseName}`);

    try {
      // Setup and load data
      this.ensureDirectoriesExist();
      if (!this.loadReportData()) {
        throw new Error('Failed to load report data');
      }
      this.loadMetricsData(); // Optional, can proceed without metrics
      this.loadRealTimeLatencyData(); // Optional, can proceed without real-time latency

      // Process metrics
      if (!this.processArtilleryMetrics()) {
        throw new Error('Failed to process Artillery metrics');
      }
      this.processResourceMetrics(); // Optional
      this.processRealTimeLatencyMetrics(); // Optional

      // Generate report
      const { mdPath, markdown } = this.generateMarkdownReport();
      if (!mdPath) {
        throw new Error('Failed to generate report');
      }

      // Output results
      this.printSummary();
      this.printReportPreview(markdown);

      return { success: true, files: this.outputFiles };
    } catch (error) {
      console.error(`\n❌ Report generation failed: ${error.message}`);
      return { success: false, error };
    }
  }
}

//==============================================================================
// MAIN EXECUTION
//==============================================================================

// Get command line arguments
const args = process.argv.slice(2);
const testName = args[0] || 'default';
const phaseName = args[1] || 'all';

// Generate report
const generator = new TestReportGenerator(testName, phaseName);
generator.generateReport().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
