/**
 * Race Management Test Suite
 * 
 * Comprehensive tests for race CRUD operations, athlete confirmations,
 * race news management, and visual customization features.
 * 
 * Run with: npm run test:races
 * Or: node tests/race-management.test.js
 */

import { describe, it, after, before } from 'node:test';
import assert from 'node:assert';
import { generateTestId, cleanupTestGame } from './test-utils.js';

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const GAME_ID = generateTestId('race-test-game');

console.log('🧪 Testing Race Management features at:', BASE_URL);
console.log('🎮 Using test game ID:', GAME_ID);

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const text = await response.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  
  return { response, data, status: response.status };
}

// Store created test data for cleanup
const testData = {
  races: [],
  athleteRaces: [],
  raceNews: []
};

// Test Suite
describe('Race Management API - CRUD Operations', () => {
  
  let testRaceId;
  let testAthleteId;
  
  // Setup - Get an athlete ID for athlete-race tests
  before(async () => {
    console.log('\n🔧 Setting up test environment...');
    const { data } = await apiRequest('/api/athletes');
    if (data.men && data.men.length > 0) {
      testAthleteId = data.men[0].id;
      console.log(`   Using test athlete ID: ${testAthleteId}`);
    }
  });
  
  // Cleanup after all tests complete
  after(async () => {
    console.log('\n🧹 Cleaning up race test data...');
    try {
      // Clean up race news
      for (const newsId of testData.raceNews) {
        try {
          await apiRequest(`/api/race-news?id=${newsId}`, { method: 'DELETE' });
        } catch (e) {
          console.warn(`   ⚠️  Could not delete race news ${newsId}`);
        }
      }
      
      // Clean up athlete-race confirmations (will cascade delete on race delete)
      
      // Clean up races (will cascade delete to athlete_races and race_news)
      for (const raceId of testData.races) {
        try {
          await apiRequest(`/api/races?id=${raceId}`, { method: 'DELETE' });
        } catch (e) {
          console.warn(`   ⚠️  Could not delete race ${raceId}`);
        }
      }
      
      console.log('✅ Race test data cleaned up successfully\n');
    } catch (error) {
      console.error('⚠️  Cleanup warning:', error.message, '\n');
    }
  });
  
  describe('POST /api/races - Create Race', () => {
    it('should create a race with basic fields', async () => {
      const raceData = {
        name: 'Test Marathon 2025',
        date: '2025-12-01',
        location: 'Test City, USA',
        distance: 'Marathon (42.195 km)',
        event_type: 'Test Event',
        description: 'A test race for testing purposes'
      };
      
      const { response, data, status } = await apiRequest('/api/races', {
        method: 'POST',
        body: JSON.stringify(raceData)
      });
      
      assert.strictEqual(status, 201, 'Should return 201 Created');
      assert.ok(data.id, 'Should return race ID');
      assert.strictEqual(data.name, raceData.name, 'Name should match');
      assert.strictEqual(data.location, raceData.location, 'Location should match');
      assert.strictEqual(data.isActive, true, 'Should be active by default');
      
      testRaceId = data.id;
      testData.races.push(data.id);
      
      console.log('✅ Race created successfully:', data.name);
      console.log('   Race ID:', data.id);
    });
    
    it('should create a race with visual customization fields', async () => {
      const raceData = {
        name: 'Visual Test Marathon 2025',
        date: '2025-12-15',
        location: 'Visual Test City, USA',
        lock_time: '2025-12-15T08:30:00-05:00',
        logo_url: 'https://example.com/logo.png',
        background_image_url: 'https://example.com/background.jpg',
        primary_color: '#FF5733',
        secondary_color: '#33C3FF',
        accent_color: '#FFD700'
      };
      
      const { response, data, status } = await apiRequest('/api/races', {
        method: 'POST',
        body: JSON.stringify(raceData)
      });
      
      assert.strictEqual(status, 201, 'Should return 201 Created');
      assert.ok(data.id, 'Should return race ID');
      assert.strictEqual(data.lockTime, raceData.lock_time, 'Lock time should match');
      assert.strictEqual(data.logoUrl, raceData.logo_url, 'Logo URL should match');
      assert.strictEqual(data.backgroundImageUrl, raceData.background_image_url, 'Background URL should match');
      assert.strictEqual(data.primaryColor, raceData.primary_color, 'Primary color should match');
      assert.strictEqual(data.secondaryColor, raceData.secondary_color, 'Secondary color should match');
      assert.strictEqual(data.accentColor, raceData.accent_color, 'Accent color should match');
      
      testData.races.push(data.id);
      
      console.log('✅ Race with visual customization created:', data.name);
      console.log('   Lock time:', data.lockTime);
      console.log('   Theme colors:', `${data.primaryColor}, ${data.secondaryColor}, ${data.accentColor}`);
    });
    
    it('should reject race creation without required fields', async () => {
      const raceData = {
        name: 'Incomplete Race'
        // Missing date and location
      };
      
      const { response, data, status } = await apiRequest('/api/races', {
        method: 'POST',
        body: JSON.stringify(raceData)
      });
      
      assert.strictEqual(status, 400, 'Should return 400 Bad Request');
      assert.ok(data.error, 'Should return error message');
      
      console.log('✅ Rejected incomplete race creation:', data.error);
    });
  });
  
  describe('GET /api/races - List Races', () => {
    it('should list all races', async () => {
      const { response, data, status } = await apiRequest('/api/races');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(Array.isArray(data), 'Should return array of races');
      assert.ok(data.length > 0, 'Should have at least one race');
      
      // Check race structure
      const race = data[0];
      assert.ok(race.id, 'Race should have id');
      assert.ok(race.name, 'Race should have name');
      assert.ok(race.date, 'Race should have date');
      assert.ok(race.location, 'Race should have location');
      
      console.log('✅ Listed all races, count:', data.length);
    });
    
    it('should filter active races', async () => {
      const { response, data, status } = await apiRequest('/api/races?active=true');
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(Array.isArray(data), 'Should return array of races');
      
      // All returned races should be active
      const allActive = data.every(race => race.isActive === true);
      assert.ok(allActive, 'All races should be active');
      
      console.log('✅ Listed active races, count:', data.length);
    });
    
    it('should get specific race by ID', async () => {
      const { response, data, status } = await apiRequest(`/api/races?id=${testRaceId}`);
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.strictEqual(data.id, testRaceId, 'Should return correct race');
      assert.ok(data.name, 'Race should have name');
      
      console.log('✅ Retrieved race by ID:', data.name);
    });
    
    it('should get race with confirmed athletes', async () => {
      // First, confirm an athlete for the race
      if (testAthleteId && testRaceId) {
        await apiRequest('/api/athlete-races', {
          method: 'POST',
          body: JSON.stringify({
            athleteId: testAthleteId,
            raceId: testRaceId,
            bibNumber: '1234'
          })
        });
      }
      
      const { response, data, status } = await apiRequest(
        `/api/races?id=${testRaceId}&includeAthletes=true`
      );
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.athletes, 'Should include athletes');
      assert.ok(data.athletes.men || data.athletes.women, 'Should have men or women athletes');
      
      console.log('✅ Retrieved race with confirmed athletes');
    });
    
    it('should return 404 for non-existent race', async () => {
      const { response, data, status } = await apiRequest('/api/races?id=99999999');
      
      assert.strictEqual(status, 404, 'Should return 404 Not Found');
      assert.ok(data.error, 'Should return error message');
      
      console.log('✅ Correctly returned 404 for non-existent race');
    });
  });
  
  describe('PUT /api/races - Update Race', () => {
    it('should update race basic fields', async () => {
      const updates = {
        name: 'Updated Test Marathon 2025',
        location: 'Updated City, USA',
        description: 'An updated test race'
      };
      
      const { response, data, status } = await apiRequest(`/api/races?id=${testRaceId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.strictEqual(data.name, updates.name, 'Name should be updated');
      assert.strictEqual(data.location, updates.location, 'Location should be updated');
      assert.strictEqual(data.description, updates.description, 'Description should be updated');
      
      console.log('✅ Race updated successfully:', data.name);
    });
    
    it('should update race visual customization fields', async () => {
      const updates = {
        lock_time: '2025-12-01T09:00:00-05:00',
        logo_url: 'https://example.com/new-logo.png',
        primary_color: '#FF0000',
        secondary_color: '#00FF00',
        accent_color: '#0000FF'
      };
      
      const { response, data, status } = await apiRequest(`/api/races?id=${testRaceId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.strictEqual(data.lockTime, updates.lock_time, 'Lock time should be updated');
      assert.strictEqual(data.logoUrl, updates.logo_url, 'Logo URL should be updated');
      assert.strictEqual(data.primaryColor, updates.primary_color, 'Primary color should be updated');
      
      console.log('✅ Race visual fields updated successfully');
      console.log('   New lock time:', data.lockTime);
      console.log('   New colors:', `${data.primaryColor}, ${data.secondaryColor}, ${data.accentColor}`);
    });
    
    it('should update race status', async () => {
      const updates = { is_active: false };
      
      const { response, data, status } = await apiRequest(`/api/races?id=${testRaceId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.strictEqual(data.isActive, false, 'Race should be inactive');
      
      console.log('✅ Race status updated to inactive');
      
      // Reactivate for other tests
      await apiRequest(`/api/races?id=${testRaceId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: true })
      });
    });
  });
  
  describe('DELETE /api/races - Delete Race', () => {
    it('should delete a race', async () => {
      // Create a race specifically for deletion
      const raceData = {
        name: 'Race to Delete',
        date: '2025-12-31',
        location: 'Delete City, USA'
      };
      
      const createResult = await apiRequest('/api/races', {
        method: 'POST',
        body: JSON.stringify(raceData)
      });
      
      const raceToDelete = createResult.data.id;
      
      const { response, data, status } = await apiRequest(`/api/races?id=${raceToDelete}`, {
        method: 'DELETE'
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.success, 'Should confirm deletion');
      assert.ok(data.message, 'Should return success message');
      
      // Verify race is deleted
      const getResult = await apiRequest(`/api/races?id=${raceToDelete}`);
      assert.strictEqual(getResult.status, 404, 'Race should no longer exist');
      
      console.log('✅ Race deleted successfully:', data.message);
    });
  });
});

