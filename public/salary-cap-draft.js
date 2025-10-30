/**
 * Salary Cap Draft System - New Slot-Based Design
 * Six slots (M1, M2, M3, W1, W2, W3) that open selection modals
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
    slots: {
        M1: null,
        M2: null,
        M3: null,
        W1: null,
        W2: null,
        W3: null
    },
    currentSlot: null,
    currentGender: null,
    currentSort: 'salary',
    totalSpent: 0,
    isLocked: false  // Track if team is submitted and locked
};

/**
 * Load session from localStorage
 */
function loadSession() {
    const TEAM_SESSION_KEY = 'marathon_fantasy_team'; // Fixed: was 'marathon_fantasy_team_session'
    console.log('🔍 loadSession: Looking for key:', TEAM_SESSION_KEY);
    console.log('🔍 loadSession: All localStorage keys:', Object.keys(localStorage));
    
    const sessionData = localStorage.getItem(TEAM_SESSION_KEY);
    console.log('🔍 loadSession: Raw sessionData:', sessionData);
    
    if (!sessionData) {
        console.log('❌ loadSession: No session data found');
        return null;
    }
    
    try {
        const parsed = JSON.parse(sessionData);
        console.log('✅ loadSession: Parsed session:', parsed);
        return parsed;
    } catch (error) {
        console.error('❌ loadSession: Error parsing session:', error);
        return null;
    }
}

/**
 * Initialize salary cap draft page
 */
async function setupSalaryCapDraft() {
    // Ensure athletes are loaded
    if (!gameState.athletes.men || gameState.athletes.men.length === 0) {
        await loadAthletes();
    }
    
    // Reset state
    salaryCapState.slots = {
        M1: null,
        M2: null,
        M3: null,
        W1: null,
        W2: null,
        W3: null
    };
    salaryCapState.currentSlot = null;
    salaryCapState.currentGender = null;
    salaryCapState.currentSort = 'salary';
    salaryCapState.totalSpent = 0;
    
    // Setup event listeners
    setupSalaryCapEventListeners();
    
    // Update displays
    updateBudgetDisplay();
    updateAllSlots();
}

/**
 * Setup event listeners for the new design
 */
function setupSalaryCapEventListeners() {
    // Slot click handlers
    document.querySelectorAll('.draft-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            // Don't trigger if clicking remove button
            if (e.target.closest('.slot-remove-btn')) {
                return;
            }
            handleSlotClick(slot);
        });
    });
    
    // Modal close button
    document.getElementById('close-selection-modal').addEventListener('click', closeSelectionModal);
    
    // Sort tab buttons
    document.querySelectorAll('.sort-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.sort-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            salaryCapState.currentSort = e.target.dataset.sort;
            renderModalAthleteList();
        });
    });
    
    // Detail modal close
    document.getElementById('close-detail-modal').addEventListener('click', closeDetailModal);
    
    // Submit team button
    document.getElementById('submit-salary-cap-team').addEventListener('click', handleSubmitSalaryCapTeam);
}

/**
 * Handle slot click to open athlete selection modal
 */
function handleSlotClick(slotElement) {
    const slotId = slotElement.dataset.slot;
    const gender = slotElement.dataset.gender;
    
    salaryCapState.currentSlot = slotId;
    salaryCapState.currentGender = gender;
    salaryCapState.currentSort = 'salary';
    
    // Update modal title
    document.getElementById('selection-modal-title').textContent = 
        `Select ${gender === 'men' ? 'Male' : 'Female'} Athlete (${slotId})`;
    
    // Reset sort tabs
    document.querySelectorAll('.sort-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.sort-tab[data-sort="salary"]').classList.add('active');
    
    // Render athlete list
    renderModalAthleteList();
    
    // Show modal
    document.getElementById('athlete-selection-modal').classList.add('active');
}

/**
 * Close the selection modal
 */
function closeSelectionModal() {
    document.getElementById('athlete-selection-modal').classList.remove('active');
    salaryCapState.currentSlot = null;
    salaryCapState.currentGender = null;
}

/**
 * Render the athlete list in the modal
 */
