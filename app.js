// Game State
let gameState = {
    athletes: { men: [], women: [] },
    players: [],
    currentPlayer: null,
    rankings: {},
    teams: {},
    results: {},
    draftComplete: false,
    resultsFinalized: false
};

// View state for ranking page
let rankingViewState = {
    currentGender: 'men'
};

// API base URL - will be relative in production
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
const GAME_ID = 'default'; // Can be made configurable if multiple games needed

// Load game state from database
async function loadGameState() {
    try {
        const response = await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`);
        if (response.ok) {
            const data = await response.json();
            gameState.players = data.players || [];
            gameState.draftComplete = data.draftComplete || false;
            gameState.resultsFinalized = data.resultsFinalized || false;
            gameState.rankings = data.rankings || {};
            gameState.teams = data.teams || {};
            gameState.results = data.results || {};
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Save game state to database
async function saveGameState() {
    try {
        await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                players: gameState.players,
                draftComplete: gameState.draftComplete,
                resultsFinalized: gameState.resultsFinalized
            })
        });
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Load athletes data
async function loadAthletes() {
    try {
        // Load from database API (will auto-seed if empty)
        const response = await fetch(`${API_BASE}/api/athletes`);
        
        if (!response.ok) {
            throw new Error(`Failed to load athletes: ${response.status} ${response.statusText}`);
        }
        
        const athletes = await response.json();
        
        // Validate we got data
        if (!athletes || !athletes.men || !athletes.women) {
            throw new Error('Invalid athletes data structure received from API');
        }
        
        if (athletes.men.length === 0 && athletes.women.length === 0) {
            throw new Error('No athletes data available - database may not be initialized');
        }
        
        gameState.athletes = athletes;
        console.log(`Loaded ${athletes.men.length} men and ${athletes.women.length} women athletes from database`);
        
    } catch (error) {
        console.error('Error loading athletes:', error);
        
        // Show user-friendly error message
        const errorMessage = `
            <div style="padding: 20px; background: #fee; border: 2px solid #c33; border-radius: 8px; margin: 20px;">
                <h3 style="color: #c33; margin-top: 0;">⚠️ Unable to Load Athletes</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>The database may not be initialized yet. Please try one of the following:</p>
                <ol>
                    <li>Wait a few moments and refresh the page</li>
                    <li>Contact the commissioner to initialize the database</li>
                    <li>Visit <code>/api/init-db</code> to manually initialize</li>
                </ol>
            </div>
        `;
        
        // Display error in the UI
        const mainContent = document.querySelector('main') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = errorMessage;
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
        
        // Set empty arrays to prevent further errors
        gameState.athletes = { men: [], women: [] };
    }
}

// Initialize the app
async function init() {
    await loadAthletes();
    await loadGameState();
    setupEventListeners();
    setupAthleteModal();
    showPage('landing-page');
}

// Setup event listeners
function setupEventListeners() {
    // Landing page
    document.getElementById('enter-game').addEventListener('click', handleEnterGame);
    document.getElementById('commissioner-mode').addEventListener('click', handleCommissionerMode);

    // Ranking page
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.gender));
    });
    document.getElementById('submit-rankings').addEventListener('click', handleSubmitRankings);

    // Draft page
    document.getElementById('view-teams').addEventListener('click', async () => {
        // Reload game state to get latest results
        await loadGameState();
        displayTeams();
        showPage('teams-page');
    });

    // Teams page
    document.getElementById('back-to-landing').addEventListener('click', () => showPage('landing-page'));

    // Commissioner page
    document.getElementById('generate-codes').addEventListener('click', handleGenerateCodes);
    document.getElementById('run-draft').addEventListener('click', handleRunDraft);
    document.getElementById('update-results').addEventListener('click', handleUpdateResults);
    document.getElementById('finalize-results').addEventListener('click', handleFinalizeResults);
    document.getElementById('reset-results').addEventListener('click', handleResetResults);
    document.getElementById('reset-game').addEventListener('click', handleResetGame);
    document.getElementById('export-data').addEventListener('click', handleExportData);
    document.getElementById('view-athletes').addEventListener('click', () => {
        showPage('athlete-management-page');
        handleViewAthletes();
    });
    document.getElementById('filter-confirmed').addEventListener('change', handleViewAthletes);
    document.getElementById('filter-missing-wa-id').addEventListener('change', handleViewAthletes);
    document.getElementById('filter-gender').addEventListener('change', handleViewAthletes);
    document.getElementById('sort-athletes').addEventListener('change', handleViewAthletes);
    document.getElementById('back-from-commissioner').addEventListener('click', () => showPage('landing-page'));
    document.getElementById('back-to-commissioner').addEventListener('click', () => showPage('commissioner-page'));
}

// Show page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// Handle enter game
function handleEnterGame() {
    const code = document.getElementById('player-code').value.trim().toUpperCase();
    if (!code) {
        alert('Please enter a player code');
        return;
    }

    if (!gameState.players.includes(code)) {
        alert('Invalid player code. Please check with your commissioner.');
        return;
    }

    gameState.currentPlayer = code;
    document.getElementById('player-name').textContent = code;

    // Check if player has already submitted rankings
    if (gameState.rankings[code]) {
        if (gameState.draftComplete) {
            displayTeams();
            showPage('teams-page');
        } else {
            alert('You have already submitted your rankings. Waiting for draft...');
            showPage('landing-page');
        }
    } else {
        setupRankingPage();
        showPage('ranking-page');
    }
}

// Handle commissioner mode
function handleCommissionerMode() {
    const password = prompt('Enter commissioner password:');
    if (password === 'kipchoge') {
        showPage('commissioner-page');
        // Refresh player codes display if players exist
        if (gameState.players.length > 0) {
            displayPlayerCodes();
        }
        // Setup results form if draft is complete
        if (gameState.draftComplete) {
            setupResultsForm();
            updateLiveStandings();
            
            // Update button states based on finalized state
            if (gameState.resultsFinalized) {
                document.getElementById('update-results').textContent = 'Results Finalized';
                document.getElementById('update-results').disabled = true;
                document.getElementById('finalize-results').style.display = 'none';
            } else {
                document.getElementById('update-results').textContent = 'Update Live Results';
                document.getElementById('update-results').disabled = false;
                if (Object.keys(gameState.results).length > 0) {
                    document.getElementById('finalize-results').style.display = 'inline-block';
                } else {
                    document.getElementById('finalize-results').style.display = 'none';
                }
            }
        }
    } else if (password !== null) {
        alert('Incorrect password');
    }
}

// Setup ranking page
function setupRankingPage() {
    switchTab('men');
}

// Switch tab
function switchTab(gender) {
    rankingViewState.currentGender = gender;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.gender === gender);
    });
    
    // Always display table view
    displayAthleteTable(gender);
}


// Display athlete table view
function displayAthleteTable(gender) {
    const tbody = document.getElementById('athlete-table-body');
    tbody.innerHTML = '';
    
    if (!gameState.currentPlayer) return;
    
    // Get or initialize rankings for this gender
    if (!gameState.rankings[gameState.currentPlayer]) {
        gameState.rankings[gameState.currentPlayer] = { men: [], women: [] };
    }
    
    let rankings = gameState.rankings[gameState.currentPlayer][gender];
    
    // If no rankings yet, initialize with all athletes sorted by PB
    if (rankings.length === 0) {
        rankings = sortAthletesByPB([...(gameState.athletes[gender] || [])]);
        gameState.rankings[gameState.currentPlayer][gender] = rankings;
    }
    
    // Display all athletes in their current rank order
    rankings.forEach((athlete, index) => {
        const row = document.createElement('tr');
        row.className = 'ranked-row';
        row.draggable = false; // Only enable when handle is grabbed
        row.dataset.athleteId = athlete.id;
        row.dataset.gender = gender;
        row.dataset.rankIndex = index;
        
        // Drag handle cell (first column)
        const dragHandleCell = document.createElement('td');
        dragHandleCell.className = 'drag-handle-cell';
        dragHandleCell.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">
                <span class="drag-grip">⋮⋮</span>
            </div>
        `;
        
        const dragHandle = dragHandleCell.querySelector('.drag-handle');
        
        // Desktop: Enable dragging only when handle is clicked
        dragHandle.addEventListener('mousedown', (e) => {
            row.draggable = true;
        });
        
        // Desktop drag event listeners (on the row)
        row.addEventListener('dragstart', handleTableRowDragStart);
        row.addEventListener('dragover', handleTableRowDragOver);
        row.addEventListener('drop', handleTableRowDrop);
        row.addEventListener('dragend', (e) => {
            handleTableRowDragEnd.call(row, e);
            row.draggable = false; // Disable after drag
        });
        
        // Mobile: Touch event listeners on the handle only
        dragHandle.addEventListener('touchstart', handleTableRowTouchStart.bind(row), { passive: false });
        dragHandle.addEventListener('touchmove', handleTableRowTouchMove.bind(row), { passive: false });
        dragHandle.addEventListener('touchend', handleTableRowTouchEnd.bind(row), { passive: false });
        
        row.appendChild(dragHandleCell);
        
        // Rank cell (editable)
        const rankCell = document.createElement('td');
        rankCell.className = 'rank-cell-input';
        
        const rankInput = document.createElement('input');
        rankInput.type = 'number';
        rankInput.className = 'table-rank-input';
        rankInput.min = '1';
        rankInput.max = rankings.length.toString();
        rankInput.value = index + 1;
        rankInput.title = 'Edit rank and press Enter';
        rankInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleTableRankChange(gender, athlete.id, parseInt(rankInput.value));
                rankInput.blur();
            }
        });
        rankInput.addEventListener('blur', () => {
            // Revert to current rank if invalid
            const updatedRank = gameState.rankings[gameState.currentPlayer][gender].findIndex(r => r.id === athlete.id);
            rankInput.value = updatedRank + 1;
        });
        rankInput.addEventListener('click', (e) => {
            e.stopPropagation();
            rankInput.select();
        });
        rankCell.appendChild(rankInput);
        row.appendChild(rankCell);
        
        // Name cell (clickable to open modal)
        const nameCell = document.createElement('td');
        nameCell.className = 'name-cell';
        nameCell.textContent = athlete.name;
        nameCell.style.cursor = 'pointer';
        nameCell.addEventListener('click', () => openAthleteModal(athlete));
        row.appendChild(nameCell);
        
        // Country cell
        const countryCell = document.createElement('td');
        countryCell.className = 'country-cell';
        countryCell.innerHTML = `${getCountryFlag(athlete.country)} ${athlete.country}`;
        row.appendChild(countryCell);
        
        // PB cell
        const pbCell = document.createElement('td');
        pbCell.className = 'pb-cell';
        pbCell.textContent = athlete.pb || '-';
        row.appendChild(pbCell);
        
        // Season Best cell
        const sbCell = document.createElement('td');
        sbCell.textContent = athlete.seasonBest || '-';
        row.appendChild(sbCell);
        
        // Marathon Rank cell
        const marathonRankCell = document.createElement('td');
        marathonRankCell.className = 'rank-display-cell';
        if (athlete.marathonRank) {
            marathonRankCell.textContent = `#${athlete.marathonRank}`;
            if (athlete.marathonRank <= 10) {
                marathonRankCell.classList.add('top-rank');
            }
        } else {
            marathonRankCell.textContent = '-';
        }
        row.appendChild(marathonRankCell);
        
        // Overall Rank cell
        const overallRankCell = document.createElement('td');
        overallRankCell.className = 'rank-display-cell';
        if (athlete.overallRank) {
            overallRankCell.textContent = `#${athlete.overallRank}`;
            if (athlete.overallRank <= 10) {
                overallRankCell.classList.add('top-rank');
            }
        } else {
            overallRankCell.textContent = '-';
        }
        row.appendChild(overallRankCell);
        
        // Age cell
        const ageCell = document.createElement('td');
        ageCell.textContent = athlete.age || '-';
        row.appendChild(ageCell);
        
        tbody.appendChild(row);
    });
}