describe('Athlete-Race Confirmations API', () => {
  
  let testRaceId;
  let testAthleteId;
  
  before(async () => {
    // Create a test race
    const raceData = {
      name: 'Athlete Confirmation Test Race',
      date: '2025-11-15',
      location: 'Test City, USA'
    };
    const raceResult = await apiRequest('/api/races', {
      method: 'POST',
      body: JSON.stringify(raceData)
    });
    testRaceId = raceResult.data.id;
    testData.races.push(testRaceId);
    
    // Get an athlete ID
    const athleteResult = await apiRequest('/api/athletes');
    testAthleteId = athleteResult.data.men[0].id;
  });
  
  describe('POST /api/athlete-races - Confirm Athlete', () => {
    it('should confirm an athlete for a race', async () => {
      const confirmData = {
        athleteId: testAthleteId,
        raceId: testRaceId,
        bibNumber: '5678'
      };
      
      const { response, data, status } = await apiRequest('/api/athlete-races', {
        method: 'POST',
        body: JSON.stringify(confirmData)
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.success, 'Should confirm success');
      assert.ok(data.message, 'Should return success message');
      
      console.log('✅ Athlete confirmed for race:', data.message);
    });
    
    it('should update bib number on re-confirmation', async () => {
      const confirmData = {
        athleteId: testAthleteId,
        raceId: testRaceId,
        bibNumber: '9999'
      };
      
      const { response, data, status } = await apiRequest('/api/athlete-races', {
        method: 'POST',
        body: JSON.stringify(confirmData)
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.success, 'Should confirm success');
      
      console.log('✅ Athlete bib number updated');
    });
    
    it('should reject confirmation with missing fields', async () => {
      const confirmData = {
        athleteId: testAthleteId
        // Missing raceId
      };
      
      const { response, data, status } = await apiRequest('/api/athlete-races', {
        method: 'POST',
        body: JSON.stringify(confirmData)
      });
      
      assert.strictEqual(status, 400, 'Should return 400 Bad Request');
      assert.ok(data.error, 'Should return error message');
      
      console.log('✅ Rejected incomplete confirmation:', data.error);
    });
  });
  
  describe('GET /api/athlete-races - List Confirmations', () => {
    it('should list confirmed athletes for a race', async () => {
      const { response, data, status } = await apiRequest(`/api/athlete-races?raceId=${testRaceId}`);
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(Array.isArray(data), 'Should return array');
      assert.ok(data.length > 0, 'Should have at least one confirmation');
      
      const confirmation = data[0];
      assert.ok(confirmation.athlete_name, 'Should have athlete name');
      assert.ok(confirmation.athlete_country, 'Should have athlete country');
      
      console.log('✅ Listed confirmed athletes, count:', data.length);
    });
  });
  
  describe('DELETE /api/athlete-races - Remove Confirmation', () => {
    it('should remove athlete confirmation', async () => {
      const { response, data, status } = await apiRequest(
        `/api/athlete-races?athleteId=${testAthleteId}&raceId=${testRaceId}`,
        { method: 'DELETE' }
      );
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.success, 'Should confirm deletion');
      
      // Verify confirmation is removed
      const listResult = await apiRequest(`/api/athlete-races?raceId=${testRaceId}`);
      const hasAthlete = listResult.data.some(c => c.athlete_id === testAthleteId);
      assert.strictEqual(hasAthlete, false, 'Athlete should no longer be confirmed');
      
      console.log('✅ Athlete confirmation removed:', data.message);
    });
  });
});

describe('Race News API - Curated Content', () => {
  
  let testRaceId;
  let testNewsId;
  
  before(async () => {
    // Create a test race for news
    const raceData = {
      name: 'Race News Test Race',
      date: '2025-11-20',
      location: 'News Test City, USA'
    };
    const raceResult = await apiRequest('/api/races', {
      method: 'POST',
      body: JSON.stringify(raceData)
    });
    testRaceId = raceResult.data.id;
    testData.races.push(testRaceId);
  });
  
  describe('POST /api/race-news - Create News', () => {
    it('should create a race news item', async () => {
      const newsData = {
        raceId: testRaceId,
        headline: 'Elite Field Announced',
        description: 'The elite field has been announced for the race.',
        articleUrl: 'https://example.com/article',
        imageUrl: 'https://example.com/image.jpg',
        publishedDate: '2025-11-01T10:00:00Z',
        displayOrder: 1,
        isVisible: true
      };
      
      const { response, data, status } = await apiRequest('/api/race-news', {
        method: 'POST',
        body: JSON.stringify(newsData)
      });
      
      assert.strictEqual(status, 201, 'Should return 201 Created');
      assert.ok(data.id, 'Should return news ID');
      assert.strictEqual(data.headline, newsData.headline, 'Headline should match');
      assert.strictEqual(data.articleUrl, newsData.articleUrl, 'Article URL should match');
      
      testNewsId = data.id;
      testData.raceNews.push(data.id);
      
      console.log('✅ Race news created:', data.headline);
    });
    
    it('should reject news without required fields', async () => {
      const newsData = {
        raceId: testRaceId
        // Missing headline
      };
      
      const { response, data, status } = await apiRequest('/api/race-news', {
        method: 'POST',
        body: JSON.stringify(newsData)
      });
      
      assert.strictEqual(status, 400, 'Should return 400 Bad Request');
      assert.ok(data.error, 'Should return error message');
      
      console.log('✅ Rejected incomplete news item:', data.error);
    });
  });
  
  describe('GET /api/race-news - List News', () => {
    it('should list visible news for a race', async () => {
      const { response, data, status } = await apiRequest(`/api/race-news?raceId=${testRaceId}`);
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(Array.isArray(data), 'Should return array');
      assert.ok(data.length > 0, 'Should have at least one news item');
      
      // All should be visible
      const allVisible = data.every(news => news.isVisible === true);
      assert.ok(allVisible, 'All news items should be visible');
      
      console.log('✅ Listed visible race news, count:', data.length);
    });
    
    it('should include hidden news when requested', async () => {
      // Create a hidden news item
      await apiRequest('/api/race-news', {
        method: 'POST',
        body: JSON.stringify({
          raceId: testRaceId,
          headline: 'Hidden News',
          isVisible: false
        })
      });
      
      const { response, data, status } = await apiRequest(
        `/api/race-news?raceId=${testRaceId}&includeHidden=true`
      );
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      const hasHidden = data.some(news => news.isVisible === false);
      assert.ok(hasHidden, 'Should include hidden news items');
      
      console.log('✅ Listed all news including hidden');
    });
    
    it('should get specific news item by ID', async () => {
      const { response, data, status } = await apiRequest(`/api/race-news?id=${testNewsId}`);
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.strictEqual(data.id, testNewsId, 'Should return correct news item');
      
      console.log('✅ Retrieved news item by ID');
    });
  });
  
  describe('PUT /api/race-news - Update News', () => {
    it('should update news item', async () => {
      const updates = {
        headline: 'Updated Elite Field',
        description: 'Updated description',
        displayOrder: 2
      };
      
      const { response, data, status } = await apiRequest(`/api/race-news?id=${testNewsId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.strictEqual(data.headline, updates.headline, 'Headline should be updated');
      assert.strictEqual(data.displayOrder, updates.displayOrder, 'Display order should be updated');
      
      console.log('✅ News item updated:', data.headline);
    });
    
    it('should toggle news visibility', async () => {
      const updates = { isVisible: false };
      
      const { response, data, status } = await apiRequest(`/api/race-news?id=${testNewsId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.strictEqual(data.isVisible, false, 'News should be hidden');
      
      console.log('✅ News visibility toggled to hidden');
    });
  });
  
  describe('DELETE /api/race-news - Delete News', () => {
    it('should delete a news item', async () => {
      const { response, data, status } = await apiRequest(`/api/race-news?id=${testNewsId}`, {
        method: 'DELETE'
      });
      
      assert.strictEqual(status, 200, 'Should return 200 OK');
      assert.ok(data.success, 'Should confirm deletion');
      
      // Verify news is deleted
      const getResult = await apiRequest(`/api/race-news?id=${testNewsId}`);
      assert.strictEqual(getResult.status, 404, 'News item should no longer exist');
      
      console.log('✅ News item deleted:', data.message);
    });
  });
});

console.log('\n✅ All Race Management tests completed!\n');
