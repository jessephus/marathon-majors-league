// Test the time formatting functions

// Round time to nearest second (for display)
function roundTimeToSecond(timeStr) {
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

// Format time gap with sub-second precision
function formatTimeGap(gapSeconds) {
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

console.log('Testing roundTimeToSecond():');
console.log('Input: "02:08:09" →', roundTimeToSecond('02:08:09')); // Should be 02:08:09
console.log('Input: "02:08:09.03" →', roundTimeToSecond('02:08:09.03')); // Should be 02:08:09
console.log('Input: "02:08:09.50" →', roundTimeToSecond('02:08:09.50')); // Should be 02:08:10
console.log('Input: "02:08:59.50" →', roundTimeToSecond('02:08:59.50')); // Should be 02:09:00
console.log('Input: "02:59:59.50" →', roundTimeToSecond('02:59:59.50')); // Should be 03:00:00
console.log('Input: "DNF" →', roundTimeToSecond('DNF')); // Should be DNF
console.log();

console.log('Testing formatTimeGap():');
console.log('Gap: 0.03 seconds →', formatTimeGap(0.03)); // Should be +0:00.03
console.log('Gap: 0.5 seconds →', formatTimeGap(0.5)); // Should be +0:00.50
console.log('Gap: 1.03 seconds →', formatTimeGap(1.03)); // Should be +0:01.03
console.log('Gap: 48 seconds →', formatTimeGap(48)); // Should be +0:48
console.log('Gap: 61.5 seconds →', formatTimeGap(61.5)); // Should be +1:01.50
console.log('Gap: 125 seconds →', formatTimeGap(125)); // Should be +2:05
