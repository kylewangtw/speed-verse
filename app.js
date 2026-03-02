// === Constants ===
const MILE_TO_KM = 1.60934;
const STORAGE_KEY = 'speedverse_data';

// === DOM Elements: Converter ===
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

// === DOM Elements: Race Calculator ===
const raceDistInput = document.getElementById('race-distance');
const raceHrInput = document.getElementById('race-hr');
const raceMinInput = document.getElementById('race-min');
const raceSecInput = document.getElementById('race-sec');
const raceDistUnitBtn = document.getElementById('race-dist-unit-btn');
const raceDistUnitLabel = document.getElementById('race-dist-unit');
const raceCalcBtn = document.getElementById('race-calc-btn');
const raceClearBtn = document.getElementById('race-clear-btn');
const raceResultDisplay = document.getElementById('race-result-display');
const quickBtns = document.querySelectorAll('.quick-btn');

// === DOM Elements: Tabs ===
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.panel');

// === State ===
let speedUnit = 'km/h';   // 'km/h' or 'mph'
let paceUnit = 'min/km';  // 'min/km' or 'min/mile'
let raceDistUnit = 'km';  // 'km' or 'mi'
let lastEditedField = 'speed'; // 'speed' or 'pace'

// === Initialization ===
function init() {
  loadFromStorage();
  bindEvents();
  updateUnitLabels();
}

// === Tab Navigation ===
function bindTabEvents() {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => {
        p.classList.remove('active');
        p.hidden = true;
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(targetId);
      panel.classList.add('active');
      panel.hidden = false;
    });
  });
}

// === Event Bindings ===
function bindEvents() {
  bindTabEvents();

  // Unit selection buttons (converter)
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

  // Convert / Clear (converter)
  convertBtn.addEventListener('click', handleConvert);
  clearBtn.addEventListener('click', clearAll);

  // Enter key to convert (converter)
  [speedInput, paceMinInput, paceSecInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleConvert();
    });
  });

  // Auto-format pace seconds
  paceSecInput.addEventListener('blur', () => {
    if (paceSecInput.value && paceSecInput.value.length === 1) {
      paceSecInput.value = paceSecInput.value.padStart(2, '0');
    }
  });

  // Race calculator
  raceDistUnitBtn.addEventListener('click', toggleRaceDistUnit);
  raceCalcBtn.addEventListener('click', handleRaceCalc);
  raceClearBtn.addEventListener('click', clearRace);

  // Quick-pick distance buttons
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const km = parseFloat(btn.dataset.km);
      if (raceDistUnit === 'km') {
        raceDistInput.value = km;
      } else {
        raceDistInput.value = Math.round((km / MILE_TO_KM) * 1000) / 1000;
      }
      // Highlight active quick btn
      quickBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Enter key to calculate (race)
  [raceDistInput, raceHrInput, raceMinInput, raceSecInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRaceCalc();
    });
  });

  // Auto-format race sec/min
  raceSecInput.addEventListener('blur', () => {
    if (raceSecInput.value && raceSecInput.value.length === 1) {
      raceSecInput.value = raceSecInput.value.padStart(2, '0');
    }
  });
  raceMinInput.addEventListener('blur', () => {
    if (raceMinInput.value && raceMinInput.value.length === 1) {
      raceMinInput.value = raceMinInput.value.padStart(2, '0');
    }
  });
}

// === Toggle Speed Unit ===
function toggleSpeedUnit() {
  speedUnit = speedUnit === 'km/h' ? 'mph' : 'km/h';
  speedUnitLabel.textContent = speedUnit;

  const speedValue = parseFloat(speedInput.value);
  if (speedValue > 0) {
    if (speedUnit === 'mph') {
      speedInput.value = Math.round((speedValue / MILE_TO_KM) * 10) / 10;
    } else {
      speedInput.value = Math.round((speedValue * MILE_TO_KM) * 10) / 10;
    }

    const paceMin = parseInt(paceMinInput.value) || 0;
    const paceSec = parseInt(paceSecInput.value) || 0;
    if (paceMin > 0 || paceSec > 0) {
      const newSpeedValue = parseFloat(speedInput.value);
      let speedInKmh = newSpeedValue;
      if (speedUnit === 'mph') speedInKmh = newSpeedValue * MILE_TO_KM;
      const paceInMinKm = speedToPace(speedInKmh);
      let finalPace = paceUnit === 'min/mile' ? paceInMinKm * MILE_TO_KM : paceInMinKm;
      const newPaceMin = Math.floor(finalPace);
      const newPaceSec = Math.round((finalPace - newPaceMin) * 60);
      paceMinInput.value = newPaceMin;
      paceSecInput.value = newPaceSec.toString().padStart(2, '0');
      showResult(`${newSpeedValue} ${speedUnit} = ${newPaceMin}:${newPaceSec.toString().padStart(2, '0')} ${paceUnit}`, true);
    }
  }
  saveToStorage();
}

