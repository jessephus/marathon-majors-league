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

      {/* Main HTML content from index.html */}
      <div dangerouslySetInnerHTML={{ __html: getMainHTML() }} />
    </>
  )
}

function getMainHTML() {
  return `
    <div class="container">
        <header>
            <h1>🗽 Fantasy NY Marathon</h1>
        </header>

        <main id="app">
            <!-- Landing Page -->
            <div id="landing-page" class="page active">
                <div class="welcome-card">
                    <h2>Welcome to the Fantasy NY Marathon!</h2>
                    <p>Compete with friends by drafting elite marathon runners.</p>
                    <div class="auth-section">
                        <label for="player-code">Enter Your Player Code:</label>
                        <input type="text" id="player-code" placeholder="e.g., RUNNER or SPRINTER">
                        <button id="enter-game" class="btn btn-primary">Enter Game</button>
                    </div>
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
                <button id="back-to-landing" class="btn btn-secondary">Back to Home</button>
            </div>

            <!-- Commissioner Page -->
            <div id="commissioner-page" class="page">
                <h2>Commissioner Dashboard</h2>
                <div class="commissioner-actions">
                    <div class="action-card">
                        <h3>Game Setup</h3>
                        <label>Number of Players:</label>
                        <input type="number" id="num-players" min="2" max="4" value="3">
                        <button id="generate-codes" class="btn btn-primary">Generate Player Codes</button>
                        <div id="player-codes-display"></div>
                    </div>

                    <div class="action-card">
                        <h3>Draft Control</h3>
                        <button id="run-draft" class="btn btn-primary">Run Snake Draft</button>
                        <div id="draft-status"></div>
                    </div>

                    <div class="action-card">
                        <h3>Results Entry</h3>
                        <div id="results-form"></div>
                        <button id="update-results" class="btn btn-primary">Update Live Results</button>
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
                        <h3>Game State</h3>
                        <button id="reset-game" class="btn btn-danger">Reset Game</button>
                    </div>
                </div>
                <button id="back-from-commissioner" class="btn btn-secondary">Back to Home</button>
            </div>

            <!-- Athlete Management Page -->
            <div id="athlete-management-page" class="page">
                <h2>Athlete Management</h2>
                <p class="page-description">View and manage all athletes in the database</p>
                
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
            <p>Marathon Majors League &copy; 2025</p>
            <button id="home-button" class="btn btn-secondary">Home</button>
            <button id="commissioner-mode" class="btn btn-secondary">Commissioner Mode</button>
        </footer>
    </div>
  `;
}