// Drag and drop for table rows (desktop + mobile touch)
let draggedTableRow = null;
let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;

function handleTableRowDragStart(e) {
    draggedTableRow = this;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleTableRowDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedTableRow !== this) {
        const tbody = this.parentElement;
        const rankedRows = Array.from(tbody.querySelectorAll('.ranked-row'));
        const draggedIndex = rankedRows.indexOf(draggedTableRow);
        const targetIndex = rankedRows.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentElement.insertBefore(draggedTableRow, this.nextSibling);
        } else {
            this.parentElement.insertBefore(draggedTableRow, this);
        }
    }
    
    return false;
}

function handleTableRowDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Update rankings based on new table row order
    const gender = this.dataset.gender;
    const tbody = this.parentElement;
    const rankedRows = Array.from(tbody.querySelectorAll('.ranked-row'));
    
    const newOrder = rankedRows.map(row => {
        const athleteId = parseInt(row.dataset.athleteId);
        const allAthletes = [...gameState.athletes.men, ...gameState.athletes.women];
        return allAthletes.find(a => a.id === athleteId);
    }).filter(Boolean);
    
    gameState.rankings[gameState.currentPlayer][gender] = newOrder;
    
    // Refresh displays
    displayAthleteTable(gender);
    
    return false;
}

function handleTableRowDragEnd(e) {
    this.style.opacity = '1';
    draggedTableRow = null;
}

// Mobile touch handlers for drag handle
function handleTableRowTouchStart(e) {
    // Start dragging immediately when handle is touched (this is bound to the row)
    const row = this;
    
    isDragging = true;
    draggedTableRow = row;
    touchStartY = e.touches[0].clientY;
    touchCurrentY = touchStartY;
    
    row.style.opacity = '0.8';
    row.style.zIndex = '1000';
    row.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
    row.style.backgroundColor = '#90caf9';
    
    e.preventDefault(); // Prevent default touch behavior on handle
}

function handleTableRowTouchMove(e) {
    if (!isDragging || !draggedTableRow) return;
    
    // Prevent scrolling while dragging
    e.preventDefault();
    
    const touch = e.touches[0];
    touchCurrentY = touch.clientY; // Update current touch position
    const deltaY = touchCurrentY - touchStartY;
    
    // Visual feedback - move the row
    draggedTableRow.style.transform = `translateY(${deltaY}px)`;
    
    // Find which row we're hovering over by temporarily hiding the dragged row
    
    // Temporarily hide the dragged row from pointer events to detect what's underneath
    const originalPointerEvents = draggedTableRow.style.pointerEvents;
    draggedTableRow.style.pointerEvents = 'none';
    
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const rowBelow = elementBelow ? elementBelow.closest('.ranked-row') : null;
    
    // Restore pointer events
    draggedTableRow.style.pointerEvents = originalPointerEvents;
    
    if (rowBelow && rowBelow !== draggedTableRow) {
        const tbody = draggedTableRow.parentElement;
        const rankedRows = Array.from(tbody.querySelectorAll('.ranked-row'));
        const draggedIndex = rankedRows.indexOf(draggedTableRow);
        const targetIndex = rankedRows.indexOf(rowBelow);
        
        if (draggedIndex < targetIndex) {
            tbody.insertBefore(draggedTableRow, rowBelow.nextSibling);
        } else {
            tbody.insertBefore(draggedTableRow, rowBelow);
        }
        
        // Reset transform and touch position after reordering
        draggedTableRow.style.transform = '';
        touchStartY = touch.clientY;
    }
}

function handleTableRowTouchEnd(e) {
    if (!draggedTableRow) return;
    
    if (isDragging) {
        // Prevent click events from firing
        e.preventDefault();
        
        // Update rankings based on new table row order
        const gender = draggedTableRow.dataset.gender;
        const tbody = draggedTableRow.parentElement;
        const rankedRows = Array.from(tbody.querySelectorAll('.ranked-row'));
        
        const newOrder = rankedRows.map(row => {
            const athleteId = parseInt(row.dataset.athleteId);
            const allAthletes = [...gameState.athletes.men, ...gameState.athletes.women];
            return allAthletes.find(a => a.id === athleteId);
        }).filter(Boolean);
        
        gameState.rankings[gameState.currentPlayer][gender] = newOrder;
        
        // Refresh displays
        displayAthleteTable(gender);
    }
    
    // Reset state
    if (draggedTableRow) {
        draggedTableRow.style.opacity = '';
        draggedTableRow.style.transform = '';
        draggedTableRow.style.zIndex = '';
        draggedTableRow.style.boxShadow = '';
        draggedTableRow.style.backgroundColor = '';
        draggedTableRow.style.pointerEvents = '';
    }
    draggedTableRow = null;
    isDragging = false;
    dragCancelled = false;
}

// Handle rank change from table input
function handleTableRankChange(gender, athleteId, newRank) {
    const rankings = gameState.rankings[gameState.currentPlayer][gender];
    
    // Validate rank
    if (newRank < 1 || newRank > rankings.length || isNaN(newRank)) {
        alert(`Please enter a valid rank between 1 and ${rankings.length}`);
        displayAthleteTable(gender);
        return;
    }
    
    // Find athlete's current position
    const currentIndex = rankings.findIndex(a => a.id === athleteId);
    if (currentIndex === -1) return;
    
    // Don't do anything if rank hasn't changed
    if (currentIndex === newRank - 1) {
        displayAthleteTable(gender);
        return;
    }
    
    // Remove athlete from current position
    const athlete = rankings.splice(currentIndex, 1)[0];
    
    // Insert at new position
    rankings.splice(newRank - 1, 0, athlete);
    
    // Refresh display
    displayAthleteTable(gender);
}

// Sort athletes by personal best time (fastest first)
function sortAthletesByPB(athletes) {
    return athletes.sort((a, b) => {
        const aTime = timeStringToSeconds(a.pb) || 999999;
        const bTime = timeStringToSeconds(b.pb) || 999999;
        return aTime - bTime;
    });
}

