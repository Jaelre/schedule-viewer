#!/usr/bin/env node

/**
 * API Inspector Script
 * Queries the MetricAid API and saves the response for inspection
 *
 * Usage:
 *   node scripts/inspect-api.js [YYYY-MM]
 *
 * Example:
 *   node scripts/inspect-api.js 2025-10
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.metricaid.com/api/v1';
const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: API_TOKEN environment variable not set');
  console.error('Set it with: export API_TOKEN="your-token-here"');
  process.exit(1);
}

// Parse command line arguments
const ym = process.argv[2] || getCurrentYM();

function getCurrentYM() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getDateRange(ym) {
  const [year, month] = ym.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

async function fetchShifts(ym) {
  const { startDate, endDate } = getDateRange(ym);

  console.log(`📅 Fetching shifts for ${ym}`);
  console.log(`   Date range: ${startDate} to ${endDate}`);
  console.log(`   API: ${API_BASE_URL}`);
  console.log('');

  const url = `${API_BASE_URL}/shifts?start_time=${startDate}&end_time=${endDate}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Save full response
    const outputDir = path.join(__dirname, '../.api-samples');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `shifts-${ym}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log(`✅ Success! Response saved to: ${filepath}`);
    console.log('');
    console.log('📊 Response Summary:');
    console.log(`   Total records: ${Array.isArray(data) ? data.length : (data.data?.length || 'unknown')}`);

    // Show sample record structure
    const sampleRecord = Array.isArray(data) ? data[0] : data.data?.[0];
    if (sampleRecord) {
      console.log('');
      console.log('📝 Sample Record Structure:');
      console.log(JSON.stringify(sampleRecord, null, 2));

      console.log('');
      console.log('🔑 Available Fields:');
      Object.keys(sampleRecord).forEach(key => {
        const value = sampleRecord[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`   - ${key}: ${type}`);
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    process.exit(1);
  }
}

// Run the script
fetchShifts(ym);
