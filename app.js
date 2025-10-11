// Game State
let gameState = {
    athletes: { men: [], women: [] },
    players: [],
    currentPlayer: null,
    rankings: {},
    teams: {},
    results: {},
    draftComplete: false
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
                draftComplete: gameState.draftComplete
            })
        });
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Load athletes data
async function loadAthletes() {
    try {
        const response = await fetch('athletes.json');
        gameState.athletes = await response.json();
    } catch (error) {
        console.error('Error loading athletes:', error);
        // Fallback to empty arrays
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
    document.getElementById('view-teams').addEventListener('click', () => {
        displayTeams();
        showPage('teams-page');
    });

    // Teams page
    document.getElementById('back-to-landing').addEventListener('click', () => showPage('landing-page'));

    // Commissioner page
    document.getElementById('generate-codes').addEventListener('click', handleGenerateCodes);
    document.getElementById('run-draft').addEventListener('click', handleRunDraft);
    document.getElementById('calculate-winner').addEventListener('click', handleCalculateWinner);
    document.getElementById('reset-game').addEventListener('click', handleResetGame);
    document.getElementById('export-data').addEventListener('click', handleExportData);
    document.getElementById('back-from-commissioner').addEventListener('click', () => showPage('landing-page'));
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
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = athlete.name;
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'details';
        detailsDiv.textContent = `${athlete.country} - PB: ${athlete.pb}`;
        
        card.appendChild(nameDiv);
        card.appendChild(detailsDiv);
        
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
        nameSpan.textContent = athlete.name;
        
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

function displayPlayerCodes() {
    const display = document.getElementById('player-codes-display');
    display.innerHTML = '<h4>Player Codes (share these with your players):</h4>';
    
    gameState.players.forEach(code => {
        const hasSubmitted = gameState.rankings[code] && 
                            gameState.rankings[code].men && 
                            gameState.rankings[code].women &&
                            gameState.rankings[code].men.length === 10 &&
                            gameState.rankings[code].women.length === 10;
        
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
    const submittedCount = gameState.players.filter(code => {
        const ranking = gameState.rankings[code];
        return ranking && ranking.men && ranking.women && 
               ranking.men.length === 10 && ranking.women.length === 10;
    }).length;
    
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

    Object.entries(gameState.teams).forEach(([player, team]) => {
        const card = createTeamCard(player, team, true);
        container.appendChild(card);
    });
}

function createTeamCard(player, team, showScore = false) {
    const card = document.createElement('div');
    card.className = 'team-card';

    const title = document.createElement('h3');
    title.textContent = player;
    card.appendChild(title);

    // Men's team
    const menSection = document.createElement('div');
    menSection.className = 'team-section';
    
    const menTitle = document.createElement('h4');
    menTitle.textContent = "Men's Team";
    menSection.appendChild(menTitle);
    
    team.men.forEach(athlete => {
        const time = gameState.results[athlete.id] || '-';
        const athleteDiv = document.createElement('div');
        athleteDiv.className = 'athlete';
        
        const infoDiv = document.createElement('div');
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = athlete.name;
        const countryDiv = document.createElement('div');
        countryDiv.className = 'country';
        countryDiv.textContent = athlete.country;
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(countryDiv);
        
        const timeDiv = document.createElement('div');
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
        const time = gameState.results[athlete.id] || '-';
        const athleteDiv = document.createElement('div');
        athleteDiv.className = 'athlete';
        
        const infoDiv = document.createElement('div');
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = athlete.name;
        const countryDiv = document.createElement('div');
        countryDiv.className = 'country';
        countryDiv.textContent = athlete.country;
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(countryDiv);
        
        const timeDiv = document.createElement('div');
        timeDiv.textContent = time;
        
        athleteDiv.appendChild(infoDiv);
        athleteDiv.appendChild(timeDiv);
        womenSection.appendChild(athleteDiv);
    });
    card.appendChild(womenSection);

    // Show score if results are available
    if (showScore && Object.keys(gameState.results).length > 0) {
        const averageTime = calculateAverageTime(team);
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score';
        scoreDiv.textContent = `Average Finish Time: ${averageTime}`;
        card.appendChild(scoreDiv);
    }

    return card;
}

// Results management
async function handleCalculateWinner() {
    if (Object.keys(gameState.results).length === 0) {
        alert('Please enter results first using the form above.');
        setupResultsForm();
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

    try {
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
    form.innerHTML = '<h4>Enter Athlete Finish Times (HH:MM:SS)</h4>';

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
        const athleteName = document.createTextNode('');
        const athleteCountry = document.createTextNode('');
        entry.innerHTML = `
            <label>${escapeHtml(athlete.name)} (${escapeHtml(athlete.country)})</label>
            <input type="text" 
                   data-athlete-id="${athlete.id}"
                   value="${escapeHtml(currentTime)}"
                   placeholder="2:05:30"
                   pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
        `;
        form.appendChild(entry);
    });

    // Add event listeners to save results
    form.querySelectorAll('input').forEach(input => {
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

            gameState = {
                athletes: gameState.athletes,
                players: [],
                currentPlayer: null,
                rankings: {},
                teams: {},
                results: {},
                draftComplete: false
            };
            
            alert('Game has been reset.');
            location.reload();
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
    a.download = 'fantasy-marathon-data.json';
    a.click();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
