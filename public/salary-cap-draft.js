/**
 * Salary Cap Draft System
 * Handles daily fantasy-style team building with budget constraints
 */

// Salary cap configuration
const SALARY_CAP_CONFIG = {
    totalCap: 30000,
    teamSize: 6,
    menPerTeam: 3,
    womenPerTeam: 3
};

// Salary cap draft state
let salaryCapState = {
    selectedTeam: {
        men: [],
        women: []
    },
    totalSpent: 0,
    filteredGender: 'all',
    sortBy: 'salary-desc',
    searchQuery: ''
};

/**
 * Initialize salary cap draft page
 */
async function setupSalaryCapDraft() {
    // Ensure athletes are loaded
    if (!gameState.athletes.men || gameState.athletes.men.length === 0) {
        await loadAthletes();
    }
    
    // Reset state
    salaryCapState.selectedTeam = { men: [], women: [] };
    salaryCapState.totalSpent = 0;
    salaryCapState.filteredGender = 'all';
    salaryCapState.sortBy = 'salary-desc';
    salaryCapState.searchQuery = '';
    
    // Setup event listeners
    setupSalaryCapEventListeners();
    
    // Render initial view
    renderAthleteList();
    updateBudgetDisplay();
    updateSelectedTeamDisplay();
}

/**
 * Setup event listeners for salary cap draft
 */
function setupSalaryCapEventListeners() {
    // Gender filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            salaryCapState.filteredGender = e.target.dataset.gender;
            renderAthleteList();
        });
    });
    
    // Sort dropdown
    document.getElementById('athlete-sort').addEventListener('change', (e) => {
        salaryCapState.sortBy = e.target.value;
        renderAthleteList();
    });
    
    // Search input
    document.getElementById('athlete-search').addEventListener('input', (e) => {
        salaryCapState.searchQuery = e.target.value.toLowerCase();
        renderAthleteList();
    });
    
    // Submit team button
    document.getElementById('submit-salary-cap-team').addEventListener('click', handleSubmitSalaryCapTeam);
    
    // Cancel button
    document.getElementById('cancel-salary-cap-draft').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? Your team will not be saved.')) {
            showPage('landing-page');
        }
    });
}

/**
 * Render the athlete list with current filters and sort
 */