// Convert time string to seconds for sorting
function timeStringToSeconds(timeStr) {
    if (!timeStr || timeStr === '-') return null;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        const [h, m, s] = parts.map(Number);
        return h * 3600 + m * 60 + s;
    }
    return null;
}

// Legacy functions - no longer used with table-only view
function addAthleteToRanking(gender, athlete) {
    // Not used - table view manages all athletes
}

function removeAthleteFromRanking(gender, athleteId) {
    // Not used - table view manages all athletes
}

function updateRankingDisplay(gender) {
    // Not used - no separate ranking display boxes
}

function setupDragAndDrop(gender) {
    // Not used - table has its own drag and drop
}

function handleManualRankChange(gender, athleteId, newRank) {
    // Not used - table has its own rank change handler
}

// Drag and drop handlers for ranking boxes (legacy - not used)
function handleDragStart(e) {}
function handleDragOver(e) { return false; }
function handleDrop(e) { return false; }
function handleDragEnd(e) {}
function getDragAfterElement(container, y) { return null; }

// Handle submit rankings
async function handleSubmitRankings() {
    const allMenRankings = gameState.rankings[gameState.currentPlayer]?.men || [];
    const allWomenRankings = gameState.rankings[gameState.currentPlayer]?.women || [];

    // Extract top 10 from each gender
    const menRankings = allMenRankings.slice(0, 10);
    const womenRankings = allWomenRankings.slice(0, 10);

    if (menRankings.length !== 10 || womenRankings.length !== 10) {
        alert('Please ensure you have ranked at least 10 men and 10 women before submitting.');
        return;
    }

    try {
        // Save top 10 rankings to database
        await fetch(`${API_BASE}/api/rankings?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerCode: gameState.currentPlayer,
                men: menRankings,
                women: womenRankings
            })
        });

        alert('Rankings submitted successfully! The draft will run once all players have submitted.');
        showPage('landing-page');
    } catch (error) {
        console.error('Error submitting rankings:', error);
        alert('Error submitting rankings. Please try again.');
    }
}

// Commissioner functions
async function handleGenerateCodes() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    if (numPlayers < 2 || numPlayers > 4) {
        alert('Please enter a number between 2 and 4');
        return;
    }

    // Marathon-themed words for player codes
    const marathonWords = [
        'RUNNER', 'SPRINTER', 'PACER', 'CHAMPION', 
        'FINISHER', 'STRIDE', 'ENDURANCE', 'VELOCITY',
        'RACER', 'ATHLETE', 'DASHER', 'JOGGER',
        'TRACKSTAR', 'SPEEDSTER', 'MARATHON', 'DISTANCE'
    ];

    // Fisher-Yates shuffle for better randomization
    const shuffled = [...marathonWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    gameState.players = shuffled.slice(0, numPlayers);

    displayPlayerCodes();

    await saveGameState();
}

function hasPlayerSubmittedRankings(playerCode) {
    const ranking = gameState.rankings[playerCode];
    return ranking && 
           ranking.men && 
           ranking.women && 
           ranking.men.length === 10 && 
           ranking.women.length === 10;
}

function displayPlayerCodes() {
    const display = document.getElementById('player-codes-display');
    display.innerHTML = '<h4>Player Codes (share these with your players):</h4>';
    
    gameState.players.forEach(code => {
        const hasSubmitted = hasPlayerSubmittedRankings(code);
        
        const item = document.createElement('div');
        item.className = `player-code-item ${hasSubmitted ? 'submitted' : 'pending'}`;
        
        const statusIcon = document.createElement('span');
        statusIcon.className = 'status-icon';
        statusIcon.textContent = hasSubmitted ? '✓' : '○';
        
        const codeText = document.createElement('span');
        codeText.textContent = `${code} - ${window.location.origin}${window.location.pathname}?player=${code}`;
        
        const statusText = document.createElement('span');
        statusText.className = 'status-text';
        statusText.textContent = hasSubmitted ? 'Rankings submitted' : 'Pending';
        
        item.appendChild(statusIcon);
        item.appendChild(codeText);
        item.appendChild(statusText);
        display.appendChild(item);
    });
    
    // Add summary
    const submittedCount = gameState.players.filter(code => hasPlayerSubmittedRankings(code)).length;
    
    const summary = document.createElement('div');
    summary.className = 'rankings-summary';
    summary.innerHTML = `<strong>${submittedCount} of ${gameState.players.length} players have submitted rankings</strong>`;
    display.appendChild(summary);
}

// Snake draft algorithm
async function handleRunDraft() {
    // Check if all players have submitted rankings
    const allSubmitted = gameState.players.every(player => gameState.rankings[player]);
    
    if (!allSubmitted) {
        alert('Not all players have submitted their rankings yet.');
        return;
    }

    // Run snake draft
    gameState.teams = {};
    gameState.players.forEach(player => {
        gameState.teams[player] = { men: [], women: [] };
    });

    // Randomize player order
    const draftOrder = [...gameState.players].sort(() => Math.random() - 0.5);

    // Draft men (3 per player)
    snakeDraft(draftOrder, 'men', 3);

    // Draft women (3 per player)
    snakeDraft(draftOrder, 'women', 3);

    gameState.draftComplete = true;

    try {
        // Save draft results to database
        await fetch(`${API_BASE}/api/draft?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teams: gameState.teams })
        });

        // Display draft results
        displayDraftResults();
        document.getElementById('draft-status').innerHTML = '<p style="color: green; font-weight: bold;">✓ Draft completed successfully!</p>';
        showPage('draft-page');
    } catch (error) {
        console.error('Error saving draft:', error);
        alert('Error saving draft results. Please try again.');
    }
}

function snakeDraft(draftOrder, gender, perPlayer) {
    const numRounds = perPlayer;
    let reverse = false;

    for (let round = 0; round < numRounds; round++) {
        const order = reverse ? [...draftOrder].reverse() : [...draftOrder];
        
        order.forEach(player => {
            // Get player's rankings for this gender
            const rankings = gameState.rankings[player][gender];
            
            // Find highest ranked available athlete
            for (let athlete of rankings) {
                const isAvailable = !Object.values(gameState.teams).some(team => 
                    team[gender].some(a => a.id === athlete.id)
                );
                
                if (isAvailable) {
                    gameState.teams[player][gender].push(athlete);
                    break;
                }
            }
        });
        
        reverse = !reverse;
    }
}

function displayDraftResults() {
    const container = document.getElementById('draft-results');
    container.innerHTML = '';

    Object.entries(gameState.teams).forEach(([player, team]) => {
        const card = createTeamCard(player, team);
        container.appendChild(card);
    });
}

function displayTeams() {
    const container = document.getElementById('teams-display');
    container.innerHTML = '';

    if (!gameState.draftComplete) {
        container.innerHTML = '<p>Draft has not been completed yet.</p>';
        return;
    }

    // Add live results notice if results exist but not finalized
    if (Object.keys(gameState.results).length > 0 && !gameState.resultsFinalized) {
        const notice = document.createElement('div');
        notice.style.cssText = 'background: var(--warning-bg); color: var(--warning-text); padding: 8px 12px; border-radius: 5px; margin-bottom: 15px; text-align: center; font-size: 0.85em; border-left: 3px solid var(--warning-yellow);';
        notice.innerHTML = '⚡ <strong>Live Results:</strong> Refresh to see updates';
        container.appendChild(notice);
    }

    Object.entries(gameState.teams).forEach(([player, team]) => {
        const card = createTeamCard(player, team, true);
        container.appendChild(card);
    });
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode) {
    // Generate flag emoji from country code using Unicode Regional Indicator symbols
    // Regional Indicators: A = U+1F1E6, B = U+1F1E7, ... Z = U+1F1FF
    const getFlag = (code) => {
        if (!code || code.length < 2) return '\u{1F3C1}'; // checkered flag
        
        // Map country codes to ISO 3166-1 alpha-2 codes
        const isoMap = {
            'AUS': 'AU', 'CAN': 'CA', 'ERI': 'ER', 'ETH': 'ET',
            'FRA': 'FR', 'GBR': 'GB', 'IRE': 'IE', 'ITA': 'IT',
            'JPN': 'JP', 'KEN': 'KE', 'MEX': 'MX', 'NED': 'NL',
            'NOR': 'NO', 'SUI': 'CH', 'TAN': 'TZ', 'USA': 'US',
            // Legacy codes
            'BEL': 'BE', 'UGA': 'UG', 'MAR': 'MA', 'CHN': 'CN',
            'ARG': 'AR', 'ESP': 'ES'
        };
        
        const iso = isoMap[code];
        if (!iso) return '\u{1F3C1}'; // checkered flag
        
        // Convert ISO code to Regional Indicator symbols
        // A = U+1F1E6, B = U+1F1E7, etc.
        const codePoints = iso.split('').map(char => 
            0x1F1E6 + char.charCodeAt(0) - 65
        );
        
        return String.fromCodePoint(...codePoints);
    };
    
    return getFlag(countryCode);
}