// === Toggle Pace Unit ===
function togglePaceUnit() {
  paceUnit = paceUnit === 'min/km' ? 'min/mile' : 'min/km';
  paceUnitLabel.textContent = paceUnit;

  const paceMin = parseInt(paceMinInput.value) || 0;
  const paceSec = parseInt(paceSecInput.value) || 0;
  const totalPaceMinutes = paceMin + paceSec / 60;

  if (totalPaceMinutes > 0) {
    let newPaceMinutes;
    if (paceUnit === 'min/mile') {
      newPaceMinutes = totalPaceMinutes * MILE_TO_KM;
    } else {
      newPaceMinutes = totalPaceMinutes / MILE_TO_KM;
    }
    const newPaceMin = Math.floor(newPaceMinutes);
    const newPaceSec = Math.round((newPaceMinutes - newPaceMin) * 60);
    paceMinInput.value = newPaceMin;
    paceSecInput.value = newPaceSec.toString().padStart(2, '0');

    const newTotal = newPaceMin + newPaceSec / 60;
    let paceInMinKm = paceUnit === 'min/mile' ? newTotal / MILE_TO_KM : newTotal;
    const speedInKmh = paceToSpeed(paceInMinKm);
    let finalSpeed = speedUnit === 'mph' ? speedInKmh / MILE_TO_KM : speedInKmh;
    const speedRounded = Math.round(finalSpeed * 10) / 10;
    speedInput.value = speedRounded;
    showResult(`${newPaceMin}:${newPaceSec.toString().padStart(2, '0')} ${paceUnit} = ${speedRounded} ${speedUnit}`, true);
  }
  saveToStorage();
}

// === Toggle Race Distance Unit ===
function toggleRaceDistUnit() {
  const prev = raceDistUnit;
  raceDistUnit = raceDistUnit === 'km' ? 'mi' : 'km';
  raceDistUnitLabel.textContent = raceDistUnit;

  const val = parseFloat(raceDistInput.value);
  if (val > 0) {
    if (raceDistUnit === 'mi') {
      raceDistInput.value = Math.round((val / MILE_TO_KM) * 1000) / 1000;
    } else {
      raceDistInput.value = Math.round((val * MILE_TO_KM) * 1000) / 1000;
    }
    // Update quick-pick highlights
    const kmVal = raceDistUnit === 'km' ? parseFloat(raceDistInput.value) : parseFloat(raceDistInput.value) * MILE_TO_KM;
    updateQuickPickHighlight(kmVal);
  }
}

function updateQuickPickHighlight(kmVal) {
  quickBtns.forEach(btn => {
    const btnKm = parseFloat(btn.dataset.km);
    btn.classList.toggle('active', Math.abs(btnKm - kmVal) < 0.01);
  });
}

// === Update Unit Labels ===
function updateUnitLabels() {
  speedUnitLabel.textContent = speedUnit;
  paceUnitLabel.textContent = paceUnit;
  raceDistUnitLabel.textContent = raceDistUnit;
}

// === Converter: Convert Logic ===
function handleConvert() {
  const speedValue = parseFloat(speedInput.value);
  const paceMin = parseInt(paceMinInput.value) || 0;
  const paceSec = parseInt(paceSecInput.value) || 0;
  const totalPaceMinutes = paceMin + paceSec / 60;

  let result = '';

  if (lastEditedField === 'speed' && speedValue > 0) {
    let speedInKmh = speedUnit === 'mph' ? speedValue * MILE_TO_KM : speedValue;
    const paceInMinKm = speedToPace(speedInKmh);
    let finalPace = paceUnit === 'min/mile' ? paceInMinKm * MILE_TO_KM : paceInMinKm;
    const paceMinResult = Math.floor(finalPace);
    const paceSecResult = Math.round((finalPace - paceMinResult) * 60);
    paceMinInput.value = paceMinResult;
    paceSecInput.value = paceSecResult.toString().padStart(2, '0');
    result = `${speedValue} ${speedUnit} = ${paceMinResult}:${paceSecResult.toString().padStart(2, '0')} ${paceUnit}`;
  }
  else if (lastEditedField === 'pace' && totalPaceMinutes > 0) {
    let paceInMinKm = paceUnit === 'min/mile' ? totalPaceMinutes / MILE_TO_KM : totalPaceMinutes;
    const speedInKmh = paceToSpeed(paceInMinKm);
    let finalSpeed = speedUnit === 'mph' ? speedInKmh / MILE_TO_KM : speedInKmh;
    const speedRounded = Math.round(finalSpeed * 10) / 10;
    speedInput.value = speedRounded;
    result = `${paceMin}:${paceSec.toString().padStart(2, '0')} ${paceUnit} = ${speedRounded} ${speedUnit}`;
  }
  else {
    showResult('請輸入配速或速度', false);
    return;
  }

  showResult(result, true);
  saveToStorage();
}

