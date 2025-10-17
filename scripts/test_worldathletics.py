#!/usr/bin/env python3
"""
Test script to verify the worldathletics package works correctly.

This script tests basic functionality before using it in the main sync script.
"""

import sys

try:
    from worldathletics import WA
    print("✓ worldathletics package imported successfully")
except ImportError as e:
    print(f"✗ Failed to import worldathletics: {e}")
    print("\nInstall with: pip install worldathletics")
    sys.exit(1)

def test_rankings_fetch():
    """Test fetching marathon rankings"""
    print("\n" + "="*60)
    print("Testing Marathon Rankings Fetch")
    print("="*60)
    
    try:
        wa = WA()
        print("✓ World Athletics client initialized")
        
        # Try to fetch top 5 men's marathon rankings
        print("\nFetching top 5 men's marathon rankings...")
        rankings = wa.get_rankings('MAR', 'M', limit=5)
        
        if rankings:
            print(f"✓ Successfully fetched {len(rankings)} rankings")
            print("\nSample data:")
            for i, athlete in enumerate(rankings[:3], 1):
                print(f"  {i}. {athlete}")
            return True
        else:
            print("✗ No rankings returned")
            return False
            
    except AttributeError:
        print("✗ Method 'get_rankings' not found")
        print("\nAvailable methods:")
        print([m for m in dir(wa) if not m.startswith('_')])
        return False
    except Exception as e:
        print(f"✗ Error fetching rankings: {e}")
        return False

def test_athlete_fetch():
    """Test fetching individual athlete details"""
    print("\n" + "="*60)
    print("Testing Athlete Details Fetch")
    print("="*60)
    
    try:
        wa = WA()
        
        # Try Eliud Kipchoge's ID
        test_id = "14208194"
        print(f"\nFetching athlete details for ID: {test_id}")
        
        athlete = wa.get_athlete(test_id)
        
        if athlete:
            print(f"✓ Successfully fetched athlete data")
            print(f"\nAthlete: {athlete.get('name', 'Unknown')}")
            print(f"Country: {athlete.get('country', 'Unknown')}")
            print(f"Gender: {athlete.get('gender', 'Unknown')}")
            print(f"\nFull data structure keys:")
            print(list(athlete.keys())[:10])  # First 10 keys
            return True
        else:
            print("✗ No athlete data returned")
            return False
            
    except AttributeError:
        print("✗ Method 'get_athlete' not found")
        print("\nAvailable methods:")
        print([m for m in dir(wa) if not m.startswith('_')])
        return False
    except Exception as e:
        print(f"✗ Error fetching athlete: {e}")
        return False

def test_package_version():
    """Check package version and API"""
    print("\n" + "="*60)
    print("Package Information")
    print("="*60)
    
    try:
        import worldathletics
        print(f"Package version: {worldathletics.__version__ if hasattr(worldathletics, '__version__') else 'Unknown'}")
        
        wa = WA()
        print(f"\nAvailable methods on WA client:")
        methods = [m for m in dir(wa) if not m.startswith('_') and callable(getattr(wa, m))]
        for method in methods[:10]:  # Show first 10 methods
            print(f"  - {method}")
        
        if len(methods) > 10:
            print(f"  ... and {len(methods) - 10} more")
        
    except Exception as e:
        print(f"Error getting package info: {e}")

def main():
    """Run all tests"""
    print("World Athletics Package Test Suite")
    print("="*60)
    
    test_package_version()
    
    rankings_ok = test_rankings_fetch()
    athlete_ok = test_athlete_fetch()
    
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    print(f"Rankings fetch: {'✓ PASS' if rankings_ok else '✗ FAIL'}")
    print(f"Athlete fetch: {'✓ PASS' if athlete_ok else '✗ FAIL'}")
    
    if rankings_ok and athlete_ok:
        print("\n✓ All tests passed! Ready to use in sync script.")
        return 0
    else:
        print("\n✗ Some tests failed. Check the worldathletics package documentation.")
        print("Package docs: https://github.com/kaijchang/worldathletics")
        return 1

if __name__ == '__main__':
    sys.exit(main())