function renderModalAthleteList() {
    const container = document.getElementById('modal-athlete-list');
    container.innerHTML = '';
    
    if (!salaryCapState.currentGender) return;
    
    // Get athletes of the current gender
    let athletes = [...gameState.athletes[salaryCapState.currentGender]];
    
    // Sort athletes
    athletes.sort((a, b) => {
        switch (salaryCapState.currentSort) {
            case 'salary':
                return (b.salary || 5000) - (a.salary || 5000);
            case 'pb':
                const aPb = convertTimeToSeconds(a.pb);
                const bPb = convertTimeToSeconds(b.pb);
                return aPb - bPb;
            case 'rank':
                const aRank = a.marathonRank || a.worldAthletics?.marathonRank || 9999;
                const bRank = b.marathonRank || b.worldAthletics?.marathonRank || 9999;
                return aRank - bRank;
            default:
                return 0;
        }
    });
    
    // Get already selected athlete IDs
    const selectedAthleteIds = Object.values(salaryCapState.slots)
        .filter(a => a !== null)
        .map(a => a.id);
    
    // Render each athlete
    athletes.forEach(athlete => {
        const item = createModalAthleteItem(athlete, selectedAthleteIds);
        container.appendChild(item);
    });
}

/**
 * Create a modal athlete list item
 */
function createModalAthleteItem(athlete, selectedAthleteIds) {
    const item = document.createElement('div');
    item.className = 'modal-athlete-item';
    
    const athleteSalary = athlete.salary || 5000;
    const isSelected = selectedAthleteIds.includes(athlete.id);
    const currentSlotAthlete = salaryCapState.slots[salaryCapState.currentSlot];
    const isInCurrentSlot = currentSlotAthlete && currentSlotAthlete.id === athlete.id;
    
    // Calculate if we can afford this athlete
    const costWithoutCurrentSlot = isInCurrentSlot 
        ? salaryCapState.totalSpent - athleteSalary 
        : salaryCapState.totalSpent;
    const wouldExceedBudget = (costWithoutCurrentSlot + athleteSalary) > SALARY_CAP_CONFIG.totalCap;
    
    if (isSelected && !isInCurrentSlot) {
        item.classList.add('selected');
    }
    
    if ((isSelected && !isInCurrentSlot) || wouldExceedBudget) {
        item.classList.add('disabled');
    }
    
    const rank = athlete.marathonRank || athlete.worldAthletics?.marathonRank;
    const rankDisplay = rank ? `Rank: #${rank}` : 'Unranked';
    
    item.innerHTML = `
        <div class="modal-athlete-info">
            <div class="modal-athlete-name">${athlete.name}</div>
            <div class="modal-athlete-stats">
                ${getCountryFlag(athlete.country)} ${athlete.country} • ${athlete.pb} • ${rankDisplay}
            </div>
        </div>
        <div class="modal-athlete-salary">$${athleteSalary.toLocaleString()}</div>
        <button class="modal-add-btn" ${(isSelected && !isInCurrentSlot) || wouldExceedBudget ? 'disabled' : ''}>
            ${isInCurrentSlot ? '✓' : '+'}
        </button>
    `;
    
    // Click on item to show detail modal
    item.addEventListener('click', (e) => {
        if (e.target.closest('.modal-add-btn')) {
            e.stopPropagation();
            if (!((isSelected && !isInCurrentSlot) || wouldExceedBudget)) {
                selectAthleteForSlot(athlete);
            }
        } else {
            showAthleteDetail(athlete);
        }
    });
    
    return item;
}

/**
 * Select an athlete for the current slot
 */
function selectAthleteForSlot(athlete) {
    if (!salaryCapState.currentSlot) return;
    
    // Remove old athlete's salary if replacing
    const oldAthlete = salaryCapState.slots[salaryCapState.currentSlot];
    if (oldAthlete) {
        salaryCapState.totalSpent -= (oldAthlete.salary || 5000);
    }
    
    // Add new athlete
    salaryCapState.slots[salaryCapState.currentSlot] = athlete;
    salaryCapState.totalSpent += (athlete.salary || 5000);
    
    // Update displays
    updateBudgetDisplay();
    updateSlot(salaryCapState.currentSlot);
    updateSubmitButton();
    
    // Close modal
    closeSelectionModal();
}

/**
 * Show athlete detail modal
 */