// Helper function to enrich athlete data with current information from athletes.json
function enrichAthleteData(athlete, gender) {
    // Find the current athlete data from gameState.athletes
    const currentData = gameState.athletes[gender]?.find(a => a.id === athlete.id);
    // Merge the saved athlete data with current data, prioritizing current data
    return currentData ? { ...athlete, ...currentData } : athlete;
}

// Helper function to create headshot element
function createHeadshotElement(athlete, className) {
    // Don't create headshot for missing URLs or default placeholders
    if (!athlete.headshotUrl || 
        athlete.headshotUrl.includes('default.jpg') || 
        athlete.headshotUrl.includes('placeholder')) {
        return null;
    }
    
    const headshotDiv = document.createElement('div');
    headshotDiv.className = className;
    const img = document.createElement('img');
    img.src = athlete.headshotUrl;
    img.alt = athlete.name;
    img.onerror = function() {
        // Hide the entire headshot container if image fails to load
        headshotDiv.style.display = 'none';
    };
    headshotDiv.appendChild(img);
    return headshotDiv;
}

// Helper function to format athlete details
function formatAthleteDetails(athlete, includePersonalBest = false) {
    let detailsParts = [];
    if (includePersonalBest) detailsParts.push(`PB: ${athlete.pb}`);
    
    // Add World Athletics rankings if available
    if (athlete.marathonRank) {
        detailsParts.push(`Marathon #${athlete.marathonRank}`);
    }
    // Show road running rank if available (even if marathon rank exists)
    if (athlete.roadRunningRank) {
        detailsParts.push(`Road #${athlete.roadRunningRank}`);
    }
    
    // Legacy fields (for backward compatibility)
    if (athlete.age) detailsParts.push(`Age: ${athlete.age}`);
    if (athlete.sponsor) detailsParts.push(athlete.sponsor);
    if (athlete.worldRanking) detailsParts.push(`${includePersonalBest ? '#' : 'Rank: #'}${athlete.worldRanking}`);
    
    return detailsParts.join(' • ');
}

function createTeamCard(player, team, showScore = false) {
    const card = document.createElement('div');
    card.className = 'team-card';

    const title = document.createElement('h3');
    title.textContent = player;
    card.appendChild(title);

    // Show score/ranking at the top if results are available
    if (showScore && Object.keys(gameState.results).length > 0) {
        const averageTime = calculateAverageTime(team);
        
        // Calculate team rankings
        const allScores = {};
        Object.entries(gameState.teams).forEach(([p, t]) => {
            allScores[p] = calculateTeamScore(t);
        });
        const sortedTeams = Object.entries(allScores).sort((a, b) => a[1] - b[1]);
        const rank = sortedTeams.findIndex(([p, s]) => p === player) + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score';
        scoreDiv.style.fontWeight = rank === 1 ? 'bold' : 'normal';
        scoreDiv.style.color = rank === 1 ? 'var(--primary-red)' : 'inherit';
        scoreDiv.style.marginBottom = '15px';
        scoreDiv.style.padding = '10px';
        scoreDiv.style.background = rank === 1 ? 'rgba(220, 53, 69, 0.1)' : 'var(--light-gray)';
        scoreDiv.style.borderRadius = '5px';
        scoreDiv.innerHTML = `
            <div style="font-size: 1.2em; margin-bottom: 5px;">
                ${medal} Rank: #${rank} of ${sortedTeams.length}
            </div>
            <div>Average Finish Time: ${averageTime}</div>
        `;
        card.appendChild(scoreDiv);
    }

    // Men's team
    const menSection = document.createElement('div');
    menSection.className = 'team-section';
    
    const menTitle = document.createElement('h4');
    menTitle.textContent = "Men's Team";
    menSection.appendChild(menTitle);
    
    team.men.forEach(athlete => {
        // Enrich athlete data with current information
        const enrichedAthlete = enrichAthleteData(athlete, 'men');
        const time = gameState.results[enrichedAthlete.id] || '-';
        const athleteDiv = document.createElement('div');
        athleteDiv.className = 'athlete';
        
        // Create headshot container
        const headshot = createHeadshotElement(enrichedAthlete, 'headshot');
        if (headshot) athleteDiv.appendChild(headshot);
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'athlete-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        
        // Add World Athletics link if available
        if (enrichedAthlete.worldAthleticsProfileUrl) {
            const link = document.createElement('a');
            link.href = enrichedAthlete.worldAthleticsProfileUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = enrichedAthlete.name;
            link.style.color = 'inherit';
            link.title = 'View World Athletics profile';
            nameDiv.appendChild(link);
        } else {
            nameDiv.textContent = enrichedAthlete.name;
        }
        
        const countryDiv = document.createElement('div');
        countryDiv.className = 'country';
        countryDiv.innerHTML = `${getCountryFlag(enrichedAthlete.country)} ${enrichedAthlete.country}`;
        
        const detailsText = formatAthleteDetails(enrichedAthlete);
        if (detailsText) {
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'details';
            detailsDiv.textContent = detailsText;
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(countryDiv);
            infoDiv.appendChild(detailsDiv);
        } else {
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(countryDiv);
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'time';
        timeDiv.textContent = time;
        
        athleteDiv.appendChild(infoDiv);
        athleteDiv.appendChild(timeDiv);
        menSection.appendChild(athleteDiv);
    });
    card.appendChild(menSection);

    // Women's team
    const womenSection = document.createElement('div');
    womenSection.className = 'team-section';
    
    const womenTitle = document.createElement('h4');
    womenTitle.textContent = "Women's Team";
    womenSection.appendChild(womenTitle);
    
    team.women.forEach(athlete => {
        // Enrich athlete data with current information
        const enrichedAthlete = enrichAthleteData(athlete, 'women');
        const time = gameState.results[enrichedAthlete.id] || '-';
        const athleteDiv = document.createElement('div');
        athleteDiv.className = 'athlete';
        
        // Create headshot container
        const headshot = createHeadshotElement(enrichedAthlete, 'headshot');
        if (headshot) athleteDiv.appendChild(headshot);
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'athlete-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        
        // Add World Athletics link if available
        if (enrichedAthlete.worldAthleticsProfileUrl) {
            const link = document.createElement('a');
            link.href = enrichedAthlete.worldAthleticsProfileUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = enrichedAthlete.name;
            link.style.color = 'inherit';
            link.title = 'View World Athletics profile';
            nameDiv.appendChild(link);
        } else {
            nameDiv.textContent = enrichedAthlete.name;
        }
        
        const countryDiv = document.createElement('div');
        countryDiv.className = 'country';
        countryDiv.innerHTML = `${getCountryFlag(enrichedAthlete.country)} ${enrichedAthlete.country}`;
        
        const detailsText = formatAthleteDetails(enrichedAthlete);
        if (detailsText) {
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'details';
            detailsDiv.textContent = detailsText;
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(countryDiv);
            infoDiv.appendChild(detailsDiv);
        } else {
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(countryDiv);
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'time';
        timeDiv.textContent = time;
        
        athleteDiv.appendChild(infoDiv);
        athleteDiv.appendChild(timeDiv);
        womenSection.appendChild(athleteDiv);
    });
    card.appendChild(womenSection);

    return card;
}

// Results management - Update live results
async function handleUpdateResults() {
    // First, collect all results from the form inputs (in case user hasn't left the field yet)
    const form = document.getElementById('results-form');
    
    // Check if form exists
    if (!form) {
        alert('Please complete the draft first before entering results.');
        return;
    }
    
    const inputs = form.querySelectorAll('input[data-athlete-id]');
    
    console.log('Found', inputs.length, 'input fields');
    
    if (inputs.length === 0) {
        alert('No results form found. Please make sure the draft is complete.');
        return;
    }
    
    // Collect all values from inputs and track invalid ones
    let hasAnyValues = false;
    const invalidFields = [];
    inputs.forEach(input => {
        const athleteId = parseInt(input.dataset.athleteId, 10);
        const time = input.value.trim();
        console.log(`Athlete ${athleteId}: "${time}"`);
        if (time) {
            hasAnyValues = true;
            if (/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/.test(time)) {
                gameState.results[athleteId] = time;
                console.log(`Added result for athlete ${athleteId}: ${time}`);
                // Mark as valid
                input.style.borderColor = '#28a745';
                input.style.backgroundColor = '#d4edda';
            } else {
                console.log(`Invalid format for athlete ${athleteId}: ${time}`);
                // Mark as invalid
                input.style.borderColor = '#dc3545';
                input.style.backgroundColor = '#f8d7da';
                // Get athlete name from label
                const label = input.previousElementSibling;
                if (label) {
                    invalidFields.push(label.textContent + ': "' + time + '"');
                }
            }
        }
    });
    
    console.log('Total results in gameState:', Object.keys(gameState.results).length);

    if (Object.keys(gameState.results).length === 0) {
        if (invalidFields.length > 0) {
            alert('Invalid time format detected. Please use HH:MM:SS format (e.g., 2:05:30 or 0:14:30).\n\nFields with invalid format:\n' + invalidFields.slice(0, 5).join('\n') + (invalidFields.length > 5 ? '\n... and ' + (invalidFields.length - 5) + ' more' : ''));
        } else if (hasAnyValues) {
            alert('Please check the time format. Times should be in HH:MM:SS format (e.g., 2:05:30)');
        } else {
            alert('Please enter results first using the form above.');
        }
        return;
    }

    // Update live standings display
    updateLiveStandings();
    
    // Show finalize button
    document.getElementById('finalize-results').style.display = 'inline-block';

    try {
        // Save results to database
        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: gameState.results })
        });
        
        alert('Live results updated! Players can now see the current standings.');
    } catch (error) {
        console.error('Error saving results:', error);
        alert('Error saving results. Please check the console for details.');
    }
}

