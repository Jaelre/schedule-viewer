#!/usr/bin/env node

/**
 * MetricAid API Explorer
 * Carefully explores the API to understand data structures
 *
 * Makes ONLY ONE REQUEST per run to avoid rate limiting
 */

const fs = require('fs');
const path = require('path');

// Configuration from .dev.vars and wrangler.toml
const API_BASE_URL = 'https://api.metricaid.com';
const API_TOKEN = 'dbbda7b7-08bb-475a-89f1-0e63234c4c74';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../.api-samples');

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

async function exploreAPI(ym) {
  const { startDate, endDate } = getDateRange(ym);

  console.log('🔍 MetricAid API Explorer');
  console.log('========================\n');
  console.log(`📅 Month: ${ym}`);
  console.log(`📆 Date Range: ${startDate} to ${endDate}`);
  console.log(`🌐 Base URL: ${API_BASE_URL}`);
  console.log(`🔑 Token: ${API_TOKEN.substring(0, 8)}...`);
  console.log('');

  // The actual endpoint from lib.rs line 132
  const url = `${API_BASE_URL}/public/schedule?token=${API_TOKEN}&startDate=${startDate}&endDate=${endDate}&scheduleVersion=live`;

  console.log('📡 Making request to:');
  console.log(`   /public/schedule?token=***&startDate=${startDate}&endDate=${endDate}&scheduleVersion=live`);
  console.log('');
  console.log('⏳ Waiting for response...');
  console.log('');

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    const elapsed = Date.now() - startTime;

    console.log(`✅ Response received in ${elapsed}ms`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:');
      console.error(errorText);
      return;
    }

    const data = await response.json();

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save full response
    const filename = `metricaid-response-${ym}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log(`💾 Full response saved to: ${filepath}`);
    console.log('');

    // Analyze structure
    analyzeResponse(data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

function analyzeResponse(data) {
  console.log('📊 Response Analysis');
  console.log('===================\n');

  // Top-level structure
  console.log('🔑 Top-level keys:');
  Object.keys(data).forEach(key => {
    const value = data[key];
    const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
    console.log(`   - ${key}: ${type}`);
  });
  console.log('');

  // If there's a data array, analyze first item
  const dataArray = data.data || (Array.isArray(data) ? data : null);
  if (dataArray && dataArray.length > 0) {
    const firstItem = dataArray[0];

    console.log('📝 First data item structure:');
    console.log(JSON.stringify(firstItem, null, 2));
    console.log('');

    console.log('🗂️  Data item fields:');
    analyzeObject(firstItem, '   ');
    console.log('');

    // Sample a few more items to see variations
    if (dataArray.length > 1) {
      console.log(`📚 Sampling ${Math.min(3, dataArray.length)} items:`);
      dataArray.slice(0, 3).forEach((item, idx) => {
        console.log(`\n   Item ${idx + 1}:`);
        console.log(`   - shift: ${item.shift?.name || '?'} (${item.shift?.abbreviation || 'no abbrev'})`);
        console.log(`   - user: ${item.user?.first_name || '?'} ${item.user?.last_name || '?'} (ID: ${item.user?.id || 'null'})`);
        console.log(`   - start_time: ${item.start_time || '?'}`);
        console.log(`   - end_time: ${item.end_time || '?'}`);
      });
      console.log('');
    }

    // Statistics
    console.log('📈 Statistics:');
    console.log(`   Total records: ${dataArray.length}`);

    const uniqueShifts = new Set(dataArray.map(d => d.shift?.name || d.shift?.abbreviation).filter(Boolean));
    console.log(`   Unique shifts: ${uniqueShifts.size}`);
    console.log(`   Shift types: ${[...uniqueShifts].sort().join(', ')}`);

    const uniqueUsers = new Set(dataArray.map(d => d.user?.id || `${d.user?.first_name}_${d.user?.last_name}`).filter(Boolean));
    console.log(`   Unique users: ${uniqueUsers.size}`);
    console.log('');
  } else {
    console.log('⚠️  No data array found or empty response');
  }

  // Look for pagination or metadata
  if (data.meta || data.pagination || data.total) {
    console.log('📄 Metadata found:');
    if (data.meta) console.log('   meta:', JSON.stringify(data.meta));
    if (data.pagination) console.log('   pagination:', JSON.stringify(data.pagination));
    if (data.total) console.log('   total:', data.total);
    console.log('');
  }
}

function analyzeObject(obj, indent = '') {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null) {
      console.log(`${indent}${key}: null`);
    } else if (Array.isArray(value)) {
      console.log(`${indent}${key}: array[${value.length}]`);
      if (value.length > 0 && typeof value[0] === 'object') {
        console.log(`${indent}  First item:`);
        analyzeObject(value[0], indent + '    ');
      }
    } else if (typeof value === 'object') {
      console.log(`${indent}${key}: object`);
      analyzeObject(value, indent + '  ');
    } else {
      console.log(`${indent}${key}: ${typeof value} = ${value}`);
    }
  });
}

// Run exploration
const ym = process.argv[2] || getCurrentYM();
console.log('⚠️  This script makes ONE API request\n');

exploreAPI(ym).then(() => {
  console.log('✅ Exploration complete!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Review the saved JSON file in .api-samples/');
  console.log('   2. Compare with the Rust types in worker/src/lib.rs');
  console.log('   3. Adjust transform logic if needed');
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
