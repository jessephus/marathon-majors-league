#!/bin/bash

# Quick Test Script
# Run this to quickly verify your Next.js migration worked

echo "🚀 Quick Migration Verification"
echo "================================"
echo ""

# Check if server is running
echo "1️⃣  Checking if server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|304"; then
    echo "   ✅ Server is running"
else
    echo "   ❌ Server not running. Start it with: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣  Testing critical endpoints..."

# Test init-db
if curl -s http://localhost:3000/api/init-db | grep -q "Neon Postgres"; then
    echo "   ✅ Database initialized"
else
    echo "   ❌ Database initialization failed"
fi

# Test athletes
if curl -s http://localhost:3000/api/athletes | grep -q '"men"'; then
    echo "   ✅ Athletes endpoint working"
else
    echo "   ❌ Athletes endpoint failed"
fi

# Test races
if curl -s http://localhost:3000/api/races | grep -q '\['; then
    echo "   ✅ Races endpoint working"
else
    echo "   ❌ Races endpoint failed"
fi

echo ""
echo "3️⃣  Testing frontend..."

# Test index.html
if curl -s http://localhost:3000 | grep -q "Fantasy"; then
    echo "   ✅ Frontend serving"
else
    echo "   ❌ Frontend not serving"
fi

# Test app.js
if curl -s http://localhost:3000/app.js | grep -q "API_BASE"; then
    echo "   ✅ JavaScript loading"
else
    echo "   ❌ JavaScript not loading"
fi

# Test style.css
if curl -s http://localhost:3000/style.css | grep -q ":root\|\."; then
    echo "   ✅ CSS loading"
else
    echo "   ❌ CSS not loading"
fi

echo ""
echo "================================"
echo "✨ Quick check complete!"
echo ""
echo "For comprehensive tests, run:"
echo "  npm test"
echo ""
