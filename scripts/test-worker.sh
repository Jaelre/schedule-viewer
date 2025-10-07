#!/bin/bash

echo "Testing Worker Endpoint"
echo "======================="
echo ""

echo "1. Testing connection..."
if curl -s --connect-timeout 2 "http://localhost:8787" > /dev/null 2>&1; then
    echo "   ✓ Worker is responding on port 8787"
else
    echo "   ✗ Cannot connect to localhost:8787"
    echo "   Make sure wrangler dev is running"
    exit 1
fi

echo ""
echo "2. Testing /api/shifts endpoint..."
RESPONSE=$(curl -s "http://localhost:8787/api/shifts?ym=2025-10")
echo "   Response: $RESPONSE"

echo ""
echo "3. Checking response type..."
if echo "$RESPONSE" | python3 -m json.tool > /dev/null 2>&1; then
    echo "   ✓ Valid JSON response"
    echo ""
    echo "4. Parsing response..."
    echo "$RESPONSE" | python3 -m json.tool | head -50
else
    echo "   ✗ Invalid JSON or error response"
    echo "   Raw: $RESPONSE"
fi
