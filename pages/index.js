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
                                    <th class="rank-header">Rank</th>
                                    <th>Athlete</th>
                                    <th>Country</th>
                                    <th class="hidden-mobile">Personal Best</th>
                                    <th class="hidden-mobile">Season Best</th>
                                    <th class="hidden-mobile">Details</th>
                                    <th>NYC Confirmed</th>
                                </tr>
                            </thead>
                            <tbody id="athlete-table-body">
                                <!-- Athletes populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                    <div class="selection-summary">
                        <p>Selected: <span id="selection-count">0</span> / 10</p>
                    </div>
                    <button id="submit-rankings" class="btn btn-primary">Submit Rankings</button>
                    <button id="back-to-landing-from-ranking" class="btn btn-secondary">Back to Home</button>
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
                <button id="back-to-landing-from-commissioner" class="btn btn-secondary">Back to Home</button>
            </div>

            <!-- Athletes View Page -->
            <div id="athletes-page" class="page">
                <h2>All Athletes</h2>
                <div class="athlete-filter">
                    <div class="tabs">
                        <button class="tab active" data-gender="men">Men</button>
                        <button class="tab" data-gender="women">Women</button>
                    </div>
                </div>
                <div id="athletes-list"></div>
                <button id="back-from-athletes" class="btn btn-secondary">Back to Commissioner</button>
            </div>
        </main>
    </div>
  `;
}
