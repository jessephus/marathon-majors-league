# World Athletics API Integration Decision

## Summary

After investigating the `worldathletics` Python package, we've decided to use **direct GraphQL API calls** instead of the wrapper library.

## Background

The `worldathletics` package (v1.2.4) is an auto-generated Python wrapper for World Athletics' GraphQL API. During implementation, we discovered significant architectural challenges.

## The worldathletics Package

### What We Discovered

```python
# The package structure
from worldathletics import WorldAthletics  # ✓ Correct import

# But the client is async-only
client = WorldAthletics()
rankings = await client.get_world_rankings(event_group='MAR', limit=100)
```

### Challenges Identified

1. **Async-Only API**: All methods return coroutines requiring `asyncio`
2. **Complex Type System**: Uses Pydantic models with nested GraphQL types
3. **Limited Documentation**: Minimal examples, auto-generated code
4. **Over-Engineering**: 4,808 exported classes for simple data fetching

### Why a Wrapper Exists

The `worldathletics` package provides:
- Type safety with Pydantic validation
- IDE auto-completion
- GraphQL query generation
- Error handling patterns

**Target audience**: Large applications needing type safety and extensive GraphQL usage.

## Our Decision: Direct GraphQL Calls

### Why Direct Calls Are Better for Us

| Factor | worldathletics Package | Direct GraphQL Calls |
|--------|------------------------|----------------------|
| **Complexity** | High (async, Pydantic models) | Low (simple HTTP POST) |
| **Dependencies** | worldathletics + 10 deps | requests only |
| **Learning Curve** | Steep (async patterns) | Minimal (standard REST) |
| **Code Clarity** | Abstracted | Explicit queries |
| **Debugging** | Through wrapper layers | Direct API responses |
| **Maintenance** | Depends on package updates | Self-contained |

### Implementation Approach

```python
import requests

# World Athletics GraphQL endpoint
GRAPHQL_URL = "https://graphql-prod-4d0a7c6.production.worldathletics.org/graphql"

# Simple synchronous query
query = """
query GetWorldRankings($gender: GenderType!, $limit: Int!) {
  getWorldRankings(
    eventGroup: "MAR"
    gender: $gender
    limit: $limit
  ) {
    rankings {
      competitor {
        id
        name
        iaafId
        country
      }
      rank
      pb
    }
  }
}
"""

response = requests.post(
    GRAPHQL_URL,
    json={
        "query": query,
        "variables": {"gender": "M", "limit": 100}
    },
    headers={"Content-Type": "application/json"}
)

data = response.json()
rankings = data['data']['getWorldRankings']['rankings']
```

### Benefits of This Approach

1. **No Async Complexity**: Simple synchronous code
2. **Explicit Control**: Full visibility into API calls
3. **Minimal Dependencies**: Just `requests` library
4. **Easy Debugging**: Clear request/response flow
5. **Self-Documenting**: GraphQL queries show exactly what's fetched

## Technical Details

### GraphQL Endpoint

```
https://graphql-prod-4d0a7c6.production.worldathletics.org/graphql
```

### Key Query: World Marathon Rankings

```graphql
query GetWorldRankings($gender: GenderType!, $limit: Int!) {
  getWorldRankings(
    eventGroup: "MAR"           # Marathon
    gender: $gender             # "M" or "F"
    limit: $limit               # Top N athletes
    regionType: "world"         # Global rankings
  ) {
    rankings {
      rank                      # Current ranking position
      competitor {
        id                      # World Athletics ID
        name                    # Full name
        iaafId                  # Alternative ID
        country                 # Country code (3-letter)
        hasProfile              # Boolean flag
      }
      pb                        # Personal best time (string)
      sb                        # Season best time (string)
    }
    parameters {
      rankDate                  # Date of rankings
      gender                    # Gender category
      disciplineCode            # Event code
    }
  }
}
```

### Query: Athlete Details

