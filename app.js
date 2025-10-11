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

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('fantasyMarathonState');
    if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
    }
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('fantasyMarathonState', JSON.stringify(gameState));
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
    loadGameState();
    setupEventListeners();
    showPage('landing-page');
}

// Setup event listeners
function setupEventListeners() {
    // Landing page
    document.getElementById('enter-game').addEventListener('click', handleEnterGame);
    document.getElementById('commissioner-mode').addEventListener('click', () => showPage('commissioner-page'));

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
        card.innerHTML = `
            <div class="name">${athlete.name}</div>
            <div class="details">${athlete.country} - PB: ${athlete.pb}</div>
        `;
        
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
        item.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${athlete.name}</span>
            <span class="country">${athlete.country}</span>
            <button class="remove-btn" onclick="removeAthleteFromRanking('${gender}', ${athlete.id})">×</button>
        `;
        
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
function handleSubmitRankings() {
    const menRankings = gameState.rankings[gameState.currentPlayer]?.men || [];
    const womenRankings = gameState.rankings[gameState.currentPlayer]?.women || [];

    if (menRankings.length !== 10 || womenRankings.length !== 10) {
        alert('Please rank exactly 10 men and 10 women before submitting.');
        return;
    }

    saveGameState();
    alert('Rankings submitted successfully! The draft will run once all players have submitted.');
    showPage('landing-page');
}

// Commissioner functions
function handleGenerateCodes() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    if (numPlayers < 2 || numPlayers > 4) {
        alert('Please enter a number between 2 and 4');
        return;
    }

    gameState.players = [];
    for (let i = 1; i <= numPlayers; i++) {
        gameState.players.push(`PLAYER${i}`);
    }

    const display = document.getElementById('player-codes-display');
    display.innerHTML = '<h4>Player Codes (share these with your players):</h4>';
    gameState.players.forEach(code => {
        const item = document.createElement('div');
        item.className = 'player-code-item';
        item.textContent = `${code} - ${window.location.href}`;
        display.appendChild(item);
    });

    saveGameState();
}

// Snake draft algorithm
function handleRunDraft() {
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
    saveGameState();

    // Display draft results
    displayDraftResults();
    document.getElementById('draft-status').innerHTML = '<p style="color: green; font-weight: bold;">✓ Draft completed successfully!</p>';
    showPage('draft-page');
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

    let html = `<h3>${player}</h3>`;

    // Men's team
    html += `<div class="team-section">
        <h4>Men's Team</h4>`;
    team.men.forEach(athlete => {
        const time = gameState.results[athlete.id] || '-';
        html += `
            <div class="athlete">
                <div>
                    <div class="name">${athlete.name}</div>
                    <div class="country">${athlete.country}</div>
                </div>
                <div>${time}</div>
            </div>
        `;
    });
    html += `</div>`;

    // Women's team
    html += `<div class="team-section">
        <h4>Women's Team</h4>`;
    team.women.forEach(athlete => {
        const time = gameState.results[athlete.id] || '-';
        html += `
            <div class="athlete">
                <div>
                    <div class="name">${athlete.name}</div>
                    <div class="country">${athlete.country}</div>
                </div>
                <div>${time}</div>
            </div>
        `;
    });
    html += `</div>`;

    // Show score if results are available
    if (showScore && Object.keys(gameState.results).length > 0) {
        const score = calculateTeamScore(team);
        html += `<div class="score">Total Score: ${score.toFixed(2)}</div>`;
    }

    card.innerHTML = html;
    return card;
}

// Results management
function handleCalculateWinner() {
    if (Object.keys(gameState.results).length === 0) {
        alert('Please enter results first using the form above.');
        setupResultsForm();
        return;
    }

    const scores = {};
    Object.entries(gameState.teams).forEach(([player, team]) => {
        scores[player] = calculateTeamScore(team);
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
        <p>Total Time: ${winner.score.toFixed(2)} seconds</p>
        <hr style="margin: 10px 0; border-color: rgba(255,255,255,0.3);">
        ${Object.entries(scores).sort((a, b) => a[1] - b[1]).map(([player, score], i) => 
            `<div>${i + 1}. ${player}: ${score.toFixed(2)} seconds</div>`
        ).join('')}
    `;

    saveGameState();
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
    const parts = timeStr.split(':').map(p => parseInt(p));
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
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
        entry.innerHTML = `
            <label>${athlete.name} (${athlete.country})</label>
            <input type="text" 
                   data-athlete-id="${athlete.id}"
                   value="${currentTime}"
                   placeholder="2:05:30"
                   pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
        `;
        form.appendChild(entry);
    });

    // Add event listeners to save results
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
            const athleteId = parseInt(e.target.dataset.athleteId);
            const time = e.target.value;
            if (time && /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/.test(time)) {
                gameState.results[athleteId] = time;
                saveGameState();
            }
        });
    });
}

function handleResetGame() {
    if (confirm('Are you sure you want to reset the entire game? This cannot be undone.')) {
        localStorage.removeItem('fantasyMarathonState');
        gameState = {
            athletes: gameState.athletes,
            players: [],
            currentPlayer: null,
            rankings: {},
            teams: {},
            results: {},
            draftComplete: false
        };
        saveGameState();
        alert('Game has been reset.');
        location.reload();
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
