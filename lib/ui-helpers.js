/**
 * UI Helper Functions (Vanilla JS version)
 * 
 * Pure JavaScript versions of UI utilities for use in legacy vanilla JS files.
 * This is a bridge module that will be replaced when legacy files are converted to TypeScript/React.
 * 
 * Source of truth: lib/ui-helpers.tsx
 * DO NOT modify this file directly - update lib/ui-helpers.tsx instead
 */

/**
 * Get runner image fallback based on gender
 * @param {string} gender - 'men', 'women', 'M', or 'W'
 * @returns {string} URL to default runner avatar
 */
export function getRunnerSvg(gender) {
  const maleRunnerImg = '/images/man-runner.png';
  const femaleRunnerImg = '/images/woman-runner.png';
  
  return gender === 'men' || gender === 'M' ? maleRunnerImg : femaleRunnerImg;
}

/**
 * Generate team initials from team name
 * @param {string} teamName - Full team name
 * @returns {string} 1-2 letter initials
 */
export function getTeamInitials(teamName) {
  if (!teamName) return 'T';
  
  const words = teamName.trim().split(/\s+/);
  let initials = '';
  
  if (words.length === 1) {
    // Single word: take first 2 letters
    initials = words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words: take first letter of first 2 words
    initials = words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }
  
  return initials;
}

/**
 * Generate consistent color hash from team name
 * @param {string} str - Team name string
 * @returns {number} Hash code
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

/**
 * Create SVG avatar placeholder for team (DOM version)
 * @param {string} teamName - Team name for color generation and initials
 * @param {number} size - SVG size in pixels (default: 48)
 * @returns {SVGElement} SVG element
 */
export function createTeamAvatarSVG(teamName, size = 48) {
  const initials = getTeamInitials(teamName);
  
  // Generate a consistent color based on the team name
  const hue = Math.abs(hashCode(teamName || 'DefaultTeam')) % 360;
  const saturation = 65;
  const lightness = 55;
  
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", size.toString());
  svg.setAttribute("height", size.toString());
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.style.borderRadius = "50%";
  svg.style.flexShrink = "0";
  svg.style.border = "3px solid white";
  svg.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  
  // Background circle
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", (size / 2).toString());
  circle.setAttribute("cy", (size / 2).toString());
  circle.setAttribute("r", (size / 2).toString());
  circle.setAttribute("fill", `hsl(${hue}, ${saturation}%, ${lightness}%)`);
  svg.appendChild(circle);
  
  // Text (initials)
  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", "50%");
  text.setAttribute("y", "50%");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", "white");
  text.setAttribute("font-size", (size * 0.4).toString());
  text.setAttribute("font-weight", "bold");
  text.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
  text.textContent = initials;
  svg.appendChild(text);
  
  return svg;
}

/**
 * Get country flag emoji from country code
 * @param {string} countryCode - ISO 3166-1 alpha-3 country code
 * @returns {string} Flag emoji
 */
export function getCountryFlag(countryCode) {
  const flagMap = {
    'USA': '🇺🇸', 'GBR': '🇬🇧', 'CAN': '🇨🇦', 'AUS': '🇦🇺',
    'FRA': '🇫🇷', 'GER': '🇩🇪', 'ITA': '🇮🇹', 'ESP': '🇪🇸',
    'JPN': '🇯🇵', 'CHN': '🇨🇳', 'KOR': '🇰🇷', 'BRA': '🇧🇷',
    'MEX': '🇲🇽', 'NED': '🇳🇱', 'BEL': '🇧🇪', 'SWE': '🇸🇪',
    'NOR': '🇳🇴', 'DEN': '🇩🇰', 'FIN': '🇫🇮', 'POL': '🇵🇱',
    'ETH': '🇪🇹', 'KEN': '🇰🇪', 'UGA': '🇺🇬', 'TAN': '🇹🇿',
    'ERI': '🇪🇷', 'RSA': '🇿🇦', 'MAR': '🇲🇦', 'ALG': '🇩🇿',
    'SUI': '🇨🇭', 'AUT': '🇦🇹', 'CZE': '🇨🇿', 'HUN': '🇭🇺',
    'ROU': '🇷🇴', 'POR': '🇵🇹', 'GRE': '🇬🇷', 'TUR': '🇹🇷',
    'ISR': '🇮🇱', 'IND': '🇮🇳', 'PAK': '🇵🇰', 'THA': '🇹🇭',
    'VIE': '🇻🇳', 'PHI': '🇵🇭', 'INA': '🇮🇩', 'MAS': '🇲🇾',
    'NZL': '🇳🇿', 'ARG': '🇦🇷', 'CHI': '🇨🇱', 'COL': '🇨🇴',
    'PER': '🇵🇪', 'VEN': '🇻🇪', 'ECU': '🇪🇨', 'BOL': '🇧🇴',
  };
  
  return flagMap[countryCode] || '🏳️';
}