// Finalize results and crown winner
async function handleFinalizeResults() {
    if (!confirm('Are you sure you want to finalize the results? This will declare the winner and lock all results.')) {
        return;
    }

    const scores = {};
    const averageTimes = {};
    Object.entries(gameState.teams).forEach(([player, team]) => {
        scores[player] = calculateTeamScore(team);
        averageTimes[player] = calculateAverageTime(team);
    });

    // Find winner (lowest score wins in marathon)
    const winner = Object.entries(scores).reduce((best, [player, score]) => {
        if (!best || score < best.score) {
            return { player, score };
        }
        return best;
    }, null);

    const display = document.getElementById('winner-display');
    display.innerHTML = `
        <h3>🏆 Winner: ${winner.player}</h3>
        <p>Average Finish Time: ${averageTimes[winner.player]}</p>
        <hr style="margin: 10px 0; border-color: rgba(255,255,255,0.3);">
        ${Object.entries(scores).sort((a, b) => a[1] - b[1]).map(([player, score], i) => 
            `<div>${i + 1}. ${player}: ${averageTimes[player]}</div>`
        ).join('')}
    `;

    // Mark results as finalized
    gameState.resultsFinalized = true;
    
    // Hide the finalize button and update button text
    document.getElementById('finalize-results').style.display = 'none';
    document.getElementById('update-results').textContent = 'Results Finalized';
    document.getElementById('update-results').disabled = true;

    try {
        // Save finalized state
        await saveGameState();
        
        // Save results to database
        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: gameState.results })
        });
    } catch (error) {
        console.error('Error saving results:', error);
    }
}

// Update live standings display
function updateLiveStandings() {
    const display = document.getElementById('live-standings');
    
    if (Object.keys(gameState.results).length === 0) {
        display.innerHTML = '';
        return;
    }

    const scores = {};
    const averageTimes = {};
    Object.entries(gameState.teams).forEach(([player, team]) => {
        scores[player] = calculateTeamScore(team);
        averageTimes[player] = calculateAverageTime(team);
    });

    const sortedTeams = Object.entries(scores).sort((a, b) => a[1] - b[1]);

    display.innerHTML = `
        <h4 style="margin-top: 20px;">Current Standings</h4>
        <div style="background: var(--light-gray); padding: 15px; border-radius: 5px; margin-top: 10px;">
            ${sortedTeams.map(([player, score], i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                return `<div style="padding: 8px 0; font-weight: ${i === 0 ? 'bold' : 'normal'}; color: ${i === 0 ? 'var(--primary-red)' : 'inherit'};">
                    ${medal} ${player}: ${averageTimes[player]}
                </div>`;
            }).join('')}
        </div>
    `;
}

function calculateTeamScore(team) {
    let totalSeconds = 0;
    
    [...team.men, ...team.women].forEach(athlete => {
        const time = gameState.results[athlete.id];
        if (time) {
            totalSeconds += timeToSeconds(time);
        }
    });

    return totalSeconds;
}

function timeToSeconds(timeStr) {
    // Convert "HH:MM:SS" or "H:MM:SS" to seconds
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
}

function secondsToTime(totalSeconds) {
    // Convert seconds to "H:MM:SS" format
    // Round to handle floating point precision
    const roundedSeconds = Math.round(totalSeconds);
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = roundedSeconds % 60;
    
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateAverageTime(team) {
    const totalSeconds = calculateTeamScore(team);
    const numAthletes = team.men.length + team.women.length;
    
    if (numAthletes === 0) {
        return '0:00:00';
    }
    
    const averageSeconds = totalSeconds / numAthletes;
    return secondsToTime(averageSeconds);
}

function setupResultsForm() {
    const form = document.getElementById('results-form');
    form.innerHTML = '<h4>Enter Athlete Finish Times (HH:MM:SS - e.g., 2:05:30)</h4><p style="color: var(--dark-gray); font-size: 0.9em; margin-bottom: 15px;">Format: Hours:Minutes:Seconds (e.g., 2:15:45 or 0:14:30)</p>';

    // Get all unique athletes from teams
    const allAthletes = new Set();
    Object.values(gameState.teams).forEach(team => {
        [...team.men, ...team.women].forEach(athlete => {
            allAthletes.add(JSON.stringify(athlete));
        });
    });

    Array.from(allAthletes).map(a => JSON.parse(a)).forEach(athlete => {
        const entry = document.createElement('div');
        entry.className = 'result-entry';
        const currentTime = gameState.results[athlete.id] || '';
        entry.innerHTML = `
            <label>${escapeHtml(athlete.name)} (${escapeHtml(athlete.country)})</label>
            <input type="text" 
                   data-athlete-id="${athlete.id}"
                   value="${escapeHtml(currentTime)}"
                   placeholder="0:14:30 or 2:05:30"
                   pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
        `;
        form.appendChild(entry);
    });

    // Add event listeners to save results and validate format
    form.querySelectorAll('input').forEach(input => {
        // Real-time validation on input
        input.addEventListener('input', (e) => {
            const time = e.target.value.trim();
            if (time === '') {
                // Empty is valid (not yet entered)
                e.target.style.borderColor = '';
                e.target.style.backgroundColor = '';
                return;
            }
            
            // Check if format is valid (HH:MM:SS or H:MM:SS)
            if (/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/.test(time)) {
                // Valid format
                e.target.style.borderColor = '#28a745';
                e.target.style.backgroundColor = '#d4edda';
            } else {
                // Invalid format
                e.target.style.borderColor = '#dc3545';
                e.target.style.backgroundColor = '#f8d7da';
            }
        });
        
        // Save on change (when user leaves the field)
        input.addEventListener('change', async (e) => {
            const athleteId = parseInt(e.target.dataset.athleteId, 10);
            const time = e.target.value;
            if (time && /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/.test(time)) {
                gameState.results[athleteId] = time;
                // Auto-save to database
                try {
                    await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ results: { [athleteId]: time } })
                    });
                    // Update live standings as results are entered
                    updateLiveStandings();
                } catch (error) {
                    console.error('Error saving result:', error);
                }
            }
        });
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function handleResetResults() {
    if (!confirm('Are you sure you want to reset live results? This will clear all athlete times but keep teams and draft intact.')) {
        return;
    }

    try {
        // Clear results from database
        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: {} })
        });

        // Clear resultsFinalized flag
        gameState.resultsFinalized = false;
        await saveGameState();

        // Update local game state
        gameState.results = {};

        // Clear displayed data
        document.getElementById('live-standings').innerHTML = '';
        document.getElementById('winner-display').innerHTML = '';
        
        // Re-setup the results form with empty values
        if (gameState.draftComplete) {
            setupResultsForm();
        }

        // Reset button states
        document.getElementById('update-results').textContent = 'Update Live Results';
        document.getElementById('update-results').disabled = false;
        document.getElementById('finalize-results').style.display = 'none';

        alert('Live results have been reset. You can now enter new times.');
    } catch (error) {
        console.error('Error resetting results:', error);
        alert('Error resetting results. Please try again.');
    }
}

async function handleResetGame() {
    if (confirm('Are you sure you want to reset the entire game? This cannot be undone.')) {
        try {
            // Clear database by deleting all records for this game
            await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    players: [],
                    draftComplete: false
                })
            });

            // Clear rankings from database
            await fetch(`${API_BASE}/api/rankings?gameId=${GAME_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rankings: {} })
            });

            // Clear teams (draft results) from database
            await fetch(`${API_BASE}/api/draft?gameId=${GAME_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teams: {} })
            });

            // Clear results from database
            await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: {} })
            });

            // Update local game state
            gameState.players = [];
            gameState.currentPlayer = null;
            gameState.rankings = {};
            gameState.teams = {};
            gameState.results = {};
            gameState.draftComplete = false;
            gameState.resultsFinalized = false;

            // Clear any displayed data
            document.getElementById('player-codes-display').innerHTML = '';
            document.getElementById('draft-status').innerHTML = '';
            document.getElementById('results-form').innerHTML = '';
            document.getElementById('winner-display').innerHTML = '';
            document.getElementById('live-standings').innerHTML = '';
            
            alert('Game has been reset.');
            showPage('landing-page');
        } catch (error) {
            console.error('Error resetting game:', error);
            alert('Error resetting game. Please try again.');
        }
    }
}

