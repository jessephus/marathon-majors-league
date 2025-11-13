/**
 * Application Configuration Constants
 * 
 * Centralized configuration values for the entire application.
 * Originally extracted from public/app.js (now removed) to eliminate duplication and enable easy configuration.
 * 
 * All constants can be safely used in:
 * - Frontend code (vanilla JS or React)
 * - Backend API routes
 * - Configuration files
 * 
 * See: PROCESS_MONOLITH_AUDIT.md - Phase 1 (Extract & Centralize Constants)
 */

/**
 * Session Storage Keys
 * Keys used for localStorage persistence
 */
export const TEAM_SESSION_KEY = 'marathon_fantasy_team';
export const COMMISSIONER_SESSION_KEY = 'marathon_fantasy_commissioner';
export const CURRENT_GAME_ID_KEY = 'current_game_id';

/**
 * Session Timeout Configuration
 * Duration in milliseconds
 */
export const COMMISSIONER_SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days
export const TEAM_SESSION_TIMEOUT = 90 * 24 * 60 * 60 * 1000; // 90 days (for season leagues)

/**
 * Cache TTL Configuration
 * Time-to-live values for caching (in milliseconds)
 */
export const RESULTS_CACHE_TTL = 30000; // 30 seconds - short TTL for live results
export const GAME_STATE_CACHE_TTL = 60000; // 60 seconds - moderate TTL for game state
export const ATHLETES_CACHE_TTL = 300000; // 5 minutes - longer TTL for athlete data

/**
 * Leaderboard Refresh Configuration
 * Auto-refresh interval for leaderboard (in milliseconds)
 */
export const LEADERBOARD_REFRESH_INTERVAL = 60000; // 60 seconds

/**
 * Salary Cap Draft Configuration
 */
export const SALARY_CAP_BUDGET = 30000; // $30,000 total budget
export const MIN_MEN_ATHLETES = 3; // Minimum 3 male athletes
export const MIN_WOMEN_ATHLETES = 3; // Minimum 3 female athletes
export const TOTAL_ROSTER_SLOTS = 6; // Total roster slots (3M + 3W)

/**
 * Game Configuration Defaults
 */
export const DEFAULT_GAME_ID = 'default';

/**
 * API Configuration
 * Base URL for API calls (computed at runtime for browser environment)
 */
export const getApiBase = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin === 'null' ? '' : window.location.origin;
    }
    return process.env.NEXT_PUBLIC_API_BASE || '';
};

/**
 * Development Mode Detection
 */
export const isDevelopment = () => {
    if (typeof window !== 'undefined') {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
    return process.env.NODE_ENV === 'development';
};

/**
 * Scoring Configuration
 * Points awarded for placements
 */
export const SCORING_SYSTEM = {
    // Placement points (for top finishers)
    PLACEMENT_POINTS: {
        1: 100,
        2: 90,
        3: 85,
        4: 80,
        5: 75,
        6: 70,
        7: 65,
        8: 60,
        9: 55,
        10: 50,
        // 11-20 scale linearly
        // Points below 10th place calculated dynamically
    },
    
    // Minimum placement for points
    MIN_PLACEMENT_FOR_POINTS: 50,
    
    // Time-based bonus points
    TIME_BONUS_THRESHOLD_MEN: '2:06:00', // Sub-2:06 for men
    TIME_BONUS_THRESHOLD_WOMEN: '2:24:00', // Sub-2:24 for women
    TIME_BONUS_POINTS: 10,
    
    // Record bonus points
    WORLD_RECORD_POINTS: 50,
    COURSE_RECORD_POINTS: 25,
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
    // Modal z-index
    MODAL_Z_INDEX: 1000,
    
    // Loading overlay duration
    LOADING_FADE_DURATION: 500, // milliseconds
    
    // Drag and drop touch sensitivity
    DRAG_THRESHOLD: 5, // pixels
    
    // Pagination defaults
    DEFAULT_PAGE_SIZE: 20,
};

/**
 * Error Messages
 * Centralized error messages for consistency
 */
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    INVALID_TEAM: 'Invalid team configuration. Please try again.',
    DRAFT_LOCKED: 'The draft is locked. You cannot make changes at this time.',
    RESULTS_FINALIZED: 'Results have been finalized. No further changes allowed.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    GENERIC_ERROR: 'An error occurred. Please try again.',
};

/**
 * Success Messages
 * Centralized success messages for consistency
 */
export const SUCCESS_MESSAGES = {
    TEAM_CREATED: 'Team created successfully!',
    TEAM_UPDATED: 'Team updated successfully!',
    RANKINGS_SUBMITTED: 'Rankings submitted successfully!',
    RESULTS_SAVED: 'Results saved successfully!',
    RESULTS_FINALIZED: 'Results finalized!',
    SESSION_CREATED: 'Session created successfully!',
};

/**
 * Feature Flags
 * Toggle features on/off
 */
export const FEATURE_FLAGS = {
    ENABLE_SNAKE_DRAFT: false, // Legacy snake draft (deprecated)
    ENABLE_SALARY_CAP_DRAFT: true, // Salary cap draft (active)
    ENABLE_LIVE_RESULTS: true, // Real-time results tracking
    ENABLE_COMMISSIONER_MODE: true, // Commissioner dashboard
    ENABLE_ATHLETE_MODAL: true, // Detailed athlete modal
    ENABLE_LEADERBOARD_AUTO_REFRESH: true, // Auto-refresh leaderboard
    ENABLE_GAME_RECAP_MODAL: true, // Game recap modal after results finalized
    ENABLE_SSR_LANDING_PAGE: true, // Server-side rendered landing page
};

/**
 * Route Paths
 * Centralized route definitions
 */
export const ROUTES = {
    HOME: '/',
    LEADERBOARD: '/leaderboard',
    COMMISSIONER: '/commissioner',
    TEAM_SESSION: '/team/[session]',
    ATHLETE_MODAL: '/athlete/[id]',
};
