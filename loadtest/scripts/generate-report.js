const fs = require('fs');
const path = require('path');

//==============================================================================
// REPORT GENERATOR CLASS
//==============================================================================

class TestReportGenerator {
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

  ensureDirectoriesExist() {
    Object.values(this.paths).forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

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

  loadEndToEndLatencyData() {
    try {
      // Look for e2e latency data in the e2e-latency directory
      const latencyDir = path.join(this.basePath, 'results', 'e2e-latency', this.testName);

      if (!fs.existsSync(latencyDir)) {
        console.log('No e2e-latency directory found, end-to-end latency will not be included');
        return false;
      }

      // List all files for debugging
      const allFiles = fs.readdirSync(latencyDir);
      console.log(`DEBUG: Found ${allFiles.length} files in latency dir:`, allFiles);

      // Use the phase name as the file prefix instead of "e2e-latency-"
      const phasePrefix = this.phaseName !== 'all' ? this.phaseName : '';

      // Find the latest latency file in the directory
      const latencyFile = this.findLatestFile(latencyDir, phasePrefix);

      if (!latencyFile) {
        console.log(`No latency file with prefix "${phasePrefix}" found, end-to-end latency will not be included`);
        return false;
      }

      console.log(`Using e2e-latency file: ${latencyFile}`);
      this.e2eLatencyData = JSON.parse(fs.readFileSync(path.join(latencyDir, latencyFile)));

      // Field name mapping - accommodate your existing field names
      this.e2eLatencyData = this.e2eLatencyData.map((item) => ({
        clientRequestTime: item.clientRequestTime,
        clientReceiveTime: item.clientReceiveTime,
        e2eLatency: item.e2eLatency,
        discussionId: item.discussionId,
      }));
      return true;
    } catch (error) {
      console.error(`Warning: Could not load end-to-end latency data: ${error.message}`);
      return false;
    }
  }

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

  processEndToEndLatencyMetrics() {
    try {
      if (!this.e2eLatencyData || this.e2eLatencyData.length === 0) {
        return false;
      }

      // Extract only completed requests with end-to-end latency
      const completedRequests = this.e2eLatencyData.filter(
        (item) => item.e2eLatency && !isNaN(item.e2eLatency) && item.clientRequestTime && item.clientReceiveTime
      );

      if (completedRequests.length === 0) {
        console.log('No valid end-to-end latency measurements found');
        return false;
      }

      // Sort latencies for percentile calculations
      const e2eLatencies = completedRequests.map((item) => item.e2eLatency).sort((a, b) => a - b);

      // Calculate percentiles
      const getPercentile = (arr, p) => {
        const index = Math.floor(arr.length * (p / 100));
        return arr[index];
      };

      this.e2eLatencyMetrics = {
        count: e2eLatencies.length,
        min: e2eLatencies[0],
        max: e2eLatencies[e2eLatencies.length - 1],
        median: getPercentile(e2eLatencies, 50),
        p75: getPercentile(e2eLatencies, 75),
        p90: getPercentile(e2eLatencies, 90),
        p95: getPercentile(e2eLatencies, 95),
        p99: getPercentile(e2eLatencies, 99),
        avg: e2eLatencies.reduce((sum, val) => sum + val, 0) / e2eLatencies.length,
      };

      return true;
    } catch (error) {
      console.error(`Warning: Error processing end-to-end latency metrics: ${error.message}`);
      return false;
    }
  }

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

        e2eLatency: this.e2eLatencyMetrics
          ? `## ⚡ End-to-End Latency Summary

| Metric | Value |
|--------|-------|
| Min    | ${fmt(this.e2eLatencyMetrics.min)} ms |
| Median (p50) | ${fmt(this.e2eLatencyMetrics.median)} ms |
| p75    | ${fmt(this.e2eLatencyMetrics.p75)} ms |
| p90    | ${fmt(this.e2eLatencyMetrics.p90)} ms |
| p95    | ${fmt(this.e2eLatencyMetrics.p95)} ms |
| p99    | ${fmt(this.e2eLatencyMetrics.p99)} ms |
| Max    | ${fmt(this.e2eLatencyMetrics.max)} ms |
| Avg    | ${fmt(this.e2eLatencyMetrics.avg)} ms |
| Total Measurements | ${fmt(this.e2eLatencyMetrics.count)} |`
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
  this.e2eLatencyMetrics
    ? this.e2eLatencyMetrics.p95 < 100
      ? '\n- **Excellent end-to-end performance**: 95% of real-time updates arrive in under 100ms'
      : this.e2eLatencyMetrics.p95 < 200
      ? '\n- **Good end-to-end performance**: 95% of real-time updates arrive in under 200ms'
      : this.e2eLatencyMetrics.p95 < 500
      ? '\n- **Acceptable end-to-end performance**: 95% of real-time updates arrive in under 500ms'
      : '\n- **End-to-end performance needs improvement**: 95% of real-time updates take more than 500ms'
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
        sections.e2eLatency,
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
      this.loadEndToEndLatencyData(); // Optional, can proceed without e2e latency

      // Process metrics
      if (!this.processArtilleryMetrics()) {
        throw new Error('Failed to process Artillery metrics');
      }
      this.processResourceMetrics(); // Optional
      this.processEndToEndLatencyMetrics(); // Optional

      // Generate report
      const { mdPath, markdown } = this.generateMarkdownReport();
      if (!mdPath) {
        throw new Error('Failed to generate report');
      }

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
