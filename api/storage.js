import { put, list, head } from '@vercel/blob';

// Blob storage helper functions
const BLOB_PREFIX = 'fantasy-marathon';

// Helper to generate blob path
function getBlobPath(gameId, type) {
  return `${BLOB_PREFIX}/${gameId}/${type}.json`;
}

// Get data from blob storage
export async function getData(gameId, type) {
  try {
    // List blobs to find the one we're looking for
    const { blobs } = await list({ prefix: getBlobPath(gameId, type) });
    
    if (blobs.length === 0) {
      return null;
    }
    
    // Get the blob URL and fetch the data
    const blobUrl = blobs[0].url;
    const response = await fetch(blobUrl);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    // Return null if blob doesn't exist
    console.log(`getData error for ${type}:`, error.message);
    return null;
  }
}

// Save data to blob storage
export async function saveData(gameId, type, data) {
  const path = getBlobPath(gameId, type);
  const blob = await put(path, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
  return blob;
}

// Initialize default game state
export function getDefaultGameState() {
  return {
    players: [],
    draft_complete: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Initialize default rankings
export function getDefaultRankings() {
  return {};
}

// Initialize default teams
export function getDefaultTeams() {
  return {};
}

// Initialize default results
export function getDefaultResults() {
  return {};
}