function renderAthleteList() {
    const container = document.getElementById('athlete-list');
    container.innerHTML = '';
    
    // Get all athletes
    let athletes = [];
    if (salaryCapState.filteredGender === 'all') {
        athletes = [
            ...gameState.athletes.men.map(a => ({ ...a, gender: 'men' })),
            ...gameState.athletes.women.map(a => ({ ...a, gender: 'women' }))
        ];
    } else if (salaryCapState.filteredGender === 'men') {
        athletes = gameState.athletes.men.map(a => ({ ...a, gender: 'men' }));
    } else {
        athletes = gameState.athletes.women.map(a => ({ ...a, gender: 'women' }));
    }
    
    // Apply search filter
    if (salaryCapState.searchQuery) {
        athletes = athletes.filter(a => 
            a.name.toLowerCase().includes(salaryCapState.searchQuery) ||
            a.country.toLowerCase().includes(salaryCapState.searchQuery)
        );
    }
    
    // Sort athletes
    athletes.sort((a, b) => {
        switch (salaryCapState.sortBy) {
            case 'salary-desc':
                return (b.salary || 5000) - (a.salary || 5000);
            case 'salary-asc':
                return (a.salary || 5000) - (b.salary || 5000);
            case 'rank-asc':
                const aRank = a.worldAthletics?.marathonRank || 9999;
                const bRank = b.worldAthletics?.marathonRank || 9999;
                return aRank - bRank;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
    
    // Render athlete cards
    athletes.forEach(athlete => {
        const card = createAthleteCard(athlete);
        container.appendChild(card);
    });
    
    if (athletes.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No athletes found matching your criteria.</p>';
    }
}

/**
 * Create athlete card element
 */
function createAthleteCard(athlete) {
    const card = document.createElement('div');
    card.className = 'athlete-card';
    
    // Check if athlete is already selected
    const isSelected = salaryCapState.selectedTeam[athlete.gender].some(a => a.id === athlete.id);
    if (isSelected) {
        card.classList.add('selected');
    }
    
    // Check if athlete can be added (gender limit, budget)
    const genderCount = salaryCapState.selectedTeam[athlete.gender].length;
    const maxForGender = athlete.gender === 'men' ? SALARY_CAP_CONFIG.menPerTeam : SALARY_CAP_CONFIG.womenPerTeam;
    const canAdd = !isSelected && genderCount < maxForGender;
    
    const athleteSalary = athlete.salary || 5000;
    const wouldExceedBudget = (salaryCapState.totalSpent + athleteSalary) > SALARY_CAP_CONFIG.totalCap;
    
    if (!canAdd || (wouldExceedBudget && !isSelected)) {
        card.classList.add('disabled');
    }
    
    // Rank display
    const rank = athlete.worldAthletics?.marathonRank;
    const rankDisplay = rank ? `Rank: #${rank}` : 'Unranked';
    
    card.innerHTML = `
        <div class="athlete-card-header">
            <div class="athlete-card-name">${athlete.name}</div>
            <div class="athlete-card-salary">$${athleteSalary.toLocaleString()}</div>
        </div>
        <div class="athlete-card-details">
            <span class="athlete-card-detail">${getCountryFlag(athlete.country)} ${athlete.country}</span>
            <span class="athlete-card-detail">${athlete.gender === 'men' ? '♂' : '♀'}</span>
        </div>
        <div class="athlete-card-stats">
            <span class="stat-badge rank">${rankDisplay}</span>
            <span class="stat-badge pb">PB: ${athlete.pb}</span>
        </div>
        <div class="athlete-card-action">
            ${isSelected ? 
                '<button class="add-athlete-btn" disabled>✓ Selected</button>' :
                `<button class="add-athlete-btn" ${!canAdd || wouldExceedBudget ? 'disabled' : ''}>
                    ${wouldExceedBudget ? 'Over Budget' : 'Add to Team'}
                </button>`
            }
        </div>
    `;
    
    // Add click handler
    if (canAdd && !wouldExceedBudget) {
        card.addEventListener('click', () => addAthleteToTeam(athlete));
    }
    
    return card;
}

/**
 * Add athlete to selected team
 */
function addAthleteToTeam(athlete) {
    const genderCount = salaryCapState.selectedTeam[athlete.gender].length;
    const maxForGender = athlete.gender === 'men' ? SALARY_CAP_CONFIG.menPerTeam : SALARY_CAP_CONFIG.womenPerTeam;
    
    if (genderCount >= maxForGender) {
        alert(`You can only select ${maxForGender} ${athlete.gender}`);
        return;
    }
    
    const athleteSalary = athlete.salary || 5000;
    if (salaryCapState.totalSpent + athleteSalary > SALARY_CAP_CONFIG.totalCap) {
        alert(`Adding this athlete would exceed your $${SALARY_CAP_CONFIG.totalCap.toLocaleString()} salary cap.`);
        return;
    }
    
    salaryCapState.selectedTeam[athlete.gender].push(athlete);
    salaryCapState.totalSpent += athleteSalary;
    
    renderAthleteList();
    updateBudgetDisplay();
    updateSelectedTeamDisplay();
}

/**
 * Remove athlete from selected team
 */
function removeAthleteFromTeam(athlete, gender) {
    const index = salaryCapState.selectedTeam[gender].findIndex(a => a.id === athlete.id);
    if (index !== -1) {
        salaryCapState.selectedTeam[gender].splice(index, 1);
        salaryCapState.totalSpent -= (athlete.salary || 5000);
        
        renderAthleteList();
        updateBudgetDisplay();
        updateSelectedTeamDisplay();
    }
}

/**
 * Update budget display
 */
function updateBudgetDisplay() {
    const spent = salaryCapState.totalSpent;
    const remaining = SALARY_CAP_CONFIG.totalCap - spent;
    const percentUsed = (spent / SALARY_CAP_CONFIG.totalCap) * 100;
    
    document.getElementById('budget-spent').textContent = `$${spent.toLocaleString()}`;
    document.getElementById('budget-remaining').textContent = `$${remaining.toLocaleString()}`;
    
    const remainingEl = document.getElementById('budget-remaining');
    remainingEl.classList.remove('over-budget', 'low-budget');
    if (remaining < 0) {
        remainingEl.classList.add('over-budget');
    } else if (remaining < 5000) {
        remainingEl.classList.add('low-budget');
    }
    
    // Update progress bar
    document.getElementById('team-progress-bar').style.width = `${Math.min(percentUsed, 100)}%`;
    
    // Update team count
    const totalSelected = salaryCapState.selectedTeam.men.length + salaryCapState.selectedTeam.women.length;
    document.getElementById('team-count').textContent = `${totalSelected}/${SALARY_CAP_CONFIG.teamSize} athletes selected`;
    
    // Enable/disable submit button
    const canSubmit = totalSelected === SALARY_CAP_CONFIG.teamSize && remaining >= 0;
    document.getElementById('submit-salary-cap-team').disabled = !canSubmit;
}

/**
 * Update selected team display
 */
function updateSelectedTeamDisplay() {
    // Update men
    const menContainer = document.getElementById('selected-men');
    const menCount = salaryCapState.selectedTeam.men.length;
    document.querySelector('.roster-section h4').textContent = `Men (${menCount}/${SALARY_CAP_CONFIG.menPerTeam})`;
    
    if (menCount === 0) {
        menContainer.innerHTML = '<p class="empty-roster">No men selected yet</p>';
    } else {
        menContainer.innerHTML = '';
        salaryCapState.selectedTeam.men.forEach(athlete => {
            const card = createSelectedAthleteCard(athlete, 'men');
            menContainer.appendChild(card);
        });
    }
    
    // Update women
    const womenContainer = document.getElementById('selected-women');
    const womenCount = salaryCapState.selectedTeam.women.length;
    document.querySelectorAll('.roster-section h4')[1].textContent = `Women (${womenCount}/${SALARY_CAP_CONFIG.womenPerTeam})`;
    
    if (womenCount === 0) {
        womenContainer.innerHTML = '<p class="empty-roster">No women selected yet</p>';
    } else {
        womenContainer.innerHTML = '';
        salaryCapState.selectedTeam.women.forEach(athlete => {
            const card = createSelectedAthleteCard(athlete, 'women');
            womenContainer.appendChild(card);
        });
    }
}

/**
 * Create selected athlete card
 */
function createSelectedAthleteCard(athlete, gender) {
    const card = document.createElement('div');
    card.className = 'selected-athlete-card';
    
    const athleteSalary = athlete.salary || 5000;
    const rank = athlete.worldAthletics?.marathonRank;
    const rankDisplay = rank ? `#${rank}` : 'Unranked';
    
    card.innerHTML = `
        <div class="selected-athlete-info">
            <div class="selected-athlete-name">${athlete.name}</div>
            <div class="selected-athlete-details">
                ${getCountryFlag(athlete.country)} ${athlete.country} • ${rankDisplay} • ${athlete.pb}
            </div>
        </div>
        <div class="selected-athlete-salary">$${athleteSalary.toLocaleString()}</div>
        <button class="remove-athlete-btn" title="Remove from team">×</button>
    `;
    
    // Add remove handler
    card.querySelector('.remove-athlete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeAthleteFromTeam(athlete, gender);
    });
    
    return card;
}

/**
 * Submit salary cap team
 */
async function handleSubmitSalaryCapTeam() {
    const totalSelected = salaryCapState.selectedTeam.men.length + salaryCapState.selectedTeam.women.length;
    
    if (totalSelected !== SALARY_CAP_CONFIG.teamSize) {
        alert(`You must select exactly ${SALARY_CAP_CONFIG.teamSize} athletes (3 men and 3 women)`);
        return;
    }
    
    if (salaryCapState.totalSpent > SALARY_CAP_CONFIG.totalCap) {
        alert(`Your team costs $${salaryCapState.totalSpent.toLocaleString()}, which exceeds the $${SALARY_CAP_CONFIG.totalCap.toLocaleString()} salary cap.`);
        return;
    }
    
    // Verify gender distribution
    if (salaryCapState.selectedTeam.men.length !== SALARY_CAP_CONFIG.menPerTeam ||
        salaryCapState.selectedTeam.women.length !== SALARY_CAP_CONFIG.womenPerTeam) {
        alert('You must select exactly 3 men and 3 women.');
        return;
    }
    
    // Get session token
    const session = loadSession();
    if (!session || !session.token) {
        alert('Session expired. Please create a new team.');
        showPage('landing-page');
        return;
    }
    
    try {
        // Save team via API
        const response = await fetch(`${API_BASE}/api/salary-cap-draft?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify({
                team: salaryCapState.selectedTeam,
                totalSpent: salaryCapState.totalSpent,
                teamName: session.teamName || 'Unnamed Team'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit team');
        }
        
        const data = await response.json();
        
        // Update local state
        gameState.teams[session.teamName] = salaryCapState.selectedTeam;
        gameState.draftComplete = true;
        
        alert('✅ Team submitted successfully!\n\n' +
              `Total spent: $${salaryCapState.totalSpent.toLocaleString()}\n` +
              `Remaining budget: $${(SALARY_CAP_CONFIG.totalCap - salaryCapState.totalSpent).toLocaleString()}`);
        
        // Show teams page
        displayTeams();
        showPage('teams-page');
        
    } catch (error) {
        console.error('Error submitting team:', error);
        alert('Failed to submit team. Please try again.\n\nError: ' + error.message);
    }
}

// Helper function to get country flag (if not already defined)
if (typeof getCountryFlag === 'undefined') {
    function getCountryFlag(countryCode) {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    }
}

// Make functions available globally
window.setupSalaryCapDraft = setupSalaryCapDraft;
window.salaryCapState = salaryCapState;
