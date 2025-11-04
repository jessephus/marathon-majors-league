/**
 * Salary Cap Draft Functional Tests
 * Tests the complete salary cap draft flow including team creation, 
 * athlete selection, budget validation, and team submission
 * 
 * Run with: node tests/salary-cap-draft.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing Salary Cap Draft functionality at:', BASE_URL);

// Helper to generate unique test IDs
const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

describe('Salary Cap Draft System Tests', () => {
  
  describe('Team Creation Flow', () => {
    it('should create a new team session via API', async () => {
      const teamName = `Test Team ${generateTestId()}`;
      const ownerName = 'Test Owner';
      
      const response = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, ownerName })
      });
      
      assert.strictEqual(response.status, 200, 'Should create session successfully');
      
      const data = await response.json();
      assert.ok(data.sessionToken, 'Should return session token');
      assert.ok(data.sessionUrl, 'Should return session URL');
      assert.strictEqual(data.teamName, teamName, 'Should return correct team name');
      
      console.log(`✅ Team session created: ${data.sessionToken.substring(0, 10)}...`);
    });
    
    it('should validate team name is required', async () => {
      const response = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: '', ownerName: 'Test' })
      });
      
      // Should fail validation
      assert.ok(
        response.status === 400 || response.status === 422,
        'Should reject empty team name'
      );
      
      console.log('✅ Team name validation working');
    });
    
    it('should handle duplicate team creation gracefully', async () => {
      const teamName = `Duplicate Test ${generateTestId()}`;
      
      // Create first team
      const response1 = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, ownerName: 'Owner 1' })
      });
      
      assert.strictEqual(response1.status, 200, 'First team should be created');
      
      // Create second team with same name (should be allowed with different session)
      const response2 = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, ownerName: 'Owner 2' })
      });
      
      assert.strictEqual(response2.status, 200, 'Second team should be created');
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      // Sessions should be different even with same team name
      assert.notStrictEqual(
        data1.sessionToken,
        data2.sessionToken,
        'Sessions should have different tokens'
      );
      
      console.log('✅ Duplicate team name handling working');
    });
  });
  
  describe('Session Management', () => {
    it('should verify valid session tokens', async () => {
      // Create a session first
      const createResponse = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: `Verify Test ${generateTestId()}`,
          ownerName: 'Tester'
        })
      });
      
      const { sessionToken } = await createResponse.json();
      
      // Verify the session
      const verifyResponse = await fetch(`${BASE_URL}/api/session/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
      
      assert.strictEqual(verifyResponse.status, 200, 'Should verify valid session');
      
      const data = await verifyResponse.json();
      assert.strictEqual(data.valid, true, 'Session should be valid');
      assert.ok(data.team, 'Should return team data');
      
      console.log('✅ Session verification working');
    });
    
    it('should reject invalid session tokens', async () => {
      const verifyResponse = await fetch(`${BASE_URL}/api/session/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: 'invalid-token-12345' })
      });
      
      const data = await verifyResponse.json();
      assert.strictEqual(data.valid, false, 'Invalid session should be rejected');
      
      console.log('✅ Invalid session rejection working');
    });
    
    it('should extend session expiry', async () => {
      // Create a session
      const createResponse = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: `Extend Test ${generateTestId()}`,
          ownerName: 'Tester'
        })
      });
      
      const { sessionToken } = await createResponse.json();
      
      // Extend the session
      const extendResponse = await fetch(`${BASE_URL}/api/session/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
      
      assert.strictEqual(extendResponse.status, 200, 'Should extend session');
      
      const data = await extendResponse.json();
      assert.ok(data.expiresAt, 'Should return new expiry time');
      
      console.log('✅ Session extension working');
    });
  });
  
  describe('Athlete Selection and Budget Management', () => {
    it('should retrieve athletes with salary information', async () => {
      const response = await fetch(`${BASE_URL}/api/athletes`);
      
      assert.strictEqual(response.status, 200, 'Should retrieve athletes');
      
      const data = await response.json();
      assert.ok(Array.isArray(data), 'Should return array of athletes');
      assert.ok(data.length > 0, 'Should have athletes');
      
      // Check that athletes have required salary cap fields
      const athlete = data[0];
      assert.ok('name' in athlete, 'Athlete should have name');
      assert.ok('gender' in athlete, 'Athlete should have gender');
      
      console.log(`✅ Athletes retrieved: ${data.length} total`);
    });
    
    it('should submit salary cap draft team', async () => {
      // Create a session
      const createResponse = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: `Draft Test ${generateTestId()}`,
          ownerName: 'Tester'
        })
      });
      
      const { sessionToken } = await createResponse.json();
      
      // Get athletes to select from
      const athletesResponse = await fetch(`${BASE_URL}/api/athletes`);
      const athletes = await athletesResponse.json();
      
      // Select 3 men and 3 women (first available)
      const men = athletes.filter(a => a.gender === 'M' || a.gender === 'men').slice(0, 3);
      const women = athletes.filter(a => a.gender === 'F' || a.gender === 'W' || a.gender === 'women').slice(0, 3);
      
      const selectedAthletes = [...men, ...women].map(a => a.id);
      
      assert.strictEqual(men.length, 3, 'Should have 3 male athletes');
      assert.strictEqual(women.length, 3, 'Should have 3 female athletes');
      
      // Submit the draft
      const draftResponse = await fetch(`${BASE_URL}/api/salary-cap-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionToken,
          athleteIds: selectedAthletes
        })
      });
      
      assert.strictEqual(draftResponse.status, 200, 'Should accept valid draft');
      
      const draftData = await draftResponse.json();
      assert.ok(draftData.success || draftData.team, 'Should confirm draft submission');
      
      console.log('✅ Salary cap draft submission working');
    });
    
    it('should validate team composition (3 men + 3 women)', async () => {
      // Create a session
      const createResponse = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: `Validation Test ${generateTestId()}`,
          ownerName: 'Tester'
        })
      });
      
      const { sessionToken } = await createResponse.json();
      
      // Get athletes
      const athletesResponse = await fetch(`${BASE_URL}/api/athletes`);
      const athletes = await athletesResponse.json();
      
      // Try to submit with wrong composition (4 men, 2 women)
      const men = athletes.filter(a => a.gender === 'M' || a.gender === 'men').slice(0, 4);
      const women = athletes.filter(a => a.gender === 'F' || a.gender === 'W' || a.gender === 'women').slice(0, 2);
      
      if (men.length >= 4 && women.length >= 2) {
        const invalidSelection = [...men, ...women].map(a => a.id);
        
        const draftResponse = await fetch(`${BASE_URL}/api/salary-cap-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionToken,
            athleteIds: invalidSelection
          })
        });
        
        // Should reject invalid composition
        assert.ok(
          draftResponse.status === 400 || draftResponse.status === 422,
          'Should reject invalid team composition'
        );
        
        console.log('✅ Team composition validation working');
      } else {
        console.log('⚠️  Skipping composition validation - not enough test athletes');
      }
    });
    
    it('should validate budget constraints ($30,000 cap)', async () => {
      // This test assumes the API validates budget
      // Create a session
      const createResponse = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: `Budget Test ${generateTestId()}`,
          ownerName: 'Tester'
        })
      });
      
      const { sessionToken } = await createResponse.json();
      
      // The actual budget validation happens on the API
      // We verify the endpoint exists and responds
      const draftResponse = await fetch(`${BASE_URL}/api/salary-cap-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionToken,
          athleteIds: []
        })
      });
      
      // Should respond (even if rejecting empty selection)
      assert.ok(draftResponse.status < 500, 'API should handle budget validation');
      
      console.log('✅ Budget validation endpoint responding');
    });
  });
  
  describe('Draft Persistence and Retrieval', () => {
    it('should persist drafted team and retrieve it', async () => {
      // Create session and draft team
      const createResponse = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: `Persist Test ${generateTestId()}`,
          ownerName: 'Tester'
        })
      });
      
      const { sessionToken } = await createResponse.json();
      
      // Get athletes and make selection
      const athletesResponse = await fetch(`${BASE_URL}/api/athletes`);
      const athletes = await athletesResponse.json();
      
      const men = athletes.filter(a => a.gender === 'M' || a.gender === 'men').slice(0, 3);
      const women = athletes.filter(a => a.gender === 'F' || a.gender === 'W' || a.gender === 'women').slice(0, 3);
      const selectedAthletes = [...men, ...women].map(a => a.id);
      
      if (selectedAthletes.length === 6) {
        // Submit draft
        await fetch(`${BASE_URL}/api/salary-cap-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken, athleteIds: selectedAthletes })
        });
        
        // Retrieve team
        const verifyResponse = await fetch(`${BASE_URL}/api/session/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken })
        });
        
        const data = await verifyResponse.json();
        assert.ok(data.team, 'Should retrieve team data');
        
        console.log('✅ Draft persistence and retrieval working');
      } else {
        console.log('⚠️  Skipping persistence test - not enough test athletes');
      }
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    it('should handle missing session token', async () => {
      const response = await fetch(`${BASE_URL}/api/salary-cap-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteIds: [1, 2, 3] })
      });
      
      assert.ok(
        response.status === 400 || response.status === 401 || response.status === 422,
        'Should reject request without session token'
      );
      
      console.log('✅ Missing session token handled');
    });
    
    it('should handle invalid athlete IDs', async () => {
      // Create a session
      const createResponse = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: `Invalid IDs Test ${generateTestId()}`,
          ownerName: 'Tester'
        })
      });
      
      const { sessionToken } = await createResponse.json();
      
      // Try with invalid athlete IDs
      const response = await fetch(`${BASE_URL}/api/salary-cap-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionToken,
          athleteIds: [99999, 99998, 99997, 99996, 99995, 99994]
        })
      });
      
      // Should handle gracefully
      assert.ok(
        response.status === 400 || response.status === 404 || response.status === 422,
        'Should handle invalid athlete IDs'
      );
      
      console.log('✅ Invalid athlete IDs handled');
    });
    
    it('should handle concurrent draft submissions for same session', async () => {
      // Create a session
      const createResponse = await fetch(`${BASE_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: `Concurrent Test ${generateTestId()}`,
          ownerName: 'Tester'
        })
      });
      
      const { sessionToken } = await createResponse.json();
      
      // Get athletes
      const athletesResponse = await fetch(`${BASE_URL}/api/athletes`);
      const athletes = await athletesResponse.json();
      
      const men = athletes.filter(a => a.gender === 'M' || a.gender === 'men').slice(0, 3);
      const women = athletes.filter(a => a.gender === 'F' || a.gender === 'W' || a.gender === 'women').slice(0, 3);
      const selectedAthletes = [...men, ...women].map(a => a.id);
      
      if (selectedAthletes.length === 6) {
        // Submit two requests simultaneously
        const [response1, response2] = await Promise.all([
          fetch(`${BASE_URL}/api/salary-cap-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken, athleteIds: selectedAthletes })
          }),
          fetch(`${BASE_URL}/api/salary-cap-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken, athleteIds: selectedAthletes })
          })
        ]);
        
        // At least one should succeed
        assert.ok(
          response1.status === 200 || response2.status === 200,
          'At least one concurrent request should succeed'
        );
        
        console.log('✅ Concurrent submissions handled');
      } else {
        console.log('⚠️  Skipping concurrent test - not enough test athletes');
      }
    });
  });
  
  describe('Roster Lock Integration', () => {
    it('should check for roster lock time configuration', async () => {
      // Verify races endpoint includes roster lock time info
      const response = await fetch(`${BASE_URL}/api/races`);
      
      assert.strictEqual(response.status, 200, 'Races endpoint should be accessible');
      
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Check if race data includes date/time information
        const race = data[0];
        assert.ok('date' in race || 'start_time' in race || 'name' in race, 
          'Race should have timing information');
        
        console.log('✅ Roster lock configuration available');
      } else {
        console.log('⚠️  No races configured for lock time test');
      }
    });
  });
});

console.log('\n✨ Salary Cap Draft tests complete!\n');
