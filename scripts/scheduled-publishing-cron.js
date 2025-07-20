#!/usr/bin/env node

/**
 * 🚀 SCHEDULED PUBLISHING CRON JOB
 * Đơn giản, độc lập, chạy mỗi phút
 * 
 * Usage:
 * node scripts/scheduled-publishing-cron.js
 * 
 * Crontab:
 * * * * * * /usr/bin/node /path/to/your/project/scripts/scheduled-publishing-cron.js
 */

const https = require('https');
const http = require('http');

// 🔧 Configuration
const CONFIG = {
  // URL của API endpoint
  API_URL: process.env.SCHEDULED_PUBLISHING_API_URL || 'http://localhost:4321/api/admin/scheduled-publishing',
  
  // Auth token (có thể set từ env)
  AUTH_TOKEN: process.env.SCHEDULED_PUBLISHING_TOKEN || 'your-secret-token-here',
  
  // Timeout
  TIMEOUT: 30000, // 30 seconds
  
  // Retry
  MAX_RETRIES: 3
};

/**
 * 📡 Gọi API để trigger scheduled publishing
 */
async function triggerScheduledPublishing() {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.API_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify({ action: 'process' });
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
      },
      timeout: CONFIG.TIMEOUT
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: result
          });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 🔄 Main function với retry logic
 */
async function main() {
  const startTime = Date.now();
  console.log(`🚀 [${new Date().toISOString()}] Starting scheduled publishing cron job...`);
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${CONFIG.MAX_RETRIES}: Calling API...`);
      
      const response = await triggerScheduledPublishing();
      
      if (response.statusCode === 200 && response.data.success) {
        const duration = Date.now() - startTime;
        const { published, errors } = response.data.data;
        
        console.log(`✅ [${new Date().toISOString()}] Success! Published ${published} articles in ${duration}ms`);
        
        if (errors && errors.length > 0) {
          console.warn(`⚠️ Warnings: ${errors.join(', ')}`);
        }
        
        process.exit(0);
      } else {
        throw new Error(`API returned error: ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = attempt * 1000; // 1s, 2s, 3s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Tất cả attempts đều fail
  const duration = Date.now() - startTime;
  console.error(`💥 [${new Date().toISOString()}] All attempts failed after ${duration}ms`);
  console.error(`💥 Last error:`, lastError?.message);
  process.exit(1);
}

/**
 * 🎯 Run the job
 */
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { main, triggerScheduledPublishing };
