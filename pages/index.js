import Head from 'next/head'
import Script from 'next/script'

export default function Home() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Fantasy NY Marathon</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>

      {/* External scripts */}
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" strategy="beforeInteractive" />
      <Script src="/app.js" strategy="afterInteractive" />
      <Script src="/salary-cap-draft.js" strategy="afterInteractive" />

      {/* Main HTML content from index.html */}
      <div dangerouslySetInnerHTML={{ __html: getMainHTML() }} />
    </>
  )
}

function getMainHTML() {
  return `
    <div class="container">
        <!-- Initial Loading Overlay -->
        <div id="app-loading-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #fff; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h1 style="color: #ff6900; margin-bottom: 20px;">🗽 Fantasy NY Marathon</h1>
            <div class="loading-spinner">Loading your experience...</div>
        </div>
        
        <header>
            <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main id="app">
            <!-- Landing Page -->
            <div id="landing-page" class="page active">
                <div class="welcome-card">
                    <h2>Welcome to the Fantasy NY Marathon!</h2>
                    <p>Compete with friends by drafting elite marathon runners.</p>
                    
                    <!-- Team Creation for Visitors -->
                    <div class="create-team-section">
                        <h3>🏃‍♂️ Join the Competition</h3>
                        <p>Create your team and draft elite runners - no registration required!</p>
                        <button id="create-team-btn" class="btn btn-primary btn-large">Create a New Team</button>
                    </div>
                </div>
            </div>
            
            <!-- Team Creation Modal -->
            <div id="team-creation-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-team-modal">&times;</button>
                    <h2>Create Your Team</h2>
                    <p>Enter your team name to get started:</p>
                    <form id="team-creation-form">
                        <div class="form-group">
                            <label for="team-name">Team Name</label>
                            <input type="text" id="team-name" placeholder="e.g., The Fast Finishers" required maxlength="50">
                        </div>
                        <div class="form-group">
                            <label for="team-owner">Your Name (optional)</label>
                            <input type="text" id="team-owner" placeholder="e.g., John Smith" maxlength="50">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-team-creation">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Team & Start Drafting</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Commissioner TOTP Modal -->
            <div id="commissioner-totp-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-totp-modal">&times;</button>
                    <h2>Commissioner Login</h2>
                    <p>Enter the 6-digit code from your authenticator app:</p>
                    <form id="commissioner-totp-form">
                        <div class="form-group">
                            <label for="totp-code">TOTP Code</label>
                            <input type="text" id="totp-code" placeholder="000000" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="off">
                            <small>Code changes every 30 seconds</small>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-totp-login">Cancel</button>
                            <button type="submit" class="btn btn-primary">Login</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Ranking Page -->
            <div id="ranking-page" class="page">
                <div class="player-info">
                    <h2>Welcome, <span id="player-name"></span>!</h2>
                    <p>Rank all athletes by dragging rows or editing rank numbers. Your top 10 will be selected for the draft.</p>
                </div>

                <div class="athlete-selection">
                    <div class="athlete-selection-header">
                        <h3>Rank Athletes</h3>
                    </div>
                    <div class="tabs">
                        <button class="tab active" data-gender="men">Men</button>
                        <button class="tab" data-gender="women">Women</button>
                    </div>
                    <div id="athlete-table-container" class="athlete-table-container">
                        <table id="athlete-table" class="athlete-table">
                            <thead>
                                <tr>
                                    <th class="drag-handle-header"></th>
                                    <th class="rank-column">Rank</th>
                                    <th>Name</th>
                                    <th>Country</th>
                                    <th>PB</th>
                                    <th>Season Best</th>
                                    <th>Marathon Rank</th>
                                    <th>Overall Rank</th>
                                    <th>Age</th>
                                </tr>
                            </thead>
                            <tbody id="athlete-table-body">
                            </tbody>
                        </table>
                    </div>
                </div>

                <button id="submit-rankings" class="btn btn-primary">Submit Rankings</button>
            </div>

            <!-- Salary Cap Draft Page -->
            <div id="salary-cap-draft-page" class="page">
                <!-- Header with Team Info and Budget -->
                <div class="draft-header">
                    <div class="team-info">
                        <div class="team-avatar-placeholder">
                            <!-- Avatar will go here eventually -->
                            <div class="avatar-circle">
                                <span class="avatar-initials" id="team-avatar-initials"></span>
                            </div>
                        </div>
                        <div class="team-name-display">
                            <div class="team-name-label">Team</div>
                            <div class="team-name-value" id="header-team-name">Your Team</div>
                        </div>
                    </div>
                    <div class="draft-budget-compact">
                        <div class="budget-metric">
                            <span class="metric-label">Cap</span>
                            <span class="metric-value">$30K</span>
                        </div>
                        <div class="budget-metric">
                            <span class="metric-label">Spent</span>
                            <span class="metric-value" id="header-budget-spent">$0</span>
                        </div>
                        <div class="budget-metric">
                            <span class="metric-label">Left</span>
                            <span class="metric-value budget-remaining" id="header-budget-remaining">$30K</span>
                        </div>
                    </div>
                </div>

                <!-- Six Slot Boxes -->
                <div class="draft-slots-container">
                    <div class="draft-slot empty" data-slot="M1" data-gender="men" data-index="0">
                        <div class="slot-label">M1</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="M2" data-gender="men" data-index="1">
                        <div class="slot-label">M2</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="M3" data-gender="men" data-index="2">
                        <div class="slot-label">M3</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="W1" data-gender="women" data-index="0">
                        <div class="slot-label">W1</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="W2" data-gender="women" data-index="1">
                        <div class="slot-label">W2</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                    
                    <div class="draft-slot empty" data-slot="W3" data-gender="women" data-index="2">
                        <div class="slot-label">W3</div>
                        <div class="slot-content">
                            <div class="slot-placeholder">Tap to select</div>
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="draft-submit-container">
                    <button id="submit-salary-cap-team" class="btn btn-primary btn-large" disabled>Submit Team</button>
                    <button id="edit-salary-cap-team" class="btn btn-secondary btn-large" onclick="unlockRoster()" style="display: none; margin-left: 12px;">Edit Roster</button>
                </div>

                <!-- Navigation Buttons (shown after roster is locked) -->
                <div id="roster-navigation" class="page-actions" style="display: none; margin-top: 20px;">
                    <button id="view-leaderboard-from-roster" class="btn btn-primary">View Leaderboard</button>
                </div>

                <!-- Athlete Selection Modal (slides in from right) -->
                <div id="athlete-selection-modal" class="selection-modal">
                    <div class="modal-header">
                        <button class="modal-back-btn" id="close-selection-modal">
                            <span class="back-arrow">←</span>
                        </button>
                        <h3 id="selection-modal-title">Select Athlete</h3>
                    </div>
                    
                    <div class="modal-sort-tabs">
                        <button class="sort-tab active" data-sort="salary">Salary</button>
                        <button class="sort-tab" data-sort="pb">PB</button>
                        <button class="sort-tab" data-sort="rank">Rank</button>
                    </div>
                    
                    <div class="modal-athlete-list" id="modal-athlete-list">
                        <!-- Populated by JavaScript -->
                    </div>
                </div>

                <!-- Athlete Detail Modal (full featured modal) -->
                <div id="athlete-detail-modal" class="modal">
                    <div class="modal-overlay" onclick="closeDetailModal()"></div>
                    <div class="athlete-card-container detail-athlete-card" onclick="event.stopPropagation()">
                        <button class="modal-close" aria-label="Close" id="close-detail-modal">&times;</button>
                        
                        <div id="detail-card-masthead" class="card-masthead">
                            <div class="masthead-content">
                                <div class="masthead-photo-section">
                                    <div class="masthead-photo-wrapper">
                                        <img id="detail-modal-athlete-photo" src="" alt="Athlete photo" class="masthead-photo">
                                        <div class="masthead-flag">
                                            <span id="detail-modal-athlete-country" class="flag-emoji"></span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="masthead-bio-section">
                                    <h2 id="detail-modal-athlete-name" class="athlete-name"></h2>
                                    <div class="bio-details">
                                        <div class="bio-item">
                                            <span id="detail-modal-athlete-gender" class="bio-value"></span>
                                        </div>
                                        <div class="bio-item">
                                            <span id="detail-modal-athlete-age" class="bio-value"></span>
                                        </div>
                                    </div>
                                    <div class="masthead-stats-grid">
                                        <div class="masthead-stat">
                                            <div class="masthead-stat-label">Marathon Rank</div>
                                            <div id="detail-modal-athlete-marathon-rank" class="masthead-stat-value"></div>
                                        </div>
                                        <div class="masthead-stat">
                                            <div class="masthead-stat-label">Personal Best</div>
                                            <div id="detail-modal-athlete-pb" class="masthead-stat-value"></div>
                                        </div>
                                        <div class="masthead-stat">
                                            <div class="masthead-stat-label">Salary</div>
                                            <div id="detail-modal-athlete-salary" class="masthead-stat-value"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tabs-container">
                            <nav class="tabs-nav">
                                <button class="tab-button active" data-tab="detail-overview">Overview</button>
                                <button class="tab-button" data-tab="detail-results">Race Log</button>
                                <button class="tab-button" data-tab="detail-progression">Progression</button>
                                <button class="tab-button" data-tab="detail-news">News</button>
                            </nav>
                        </div>

                        <div class="tab-content-container">
                            <div id="tab-detail-overview" class="tab-panel active">
                                <div class="overview-section">
                                    <h3 class="section-title">Key Statistics</h3>
                                    <div class="stats-grid">
                                        <div class="stat-card">
                                            <div class="stat-label">Personal Best</div>
                                            <div id="detail-overview-pb" class="stat-value-large"></div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="stat-label">Season Best</div>
                                            <div id="detail-modal-athlete-sb" class="stat-value-large"></div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="stat-label">Marathon Rank</div>
                                            <div id="detail-overview-marathon-rank" class="stat-value-large"></div>
                                        </div>
                                        <div class="stat-card">
                                            <div class="stat-label">Overall Rank</div>
                                            <div id="detail-modal-athlete-overall-rank" class="stat-value-large"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="overview-section">
                                    <h3 class="section-title">Profile Information</h3>
                                    <div class="profile-grid">
                                        <div class="profile-row">
                                            <span class="profile-label">Date of Birth</span>
                                            <span id="detail-modal-athlete-dob" class="profile-value">N/A</span>
                                        </div>
                                        <div class="profile-row">
                                            <span class="profile-label">World Athletics ID</span>
                                            <span id="detail-modal-athlete-wa-id" class="profile-value">N/A</span>
                                        </div>
                                        <div class="profile-row">
                                            <span class="profile-label">Road Running Rank</span>
                                            <span id="detail-modal-athlete-road-rank" class="profile-value">N/A</span>
                                        </div>
                                        <div id="detail-modal-athlete-sponsor-section" class="profile-row" style="display: none;">
                                            <span class="profile-label">Sponsor</span>
                                            <span id="detail-modal-athlete-sponsor" class="profile-value">N/A</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="overview-section">
                                    <a id="detail-modal-wa-link" href="#" target="_blank" rel="noopener noreferrer" class="wa-link-button">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                        </svg>
                                        View Full World Athletics Profile
                                    </a>
                                </div>
                            </div>

                            <div id="tab-detail-results" class="tab-panel">
                                <div class="tab-content-header">
                                    <h3 class="tab-content-title">2025 Race Results</h3>
                                    <div id="detail-results-loading" class="loading-indicator">Loading...</div>
                                </div>
                                <div id="detail-results-list" class="results-list"></div>
                                <div id="detail-results-empty" class="empty-state" style="display: none;">
                                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                    </svg>
                                    <p>No 2025 race results available</p>
                                </div>
                            </div>

                            <div id="tab-detail-progression" class="tab-panel">
                                <div class="tab-content-header">
                                    <h3 id="detail-progression-title" class="tab-content-title">Season's Best: Marathon</h3>
                                    <div id="detail-progression-loading" class="loading-indicator">Loading...</div>
                                </div>
                                <div class="chart-container">
                                    <canvas id="detail-progression-chart-canvas"></canvas>
                                </div>
                                <select id="detail-discipline-selector" class="discipline-selector" style="display: none;">
                                    <option value="Marathon">Marathon</option>
                                </select>
                                <div id="detail-selected-race-info" class="selected-race-info" style="display: none;">
                                    <h4 class="race-info-title">Race Details</h4>
                                    <div id="detail-race-info-content"></div>
                                </div>
                                <div id="detail-progression-empty" class="empty-state" style="display: none;">
                                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <p>No progression data available</p>
                                </div>
                            </div>

                            <div id="tab-detail-news" class="tab-panel">
                                <div class="tab-content-header">
                                    <h3 class="tab-content-title">Latest News</h3>
                                </div>
                                <div class="empty-state">
                                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                                    </svg>
                                    <p>News feed coming soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Draft Page -->
            <div id="draft-page" class="page">
                <h2>Draft Results</h2>
                <p class="draft-info">The snake draft has been completed! Here are the teams:</p>
                <div id="draft-results"></div>
                <button id="view-teams" class="btn btn-primary">View Teams</button>
            </div>

            <!-- Teams Page -->
            <div id="teams-page" class="page">
                <h2>Team Rosters</h2>
                <div id="teams-display"></div>
                <div class="page-actions">
                    <button id="view-leaderboard-btn" class="btn btn-primary">View Leaderboard</button>
                    <button id="back-to-landing" class="btn btn-secondary">Back to Home</button>
                </div>
            </div>

            <!-- Leaderboard Page -->
            <div id="leaderboard-page" class="page">
                <h2>Leaderboard</h2>
                
                <!-- Leaderboard Tabs -->
                <div class="leaderboard-tabs">
                    <button class="leaderboard-tab active" data-tab="fantasy">Fantasy Results</button>
                    <button class="leaderboard-tab" data-tab="race">Race Results</button>
                </div>
                
                <!-- Fantasy Results Tab Content (default) -->
                <div id="fantasy-results-tab" class="leaderboard-tab-content active">
                    <div id="leaderboard-display"></div>
                </div>
                
                <!-- Race Results Tab Content -->
                <div id="race-results-tab" class="leaderboard-tab-content">
                    <div class="race-results-controls">
                        <div class="gender-toggle">
                            <button class="gender-toggle-btn active" data-gender="men">Men</button>
                            <button class="gender-toggle-btn" data-gender="women">Women</button>
                        </div>
                        <div class="split-selector">
                            <label for="split-select">Show:</label>
                            <select id="split-select" class="split-select">
                                <option value="finish">Finish Time</option>
                                <option value="5k">5K Split</option>
                                <option value="10k">10K Split</option>
                                <option value="half">Half Marathon</option>
                                <option value="30k">30K Split</option>
                                <option value="35k">35K Split</option>
                                <option value="40k">40K Split</option>
                            </select>
                        </div>
                    </div>
                    <div id="race-results-display"></div>
                </div>
                
                <div class="page-actions">
                    <button id="back-to-roster" class="btn btn-secondary">Back to Roster</button>
                </div>
            </div>

            <!-- Commissioner Page -->
            <div id="commissioner-page" class="page">
                <h2>Commissioner Dashboard</h2>
                <div class="commissioner-actions">
                    <div class="action-card">
                        <h3>Player Links</h3>
                        <div id="player-codes-display"></div>
                        <button id="manage-teams-btn" class="btn btn-primary" style="margin-top: 16px;">Manage Players/Teams</button>
                    </div>

                    <div class="action-card">
                        <h3>Draft Control</h3>
                        <button id="run-draft" class="btn btn-primary">Run Snake Draft</button>
                        <div id="draft-status"></div>
                    </div>

                    <div class="action-card">
                        <h3>Results Management</h3>
                        <button id="manage-results-btn" class="btn btn-primary">Manage Live Results</button>
                        <button id="finalize-results" class="btn btn-success" style="display: none;">Finalize Results & Crown Winner</button>
                        <button id="reset-results" class="btn btn-warning">Reset Live Results</button>
                        <div id="live-standings"></div>
                        <div id="winner-display"></div>
                    </div>

                    <div class="action-card">
                        <h3>Athlete Management</h3>
                        <button id="view-athletes" class="btn btn-primary">View All Athletes</button>
                    </div>

                    <div class="action-card">
                        <h3>Development Tools</h3>
                        <button id="load-demo-data" class="btn btn-primary">🎭 Load Demo Data</button>
                        <p style="font-size: 0.85em; color: #666; margin-top: 10px;">
                            Creates 3 fake teams with rosters and optional results for testing
                        </p>
                    </div>

                    <div class="action-card">
                        <h3>Game State</h3>
                        <button id="reset-game" class="btn btn-danger">Reset Game</button>
                    </div>
                </div>
                <button id="back-from-commissioner" class="btn btn-secondary">Back to Home</button>
            </div>

            <!-- Manage Players/Teams Page -->
            <div id="manage-teams-page" class="page">
                <h2>Manage Players/Teams</h2>
                <p class="page-description">View and manage all players and their team status</p>
                
                <div class="manage-teams-container">
                    <table id="teams-status-table" class="teams-status-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Team Name</th>
                                <th>Player Link</th>
                                <th>Rankings</th>
                                <th class="draft-status-column">Draft Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="teams-status-table-body">
                            <!-- Populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <button id="back-to-commissioner-from-teams" class="btn btn-secondary">Back to Dashboard</button>
            </div>

            <!-- Athlete Management Page -->
            <div id="athlete-management-page" class="page">
                <h2>Athlete Management</h2>
                <p class="page-description">View and manage all athletes in the database</p>
                
                <div class="action-buttons">
                    <button id="add-athlete-btn" class="btn btn-primary">Add New Athlete</button>
                </div>
                
                <div class="athlete-filters">
                    <label>
                        <input type="checkbox" id="filter-confirmed" checked> Show only confirmed for NYC Marathon
                    </label>
                    <label>
                        <input type="checkbox" id="filter-missing-wa-id"> Show only missing World Athletics ID
                    </label>
                    <label>
                        Gender:
                        <select id="filter-gender">
                            <option value="all">All</option>
                            <option value="men">Men</option>
                            <option value="women">Women</option>
                        </select>
                    </label>
                    <label>
                        Sort by:
                        <select id="sort-athletes">
                            <option value="id">ID</option>
                            <option value="name">Name</option>
                            <option value="marathon_rank">Marathon Rank</option>
                            <option value="pb">Personal Best</option>
                        </select>
                    </label>
                </div>
                
                <div id="athlete-management-container"></div>
                
                <button id="back-to-commissioner" class="btn btn-secondary">Back to Dashboard</button>
            </div>

            <!-- Results Management Page -->
            <div id="results-management-page" class="page">
                <h2>Manage Live Results</h2>
                <p class="page-description">View and edit all race results entered so far</p>
                
                <!-- View Selector -->
                <div class="results-view-controls">
                    <label for="results-view-select">Show:</label>
                    <select id="results-view-select" class="view-selector">
                        <option value="finish">Finish Time</option>
                        <option value="5k">5K Split</option>
                        <option value="10k">10K Split</option>
                        <option value="half">Half Marathon Split</option>
                        <option value="30k">30K Split</option>
                        <option value="35k">35K Split</option>
                        <option value="40k">40K Split</option>
                        <option value="bonuses">Bonus Points</option>
                    </select>
                </div>
                
                <div id="results-management-container">
                    <table id="results-table" class="results-table">
                        <thead>
                            <tr>
                                <th>Athlete</th>
                                <th>Country</th>
                                <th>Gender</th>
                                <th id="time-column-header">Finish Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="results-table-body">
                            <!-- Populated by JavaScript -->
                        </tbody>
                    </table>
                    <div id="no-results-message" style="display: none; text-align: center; padding: 40px; color: var(--dark-gray);">
                        <p>No results have been entered yet.</p>
                        <p>Results will appear here once you start entering athlete finish times.</p>
                    </div>
                </div>
                
                <button id="back-to-commissioner-from-results" class="btn btn-secondary">Back to Dashboard</button>
            </div>
            
            <!-- Add Athlete Modal -->
            <div id="add-athlete-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="add-athlete-modal-close">&times;</button>
                    <h2>Add New Athlete</h2>
                    <form id="add-athlete-form">
                        <div class="form-group">
                            <label for="athlete-name">Name *</label>
                            <input type="text" id="athlete-name" required placeholder="First LAST">
                        </div>
                        <div class="form-group">
                            <label for="athlete-country">Country Code *</label>
                            <input type="text" id="athlete-country" required placeholder="USA" maxlength="3" pattern="[A-Z]{3}">
                        </div>
                        <div class="form-group">
                            <label for="athlete-gender">Gender *</label>
                            <select id="athlete-gender" required>
                                <option value="">Select...</option>
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="athlete-pb">Personal Best *</label>
                            <input type="text" id="athlete-pb" required placeholder="2:05:30" pattern="[0-9]:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="athlete-season-best">Season Best</label>
                            <input type="text" id="athlete-season-best" placeholder="2:06:00" pattern="[0-9]:[0-9]{2}:[0-9]{2}">
                        </div>
                        <div class="form-group">
                            <label for="athlete-marathon-rank">Marathon Rank</label>
                            <input type="number" id="athlete-marathon-rank" placeholder="42" min="1">
                        </div>
                        <div class="form-group">
                            <label for="athlete-age">Age</label>
                            <input type="number" id="athlete-age" placeholder="28" min="18" max="60">
                        </div>
                        <div class="form-group">
                            <label for="athlete-sponsor">Sponsor</label>
                            <input type="text" id="athlete-sponsor" placeholder="Nike">
                        </div>
                        <div class="form-group">
                            <label for="athlete-wa-id">World Athletics ID</label>
                            <input type="text" id="athlete-wa-id" placeholder="14208500">
                        </div>
                        <div class="form-group">
                            <label for="athlete-headshot">Headshot URL</label>
                            <input type="url" id="athlete-headshot" placeholder="https://...">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="athlete-confirm-nyc">
                                Confirm for NYC Marathon
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Add Athlete</button>
                            <button type="button" class="btn btn-secondary" id="cancel-add-athlete">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </main>

        <!-- Athlete Card Modal -->
        <div id="athlete-modal" class="modal">
            <div class="modal-overlay"></div>
            <div class="athlete-card-container">
                <button class="modal-close" aria-label="Close">&times;</button>
                
                <div id="card-masthead" class="card-masthead">
                    <div class="masthead-content">
                        <div class="masthead-photo-section">
                            <div class="masthead-photo-wrapper">
                                <img id="modal-athlete-photo" src="" alt="Athlete photo" class="masthead-photo">
                                <div class="masthead-flag">
                                    <span id="modal-athlete-country" class="flag-emoji"></span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="masthead-bio-section">
                            <h2 id="modal-athlete-name" class="athlete-name"></h2>
                            <div class="bio-details">
                                <div class="bio-item">
                                    <span id="modal-athlete-gender" class="bio-value"></span>
                                </div>
                                <div class="bio-item">
                                    <span id="modal-athlete-age" class="bio-value"></span>
                                </div>
                            </div>
                            <div class="masthead-stats-grid">
                                <div class="masthead-stat">
                                    <div class="masthead-stat-label">Marathon Rank</div>
                                    <div id="modal-athlete-marathon-rank" class="masthead-stat-value"></div>
                                </div>
                                <div class="masthead-stat">
                                    <div class="masthead-stat-label">Personal Best</div>
                                    <div id="modal-athlete-pb" class="masthead-stat-value"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tabs-container">
                    <nav class="tabs-nav">
                        <button class="tab-button active" data-tab="overview">Overview</button>
                        <button class="tab-button" data-tab="results">Race Log</button>
                        <button class="tab-button" data-tab="progression">Progression</button>
                        <button class="tab-button" data-tab="news">News</button>
                    </nav>
                </div>

                <div class="tab-content-container">
                    <div id="tab-overview" class="tab-panel active">
                        <div class="overview-section">
                            <h3 class="section-title">Key Statistics</h3>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-label">Personal Best</div>
                                    <div id="overview-pb" class="stat-value-large"></div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Season Best</div>
                                    <div id="modal-athlete-sb" class="stat-value-large"></div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Marathon Rank</div>
                                    <div id="overview-marathon-rank" class="stat-value-large"></div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Overall Rank</div>
                                    <div id="modal-athlete-overall-rank" class="stat-value-large"></div>
                                </div>
                            </div>
                        </div>

                        <div class="overview-section">
                            <h3 class="section-title">Profile Information</h3>
                            <div class="profile-grid">
                                <div class="profile-row">
                                    <span class="profile-label">Date of Birth</span>
                                    <span id="modal-athlete-dob" class="profile-value">N/A</span>
                                </div>
                                <div class="profile-row">
                                    <span class="profile-label">World Athletics ID</span>
                                    <span id="modal-athlete-wa-id" class="profile-value">N/A</span>
                                </div>
                                <div class="profile-row">
                                    <span class="profile-label">Road Running Rank</span>
                                    <span id="modal-athlete-road-rank" class="profile-value">N/A</span>
                                </div>
                                <div id="modal-athlete-sponsor-section" class="profile-row" style="display: none;">
                                    <span class="profile-label">Sponsor</span>
                                    <span id="modal-athlete-sponsor" class="profile-value">N/A</span>
                                </div>
                            </div>
                        </div>

                        <div class="overview-section">
                            <a id="modal-wa-link" href="#" target="_blank" rel="noopener noreferrer" class="wa-link-button">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                                View Full World Athletics Profile
                            </a>
                        </div>
                    </div>

                    <div id="tab-results" class="tab-panel">
                        <div class="tab-content-header">
                            <h3 class="tab-content-title">2025 Race Results</h3>
                            <div id="results-loading" class="loading-indicator">Loading...</div>
                        </div>
                        <div id="results-list" class="results-list"></div>
                        <div id="results-empty" class="empty-state" style="display: none;">
                            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <p>No 2025 race results available</p>
                        </div>
                    </div>

                    <div id="tab-progression" class="tab-panel">
                        <div class="tab-content-header">
                            <h3 id="progression-title" class="tab-content-title">Season's Best: Marathon</h3>
                            <div id="progression-loading" class="loading-indicator">Loading...</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="progression-chart-canvas"></canvas>
                        </div>
                        <select id="discipline-selector" class="discipline-selector" style="display: none;">
                            <option value="Marathon">Marathon</option>
                        </select>
                        <div id="selected-race-info" class="selected-race-info" style="display: none;">
                            <h4 class="race-info-title">Race Details</h4>
                            <div id="race-info-content"></div>
                        </div>
                        <div id="progression-empty" class="empty-state" style="display: none;">
                            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <p>No progression data available</p>
                        </div>
                    </div>

                    <div id="tab-news" class="tab-panel">
                        <div class="tab-content-header">
                            <h3 class="tab-content-title">Latest News</h3>
                        </div>
                        <div class="empty-state">
                            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                            </svg>
                            <p>News feed coming soon</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <div class="footer-actions">
                <button id="home-button" class="btn btn-secondary">Home</button>
                <button id="commissioner-mode" class="btn btn-secondary">Commissioner Mode</button>
                <div class="game-switcher">
                    <label for="game-select">Game: </label>
                    <select id="game-select" class="game-select">
                        <option value="default">Default Game</option>
                        <option value="demo-game">Demo Game</option>
                    </select>
                </div>
            </div>
            <p class="footer-copyright">Marathon Majors League &copy; 2025</p>
        </footer>
    </div>
  `;
}
