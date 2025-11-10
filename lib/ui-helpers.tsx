/**
 * UI Utility Functions Module
 * 
 * Shared UI helper functions used across the application.
 * Eliminates code duplication from app.js, salary-cap-draft.js, and [session].tsx.
 * 
 * See: PROCESS_MONOLITH_AUDIT.md lines 895-910 (Priority 1.2: UI Utility Functions Module)
 */

import React from 'react';

/**
 * Get runner image fallback based on gender
 * @param gender - 'men', 'women', 'M', or 'W'
 * @returns URL to default runner avatar
 */
export function getRunnerSvg(gender: string): string {
  const maleRunnerImg = '/images/man-runner.png';
  const femaleRunnerImg = '/images/woman-runner.png';
  
  return gender === 'men' || gender === 'M' ? maleRunnerImg : femaleRunnerImg;
}

/**
 * Generate team initials from team name
 * @param teamName - Full team name
 * @returns 1-2 letter initials
 * @example
 * getTeamInitials('Swift Runners') // 'SR'
 * getTeamInitials('Rockets') // 'RO'
 */
export function getTeamInitials(teamName: string): string {
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
 * @param str - Team name string
 * @returns Hash code as number
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

/**
 * Create SVG avatar placeholder for team (React JSX version)
 * @param teamName - Team name for color generation and initials
 * @param size - SVG size in pixels (default: 48)
 * @returns React SVG element
 */
export function createTeamAvatarSVG(teamName: string, size: number = 48) {
  const initials = getTeamInitials(teamName);
  
  // Generate a consistent color based on the team name
  const hue = Math.abs(hashCode(teamName || 'DefaultTeam')) % 360;
  const saturation = 65;
  const lightness = 55;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        borderRadius: '50%',
        flexShrink: 0,
        border: '3px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill={`hsl(${hue}, ${saturation}%, ${lightness}%)`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontSize={size * 0.4}
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}

/**
 * Create SVG avatar placeholder for team (DOM version for vanilla JS)
 * @param teamName - Team name for color generation and initials
 * @param size - SVG size in pixels (default: 48)
 * @returns SVG element
 */
export function createTeamAvatarSVGElement(teamName: string, size: number = 48): SVGElement {
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
 * Get country flag emoji from ISO 3166-1 alpha-3 country code
 * @param countryCode - 3-letter country code (e.g., 'USA', 'KEN')
 * @returns Flag emoji string
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 3) return '🏁';
  
  // Convert alpha-3 to alpha-2 (simplified mapping)
  const alpha3ToAlpha2: Record<string, string> = {
    'USA': 'US', 'GBR': 'GB', 'CAN': 'CA', 'AUS': 'AU', 'NZL': 'NZ',
    'KEN': 'KE', 'ETH': 'ET', 'ERI': 'ER', 'UGA': 'UG', 'TAN': 'TZ',
    'JPN': 'JP', 'CHN': 'CN', 'KOR': 'KR', 'IND': 'IN',
    'FRA': 'FR', 'DEU': 'DE', 'ITA': 'IT', 'ESP': 'ES', 'NED': 'NL',
    'BEL': 'BE', 'SUI': 'CH', 'AUT': 'AT', 'POL': 'PL', 'NOR': 'NO',
    'SWE': 'SE', 'FIN': 'FI', 'DEN': 'DK', 'IRL': 'IE', 'POR': 'PT',
    'BRA': 'BR', 'ARG': 'AR', 'MEX': 'MX', 'COL': 'CO', 'PER': 'PE',
    'RSA': 'ZA', 'EGY': 'EG', 'MAR': 'MA', 'ALG': 'DZ'
  };
  
  const alpha2 = alpha3ToAlpha2[countryCode.toUpperCase()] || countryCode.substring(0, 2);
  
  const getFlag = (code: string): string => {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 
        0x1F1E6 + char.charCodeAt(0) - 65
      );
    
    return String.fromCodePoint(...codePoints);
  };
  
  return getFlag(alpha2);
}

/**
 * Create headshot image element with error handling
 * @param athlete - Athlete object with headshotUrl
 * @param className - CSS class for the container div
 * @returns DOM element or null if no valid headshot
 */
export function createHeadshotElement(
  athlete: { headshotUrl?: string; name: string },
  className: string
): HTMLDivElement | null {
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

/**
 * Enrich athlete data with current information from global state
 * @param athlete - Athlete object with id
 * @param gender - 'men' or 'women'
 * @param athletesData - Current athlete database
 * @returns Merged athlete object
 */
export function enrichAthleteData(
  athlete: any,
  gender: 'men' | 'women',
  athletesData: { men: any[]; women: any[] }
): any {
  // Find the current athlete data
  const currentData = athletesData[gender]?.find((a: any) => a.id === athlete.id);
  // Merge the saved athlete data with current data, prioritizing current data
  return currentData ? { ...athlete, ...currentData } : athlete;
}
