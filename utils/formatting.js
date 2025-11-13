/**
 * Formatting Utilities Module
 * 
 * Pure formatting functions for time, pace, ordinals, and XSS prevention.
 * Originally extracted from public/app.js (now removed) to eliminate duplication and enable testing.
 * 
 * All functions are pure (no side effects) and can be safely used in:
 * - Frontend components (React or vanilla JS)
 * - Backend API routes
 * - Unit tests
 * 
 * See: PROCESS_MONOLITH_AUDIT.md - Phase 1.1 (Utility Functions Module)
 */

/**
 * Format split name to display label
 * @param {string} splitName - Split key (e.g., '5k', 'half')
 * @returns {string} Formatted label (e.g., '5K', 'Half Marathon')
 * @example
 * formatSplitLabel('5k') // '5K'
 * formatSplitLabel('half') // 'Half Marathon'
 */
export function formatSplitLabel(splitName) {
    const splitLabels = {
        '5k': '5K',
        '10k': '10K',
        'half': 'Half Marathon',
        '30k': '30K',
        '35k': '35K',
        '40k': '40K'
    };
    
    return splitLabels[splitName] || (splitName ? splitName.toUpperCase() : 'recent split');
}

/**
 * Format time gap with sub-second precision
 * @param {number} gapSeconds - Gap in seconds (can include decimals)
 * @returns {string} Formatted gap (e.g., '+2:34', '+0:05.50')
 * @example
 * formatTimeGap(154) // '+2:34'
 * formatTimeGap(0.5) // '+0:00.50'
 */
export function formatTimeGap(gapSeconds) {
    if (gapSeconds <= 0) return '';
    
    const minutes = Math.floor(gapSeconds / 60);
    const seconds = gapSeconds % 60;
    
    // Show sub-second precision if gap is less than 1 second
    if (gapSeconds < 1) {
        return `+0:00.${Math.round(seconds * 100).toString().padStart(2, '0')}`;
    }
    
    // Show decimal seconds if there's a fractional part
    const wholeSec = Math.floor(seconds);
    const decimal = seconds - wholeSec;
    
    if (decimal > 0) {
        const decimalStr = Math.round(decimal * 100).toString().padStart(2, '0');
        return `+${minutes}:${wholeSec.toString().padStart(2, '0')}.${decimalStr}`;
    }
    
    // No decimals needed
    return `+${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Convert milliseconds to H:MM:SS format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time (e.g., '2:15:30', '45:20')
 * @example
 * formatTimeFromMs(8130000) // '2:15:30'
 * formatTimeFromMs(2720000) // '45:20'
 */
export function formatTimeFromMs(ms) {
    if (!ms || ms <= 0) return '0:00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Convert pace from ms per meter to min/mile format
 * @param {number} msPerMeter - Pace in milliseconds per meter
 * @returns {string} Formatted pace (e.g., '5:30/mi')
 * @example
 * formatPacePerMile(3436.4) // '5:30/mi'
 */
export function formatPacePerMile(msPerMeter) {
    if (!msPerMeter || msPerMeter <= 0) return 'N/A';
    
    // 1 mile = 1609.34 meters
    const msPerMile = msPerMeter * 1609.34;
    const totalSeconds = Math.floor(msPerMile / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
}

/**
 * Parse time string to total seconds
 * @param {string} timeStr - Time string in H:MM:SS format
 * @returns {number|null} Total seconds or null if invalid
 * @example
 * timeStringToSeconds('2:15:30') // 8130
 * timeStringToSeconds('45:20') // null (invalid format)
 */
export function timeStringToSeconds(timeStr) {
    if (!timeStr || timeStr === '-') return null;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        const [h, m, s] = parts.map(Number);
        return h * 3600 + m * 60 + s;
    }
    return null;
}

/**
 * Round time string to nearest second
 * @param {string} timeStr - Time string (H:MM:SS or H:MM:SS.mmm)
 * @returns {string} Rounded time string
 * @example
 * roundTimeToSecond('2:15:30.789') // '2:15:31'
 * roundTimeToSecond('2:15:59.500') // '2:16:00'
 */
export function roundTimeToSecond(timeStr) {
    if (!timeStr || timeStr === 'DNF' || timeStr === 'DNS' || timeStr === 'N/A') {
        return timeStr;
    }
    
    // Parse time string (H:MM:SS or H:MM:SS.mmm)
    const parts = timeStr.split(':');
    if (parts.length !== 3) return timeStr;
    
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsWithDecimal = parseFloat(parts[2]);
    
    // Round to nearest second
    const roundedSeconds = Math.round(secondsWithDecimal);
    
    // Handle 60 seconds case (round up to next minute)
    if (roundedSeconds >= 60) {
        const newMinutes = minutes + 1;
        if (newMinutes >= 60) {
            return `${hours + 1}:00:00`;
        }
        return `${hours}:${newMinutes.toString().padStart(2, '0')}:00`;
    }
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${roundedSeconds.toString().padStart(2, '0')}`;
}