function showAthleteDetail(athlete) {
    const content = document.getElementById('athlete-detail-content');
    const athleteSalary = athlete.salary || 5000;
    const rank = athlete.marathonRank || athlete.worldAthletics?.marathonRank;
    
    content.innerHTML = `
        <div class="detail-athlete-header">
            ${athlete.headshotUrl ? `<img src="${athlete.headshotUrl}" class="detail-athlete-headshot" alt="${athlete.name}">` : ''}
            <div class="detail-athlete-name">${athlete.name}</div>
            <div class="detail-athlete-country">${getCountryFlag(athlete.country)} ${athlete.country}</div>
            <div class="detail-athlete-salary">$${athleteSalary.toLocaleString()}</div>
        </div>
        
        <div class="detail-stats-grid">
            <div class="detail-stat">
                <div class="detail-stat-label">Personal Best</div>
                <div class="detail-stat-value">${athlete.pb}</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-label">Marathon Rank</div>
                <div class="detail-stat-value">${rank ? `#${rank}` : 'N/A'}</div>
            </div>
            ${athlete.seasonBest ? `
            <div class="detail-stat">
                <div class="detail-stat-label">Season Best</div>
                <div class="detail-stat-value">${athlete.seasonBest}</div>
            </div>
            ` : ''}
            ${athlete.age ? `
            <div class="detail-stat">
                <div class="detail-stat-label">Age</div>
                <div class="detail-stat-value">${athlete.age}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Show modal
    document.getElementById('athlete-detail-modal').classList.add('active');
}

/**
 * Close athlete detail modal
 */
function closeDetailModal() {
    document.getElementById('athlete-detail-modal').classList.remove('active');
}

/**
 * Update a specific slot display
 */
function updateSlot(slotId) {
    const slotElement = document.querySelector(`.draft-slot[data-slot="${slotId}"]`);
    if (!slotElement) return;
    
    const athlete = salaryCapState.slots[slotId];
    const slotContent = slotElement.querySelector('.slot-content');
    
    if (athlete) {
        slotElement.classList.remove('empty');
        slotElement.classList.add('filled');
        
        const athleteSalary = athlete.salary || 5000;
        const rank = athlete.marathonRank || athlete.worldAthletics?.marathonRank;
        const rankDisplay = rank ? `#${rank}` : 'Unranked';
        
        slotContent.innerHTML = `
            <div class="slot-athlete-info">
                <div class="slot-athlete-name">${athlete.name}</div>
                <div class="slot-athlete-details">${getCountryFlag(athlete.country)} ${athlete.country} • ${athlete.pb} • ${rankDisplay}</div>
            </div>
            <div class="slot-athlete-salary">$${athleteSalary.toLocaleString()}</div>
            <button class="slot-remove-btn" onclick="removeAthleteFromSlot('${slotId}'); event.stopPropagation();">×</button>
        `;
    } else {
        slotElement.classList.add('empty');
        slotElement.classList.remove('filled');
        slotContent.innerHTML = '<div class="slot-placeholder">Tap to select</div>';
    }
}

/**
 * Update all slot displays
 */
function updateAllSlots() {
    Object.keys(salaryCapState.slots).forEach(slotId => {
        updateSlot(slotId);
    });
    updateSubmitButton();
}

/**
 * Remove athlete from a slot
 */
function removeAthleteFromSlot(slotId) {
    const athlete = salaryCapState.slots[slotId];
    if (athlete) {
        salaryCapState.totalSpent -= (athlete.salary || 5000);
        salaryCapState.slots[slotId] = null;
        
        updateBudgetDisplay();
        updateSlot(slotId);
        updateSubmitButton();
    }
}

/**
 * Update budget display
 */
function updateBudgetDisplay() {
    const spent = salaryCapState.totalSpent;
    const remaining = SALARY_CAP_CONFIG.totalCap - spent;
    
    document.getElementById('header-budget-spent').textContent = `$${spent.toLocaleString()}`;
    document.getElementById('header-budget-remaining').textContent = `$${remaining.toLocaleString()}`;
    
    const remainingEl = document.getElementById('header-budget-remaining');
    remainingEl.classList.remove('over-budget');
    if (remaining < 0) {
        remainingEl.classList.add('over-budget');
    }
}

/**
 * Update submit button state
 */
function updateSubmitButton() {
    const allSlotsFilled = Object.values(salaryCapState.slots).every(slot => slot !== null);
    const underBudget = salaryCapState.totalSpent <= SALARY_CAP_CONFIG.totalCap;
    
    const submitBtn = document.getElementById('submit-salary-cap-team');
    submitBtn.disabled = !(allSlotsFilled && underBudget);
}

/**
 * Submit salary cap team
 */
