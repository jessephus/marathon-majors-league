/**
 * Salary Cap Draft System - New Slot-Based Design
 * Six slots (M1, M2, M3, W1, W2, W3) that open selection modals
 */

/**
 * Get runner image fallback based on gender
 */
function getRunnerSvg(gender) {
    // Return image URLs for default runner avatars
    const maleRunnerImg = '/images/man-runner.png';
    const femaleRunnerImg = '/images/woman-runner.png';

    return gender === 'men' || gender === 'M' ? maleRunnerImg : femaleRunnerImg;
}

/**
 * Helper function to generate team initials
 */
function getTeamInitials(teamName) {
    if (!teamName) return 'T';
    
    const words = teamName.trim().split(/\s+/);
    let initials = '';
    
    if (words.length === 1) {
        // Single word: take first 2 letters
        initials = words[0].substring(0, 2).toUpperCase();
    } else {
        // Multiple words: take first letter of first 2 words
        initials = words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
    }
    
    return initials;
}

/**
 * Helper function to create SVG avatar placeholder
 */
function createTeamAvatarSVG(teamName, size = 48) {
    const initials = getTeamInitials(teamName);
    
    // Generate a consistent color based on the team name
    const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };
    
    // Use the team name or a default to generate consistent color
    const hue = Math.abs(hashCode(teamName || 'DefaultTeam')) % 360;
    const saturation = 65;
    const lightness = 55;
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.style.borderRadius = "50%";
    svg.style.flexShrink = "0";
    svg.style.border = "3px solid white";
    svg.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    
    // Background circle
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", size / 2);
    circle.setAttribute("cy", size / 2);
    circle.setAttribute("r", size / 2);
    circle.setAttribute("fill", `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    svg.appendChild(circle);
    
    // Text (initials)
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "50%");
    text.setAttribute("y", "50%");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", size * 0.4);
    text.setAttribute("font-weight", "bold");
    text.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
    text.textContent = initials;
    svg.appendChild(text);
    
    return svg;
}

/**
 * Check if any race results exist in the game
 * If results exist, open scoring modal; otherwise open regular athlete modal
 */
async function openAppropriateAthleteModal(athlete) {
    try {
        // Check if we have gameState.results already loaded
        if (window.gameState && window.gameState.results && Object.keys(window.gameState.results).length > 0) {
            // Results exist - open scoring modal
            openAthleteScoringModal(athlete);
            return;
        }
        
        // Check via API
        const response = await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`);
        const data = await response.json();
        
        const results = data.scored || data.results || [];
        
        if (results.length > 0) {
            // Results exist - open scoring modal
            openAthleteScoringModal(athlete);
        } else {
            // No results yet - open regular athlete modal
            openAthleteModal(athlete);
        }
    } catch (error) {
        console.error('Error checking for results:', error);
        // Fallback to regular modal on error
        openAthleteModal(athlete);
    }
}

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
    isLocked: false,  // Track if team is submitted and locked
    permanentlyLocked: false  // Track if roster is permanently locked due to race results
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
        
        // Get gameId from separate localStorage key
        const gameId = localStorage.getItem('current_game_id') || 'default';
        
        // Add gameId to session object
        const sessionWithGameId = {
            ...parsed,
            gameId
        };
        
        console.log('✅ loadSession: Parsed session:', sessionWithGameId);
        return sessionWithGameId;
    } catch (error) {
        console.error('❌ loadSession: Error parsing session:', error);
        return null;
    }
}

/**
 * Initialize salary cap draft page
 */
