// === Constants ===
const MILE_TO_KM = 1.60934;
const STORAGE_KEY = 'speedverse_data';

// === DOM Elements ===
const speedInput = document.getElementById('speed-input');
const paceMinInput = document.getElementById('pace-min');
const paceSecInput = document.getElementById('pace-sec');
const speedUnitBtn = document.getElementById('speed-unit-btn');
const paceUnitBtn = document.getElementById('pace-unit-btn');
const speedUnitLabel = document.getElementById('speed-unit');
const paceUnitLabel = document.getElementById('pace-unit');
const convertBtn = document.getElementById('convert-btn');
const clearBtn = document.getElementById('clear-btn');
const resultDisplay = document.getElementById('result-display');

// === State ===
let speedUnit = 'km/h'; // 'km/h' or 'mph'
let paceUnit = 'min/km'; // 'min/km' or 'min/mile'
let lastEditedField = 'speed'; // 'speed' or 'pace'

// === Unit Options ===
const speedUnits = ['km/h', 'mph'];
const paceUnits = ['min/km', 'min/mile'];

// === Initialization ===
function init() {
  loadFromStorage();
  bindEvents();
  updateUnitLabels();
}

// === Event Bindings ===
function bindEvents() {
  // Unit selection buttons
  speedUnitBtn.addEventListener('click', () => toggleSpeedUnit());
  paceUnitBtn.addEventListener('click', () => togglePaceUnit());

  // Track which field was last edited
  speedInput.addEventListener('input', () => {
    lastEditedField = 'speed';
    clearResult();
  });
  
  paceMinInput.addEventListener('input', () => {
    lastEditedField = 'pace';
    clearResult();
  });
  
  paceSecInput.addEventListener('input', () => {
    lastEditedField = 'pace';
    clearResult();
  });

  // Convert button
  convertBtn.addEventListener('click', handleConvert);

  // Clear button
  clearBtn.addEventListener('click', clearAll);

  // Enter key to convert
  [speedInput, paceMinInput, paceSecInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleConvert();
      }
    });
  });

  // Auto-format pace seconds
  paceSecInput.addEventListener('blur', () => {
    if (paceSecInput.value && paceSecInput.value.length === 1) {
      paceSecInput.value = paceSecInput.value.padStart(2, '0');
    }
  });
}

// === Toggle Speed Unit ===
function toggleSpeedUnit() {
  speedUnit = speedUnit === 'km/h' ? 'mph' : 'km/h';
  speedUnitLabel.textContent = speedUnit;
  
  // Convert speed value if exists
  const speedValue = parseFloat(speedInput.value);
  if (speedValue > 0) {
    if (speedUnit === 'mph') {
      // km/h to mph
      speedInput.value = Math.round((speedValue / MILE_TO_KM) * 10) / 10;
    } else {
      // mph to km/h
      speedInput.value = Math.round((speedValue * MILE_TO_KM) * 10) / 10;
    }
    
    // Recalculate pace if it has value
    const paceMin = parseInt(paceMinInput.value) || 0;
    const paceSec = parseInt(paceSecInput.value) || 0;
    if (paceMin > 0 || paceSec > 0) {
      // Recalculate pace based on new speed
      const newSpeedValue = parseFloat(speedInput.value);
      let speedInKmh = newSpeedValue;
      if (speedUnit === 'mph') {
        speedInKmh = newSpeedValue * MILE_TO_KM;
      }
      
      const paceInMinKm = speedToPace(speedInKmh);
      let finalPace = paceInMinKm;
      if (paceUnit === 'min/mile') {
        // min/km to min/mile: multiply by MILE_TO_KM
        finalPace = paceInMinKm * MILE_TO_KM;
      }
      
      const newPaceMin = Math.floor(finalPace);
      const newPaceSec = Math.round((finalPace - newPaceMin) * 60);
      paceMinInput.value = newPaceMin;
      paceSecInput.value = newPaceSec.toString().padStart(2, '0');
      
      // Update result
      const result = `${newSpeedValue} ${speedUnit} = ${newPaceMin}:${newPaceSec.toString().padStart(2, '0')} ${paceUnit}`;
      showResult(result, true);
    }
  }
  
  saveToStorage();
}

// === Toggle Pace Unit ===
function togglePaceUnit() {
  paceUnit = paceUnit === 'min/km' ? 'min/mile' : 'min/km';
  paceUnitLabel.textContent = paceUnit;
  
  // Convert pace value if exists
  const paceMin = parseInt(paceMinInput.value) || 0;
  const paceSec = parseInt(paceSecInput.value) || 0;
  const totalPaceMinutes = paceMin + paceSec / 60;
  
  if (totalPaceMinutes > 0) {
    if (paceUnit === 'min/mile') {
      // min/km to min/mile
      const newPaceMinutes = totalPaceMinutes * MILE_TO_KM;
      const newPaceMin = Math.floor(newPaceMinutes);
      const newPaceSec = Math.round((newPaceMinutes - newPaceMin) * 60);
      paceMinInput.value = newPaceMin;
      paceSecInput.value = newPaceSec.toString().padStart(2, '0');
    } else {
      // min/mile to min/km
      const newPaceMinutes = totalPaceMinutes / MILE_TO_KM;
      const newPaceMin = Math.floor(newPaceMinutes);
      const newPaceSec = Math.round((newPaceMinutes - newPaceMin) * 60);
      paceMinInput.value = newPaceMin;
      paceSecInput.value = newPaceSec.toString().padStart(2, '0');
    }
    
    // Recalculate speed based on new pace
    const newPaceMin = parseInt(paceMinInput.value) || 0;
    const newPaceSec = parseInt(paceSecInput.value) || 0;
    const newTotalPaceMinutes = newPaceMin + newPaceSec / 60;
    
    // Convert to base unit (min/km) for calculation
    let paceInMinKm = newTotalPaceMinutes;
    if (paceUnit === 'min/mile') {
      paceInMinKm = newTotalPaceMinutes * MILE_TO_KM;
    }
    
    // Calculate speed in km/h
    const speedInKmh = paceToSpeed(paceInMinKm);
    
    // Convert to target speed unit
    let finalSpeed = speedInKmh;
    if (speedUnit === 'mph') {
      finalSpeed = speedInKmh / MILE_TO_KM;
    }
    
    const speedRounded = Math.round(finalSpeed * 10) / 10;
    speedInput.value = speedRounded;
    
    // Update result
    const result = `${newPaceMin}:${newPaceSec.toString().padStart(2, '0')} ${paceUnit} = ${speedRounded} ${speedUnit}`;
    showResult(result, true);
  }
  
  saveToStorage();
}