function handleExportData() {
    const data = JSON.stringify(gameState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fantasy-ny-marathon-data.json';
    a.click();
}

// Handle view athletes
async function handleViewAthletes() {
    const container = document.getElementById('athlete-management-container');
    
    // Get filter values
    const confirmedOnly = document.getElementById('filter-confirmed').checked;
    const missingWaIdOnly = document.getElementById('filter-missing-wa-id').checked;
    const genderFilter = document.getElementById('filter-gender').value;
    const sortBy = document.getElementById('sort-athletes').value;
    
    try {
        container.innerHTML = '<p>Loading athletes...</p>';
        
        // Fetch all athletes from API with confirmedOnly parameter
        const response = await fetch(`${API_BASE}/api/athletes?confirmedOnly=${confirmedOnly}`);
        if (!response.ok) throw new Error('Failed to load athletes');
        const athletesData = await response.json();
        
        // Combine men and women
        let allAthletes = [
            ...athletesData.men.map(a => ({...a, gender: 'men'})),
            ...athletesData.women.map(a => ({...a, gender: 'women'}))
        ];
        
        // Apply gender filter
        if (genderFilter !== 'all') {
            allAthletes = allAthletes.filter(a => a.gender === genderFilter);
        }
        
        // Apply missing WA ID filter
        if (missingWaIdOnly) {
            allAthletes = allAthletes.filter(a => !a.worldAthleticsId || a.worldAthleticsId.trim() === '');
        }
        
        // Sort athletes
        allAthletes.sort((a, b) => {
            if (sortBy === 'id') return a.id - b.id;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'marathon_rank') {
                const rankA = a.marathonRank || 9999;
                const rankB = b.marathonRank || 9999;
                return rankA - rankB;
            }
            if (sortBy === 'pb') {
                const pbA = a.pb || '9:99:99';
                const pbB = b.pb || '9:99:99';
                return pbA.localeCompare(pbB);
            }
            return 0;
        });
        
        // Display table
        if (allAthletes.length === 0) {
            container.innerHTML = '<p>No athletes found.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'athlete-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Country</th>
                    <th>Gender</th>
                    <th>Personal Best</th>
                    <th>Marathon Rank</th>
                    <th>Age</th>
                    <th>World Athletics ID</th>
                    <th>NYC Confirmed</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${allAthletes.map(athlete => `
                    <tr data-athlete-id="${athlete.id}">
                        <td>${athlete.id}</td>
                        <td>
                            <a href="#" class="athlete-name-link" data-athlete-id="${athlete.id}" title="View athlete details">
                                ${athlete.name}
                            </a>
                        </td>
                        <td>${athlete.country}</td>
                        <td>${athlete.gender === 'men' ? 'M' : 'W'}</td>
                        <td>${athlete.pb || 'N/A'}</td>
                        <td>${athlete.marathonRank ? '#' + athlete.marathonRank : 'N/A'}</td>
                        <td>${athlete.age || 'N/A'}</td>
                        <td class="wa-id-cell">
                            <input 
                                type="text" 
                                class="wa-id-input" 
                                data-athlete-id="${athlete.id}"
                                value="${athlete.worldAthleticsId || ''}" 
                                placeholder="Enter WA ID"
                                title="World Athletics ID (e.g., 14208500)"
                            />
                        </td>
                        <td>${athlete.nycConfirmed ? '✓ Yes' : '✗ No'}</td>
                        <td class="actions-cell">
                            <button 
                                class="btn-save-wa-id btn-small" 
                                data-athlete-id="${athlete.id}"
                                title="Save World Athletics ID"
                            >Save</button>
                            <button 
                                class="btn-sync-athlete btn-small btn-secondary" 
                                data-athlete-id="${athlete.id}"
                                data-athlete-name="${athlete.name}"
                                data-wa-id="${athlete.worldAthleticsId || ''}"
                                title="Sync athlete data from World Athletics"
                                ${!athlete.worldAthleticsId ? 'disabled' : ''}
                            >Sync</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = `
            <p><strong>${allAthletes.length} athlete(s) found</strong></p>
            <div class="table-scroll">
                ${table.outerHTML}
            </div>
        `;
        
        // Add event listeners to athlete name links
        document.querySelectorAll('.athlete-name-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const athleteId = parseInt(e.target.dataset.athleteId, 10);
                const athlete = allAthletes.find(a => a.id === athleteId);
                if (athlete) {
                    openAthleteModal(athlete);
                }
            });
        });
        
        // Add event listeners to save buttons
        document.querySelectorAll('.btn-save-wa-id').forEach(button => {
            button.addEventListener('click', handleSaveWorldAthleticsId);
        });
        
        // Add event listeners to sync buttons
        document.querySelectorAll('.btn-sync-athlete').forEach(button => {
            button.addEventListener('click', handleSyncAthlete);
        });
        
    } catch (error) {
        console.error('Error loading athletes:', error);
        container.innerHTML = '<p style="color: red;">Error loading athletes. Please try again.</p>';
    }
}

// Handle saving World Athletics ID
async function handleSaveWorldAthleticsId(event) {
    const button = event.target;
    const athleteId = button.getAttribute('data-athlete-id');
    const input = document.querySelector(`.wa-id-input[data-athlete-id="${athleteId}"]`);
    const worldAthleticsId = input.value.trim();
    
    // Confirm if removing ID
    if (!worldAthleticsId) {
        if (!confirm('Are you sure you want to remove the World Athletics ID for this athlete?')) {
            return;
        }
    }
    
    try {
        button.disabled = true;
        button.textContent = 'Saving...';
        
        const response = await fetch(`${API_BASE}/api/update-athlete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                athleteId: parseInt(athleteId),
                worldAthleticsId: worldAthleticsId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update');
        }
        
        const result = await response.json();
        
        // Show success feedback
        button.textContent = 'Saved!';
        button.style.backgroundColor = '#4CAF50';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = 'Save';
            button.style.backgroundColor = '';
            button.disabled = false;
        }, 2000);
        
        console.log('Updated athlete:', result.athlete);
        
    } catch (error) {
        console.error('Error saving World Athletics ID:', error);
        alert('Failed to save World Athletics ID: ' + error.message);
        button.textContent = 'Save';
        button.disabled = false;
    }
}