async function handleSubmitSalaryCapTeam() {
    console.log('=== SUBMIT TEAM CALLED ===');
    
    const allSlotsFilled = Object.values(salaryCapState.slots).every(slot => slot !== null);
    console.log('All slots filled?', allSlotsFilled);
    
    if (!allSlotsFilled) {
        alert('Please fill all 6 slots before submitting.');
        return;
    }
    
    if (salaryCapState.totalSpent > SALARY_CAP_CONFIG.totalCap) {
        alert(`Your team costs $${salaryCapState.totalSpent.toLocaleString()}, which exceeds the $${SALARY_CAP_CONFIG.totalCap.toLocaleString()} salary cap.`);
        return;
    }
    
    // Convert slots to team format
    const team = {
        men: [salaryCapState.slots.M1, salaryCapState.slots.M2, salaryCapState.slots.M3],
        women: [salaryCapState.slots.W1, salaryCapState.slots.W2, salaryCapState.slots.W3]
    };
    console.log('Team prepared:', team);
    
    // Get session token
    console.log('Loading session from localStorage...');
    const session = loadSession();
    console.log('=== SESSION LOADED ===', {
        raw: session,
        hasSession: !!session,
        hasToken: !!session?.token,
        tokenValue: session?.token,
        teamName: session?.teamName,
        expiresAt: session?.expiresAt
    });
    
    if (!session || !session.token) {
        console.error('❌ SESSION VALIDATION FAILED', { session });
        alert('Session expired. Please create a new team.');
        showPage('landing-page');
        return;
    }
    
    console.log('✅ Session valid, proceeding with submission');
    
    try {
        // Save team via API
        const response = await fetch(`${API_BASE}/api/salary-cap-draft?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify({
                team: team,
                totalSpent: salaryCapState.totalSpent,
                teamName: session.teamName || 'Unnamed Team'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit team');
        }
        
        const data = await response.json();
        
        // Lock the team
        salaryCapState.isLocked = true;
        
        // Update local state
        gameState.teams[session.teamName] = team;
        gameState.draftComplete = true;
        
        // Show subtle success message
        showSuccessNotification('✅ Roster saved successfully');
        
        // Update UI to locked state
        lockRoster();
        
    } catch (error) {
        console.error('Error submitting team:', error);
        
        // Check if this is a session expiration error
        if (error.message && error.message.includes('Session expired')) {
            alert(
                'Your session has expired.\n\n' +
                'Sessions last for 90 days. You\'ll need to create a new team to get a fresh session.\n\n' +
                'Click OK to return to the home page.'
            );
            // Clear the expired session
            localStorage.removeItem('marathon_fantasy_team_session');
            showPage('landing-page');
        } else {
            alert('Failed to submit team. Please try again.\n\nError: ' + error.message);
        }
    }
}

/**
 * Helper function to convert time to seconds for sorting
 */
function convertTimeToSeconds(timeString) {
    if (!timeString || timeString === 'N/A' || timeString === 'Debut') return 999999;
    const parts = timeString.split(':');
    if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 999999;
}

/**
 * Show subtle success notification
 */
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Lock the roster after submission
 */
function lockRoster() {
    // Disable submit button and change to locked state
    const submitBtn = document.getElementById('submit-salary-cap-team');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Roster Locked ✓';
    submitBtn.style.opacity = '0.6';
    
    // Show edit button
    const editBtn = document.getElementById('edit-salary-cap-team');
    if (editBtn) {
        editBtn.style.display = 'inline-block';
    }
    
    // Disable all slot interactions - update slots to show locked state
    updateAllSlotsLocked();
}

/**
 * Unlock the roster for editing
 */
function unlockRoster() {
    salaryCapState.isLocked = false;
    
    // Re-enable submit button
    const submitBtn = document.getElementById('submit-salary-cap-team');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Team';
    submitBtn.style.opacity = '1';
    
    // Hide edit button
    const editBtn = document.getElementById('edit-salary-cap-team');
    if (editBtn) {
        editBtn.style.display = 'none';
    }
    
    // Re-enable slot interactions
    updateAllSlots();
    
    showSuccessNotification('Roster unlocked - you can now make changes');
}

/**
 * Update all slots to show locked state
 */
function updateAllSlotsLocked() {
    ['M1', 'M2', 'M3', 'W1', 'W2', 'W3'].forEach(slotId => {
        const slotElement = document.querySelector(`[data-slot="${slotId}"]`);
        if (slotElement) {
            slotElement.style.cursor = 'default';
            slotElement.onclick = (e) => {
                // Only allow viewing details, not removing
                const athlete = salaryCapState.slots[slotId];
                if (athlete && e.target.classList.contains('athlete-name')) {
                    openDetailModal(athlete);
                }
            };
            
            // Remove the remove button
            const removeBtn = slotElement.querySelector('.remove-athlete');
            if (removeBtn) {
                removeBtn.style.display = 'none';
            }
        }
    });
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
window.removeAthleteFromSlot = removeAthleteFromSlot;
window.unlockRoster = unlockRoster;
window.salaryCapState = salaryCapState;