// === Race Pace Calculator ===
function handleRaceCalc() {
  const distRaw = parseFloat(raceDistInput.value);
  const hr = parseInt(raceHrInput.value) || 0;
  const min = parseInt(raceMinInput.value) || 0;
  const sec = parseInt(raceSecInput.value) || 0;

  if (!distRaw || distRaw <= 0) {
    showRaceResult('請輸入距離', false);
    return;
  }
  if (hr === 0 && min === 0 && sec === 0) {
    showRaceResult('請輸入完賽時間', false);
    return;
  }

  // Convert distance to km
  const distKm = raceDistUnit === 'mi' ? distRaw * MILE_TO_KM : distRaw;

  // Total time in minutes
  const totalMinutes = hr * 60 + min + sec / 60;

  // Pace in min/km
  const paceMinKm = totalMinutes / distKm;
  const paceM = Math.floor(paceMinKm);
  const paceS = Math.round((paceMinKm - paceM) * 60);

  // Speed in km/h
  const speedKmh = 60 / paceMinKm;

  // Format results
  const paceStr = `${paceM}:${paceS.toString().padStart(2, '0')}`;
  const speedStr = speedKmh.toFixed(1);

  // Build a rich multi-line result
  const lines = [
    { label: '均速 (配速)', value: `${paceStr} min/km` },
    { label: '均速 (時速)', value: `${speedStr} km/h` },
  ];

  // Also show min/mile and mph
  const paceMinMile = paceMinKm * MILE_TO_KM;
  const paceMileM = Math.floor(paceMinMile);
  const paceMileS = Math.round((paceMinMile - paceMileM) * 60);
  lines.push({ label: '均速 (配速)', value: `${paceMileM}:${paceMileS.toString().padStart(2, '0')} min/mi` });
  lines.push({ label: '均速 (時速)', value: `${(speedKmh / MILE_TO_KM).toFixed(1)} mph` });

  showRaceResult(lines, true);
}

// === Speed to Pace ===
function speedToPace(speed) {
  return 60 / speed;
}

// === Pace to Speed ===
function paceToSpeed(paceMinutes) {
  return 60 / paceMinutes;
}

// === Show Result (Converter) ===
function showResult(text, isSuccess) {
  resultDisplay.classList.toggle('has-result', isSuccess);
  resultDisplay.innerHTML = isSuccess
    ? `<p class="result-text">${text}</p>`
    : `<p class="result-text">${text}</p>`;

  resultDisplay.style.transform = 'scale(1.02)';
  setTimeout(() => { resultDisplay.style.transform = 'scale(1)'; }, 150);
}

// === Show Result (Race) ===
function showRaceResult(lines, isSuccess) {
  raceResultDisplay.classList.toggle('has-result', isSuccess);

  if (!isSuccess) {
    raceResultDisplay.innerHTML = `<p class="result-text">${lines}</p>`;
    return;
  }

  // lines is an array of {label, value}
  const html = `
    <div class="race-result-grid">
      <div class="race-result-row primary">
        <span class="race-result-label">配速</span>
        <span class="race-result-value">${lines[0].value}</span>
      </div>
      <div class="race-result-row primary">
        <span class="race-result-label">時速</span>
        <span class="race-result-value">${lines[1].value}</span>
      </div>
      <div class="race-result-divider"></div>
      <div class="race-result-row secondary">
        <span class="race-result-label">配速</span>
        <span class="race-result-value">${lines[2].value}</span>
      </div>
      <div class="race-result-row secondary">
        <span class="race-result-label">時速</span>
        <span class="race-result-value">${lines[3].value}</span>
      </div>
    </div>
  `;
  raceResultDisplay.innerHTML = html;
  raceResultDisplay.style.transform = 'scale(1.02)';
  setTimeout(() => { raceResultDisplay.style.transform = 'scale(1)'; }, 150);
}

// === Clear Result (Converter) ===
function clearResult() {
  resultDisplay.classList.remove('has-result');
  resultDisplay.innerHTML = '<p class="result-text">輸入配速或速度後按換算</p>';
}

// === Clear All (Converter) ===
function clearAll() {
  speedInput.value = '';
  paceMinInput.value = '';
  paceSecInput.value = '';
  clearResult();
  saveToStorage();
}

// === Clear Race ===
function clearRace() {
  raceDistInput.value = '';
  raceHrInput.value = '';
  raceMinInput.value = '';
  raceSecInput.value = '';
  quickBtns.forEach(b => b.classList.remove('active'));
  raceResultDisplay.classList.remove('has-result');
  raceResultDisplay.innerHTML = '<p class="result-text">輸入距離與完賽時間後計算均速</p>';
}

// === Local Storage ===
function saveToStorage() {
  const data = {
    speedUnit,
    paceUnit,
    raceDistUnit,
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
      raceDistUnit = data.raceDistUnit || 'km';
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerSW);
  } else {
    registerSW();
  }
}

function registerSW() {
  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then(reg => {
      console.log('SW registered:', reg.scope);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New SW available');
          }
        });
      });
    })
    .catch(err => {
      console.error('SW registration failed:', err);
    });
}

// === Start App ===
init();
