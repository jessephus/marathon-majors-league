#!/usr/bin/env python3
"""
Test script to verify World Athletics API connectivity and discover the correct endpoint.
"""

import sys
import json

# Test 1: Check if worldathletics package works
print("=" * 60)
print("Test 1: Checking worldathletics package")
print("=" * 60)

try:
    import worldathletics
    print("✓ worldathletics package importable")
    
    # Get the default URL and headers
    from worldathletics.async_base_client import AsyncBaseClient
    import inspect
    
    # Check the __init__ signature for default URL
    sig = inspect.signature(AsyncBaseClient.__init__)
    defaults = {
        k: v.default 
        for k, v in sig.parameters.items() 
        if v.default is not inspect.Parameter.empty
    }
    
    print(f"\nDefault URL: {defaults.get('url', 'NOT FOUND')}")
    print(f"Default headers: {json.dumps(defaults.get('headers', {}), indent=2)}")
    
except ImportError:
    print("✗ worldathletics not installed")
    sys.exit(1)

# Test 2: Try actual API call with worldathletics
print("\n" + "=" * 60)
print("Test 2: Testing actual API call")
print("=" * 60)

try:
    import asyncio
    from worldathletics import WorldAthletics
    
    async def test_api():
        try:
            client = WorldAthletics()
            print("✓ WorldAthletics client created")
            
            # Try to fetch rankings
            print("\nFetching top 5 men's marathon rankings...")
            response = await client.get_world_rankings(
                event_group='MAR',
                gender='M',
                limit=5
            )
            
            print("✓ API call successful!")
            
            # Check response structure
            if hasattr(response, 'get_world_rankings'):
                rankings = response.get_world_rankings
                if hasattr(rankings, 'rankings') and rankings.rankings:
                    print(f"✓ Got {len(rankings.rankings)} rankings")
                    first = rankings.rankings[0]
                    print(f"\nFirst athlete: {first}")
                    return True
            
            print("Response structure:", dir(response))
            return False
            
        except Exception as e:
            print(f"✗ API call failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    success = asyncio.run(test_api())
    sys.exit(0 if success else 1)
    
except Exception as e:
    print(f"✗ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
