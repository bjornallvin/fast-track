#!/usr/bin/env node

/**
 * Network Traffic Analyzer for Smart Scale
 *
 * This script helps analyze network traffic from your smart scale
 * to understand how it communicates with Garmin.
 *
 * Usage:
 * 1. First, capture traffic using tcpdump:
 *    sudo tcpdump -i en0 -w scale_traffic.pcap host <scale_ip>
 *
 * 2. Or use Wireshark to export as JSON:
 *    tshark -r scale_traffic.pcap -T json > traffic.json
 *
 * 3. Then analyze with this script:
 *    node network-analyzer.js traffic.json
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const url = require('url');

// Common Garmin endpoints to look for
const GARMIN_ENDPOINTS = [
  'connect.garmin.com',
  'api.garmin.com',
  'sso.garmin.com',
  'connectapi.garmin.com',
  'services.garmin.com'
];

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--monitor')) {
  // Real-time monitoring mode
  console.log('Starting real-time network monitor...');
  console.log('Note: This requires root access and proper network configuration');
  console.log('\nTo capture scale traffic:');
  console.log('1. Find your scale\'s IP address (check router DHCP clients)');
  console.log('2. Run: sudo tcpdump -i en0 -A host <scale_ip>');
  console.log('\nLook for:');
  console.log('- HTTP/HTTPS requests to Garmin domains');
  console.log('- JSON or XML payloads with weight data');
  console.log('- Authentication headers (OAuth, API keys)');
  console.log('- API endpoints and paths');

  startProxyServer();
} else if (args[0]) {
  // Analyze captured traffic
  analyzeTrafficFile(args[0]);
} else {
  showHelp();
}

function showHelp() {
  console.log(`
Smart Scale Network Analyzer

This tool helps you understand how your smart scale communicates with Garmin.

Usage:
  node network-analyzer.js [options] [file]

Options:
  --monitor    Start a local proxy server to monitor traffic
  --help       Show this help message

Examples:
  # Analyze captured traffic
  node network-analyzer.js traffic.json

  # Start monitoring proxy
  node network-analyzer.js --monitor

To capture traffic from your scale:

Method 1: Using tcpdump (Mac/Linux)
  1. Find scale IP: arp -a | grep -i garmin
  2. Capture: sudo tcpdump -i en0 -w scale.pcap host <scale_ip>
  3. Convert: tshark -r scale.pcap -T json > traffic.json
  4. Analyze: node network-analyzer.js traffic.json

Method 2: Using Wireshark
  1. Start Wireshark capture
  2. Filter by scale's IP or MAC address
  3. Weigh yourself on the scale
  4. Stop capture and export as JSON
  5. Analyze with this script

Method 3: Router-based capture
  1. Enable logging on your router
  2. Filter by scale's MAC address
  3. Export logs and analyze
  `);
}

function analyzeTrafficFile(filename) {
  console.log(`Analyzing traffic file: ${filename}\n`);

  try {
    const data = fs.readFileSync(filename, 'utf8');
    const packets = JSON.parse(data);

    let garminRequests = [];
    let possibleAuth = [];
    let dataPayloads = [];

    packets.forEach(packet => {
      // Look for HTTP/HTTPS traffic
      if (packet._source && packet._source.layers) {
        const layers = packet._source.layers;

        // Check for HTTP
        if (layers.http) {
          const http = layers.http;
          const host = http['http.host'];

          if (host && GARMIN_ENDPOINTS.some(endpoint => host.includes(endpoint))) {
            garminRequests.push({
              host: host,
              method: http['http.request.method'],
              path: http['http.request.uri'],
              headers: extractHeaders(http),
              body: http['http.file_data']
            });
          }

          // Look for authentication
          if (http['http.authorization']) {
            possibleAuth.push({
              type: 'Authorization Header',
              value: http['http.authorization']
            });
          }
        }

        // Check for TLS/SSL
        if (layers.tls) {
          const tls = layers.tls;
          if (tls['tls.handshake.extensions_server_name']) {
            const serverName = tls['tls.handshake.extensions_server_name'];
            if (GARMIN_ENDPOINTS.some(endpoint => serverName.includes(endpoint))) {
              console.log(`TLS connection to Garmin: ${serverName}`);
            }
          }
        }

        // Look for data patterns (weight, body composition)
        if (layers.data) {
          const rawData = layers.data['data.data'];
          if (rawData) {
            // Try to decode as ASCII/UTF-8
            const decoded = Buffer.from(rawData.replace(/:/g, ''), 'hex').toString();

            // Look for JSON patterns
            if (decoded.includes('weight') || decoded.includes('bodyFat') ||
                decoded.includes('mass') || decoded.includes('metric')) {
              dataPayloads.push(decoded);
            }
          }
        }
      }
    });

    // Display results
    if (garminRequests.length > 0) {
      console.log('=== Garmin API Requests Found ===\n');
      garminRequests.forEach(req => {
        console.log(`${req.method} https://${req.host}${req.path}`);
        if (req.headers) {
          console.log('Headers:', req.headers);
        }
        if (req.body) {
          console.log('Body:', req.body);
        }
        console.log('---');
      });
    }

    if (possibleAuth.length > 0) {
      console.log('\n=== Authentication Found ===\n');
      possibleAuth.forEach(auth => {
        console.log(`${auth.type}: ${auth.value}`);
      });
    }

    if (dataPayloads.length > 0) {
      console.log('\n=== Possible Data Payloads ===\n');
      dataPayloads.forEach(payload => {
        console.log(payload.substring(0, 200) + '...');
        console.log('---');
      });
    }

    if (garminRequests.length === 0 && dataPayloads.length === 0) {
      console.log('No Garmin traffic found. The scale might:');
      console.log('- Use a different API endpoint');
      console.log('- Use encrypted/binary protocol');
      console.log('- Not have synced during capture');
      console.log('\nTry weighing yourself while capturing traffic.');
    }

  } catch (error) {
    console.error('Error analyzing file:', error.message);
    console.log('\nMake sure the file is valid JSON from Wireshark/tshark export.');
  }
}

function extractHeaders(httpLayer) {
  const headers = {};
  Object.keys(httpLayer).forEach(key => {
    if (key.startsWith('http.request.header.')) {
      const headerName = key.replace('http.request.header.', '');
      headers[headerName] = httpLayer[key];
    }
  });
  return headers;
}

function startProxyServer() {
  // Create a simple HTTP proxy to intercept scale traffic
  const proxy = http.createServer((req, res) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      if (body) {
        console.log('Body:', body);

        // Try to parse as JSON
        try {
          const jsonBody = JSON.parse(body);
          if (jsonBody.weight || jsonBody.bodyFat || jsonBody.bodyComposition) {
            console.log('\n🎯 WEIGHT DATA DETECTED:');
            console.log(JSON.stringify(jsonBody, null, 2));

            // Save to file for later use
            fs.appendFileSync('captured_scale_data.json',
              JSON.stringify({ timestamp: new Date(), data: jsonBody }) + '\n');
          }
        } catch (e) {
          // Not JSON
        }
      }

      // Forward the request
      const urlParts = url.parse(req.url);
      const options = {
        hostname: urlParts.hostname,
        port: urlParts.port,
        path: urlParts.path,
        method: req.method,
        headers: req.headers
      };

      const proxyReq = (urlParts.protocol === 'https:' ? https : http).request(options, proxyRes => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', err => {
        console.error('Proxy error:', err);
        res.writeHead(500);
        res.end('Proxy error');
      });

      if (body) {
        proxyReq.write(body);
      }
      proxyReq.end();
    });
  });

  proxy.listen(8888, () => {
    console.log('\n📡 Proxy server running on port 8888');
    console.log('\nTo use:');
    console.log('1. Configure your scale to use proxy: 192.168.1.x:8888 (your Mac\'s IP)');
    console.log('2. Or configure your router to redirect scale traffic through this proxy');
    console.log('3. Weigh yourself and watch the console for traffic\n');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});