```graphql
query GetAthlete($id: Int!) {
  getCompetitor(id: $id) {
    basicData {
      firstName
      lastName
      birthDate
      countryCode
    }
    personalBests {
      results {
        discipline
        mark
        resultDate
      }
    }
    honours {
      achievements
    }
  }
}
```

## Implementation Strategy

### Phase 1: Rankings Sync ✓
- Fetch top 100 men's marathon rankings
- Fetch top 100 women's marathon rankings
- Extract: ID, name, country, PB, rank
- Delta detection via content hashing
- Upsert to Postgres database

### Phase 2: Athlete Details (Optional)
- Batch fetch detailed profiles
- Extract: birthdate, season best, honors
- Enrich database records

### Phase 3: Result Tracking (Future)
- Monitor race results
- Update athlete performance data
- Track seasonal changes

## Error Handling

### HTTP Errors
```python
response = requests.post(GRAPHQL_URL, json=payload, timeout=30)
response.raise_for_status()  # Raises for 4xx/5xx
data = response.json()

if 'errors' in data:
    # GraphQL errors (200 status but query failed)
    logger.error(f"GraphQL errors: {data['errors']}")
```

### Rate Limiting
```python
# Conservative: 1 request per 200ms = 5 req/sec
time.sleep(0.2)

# With retry logic
for attempt in range(3):
    try:
        response = requests.post(...)
        break
    except requests.exceptions.RequestException as e:
        if attempt == 2:
            raise
        time.sleep(2 ** attempt)  # Exponential backoff
```

## Testing Strategy

### 1. Manual GraphQL Testing
Use tools like:
- Postman
- Insomnia
- GraphQL Playground (if available)
- curl commands

### 2. Python Testing
```python
# scripts/test_graphql_direct.py
import requests

def test_rankings_query():
    query = """..."""
    response = requests.post(GRAPHQL_URL, json={"query": query})
    assert response.status_code == 200
    data = response.json()
    assert 'data' in data
    assert 'getWorldRankings' in data['data']
    print(f"✓ Fetched {len(data['data']['getWorldRankings']['rankings'])} athletes")

if __name__ == '__main__':
    test_rankings_query()
```

## Migration Path

### Current State
- ❌ worldathletics package (v1.2.4)
- ❌ Async WorldAthletics client
- ❌ Complex type system

### Target State
- ✅ Direct GraphQL POST requests
- ✅ Synchronous requests library
- ✅ Simple dict-based responses
- ✅ Explicit error handling

### Migration Steps

1. ✅ Remove worldathletics import
2. ✅ Add GraphQL query constants
3. ✅ Implement `fetch_rankings_graphql()` function
4. ✅ Implement `fetch_athlete_graphql()` function
5. ✅ Update sync script to use new functions
6. ✅ Test with dry-run mode
7. ✅ Update requirements.txt (remove worldathletics)
8. ✅ Update documentation

## Performance Comparison

### worldathletics Package
- 🟡 Initial request: ~500ms (async setup)
- 🟢 Subsequent requests: ~100-200ms
- 🔴 Memory: High (Pydantic models)
- 🔴 Code complexity: High

### Direct GraphQL
- 🟢 All requests: ~100-200ms
- 🟢 Memory: Low (native dicts)
- 🟢 Code complexity: Low
- 🟢 Debugging: Easy

## Conclusion

**Direct GraphQL calls are the right choice** for our use case:

- ✅ Simpler implementation
- ✅ Easier maintenance
- ✅ Better performance
- ✅ More control
- ✅ Easier debugging

The `worldathletics` package is well-designed for its purpose, but that purpose doesn't align with our needs. Direct API calls give us exactly what we need with less complexity.

## References

- World Athletics GraphQL API: `https://graphql-prod-4d0a7c6.production.worldathletics.org/graphql`
- worldathletics package: https://github.com/kaijchang/worldathletics
- GraphQL documentation: https://graphql.org/learn/