/**
 * Get ordinal suffix for a number
 * @param {number} n - Number to get ordinal for
 * @returns {string} Number with ordinal suffix (e.g., '1st', '2nd', '3rd', '4th')
 * @example
 * getOrdinal(1) // '1st'
 * getOrdinal(2) // '2nd'
 * getOrdinal(21) // '21st'
 * getOrdinal(100) // '100th'
 */
export function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 * @example
 * escapeHtml('<script>alert("xss")</script>') // '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
export function escapeHtml(text) {
    if (typeof document !== 'undefined') {
        // Browser environment - use DOM method
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    } else {
        // Node.js environment - use string replacement
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

/**
 * Get record badge HTML for athlete display
 * @param {string} recordType - Type of record ('WORLD', 'COURSE', 'BOTH', 'NONE')
 * @param {string} recordStatus - Status of record ('confirmed' or 'provisional')
 * @returns {string} HTML badge string
 * @example
 * getRecordBadge('WORLD', 'confirmed') // '<span style="..." title="World Record">WR</span>'
 */
export function getRecordBadge(recordType, recordStatus) {
    if (recordType === 'NONE' || !recordType) {
        return '';
    }
    
    let badge = '';
    let title = '';
    let style = 'padding: 2px 6px; border-radius: 3px; font-size: 0.75em; font-weight: bold; margin-left: 6px;';
    
    if (recordType === 'WORLD' || recordType === 'BOTH') {
        badge = 'WR';
        title = 'World Record';
        style += ' background: gold; color: #333;';
    } else if (recordType === 'COURSE') {
        badge = 'CR';
        title = 'Course Record';
        style += ' background: #2C39A2; color: white;';
    }
    
    if (recordStatus === 'provisional') {
        style += ' border: 2px dashed #666;';
        title += ' (Provisional - Pending Confirmation)';
    }
    
    return `<span style="${style}" title="${title}">${badge}</span>`;
}

/**
 * Get country flag emoji from ISO 3166-1 alpha-3 code
 * @param {string} countryCode - 3-letter country code (e.g., 'USA', 'KEN', 'ETH')
 * @returns {string} Flag emoji or country code if not found
 * @example
 * getCountryFlag('USA') // '🇺🇸'
 * getCountryFlag('KEN') // '🇰🇪'
 */
export function getCountryFlag(countryCode) {
    // Map of ISO 3166-1 alpha-3 to alpha-2 codes for common marathon countries
    const countryMap = {
        'USA': 'US', 'KEN': 'KE', 'ETH': 'ET', 'GBR': 'GB', 'JPN': 'JP',
        'FRA': 'FR', 'DEU': 'DE', 'ITA': 'IT', 'ESP': 'ES', 'AUS': 'AU',
        'CAN': 'CA', 'BRA': 'BR', 'MEX': 'MX', 'NOR': 'NO', 'SWE': 'SE',
        'NED': 'NL', 'BEL': 'BE', 'CHE': 'CH', 'AUT': 'AT', 'POL': 'PL',
        'RUS': 'RU', 'CHN': 'CN', 'KOR': 'KR', 'IND': 'IN', 'ZAF': 'ZA',
        'ERI': 'ER', 'UGA': 'UG', 'TAN': 'TZ', 'MAR': 'MA', 'TUR': 'TR',
        'ISR': 'IL', 'NZL': 'NZ', 'IRL': 'IE', 'PRT': 'PT', 'CZE': 'CZ',
        'HUN': 'HU', 'ROU': 'RO', 'UKR': 'UA', 'BLR': 'BY', 'LTU': 'LT',
        'ARG': 'AR', 'CHL': 'CL', 'COL': 'CO', 'PER': 'PE', 'VEN': 'VE',
        'THA': 'TH', 'VNM': 'VN', 'PHI': 'PH', 'IDN': 'ID', 'MYS': 'MY',
        'SGP': 'SG', 'HKG': 'HK', 'TWN': 'TW', 'BAH': 'BH', 'BRN': 'BN'
    };
    
    const alpha2 = countryMap[countryCode];
    if (!alpha2) return countryCode;
    
    // Convert ISO 3166-1 alpha-2 to flag emoji
    // Regional indicator symbols: A=127462, so offset by 127397 (127462-65)
    const codePoints = alpha2.split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