// Handle syncing individual athlete
async function handleSyncAthlete(event) {
    const button = event.target;
    const athleteId = button.getAttribute('data-athlete-id');
    const athleteName = button.getAttribute('data-athlete-name');
    const worldAthleticsId = button.getAttribute('data-wa-id');
    
    if (!worldAthleticsId) {
        alert('Cannot sync athlete without a World Athletics ID. Please add the ID first.');
        return;
    }
    
    try {
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Syncing...';
        button.style.opacity = '0.6';
        
        const response = await fetch(`${API_BASE}/api/sync-athlete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                athleteId: parseInt(athleteId),
                worldAthleticsId: worldAthleticsId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to sync athlete');
        }
        
        const result = await response.json();
        
        // Show success feedback
        button.textContent = 'Synced!';
        button.style.backgroundColor = '#4CAF50';
        button.style.opacity = '1';
        
        // Reload the athlete table to show updated data
        setTimeout(async () => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
            button.disabled = false;
            
            // Refresh the table
            await handleViewAthletes();
        }, 2000);
        
        console.log('Synced athlete:', result.athlete);
        
    } catch (error) {
        console.error('Error syncing athlete:', error);
        alert('Failed to sync athlete: ' + error.message + '\n\nThis may be because:\n- The World Athletics ID is incorrect\n- The athlete is not in the current rankings\n- Network or server error');
        button.textContent = 'Sync';
        button.style.opacity = '1';
        button.disabled = false;
    }
}

// ============================================================================
// ATHLETE CARD MODAL
// ============================================================================

/**
 * Open athlete detail modal with progression and race results
 * @param {number|object} athleteIdOrData - Athlete ID or full athlete object
 */
async function openAthleteModal(athleteIdOrData) {
    const modal = document.getElementById('athlete-modal');
    let athleteId, athleteData;
    
    // Handle both ID and full object
    if (typeof athleteIdOrData === 'object') {
        athleteData = athleteIdOrData;
        athleteId = athleteData.id;
    } else {
        athleteId = athleteIdOrData;
        // Find athlete in current data
        athleteData = [...gameState.athletes.men, ...gameState.athletes.women]
            .find(a => a.id === athleteId);
    }
    
    if (!athleteData) {
        console.error('Athlete not found:', athleteId);
        return;
    }
    
    // Populate basic info
    populateAthleteBasicInfo(athleteData);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Load progression and results data
    await loadAthleteDetailedData(athleteId);
}

/**
 * Convert ISO 3166-1 alpha-3 country code to flag emoji
 */
function getCountryFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length < 2) return '🏁';
    
    // Map of common alpha-3 to alpha-2 codes for marathon countries
    const alpha3ToAlpha2 = {
        'KEN': 'KE', 'ETH': 'ET', 'USA': 'US', 'GBR': 'GB', 'JPN': 'JP',
        'FRA': 'FR', 'GER': 'DE', 'ITA': 'IT', 'ESP': 'ES', 'NED': 'NL',
        'BEL': 'BE', 'SUI': 'CH', 'AUT': 'AT', 'CAN': 'CA', 'AUS': 'AU',
        'NZL': 'NZ', 'UGA': 'UG', 'TAN': 'TZ', 'ERI': 'ER', 'BRN': 'BH',
        'MAR': 'MA', 'ALG': 'DZ', 'RSA': 'ZA', 'MEX': 'MX', 'BRA': 'BR',
        'CHN': 'CN', 'KOR': 'KR', 'PRK': 'KP', 'IND': 'IN', 'ISR': 'IL',
        'POL': 'PL', 'UKR': 'UA', 'RUS': 'RU', 'BLR': 'BY', 'CZE': 'CZ',
        'SVK': 'SK', 'HUN': 'HU', 'ROU': 'RO', 'BUL': 'BG', 'SRB': 'RS',
        'CRO': 'HR', 'SLO': 'SI', 'SWE': 'SE', 'NOR': 'NO', 'DEN': 'DK',
        'FIN': 'FI', 'ISL': 'IS', 'IRL': 'IE', 'POR': 'PT', 'TUR': 'TR'
    };
    
    const alpha2 = alpha3ToAlpha2[countryCode.toUpperCase()] || countryCode.slice(0, 2).toUpperCase();
    const codePoints = alpha2.split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

/**
 * Get gradient colors based on country flag colors
 */
function getCountryGradient(countryCode) {
    const flagColors = {
        'KEN': ['#BB0000', '#006600', '#000000'], // Kenya - Red, Green, Black
        'ETH': ['#009543', '#FCDD09', '#DA121A'], // Ethiopia - Green, Yellow, Red
        'USA': ['#B22234', '#FFFFFF', '#3C3B6E'], // USA - Red, White, Blue
        'GBR': ['#012169', '#FFFFFF', '#C8102E'], // UK - Blue, White, Red
        'JPN': ['#BC002D', '#FFFFFF'], // Japan - Red, White
        'UGA': ['#000000', '#FCDC04', '#D90000'], // Uganda - Black, Yellow, Red
        'TAN': ['#1EB53A', '#FCD116', '#00A3DD'], // Tanzania - Green, Yellow, Blue
        'GER': ['#000000', '#DD0000', '#FFCE00'], // Germany - Black, Red, Gold
        'FRA': ['#002395', '#FFFFFF', '#ED2939'], // France - Blue, White, Red
        'ESP': ['#AA151B', '#F1BF00'], // Spain - Red, Yellow
        'ITA': ['#009246', '#FFFFFF', '#CE2B37'], // Italy - Green, White, Red
        'NED': ['#21468B', '#FFFFFF', '#AE1C28'], // Netherlands - Blue, White, Red
        'BEL': ['#000000', '#FDDA24', '#EF3340'], // Belgium - Black, Yellow, Red
        'MAR': ['#C1272D', '#006233'], // Morocco - Red, Green
        'ERI': ['#12A2DD', '#EA0000', '#4CA64C'], // Eritrea - Blue, Red, Green
        'BRN': ['#CE1126', '#FFFFFF'], // Bahrain - Red, White
        'CHN': ['#DE2910', '#FFDE00'], // China - Red, Yellow
        'MEX': ['#006847', '#FFFFFF', '#CE1126'], // Mexico - Green, White, Red
        'BRA': ['#009B3A', '#FEDF00', '#002776'], // Brazil - Green, Yellow, Blue
        'CAN': ['#FF0000', '#FFFFFF'], // Canada - Red, White
        'AUS': ['#012169', '#FFFFFF', '#E4002B'], // Australia - Blue, White, Red
        'NOR': ['#BA0C2F', '#FFFFFF', '#00205B'], // Norway - Red, White, Blue
        'SWE': ['#006AA7', '#FECC00'], // Sweden - Blue, Yellow
        'FIN': ['#003580', '#FFFFFF'], // Finland - Blue, White
        'POL': ['#FFFFFF', '#DC143C'], // Poland - White, Red
        'RUS': ['#FFFFFF', '#0039A6', '#D52B1E'], // Russia - White, Blue, Red
        'UKR': ['#0057B7', '#FFD700'], // Ukraine - Blue, Yellow
        'RSA': ['#007A4D', '#FFB612', '#DE3831'], // South Africa - Green, Yellow, Red
        'POR': ['#006600', '#FF0000'], // Portugal - Green, Red
        'IRL': ['#169B62', '#FFFFFF', '#FF883E'], // Ireland - Green, White, Orange
        'BUL': ['#FFFFFF', '#00966E', '#D62612'], // Bulgaria - White, Green, Red
        'ROU': ['#002B7F', '#FCD116', '#CE1126'], // Romania - Blue, Yellow, Red
        'CZE': ['#11457E', '#FFFFFF', '#D7141A'], // Czech Republic - Blue, White, Red
        'HUN': ['#CD2A3E', '#FFFFFF', '#436F4D'], // Hungary - Red, White, Green
        'CRO': ['#FF0000', '#FFFFFF', '#171796'], // Croatia - Red, White, Blue
        'TUR': ['#E30A17', '#FFFFFF'], // Turkey - Red, White
    };
    
    const colors = flagColors[countryCode] || ['#2C39A2', '#ff6900']; // Default to app colors
    
    // Create gradient with 2-3 colors
    if (colors.length === 2) {
        return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    } else if (colors.length === 3) {
        return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
    }
    
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
}

/**
 * Populate basic athlete information in the modal
 */
function populateAthleteBasicInfo(athlete) {
    // Apply country gradient to masthead
    const masthead = document.getElementById('card-masthead');
    masthead.style.background = getCountryGradient(athlete.country);
    
    // Photo with gender-specific runner fallback
    const photo = document.getElementById('modal-athlete-photo');
    const isMale = athlete.gender === 'men';
    
    // Male runner SVG - running pose
    const maleRunnerSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"%3E%3Crect fill="%23e9ecef" width="120" height="120"/%3E%3Cg transform="translate(60,60)"%3E%3C!-- Head --%3E%3Ccircle cx="0" cy="-22" r="8" fill="%236c757d"/%3E%3C!-- Body --%3E%3Cpath d="M-2-14 L-2 8" stroke="%236c757d" stroke-width="4" stroke-linecap="round"/%3E%3C!-- Arms running position --%3E%3Cpath d="M-2-10 L-12-5 M-2-6 L8 2" stroke="%236c757d" stroke-width="3" stroke-linecap="round"/%3E%3C!-- Legs running position --%3E%3Cpath d="M-2 8 L-8 22 M-2 8 L6 18" stroke="%236c757d" stroke-width="3.5" stroke-linecap="round"/%3E%3C/g%3E%3C/svg%3E';
    
    // Female runner SVG - running pose with longer hair
    const femaleRunnerSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"%3E%3Crect fill="%23e9ecef" width="120" height="120"/%3E%3Cg transform="translate(60,60)"%3E%3C!-- Head with hair --%3E%3Cellipse cx="0" cy="-22" rx="9" ry="8" fill="%236c757d"/%3E%3Cpath d="M-9-22 Q-11-18 -9-14 M9-22 Q11-18 9-14" stroke="%236c757d" stroke-width="2" fill="none"/%3E%3C!-- Body --%3E%3Cpath d="M-1-14 L-1 8" stroke="%236c757d" stroke-width="3.5" stroke-linecap="round"/%3E%3C!-- Arms running position --%3E%3Cpath d="M-1-10 L-11-5 M-1-6 L8 2" stroke="%236c757d" stroke-width="2.5" stroke-linecap="round"/%3E%3C!-- Legs running position --%3E%3Cpath d="M-1 8 L-7 22 M-1 8 L6 18" stroke="%236c757d" stroke-width="3" stroke-linecap="round"/%3E%3C/g%3E%3C/svg%3E';
    
    const defaultRunnerSvg = isMale ? maleRunnerSvg : femaleRunnerSvg;
    
    if (athlete.headshotUrl) {
        photo.src = athlete.headshotUrl;
        photo.alt = athlete.name;
        // Handle 404 errors by falling back to gender-specific runner icon
        photo.onerror = function() {
            this.onerror = null; // Prevent infinite loop
            this.src = defaultRunnerSvg;
        };
    } else {
        photo.src = defaultRunnerSvg;
        photo.alt = 'No photo';
    }
    
    // Basic info
    document.getElementById('modal-athlete-name').textContent = athlete.name;
    document.getElementById('modal-athlete-country').textContent = getCountryFlagEmoji(athlete.country);
    document.getElementById('modal-athlete-gender').textContent = athlete.gender === 'men' ? 'Men' : 'Women';
    document.getElementById('modal-athlete-age').textContent = athlete.age ? `${athlete.age}yo` : 'Age N/A';
    
    // Masthead stats
    document.getElementById('modal-athlete-pb').textContent = athlete.pb || 'N/A';
    document.getElementById('modal-athlete-marathon-rank').textContent = athlete.marathonRank ? `#${athlete.marathonRank}` : 'N/A';
    
    // Overview tab stats (duplicated for overview section)
    document.getElementById('overview-pb').textContent = athlete.pb || 'N/A';
    document.getElementById('modal-athlete-sb').textContent = athlete.seasonBest || athlete.pb || 'N/A';
    document.getElementById('overview-marathon-rank').textContent = athlete.marathonRank ? `#${athlete.marathonRank}` : 'N/A';
    document.getElementById('modal-athlete-overall-rank').textContent = athlete.overallRank ? `#${athlete.overallRank}` : 'N/A';
    
    // Sponsor
    const sponsorSection = document.getElementById('modal-athlete-sponsor-section');
    if (athlete.sponsor) {
        document.getElementById('modal-athlete-sponsor').textContent = athlete.sponsor;
        sponsorSection.style.display = 'flex';
    } else {
        sponsorSection.style.display = 'none';
    }
    
    // Profile tab
    document.getElementById('modal-athlete-dob').textContent = athlete.dateOfBirth ? 
        new Date(athlete.dateOfBirth).toLocaleDateString() : 'N/A';
    document.getElementById('modal-athlete-wa-id').textContent = athlete.worldAthleticsId || 'N/A';
    document.getElementById('modal-athlete-road-rank').textContent = athlete.roadRunningRank ? 
        `#${athlete.roadRunningRank}` : 'N/A';
    
    // World Athletics link
    const waLink = document.getElementById('modal-wa-link');
    if (athlete.worldAthleticsProfileUrl) {
        waLink.href = athlete.worldAthleticsProfileUrl;
        waLink.style.display = 'flex';
    } else if (athlete.worldAthleticsId) {
        waLink.href = `https://worldathletics.org/athletes/_/${athlete.worldAthleticsId}`;
        waLink.style.display = 'flex';
    } else {
        waLink.style.display = 'none';
    }
}

/**
 * Load progression and race results from API
 */
async function loadAthleteDetailedData(athleteId) {
    const progressionDiv = document.getElementById('progression-chart');
    const resultsDiv = document.getElementById('results-list');
    const progressionLoading = document.getElementById('progression-loading');
    const resultsLoading = document.getElementById('results-loading');
    const progressionEmpty = document.getElementById('progression-empty');
    const resultsEmpty = document.getElementById('results-empty');
    
    // Show loading states
    progressionLoading.style.display = 'block';
    resultsLoading.style.display = 'block';
    progressionDiv.innerHTML = '';
    resultsDiv.innerHTML = '';
    progressionEmpty.style.display = 'none';
    resultsEmpty.style.display = 'none';
    
    try {
        // Fetch athlete profile with progression and results
        const response = await fetch(`${API_BASE}/api/athletes?id=${athleteId}&include=progression,results&year=2025`);
        if (!response.ok) throw new Error('Failed to load athlete data');
        
        const data = await response.json();
        
        // Hide loading spinners
        progressionLoading.style.display = 'none';
        resultsLoading.style.display = 'none';
        
        // Display progression data
        if (data.progression && data.progression.length > 0) {
            displayProgression(data.progression);
        } else {
            progressionEmpty.style.display = 'block';
        }
        
        // Display race results
        if (data.raceResults && data.raceResults.length > 0) {
            displayRaceResults(data.raceResults);
        } else {
            resultsEmpty.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading athlete details:', error);
        progressionLoading.style.display = 'none';
        resultsLoading.style.display = 'none';
        progressionEmpty.textContent = 'Error loading data';
        progressionEmpty.style.display = 'block';
        resultsEmpty.textContent = 'Error loading data';
        resultsEmpty.style.display = 'block';
    }
}

/**
 * Display progression data in the modal
 */
let progressionChart = null;
let currentProgressionData = null;

function displayProgression(progression) {
    currentProgressionData = progression;
    
    // Get unique disciplines
    const disciplines = [...new Set(progression.map(item => item.discipline))].sort();
    
    // Show discipline selector if more than one discipline
    const disciplineSelector = document.getElementById('discipline-selector');
    if (disciplines.length > 1) {
        disciplineSelector.style.display = 'block';
        disciplineSelector.innerHTML = disciplines.map(d => 
            `<option value="${d}">${d}</option>`
        ).join('');
        
        // Add change event listener
        disciplineSelector.onchange = function() {
            renderProgressionChart(currentProgressionData, this.value);
        };
    } else {
        disciplineSelector.style.display = 'none';
    }
    
    // Render chart with default discipline (Marathon or first available)
    const defaultDiscipline = disciplines.includes('Marathon') ? 'Marathon' : disciplines[0];
    renderProgressionChart(progression, defaultDiscipline);
}

function renderProgressionChart(progression, discipline = 'Marathon') {
    const canvas = document.getElementById('progression-chart-canvas');
    const ctx = canvas.getContext('2d');
    
    // Filter by discipline and group by season (best mark per season)
    const filtered = progression.filter(item => item.discipline === discipline);
    const grouped = filtered.reduce((acc, item) => {
        const season = item.season;
        if (!acc[season] || item.mark < acc[season].mark) {
            acc[season] = item;
        }
        return acc;
    }, {});
    
    // Sort by season and limit to last 7 years
    const sorted = Object.values(grouped).sort((a, b) => 
        parseInt(a.season) - parseInt(b.season)
    );
    const limited = sorted.slice(-7);
    
    if (limited.length === 0) {
        document.getElementById('progression-empty').style.display = 'block';
        canvas.parentElement.style.display = 'none';
        return;
    }
    
    document.getElementById('progression-empty').style.display = 'none';
    canvas.parentElement.style.display = 'block';
    
    // Convert time strings to seconds for plotting
    const timeToSeconds = (timeStr) => {
        if (!timeStr) return null;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return null;
    };
    
    const secondsToTime = (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    };
    
    const chartData = limited.map(item => ({
        x: item.season,
        y: timeToSeconds(item.mark),
        ...item
    }));
    
    // Destroy previous chart if exists
    if (progressionChart) {
        progressionChart.destroy();
    }
    
    // Create new chart
    progressionChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: discipline,
                data: chartData,
                borderColor: '#ff6900',
                backgroundColor: 'rgba(255, 105, 0, 0.1)',
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ff6900',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Year',
                        font: {
                            weight: 'bold',
                            size: 13
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return Math.floor(value);
                        },
                        stepSize: 1
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    reverse: true, // Lower times are better
                    title: {
                        display: true,
                        text: 'Time',
                        font: {
                            weight: 'bold',
                            size: 13
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return secondsToTime(value);
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const data = chartData[index];
                    displaySelectedRaceInfo(data);
                }
            }
        }
    });
}