// === Update Unit Labels ===
function updateUnitLabels() {
  speedUnitLabel.textContent = speedUnit;
  paceUnitLabel.textContent = paceUnit;
}

// === Conversion Logic ===
function handleConvert() {
  const speedValue = parseFloat(speedInput.value);
  const paceMin = parseInt(paceMinInput.value) || 0;
  const paceSec = parseInt(paceSecInput.value) || 0;
  const totalPaceMinutes = paceMin + paceSec / 60;

  let result = '';

  if (lastEditedField === 'speed' && speedValue > 0) {
    // Convert speed to pace
    // First convert speed to base unit (km/h) if needed
    let speedInKmh = speedValue;
    if (speedUnit === 'mph') {
      speedInKmh = speedValue * MILE_TO_KM;
    }
    
    // Calculate pace in min/km
    const paceInMinKm = speedToPace(speedInKmh);
    
    // Convert to target pace unit if needed
    let finalPace = paceInMinKm;
    if (paceUnit === 'min/mile') {
      // min/km to min/mile: multiply by MILE_TO_KM (1 mile = 1.60934 km)
      finalPace = paceInMinKm * MILE_TO_KM;
    }
    
    const paceMinResult = Math.floor(finalPace);
    const paceSecResult = Math.round((finalPace - paceMinResult) * 60);
    
    // Update pace inputs
    paceMinInput.value = paceMinResult;
    paceSecInput.value = paceSecResult.toString().padStart(2, '0');
    
    result = `${speedValue} ${speedUnit} = ${paceMinResult}:${paceSecResult.toString().padStart(2, '0')} ${paceUnit}`;
  } 
  else if (lastEditedField === 'pace' && totalPaceMinutes > 0) {
    // Convert pace to speed
    // First convert pace to base unit (min/km) if needed
    let paceInMinKm = totalPaceMinutes;
    if (paceUnit === 'min/mile') {
      paceInMinKm = totalPaceMinutes * MILE_TO_KM;
    }
    
    // Calculate speed in km/h
    const speedInKmh = paceToSpeed(paceInMinKm);
    
    // Convert to target speed unit if needed
    let finalSpeed = speedInKmh;
    if (speedUnit === 'mph') {
      finalSpeed = speedInKmh / MILE_TO_KM;
    }
    
    const speedRounded = Math.round(finalSpeed * 10) / 10;
    
    // Update speed input
    speedInput.value = speedRounded;
    
    result = `${paceMin}:${paceSec.toString().padStart(2, '0')} ${paceUnit} = ${speedRounded} ${speedUnit}`;
  }
  else {
    showResult('Please enter speed or pace', false);
    return;
  }

  showResult(result, true);
  saveToStorage();
}

// === Speed to Pace ===
function speedToPace(speed) {
  // pace (min/unit) = 60 / speed (unit/h)
  return 60 / speed;
}

// === Pace to Speed ===
function paceToSpeed(paceMinutes) {
  // speed (unit/h) = 60 / pace (min/unit)
  return 60 / paceMinutes;
}

// === Show Result ===
function showResult(text, isSuccess) {
  resultDisplay.classList.toggle('has-result', isSuccess);
  resultDisplay.querySelector('.result-text').textContent = text;
  
  // Add a small animation
  resultDisplay.style.transform = 'scale(1.02)';
  setTimeout(() => {
    resultDisplay.style.transform = 'scale(1)';
  }, 150);
}

// === Clear Result ===
function clearResult() {
  resultDisplay.classList.remove('has-result');
  resultDisplay.querySelector('.result-text').textContent = 'Enter speed or pace and click convert';
}

// === Clear All ===
function clearAll() {
  speedInput.value = '';
  paceMinInput.value = '';
  paceSecInput.value = '';
  clearResult();
  saveToStorage();
}

// === Local Storage ===
function saveToStorage() {
  const data = {
    speedUnit: speedUnit,
    paceUnit: paceUnit,
    speed: speedInput.value,
    paceMin: paceMinInput.value,
    paceSec: paceSecInput.value,
    lastEdited: lastEditedField
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      speedUnit = data.speedUnit || 'km/h';
      paceUnit = data.paceUnit || 'min/km';
      speedInput.value = data.speed || '';
      paceMinInput.value = data.paceMin || '';
      paceSecInput.value = data.paceSec || '';
      lastEditedField = data.lastEdited || 'speed';
    }
  } catch (e) {
    // Ignore storage errors
  }
}

// === Service Worker Registration ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => {
        console.log('SW registered:', reg.scope);
      })
      .catch(err => {
        console.log('SW registration failed:', err);
      });
  });
}

// === Start App ===
init();
