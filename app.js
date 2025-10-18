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
    setupDragAndDrop('men');
    switchTab('men');
}

// Switch tab
function switchTab(gender) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.gender === gender);
    });
    displayAthletePool(gender);
}

// Display athlete pool
function displayAthletePool(gender) {
    const pool = document.getElementById('athlete-pool');
    pool.innerHTML = '';

    const athletes = gameState.athletes[gender] || [];
    const currentRankings = gameState.currentPlayer ? 
        (gameState.rankings[gameState.currentPlayer]?.[gender] || []) : [];

    athletes.forEach(athlete => {
        const isSelected = currentRankings.some(r => r.id === athlete.id);
        const card = document.createElement('div');
        card.className = `athlete-card ${isSelected ? 'selected' : ''}`;
        
        // Create headshot container if available
        const headshot = createHeadshotElement(athlete, 'headshot-small');
        if (headshot) card.appendChild(headshot);
        
        const infoContainer = document.createElement('div');
        infoContainer.className = 'athlete-card-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = athlete.name;
        
        const countryDiv = document.createElement('div');
        countryDiv.className = 'country';
        countryDiv.innerHTML = `${getCountryFlag(athlete.country)} ${athlete.country}`;
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'details';
        detailsDiv.textContent = formatAthleteDetails(athlete, true);
        
        infoContainer.appendChild(nameDiv);
        infoContainer.appendChild(countryDiv);
        infoContainer.appendChild(detailsDiv);
        
        card.appendChild(infoContainer);
        
        if (!isSelected && currentRankings.length < 10) {
            card.addEventListener('click', () => addAthleteToRanking(gender, athlete));
        } else if (currentRankings.length >= 10 && !isSelected) {
            card.classList.add('disabled');
        }
        
        pool.appendChild(card);
    });
}

// Add athlete to ranking
function addAthleteToRanking(gender, athlete) {
    if (!gameState.rankings[gameState.currentPlayer]) {
        gameState.rankings[gameState.currentPlayer] = { men: [], women: [] };
    }

    const rankings = gameState.rankings[gameState.currentPlayer][gender];
    if (rankings.length >= 10) {
        alert('You can only rank 10 athletes per category');
        return;
    }

    rankings.push(athlete);
    updateRankingDisplay(gender);
    displayAthletePool(gender);
}

// Remove athlete from ranking
function removeAthleteFromRanking(gender, athleteId) {
    const rankings = gameState.rankings[gameState.currentPlayer][gender];
    const index = rankings.findIndex(a => a.id === athleteId);
    if (index > -1) {
        rankings.splice(index, 1);
        updateRankingDisplay(gender);
        displayAthletePool(gender);
    }
}

// Update ranking display
function updateRankingDisplay(gender) {
    const container = document.getElementById(`${gender}-ranking`);
    const rankings = gameState.rankings[gameState.currentPlayer]?.[gender] || [];
    
    container.innerHTML = '';
    rankings.forEach((athlete, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.draggable = true;
        item.dataset.index = index;
        item.dataset.gender = gender;
        
        const rankSpan = document.createElement('span');
        rankSpan.className = 'rank';
        rankSpan.textContent = `${index + 1}.`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'name';
        
        // Add World Athletics link if available
        if (athlete.worldAthleticsProfileUrl) {
            const link = document.createElement('a');
            link.href = athlete.worldAthleticsProfileUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = athlete.name;
            link.style.color = 'inherit';
            link.style.textDecoration = 'none';
            link.title = 'View World Athletics profile';
            link.addEventListener('click', (e) => e.stopPropagation());
            nameSpan.appendChild(link);
        } else {
            nameSpan.textContent = athlete.name;
        }
        
        const countrySpan = document.createElement('span');
        countrySpan.className = 'country';
        countrySpan.textContent = athlete.country;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => removeAthleteFromRanking(gender, athlete.id));
        
        item.appendChild(rankSpan);
        item.appendChild(nameSpan);
        item.appendChild(countrySpan);
        item.appendChild(removeBtn);
        
        // Drag events
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        
        container.appendChild(item);
    });
}

// Setup drag and drop
function setupDragAndDrop(gender) {
    updateRankingDisplay('men');
    updateRankingDisplay('women');
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(this.parentElement, e.clientY);
    if (afterElement == null) {
        this.parentElement.appendChild(draggedItem);
    } else {
        this.parentElement.insertBefore(draggedItem, afterElement);
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Update the rankings array based on new order
    const gender = this.dataset.gender;
    const container = document.getElementById(`${gender}-ranking`);
    const items = Array.from(container.querySelectorAll('.ranking-item'));
    const rankings = gameState.rankings[gameState.currentPlayer][gender];
    
    const newOrder = items.map(item => {
        const index = parseInt(item.dataset.index);
        return rankings[index];
    });
    
    gameState.rankings[gameState.currentPlayer][gender] = newOrder;
    updateRankingDisplay(gender);
    
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ranking-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Handle submit rankings
async function handleSubmitRankings() {
    const menRankings = gameState.rankings[gameState.currentPlayer]?.men || [];
    const womenRankings = gameState.rankings[gameState.currentPlayer]?.women || [];

    if (menRankings.length !== 10 || womenRankings.length !== 10) {
        alert('Please rank exactly 10 men and 10 women before submitting.');
        return;
    }

    try {
        // Save rankings to database
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
    const container = document.getElementById('athlete-table-container');
    
    // Get filter values
    const confirmedOnly = document.getElementById('filter-confirmed').checked;
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
                        <td>${athlete.name}</td>
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
                        <td>
                            <button 
                                class="btn-save-wa-id btn-small" 
                                data-athlete-id="${athlete.id}"
                                title="Save World Athletics ID"
                            >💾 Save</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = `
            <p><strong>${allAthletes.length} athlete(s) found</strong></p>
            <p class="info-message">💡 <strong>Tip:</strong> Athletes without a World Athletics ID cannot be tracked when they drop out of the top 100 rankings. Add the ID to enable automatic sync updates.</p>
            <div class="table-scroll">
                ${table.outerHTML}
            </div>
        `;
        
        // Add event listeners to save buttons
        document.querySelectorAll('.btn-save-wa-id').forEach(button => {
            button.addEventListener('click', handleSaveWorldAthleticsId);
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
        button.textContent = '💾 Saving...';
        
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
        button.textContent = '✓ Saved!';
        button.style.backgroundColor = '#4CAF50';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = '💾 Save';
            button.style.backgroundColor = '';
            button.disabled = false;
        }, 2000);
        
        console.log('Updated athlete:', result.athlete);
        
    } catch (error) {
        console.error('Error saving World Athletics ID:', error);
        alert('Failed to save World Athletics ID: ' + error.message);
        button.textContent = '💾 Save';
        button.disabled = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