function displaySelectedRaceInfo(raceData) {
    const container = document.getElementById('selected-race-info');
    const content = document.getElementById('race-info-content');
    
    content.innerHTML = `
        <div class="race-info-item">
            <div class="race-info-label">Year</div>
            <div class="race-info-value">${raceData.season}</div>
        </div>
        <div class="race-info-item">
            <div class="race-info-label">Time</div>
            <div class="race-info-value">${raceData.mark}</div>
        </div>
        <div class="race-info-item">
            <div class="race-info-label">Venue</div>
            <div class="race-info-value">${raceData.venue || 'Unknown'}</div>
        </div>
        <div class="race-info-item">
            <div class="race-info-label">Discipline</div>
            <div class="race-info-value">${raceData.discipline}</div>
        </div>
    `;
    
    container.style.display = 'block';
}


/**
 * Display race results in the modal
 */
function displayRaceResults(results) {
    const container = document.getElementById('results-list');
    
    // Sort by date (most recent first)
    const sorted = results.sort((a, b) => 
        new Date(b.competitionDate) - new Date(a.competitionDate)
    );
    
    container.innerHTML = sorted.map(result => {
        const date = new Date(result.competitionDate);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        return `
            <div class="result-item">
                <div class="result-header">
                    <div class="result-competition">${result.competitionName}</div>
                    <div class="result-position">${result.position || 'N/A'}</div>
                </div>
                <div class="result-details">
                    <div class="result-time">${result.finishTime || 'N/A'}</div>
                    <div class="result-venue">${result.venue}</div>
                    <div class="result-date">${formattedDate}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Close the athlete modal
 */
function closeAthleteModal() {
    const modal = document.getElementById('athlete-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset to overview tab
    switchModalTab('overview');
}

/**
 * Switch between tabs in the modal
 */
function switchModalTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`tab-${tabName}`);
    if (activePanel) {
        activePanel.classList.add('active');
    }
}

/**
 * Setup modal event listeners
 */
function setupAthleteModal() {
    const modal = document.getElementById('athlete-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    // Close button
    closeBtn.addEventListener('click', closeAthleteModal);
    
    // Click outside to close
    overlay.addEventListener('click', closeAthleteModal);
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeAthleteModal();
        }
    });
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', () => {
            switchModalTab(tab.dataset.tab);
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