async function setupSalaryCapDraft() {
    const perfStart = performance.now();
    console.log('🎯 Setting up Salary Cap Draft...');
    
    // Initialize state
    const initStart = performance.now();
    salaryCapState.slots = {
        M1: null, M2: null, M3: null,
        W1: null, W2: null, W3: null
    };
    salaryCapState.totalSpent = 0;
    salaryCapState.isLocked = false;
    salaryCapState.permanentlyLocked = false;
    console.log(`⏱️ State initialization took ${(performance.now() - initStart).toFixed(2)}ms`);
    
    // Load session to get gameId and playerCode
    const sessionStart = performance.now();
    const session = loadSession();
    console.log(`⏱️ loadSession took ${(performance.now() - sessionStart).toFixed(2)}ms`);
    console.log('✅ loadSession: Parsed session:', session);
    if (!session || !session.gameId || !session.playerCode) {
        showErrorNotification('No session found. Please enter game via home page.');
        console.error('❌ Invalid session:', session);
        return;
    }
    
    // Update team header with team name and avatar
    if (session.teamName) {
        updateTeamHeader(session.teamName);
    }
    
    const gameId = session.gameId;
    const playerCode = session.playerCode;
    
    // Fetch team data, check results, and get game state in parallel
    const fetchStart = performance.now();
    console.log('🔍 Fetching team data, checking results, and getting game state (parallel)...');
    
    try {
        const [teamResponse, resultsResponse, gameStateResponse] = await Promise.all([
            fetch(`/api/salary-cap-draft?gameId=${gameId}&playerCode=${playerCode}`),
            fetch(`/api/results?gameId=${gameId}&checkOnly=true`),
            fetch(`/api/game-state?gameId=${gameId}`)
        ]);
        console.log(`⏱️ Parallel API fetches took ${(performance.now() - fetchStart).toFixed(2)}ms`);
        
        // Parse team data
        const parseStart = performance.now();
        const data = await teamResponse.json();
        const resultsData = await resultsResponse.json();
        const gameStateData = await gameStateResponse.json();
        console.log(`⏱️ JSON parsing took ${(performance.now() - parseStart).toFixed(2)}ms`);
        console.log('🔍 Team data from API:', data);
        console.log('🔍 Game state from API:', gameStateData);
        
        // API returns all teams keyed by playerCode, get this player's team
        const playerTeam = data[playerCode];
        
        if (playerTeam) {
            const loadStart = performance.now();
            console.log('✅ Loading existing team:', playerTeam);
            
            const men = playerTeam.men || [];
            const women = playerTeam.women || [];
            
            // Load men into M1, M2, M3
            if (men[0]) salaryCapState.slots.M1 = men[0];
            if (men[1]) salaryCapState.slots.M2 = men[1];
            if (men[2]) salaryCapState.slots.M3 = men[2];
            
            // Load women into W1, W2, W3
            if (women[0]) salaryCapState.slots.W1 = women[0];
            if (women[1]) salaryCapState.slots.W2 = women[1];
            if (women[2]) salaryCapState.slots.W3 = women[2];
            
            // Use totalSpent from API or calculate
            salaryCapState.totalSpent = playerTeam.totalSpent || 
                Object.values(salaryCapState.slots)
                    .filter(a => a !== null)
                    .reduce((sum, a) => sum + (a.salary || 5000), 0);
            
            // Mark as locked since they already submitted
            salaryCapState.isLocked = true;
            console.log(`⏱️ Team loading took ${(performance.now() - loadStart).toFixed(2)}ms`);
        } else {
            console.log('ℹ️ No existing team found for player:', playerCode);
        }
        
        // Check if results exist (permanently lock roster)
        if (resultsData.hasResults) {
            salaryCapState.permanentlyLocked = true;
            console.log('🔒 Race results exist - roster permanently locked');
        }
        
        // Check if roster lock time has passed (permanently lock roster)
        if (gameStateData.rosterLockTime) {
            const lockTime = new Date(gameStateData.rosterLockTime);
            const now = new Date();
            
            // Show roster lock time notice
            displayRosterLockTime(lockTime);
            
            if (now >= lockTime) {
                salaryCapState.permanentlyLocked = true;
                console.log('🔒 Roster lock time has passed - roster permanently locked');
                console.log('🕒 Lock time was:', lockTime.toLocaleString());
            } else {
                console.log('ℹ️ Roster lock time not yet reached:', lockTime.toLocaleString());
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading team:', error);
    }
    
    // Setup UI
    const uiStart = performance.now();
    console.log('🎨 Setting up UI...');
    
    const listenersStart = performance.now();
    setupSalaryCapEventListeners();
    console.log(`⏱️ Event listeners setup took ${(performance.now() - listenersStart).toFixed(2)}ms`);
    
    const budgetStart = performance.now();
    updateBudgetDisplay();
    console.log(`⏱️ Budget display update took ${(performance.now() - budgetStart).toFixed(2)}ms`);
    
    const slotsStart = performance.now();
    updateAllSlots();
    console.log(`⏱️ updateAllSlots took ${(performance.now() - slotsStart).toFixed(2)}ms`);
    
    if (salaryCapState.isLocked) {
        const lockStart = performance.now();
        lockRoster();
        console.log(`⏱️ lockRoster took ${(performance.now() - lockStart).toFixed(2)}ms`);
    }
    
    console.log(`⏱️ UI setup took ${(performance.now() - uiStart).toFixed(2)}ms`);
    console.log(`⏱️ Total setupSalaryCapDraft took ${(performance.now() - perfStart).toFixed(2)}ms`);
    
    // Check if we should show the game recap modal (after everything is set up)
    setTimeout(async () => {
        if (typeof window.checkAndShowGameRecap === 'function') {
            await window.checkAndShowGameRecap();
        }
    }, 500);
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
    
    // If locked, show detail modal for filled slots or do nothing for empty
    if (salaryCapState.isLocked) {
        const athlete = salaryCapState.slots[slotId];
        if (athlete) {
            openAppropriateAthleteModal(athlete);
        }
        return;
    }
    
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
    
    // Check multiple possible rank field names
    const rank = athlete.marathonRank || athlete.marathon_rank || athlete.worldAthletics?.marathonRank || athlete.worldAthletics?.marathon_rank;
    const rankDisplay = rank ? `Rank: #${rank}` : 'Unranked';
    
    // Get headshot URL or fallback to default runner image
    const headshotUrl = athlete.headshotUrl || athlete.headshot_url || getRunnerSvg(salaryCapState.currentGender);
    
    item.innerHTML = `
        <div class="modal-athlete-headshot">
            <img src="${headshotUrl}" alt="${athlete.name}" onerror="this.src='${getRunnerSvg(salaryCapState.currentGender)}'">
        </div>
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
    const athleteSalary = athlete.salary || 5000;
    const rank = athlete.marathonRank || athlete.marathon_rank || athlete.worldAthletics?.marathonRank || athlete.worldAthletics?.marathon_rank;
    
    // Apply country gradient to masthead
    const masthead = document.getElementById('detail-card-masthead');
    if (masthead) {
        masthead.style.background = getCountryGradient(athlete.country);
    }
    
    // Photo with gender-specific runner fallback
    const photo = document.getElementById('detail-modal-athlete-photo');
    const defaultRunnerSvg = getRunnerSvg(salaryCapState.currentGender);
    const headshotUrl = athlete.headshot_url || athlete.headshotUrl;
    
    if (photo) {
        if (headshotUrl) {
            photo.src = headshotUrl;
            photo.alt = athlete.name;
            photo.onerror = function() {
                this.onerror = null;
                this.src = defaultRunnerSvg;
            };
        } else {
            photo.src = defaultRunnerSvg;
            photo.alt = 'No photo';
        }
    }
    
    // Basic info
    document.getElementById('detail-modal-athlete-name').textContent = athlete.name;
    document.getElementById('detail-modal-athlete-country').textContent = getCountryFlagEmoji(athlete.country);
    document.getElementById('detail-modal-athlete-gender').textContent = athlete.gender === 'men' ? 'Men' : 'Women';
    document.getElementById('detail-modal-athlete-age').textContent = athlete.age ? `${athlete.age}yo` : 'Age N/A';
    
    // Masthead stats
    document.getElementById('detail-modal-athlete-pb').textContent = athlete.pb || 'N/A';
    document.getElementById('detail-modal-athlete-marathon-rank').textContent = rank ? `#${rank}` : 'N/A';
    document.getElementById('detail-modal-athlete-salary').textContent = `$${athleteSalary.toLocaleString()}`;
    
    // Overview tab stats
    document.getElementById('detail-overview-pb').textContent = athlete.pb || 'N/A';
    document.getElementById('detail-modal-athlete-sb').textContent = athlete.seasonBest || athlete.season_best || athlete.pb || 'N/A';
    document.getElementById('detail-overview-marathon-rank').textContent = rank ? `#${rank}` : 'N/A';
    document.getElementById('detail-modal-athlete-overall-rank').textContent = athlete.overallRank || athlete.overall_rank ? `#${athlete.overallRank || athlete.overall_rank}` : 'N/A';
    
    // Sponsor
    const sponsorSection = document.getElementById('detail-modal-athlete-sponsor-section');
    if (athlete.sponsor) {
        document.getElementById('detail-modal-athlete-sponsor').textContent = athlete.sponsor;
        if (sponsorSection) sponsorSection.style.display = 'flex';
    } else {
        if (sponsorSection) sponsorSection.style.display = 'none';
    }
    
    // Profile tab
    document.getElementById('detail-modal-athlete-dob').textContent = athlete.dateOfBirth || athlete.date_of_birth ? 
        new Date(athlete.dateOfBirth || athlete.date_of_birth).toLocaleDateString() : 'N/A';
    document.getElementById('detail-modal-athlete-wa-id').textContent = athlete.worldAthleticsId || athlete.world_athletics_id || 'N/A';
    document.getElementById('detail-modal-athlete-road-rank').textContent = athlete.roadRunningRank || athlete.road_running_rank ? 
        `#${athlete.roadRunningRank || athlete.road_running_rank}` : 'N/A';
    
    // World Athletics link
    const waLink = document.getElementById('detail-modal-wa-link');
    if (waLink) {
        const waProfileUrl = athlete.worldAthleticsProfileUrl || athlete.world_athletics_profile_url;
        if (waProfileUrl) {
            waLink.href = waProfileUrl;
            waLink.style.display = 'flex';
        } else {
            waLink.style.display = 'none';
        }
    }
    
    // Setup tab switching for detail modal
    setupDetailModalTabs();
    
    // Reset to Overview tab
    const detailModal = document.getElementById('athlete-detail-modal');
    detailModal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    detailModal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    detailModal.querySelector('.tab-button[data-tab="detail-overview"]').classList.add('active');
    document.getElementById('tab-detail-overview').classList.add('active');
    
    // Show modal
    document.getElementById('athlete-detail-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Load detailed data (progression and race results)
    loadDetailAthleteData(athlete.id);
}

/**
 * Setup tab switching for detail modal
 */
function setupDetailModalTabs() {
    const detailModal = document.getElementById('athlete-detail-modal');
    if (!detailModal) return;
    
    const tabButtons = detailModal.querySelectorAll('.tab-button');
    
    // Remove any existing listeners by cloning and replacing
    tabButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    // Add new listeners
    detailModal.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update active button
            detailModal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active panel
            detailModal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(`tab-${tabName}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

/**
 * Close athlete detail modal
 */
function closeDetailModal() {
    document.getElementById('athlete-detail-modal').classList.remove('active');
    document.body.style.overflow = '';
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
        // Check multiple possible rank field names
        const rank = athlete.marathonRank || athlete.marathon_rank || athlete.worldAthletics?.marathonRank || athlete.worldAthletics?.marathon_rank;
        const rankDisplay = rank ? `#${rank}` : 'Unranked';
        
        // Determine gender from slot ID (M1, M2, M3 = men; W1, W2, W3 = women)
        const gender = slotId.startsWith('M') ? 'men' : 'women';
        const headshotUrl = athlete.headshot_url || athlete.headshotUrl;
        const fallbackImg = getRunnerSvg(gender);
        const displayUrl = headshotUrl || fallbackImg;
        
        slotContent.innerHTML = `
            <div class="slot-headshot">
                <img src="${displayUrl}" alt="${athlete.name}" class="slot-headshot-img" onerror="this.onerror=null; this.src='${fallbackImg}';" />
            </div>
            <div class="slot-athlete-info">
                <div class="slot-athlete-name">${athlete.name}</div>
                <div class="slot-athlete-details">${getCountryFlag(athlete.country)} ${athlete.country} • ${athlete.pb} • ${rankDisplay}</div>
            </div>
            <div class="slot-athlete-salary">$${athleteSalary.toLocaleString()}</div>
            <button class="slot-remove-btn" ${salaryCapState.isLocked ? 'style="display: none;"' : ''} onclick="removeAthleteFromSlot('${slotId}'); event.stopPropagation();">×</button>
        `;
        
        // Update cursor and classes based on lock state  
        if (salaryCapState.isLocked) {
            slotElement.style.cursor = 'pointer';
            slotElement.classList.add('locked');
        } else {
            slotElement.style.cursor = 'default';
            slotElement.classList.remove('locked');
        }
    } else {
        slotElement.classList.add('empty');
        slotElement.classList.remove('filled');
        slotContent.innerHTML = '<div class="slot-placeholder">Tap to select</div>';
        
        // Update cursor and classes based on lock state
        if (salaryCapState.isLocked) {
            slotElement.style.cursor = 'not-allowed';
            slotElement.classList.add('locked');
        } else {
            slotElement.style.cursor = 'pointer';
            slotElement.classList.remove('locked');
        }
    }
}

/**
 * Update all slot displays
 */
function updateAllSlots() {
    const start = performance.now();
    ['M1', 'M2', 'M3', 'W1', 'W2', 'W3'].forEach(slotId => {
        updateSlot(slotId);
    });
    updateSubmitButton();
    console.log(`⏱️ updateAllSlots (6 slots) took ${(performance.now() - start).toFixed(2)}ms`);
}

/**
 * Remove athlete from a slot
 */
function removeAthleteFromSlot(slotId) {
    // Prevent removal if roster is locked
    if (salaryCapState.isLocked) {
        console.log('Cannot remove athlete - roster is locked');
        return;
    }
    
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
 * Update team header with name and SVG avatar
 */
function updateTeamHeader(teamName) {
    if (!teamName) return;
    
    // Update team name
    const teamNameEl = document.getElementById('header-team-name');
    if (teamNameEl) {
        teamNameEl.textContent = teamName;
    }
    
    // Replace the avatar placeholder with SVG avatar
    const avatarContainer = document.querySelector('.team-avatar-placeholder .avatar-circle');
    if (avatarContainer) {
        // Clear existing content
        avatarContainer.innerHTML = '';
        
        // Create and append SVG avatar
        const avatarSvg = createTeamAvatarSVG(teamName, 48);
        avatarSvg.style.border = 'none';  // Remove border since SVG is already circular
        avatarContainer.appendChild(avatarSvg);
    }
}

/**
 * Update budget display
 */
function updateBudgetDisplay() {
    const spent = salaryCapState.totalSpent;
    const remaining = SALARY_CAP_CONFIG.totalCap - spent;
    
    // Format values compactly (e.g., $5K instead of $5,000)
    const formatCompact = (value) => {
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    };
    
    document.getElementById('header-budget-spent').textContent = formatCompact(spent);
    document.getElementById('header-budget-remaining').textContent = formatCompact(remaining);
    
    const remainingEl = document.getElementById('header-budget-remaining');
    remainingEl.classList.remove('over-budget');
    if (remaining < 0) {
        remainingEl.classList.add('over-budget');
    }
}

/**
 * Display roster lock time notice
 */
function displayRosterLockTime(lockTime) {
    const noticeEl = document.getElementById('roster-lock-notice');
    const displayEl = document.getElementById('roster-lock-time-display');
    
    if (!noticeEl || !displayEl) {
        return;
    }
    
    const now = new Date();
    const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
    };
    
    if (now >= lockTime) {
        displayEl.textContent = `Rosters locked as of ${lockTime.toLocaleString('en-US', options)}`;
        noticeEl.style.backgroundColor = '#ffebee';
        noticeEl.style.color = '#c62828';
    } else {
        displayEl.textContent = `Rosters will lock at ${lockTime.toLocaleString('en-US', options)}`;
        noticeEl.style.backgroundColor = '#fff3e0';
        noticeEl.style.color = '#e65100';
    }
    
    noticeEl.style.display = 'block';
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
 * Show subtle error notification
 */
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #ef4444;
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
    const start = performance.now();
    console.log('🔒 Locking roster...');
    
    // Disable submit button and change to locked state
    const submitBtn = document.getElementById('submit-salary-cap-team');
    submitBtn.disabled = true;
    
    if (salaryCapState.permanentlyLocked) {
        // Check if results are finalized
        if (salaryCapState.gameState && salaryCapState.gameState.resultsFinalized) {
            // Show "View Game Recap" button instead
            submitBtn.textContent = '🎉 View Game Recap';
            submitBtn.style.opacity = '1';
            submitBtn.disabled = false;
            submitBtn.style.cursor = 'pointer';
            
            // Replace click handler
            submitBtn.onclick = () => {
                if (typeof window.checkAndShowGameRecap === 'function') {
                    // Temporarily clear the "seen" flag so recap shows again
                    const playerCode = salaryCapState.session?.playerCode;
                    if (playerCode) {
                        const gameId = localStorage.getItem('current_game_id') || 'default';
                        localStorage.removeItem(`gameRecap_${gameId}_${playerCode}`);
                        window.checkAndShowGameRecap();
                    }
                }
            };
        } else {
            submitBtn.textContent = '🔒 Locked - Race Started';
            submitBtn.style.opacity = '0.5';
        }
    } else {
        submitBtn.textContent = 'Roster Locked ✓';
        submitBtn.style.opacity = '0.6';
    }
    
    // Show/hide edit button based on permanent lock
    const editBtn = document.getElementById('edit-salary-cap-team');
    if (editBtn) {
        if (salaryCapState.permanentlyLocked) {
            editBtn.style.display = 'none'; // Hide edit button when permanently locked
        } else {
            editBtn.style.display = 'inline-block';
        }
    }
    
    // Show navigation buttons (leaderboard, etc.)
    const navDiv = document.getElementById('roster-navigation');
    if (navDiv) {
        navDiv.style.display = 'flex';
    }
    
    // Disable all slot interactions - update slots to show locked state
    const slotsStart = performance.now();
    updateAllSlotsLocked();
    console.log(`⏱️ updateAllSlotsLocked took ${(performance.now() - slotsStart).toFixed(2)}ms`);
    
    console.log(`⏱️ lockRoster total took ${(performance.now() - start).toFixed(2)}ms`);
}

/**
 * Unlock the roster for editing
 */
function unlockRoster() {
    // Check if roster is permanently locked due to race results
    if (salaryCapState.permanentlyLocked) {
        showErrorNotification('Cannot edit roster - race results have already been entered. Rosters are permanently locked once the race begins.');
        return;
    }
    
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
    
    // Hide navigation buttons
    const navDiv = document.getElementById('roster-navigation');
    if (navDiv) {
        navDiv.style.display = 'none';
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
                    openAppropriateAthleteModal(athlete);
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

/**
 * Convert ISO 3166-1 alpha-3 country code to flag emoji
 */
function getCountryFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length < 2) return '🏁';
    const sanitized = countryCode.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (sanitized.length < 2) return '🏁';
    
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
    
    const alpha2 = alpha3ToAlpha2[sanitized] || sanitized.slice(0, 2);
    const codePoints = alpha2.split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

/**
 * Get gradient colors based on country flag colors
 */
function getCountryGradient(countryCode) {
    const flagColors = {
        'KEN': ['#BB0000', '#006600', '#000000'],
        'ETH': ['#009543', '#FCDD09', '#DA121A'],
        'USA': ['#B22234', '#FFFFFF', '#3C3B6E'],
        'GBR': ['#012169', '#FFFFFF', '#C8102E'],
        'JPN': ['#BC002D', '#FFFFFF'],
        'UGA': ['#000000', '#FCDC04', '#D90000'],
        'TAN': ['#1EB53A', '#FCD116', '#00A3DD'],
        'GER': ['#000000', '#DD0000', '#FFCE00'],
        'FRA': ['#002395', '#FFFFFF', '#ED2939'],
        'ESP': ['#AA151B', '#F1BF00'],
        'ITA': ['#009246', '#FFFFFF', '#CE2B37'],
        'NED': ['#21468B', '#FFFFFF', '#AE1C28'],
        'BEL': ['#000000', '#FDDA24', '#EF3340'],
        'MAR': ['#C1272D', '#006233'],
        'ERI': ['#12A2DD', '#EA0000', '#4CA64C'],
        'BRN': ['#CE1126', '#FFFFFF'],
        'CHN': ['#DE2910', '#FFDE00'],
        'MEX': ['#006847', '#FFFFFF', '#CE1126'],
        'BRA': ['#009B3A', '#FEDF00', '#002776'],
        'CAN': ['#FF0000', '#FFFFFF'],
        'AUS': ['#012169', '#FFFFFF', '#E4002B'],
        'NOR': ['#BA0C2F', '#FFFFFF', '#00205B'],
        'SWE': ['#006AA7', '#FECC00'],
        'FIN': ['#003580', '#FFFFFF'],
        'POL': ['#FFFFFF', '#DC143C'],
        'RUS': ['#FFFFFF', '#0039A6', '#D52B1E'],
        'UKR': ['#0057B7', '#FFD700'],
        'RSA': ['#007A4D', '#FFB612', '#DE3831'],
        'POR': ['#006600', '#FF0000'],
        'IRL': ['#169B62', '#FFFFFF', '#FF883E'],
        'BUL': ['#FFFFFF', '#00966E', '#D62612'],
        'ROU': ['#002B7F', '#FCD116', '#CE1126'],
        'CZE': ['#11457E', '#FFFFFF', '#D7141A'],
        'HUN': ['#CD2A3E', '#FFFFFF', '#436F4D'],
        'CRO': ['#FF0000', '#FFFFFF', '#171796'],
        'TUR': ['#E30A17', '#FFFFFF'],
    };
    
    const colors = flagColors[countryCode] || ['#2C39A2', '#ff6900'];
    
    if (colors.length === 2) {
        return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    } else if (colors.length === 3) {
        return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
    }
    
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
}

/**
 * Load progression and race results for detail modal
 */
let detailProgressionChart = null;
let detailProgressionData = null;

async function loadDetailAthleteData(athleteId) {
    const resultsDiv = document.getElementById('detail-results-list');
    const progressionLoading = document.getElementById('detail-progression-loading');
    const resultsLoading = document.getElementById('detail-results-loading');
    const progressionEmpty = document.getElementById('detail-progression-empty');
    const resultsEmpty = document.getElementById('detail-results-empty');
    const chartContainer = document.querySelector('#athlete-detail-modal .chart-container');
    const selectedRaceInfo = document.getElementById('detail-selected-race-info');
    
    // Show loading states
    if (progressionLoading) progressionLoading.style.display = 'block';
    if (resultsLoading) resultsLoading.style.display = 'block';
    if (resultsDiv) resultsDiv.innerHTML = '';
    if (progressionEmpty) progressionEmpty.style.display = 'none';
    if (resultsEmpty) resultsEmpty.style.display = 'none';
    if (chartContainer) chartContainer.style.display = 'none';
    if (selectedRaceInfo) selectedRaceInfo.style.display = 'none';
    
    try {
        // Fetch athlete profile with progression and results
        const response = await fetch(`${API_BASE}/api/athletes?id=${athleteId}&include=progression,results&year=2025`);
        if (!response.ok) throw new Error('Failed to load athlete data');
        
        const data = await response.json();
        
        // Hide loading spinners
        if (progressionLoading) progressionLoading.style.display = 'none';
        if (resultsLoading) resultsLoading.style.display = 'none';
        
        // Display progression data
        if (data.progression && data.progression.length > 0) {
            displayDetailProgression(data.progression);
        } else {
            if (progressionEmpty) progressionEmpty.style.display = 'block';
        }
        
        // Display race results
        if (data.raceResults && data.raceResults.length > 0) {
            displayDetailRaceResults(data.raceResults);
        } else {
            if (resultsEmpty) resultsEmpty.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading athlete details:', error);
        if (progressionLoading) progressionLoading.style.display = 'none';
        if (resultsLoading) resultsLoading.style.display = 'none';
        if (progressionEmpty) {
            progressionEmpty.querySelector('p').textContent = 'Error loading data';
            progressionEmpty.style.display = 'block';
        }
        if (resultsEmpty) {
            resultsEmpty.querySelector('p').textContent = 'Error loading data';
            resultsEmpty.style.display = 'block';
        }
    }
}

/**
 * Display progression data in detail modal
 */
function displayDetailProgression(progression) {
    detailProgressionData = progression;
    
    // Get unique disciplines
    const disciplines = [...new Set(progression.map(item => item.discipline))].sort();
    
    // Show discipline selector if more than one discipline
    const disciplineSelector = document.getElementById('detail-discipline-selector');
    if (disciplines.length > 1 && disciplineSelector) {
        disciplineSelector.style.display = 'block';
        disciplineSelector.innerHTML = disciplines.map(d => 
            `<option value="${d}">${d}</option>`
        ).join('');
        
        // Add change event listener
        disciplineSelector.onchange = function() {
            renderDetailProgressionChart(detailProgressionData, this.value);
        };
    } else if (disciplineSelector) {
        disciplineSelector.style.display = 'none';
    }
    
    // Render chart with default discipline (Marathon or first available)
    const defaultDiscipline = disciplines.includes('Marathon') ? 'Marathon' : disciplines[0];
    if (disciplineSelector) {
        disciplineSelector.value = defaultDiscipline;
    }
    renderDetailProgressionChart(progression, defaultDiscipline);
}

/**
 * Render progression chart in detail modal
 */
function renderDetailProgressionChart(progression, discipline = 'Marathon') {
    const canvas = document.getElementById('detail-progression-chart-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const progressionTitle = document.getElementById('detail-progression-title');
    
    // Update title with current discipline
    if (progressionTitle) {
        progressionTitle.textContent = `Season's Best: ${discipline}`;
    }
    
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
        const progressionEmpty = document.getElementById('detail-progression-empty');
        if (progressionEmpty) progressionEmpty.style.display = 'block';
        const chartContainer = canvas.parentElement;
        if (chartContainer) chartContainer.style.display = 'none';
        return;
    }
    
    const progressionEmpty = document.getElementById('detail-progression-empty');
    if (progressionEmpty) progressionEmpty.style.display = 'none';
    const chartContainer = canvas.parentElement;
    if (chartContainer) chartContainer.style.display = 'block';
    
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
    if (detailProgressionChart) {
        detailProgressionChart.destroy();
    }
    
    // Create new chart (requires Chart.js loaded in the page)
    if (typeof Chart !== 'undefined') {
        detailProgressionChart = new Chart(ctx, {
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
                        displayDetailSelectedRaceInfo(data);
                    }
                }
            }
        });
    }
}

/**
 * Display selected race info in detail modal
 */
function displayDetailSelectedRaceInfo(raceData) {
    const container = document.getElementById('detail-selected-race-info');
    const content = document.getElementById('detail-race-info-content');
    
    if (!container || !content) return;
    
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
 * Display race results in detail modal
 */
function displayDetailRaceResults(results) {
    const container = document.getElementById('detail-results-list');
    if (!container) return;
    
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

// Make functions available globally
window.setupSalaryCapDraft = setupSalaryCapDraft;
window.removeAthleteFromSlot = removeAthleteFromSlot;
window.unlockRoster = unlockRoster;
window.salaryCapState = salaryCapState;
