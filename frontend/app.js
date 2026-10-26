/*
  FILE: app.js
  WHO MADE THIS: Luv
  WHAT IT DOES: All the interactivity of the page.
                - Updates slider values when you drag
                - Fills tehsil preset values
                - Sends data to the server and shows the result
                - Language switching (English / Hindi)
                - Dark/Light mode toggling
                - Loads history
*/

// ============================================================
// LANGUAGE DICTIONARY (English and Hindi translations)
// ============================================================
const TRANSLATIONS = {
    en: {
        soil_title:      'Soil & Climate Details',
        soil_desc:       'Enter your soil test values or select a tehsil to auto-fill.',
        tehsil_label:    'Select Your Tehsil',
        recommend_btn:   'Get Crop Recommendation',
        loading_text:    'Consulting AI model...',
        empty_title:     'Ready to Recommend',
        empty_desc:      'Fill in your soil details on the left and click "Get Recommendation"',
        result_title:    'AI Recommendation',
        confidence_label: 'Confidence:',
        alt_label:       'Also Consider:',
        fert_title:      'Fertilizer Plan (per acre)',
    },
    hi: {
        soil_title:      'मिट्टी और जलवायु विवरण',
        soil_desc:       'अपने मिट्टी परीक्षण के मूल्य दर्ज करें या तहसील चुनें।',
        tehsil_label:    'अपनी तहसील चुनें',
        recommend_btn:   'फसल सुझाव पाएं',
        loading_text:    'AI मॉडल से पूछ रहे हैं...',
        empty_title:     'सुझाव के लिए तैयार',
        empty_desc:      'बाईं तरफ मिट्टी की जानकारी भरें और बटन दबाएं',
        result_title:    'AI सुझाव',
        confidence_label: 'विश्वास:',
        alt_label:       'अन्य विकल्प:',
        fert_title:      'खाद योजना (प्रति एकड़)',
    }
};

let currentLang = localStorage.getItem('agrosense_lang') || 'en';

// ============================================================
// TEHSIL PRESETS (NASA 5-year average climate for each tehsil)
// ============================================================
const TEHSIL_PRESETS = {
    'Indore':   { temperature: 28, humidity: 65, rainfall: 480 },
    'Sanwer':   { temperature: 28, humidity: 63, rainfall: 460 },
    'Depalpur': { temperature: 28, humidity: 62, rainfall: 455 },
    'Mhow':     { temperature: 27, humidity: 67, rainfall: 500 },
    'Hatod':    { temperature: 28, humidity: 61, rainfall: 450 },
};

// ============================================================
// SLIDER: Update display value when user moves a slider
// ============================================================
function updateSlider(name, value) {
    const badgeId = name.toLowerCase() + '-val';
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = value;
}

// ============================================================
// TEHSIL PRESET: Auto-fill climate sliders when tehsil is selected
// ============================================================
function applyTehsilPreset() {
    const tehsil = document.getElementById('tehsil').value;
    if (!tehsil || !TEHSIL_PRESETS[tehsil]) return;

    const preset = TEHSIL_PRESETS[tehsil];

    // Update each climate slider smoothly
    Object.entries(preset).forEach(([key, value]) => {
        const slider = document.getElementById('slider-' + key);
        if (slider) {
            slider.value = value;
            updateSlider(key, value);
        }
    });
}

// ============================================================
// MAIN FUNCTION: Send soil data to server, show result
// ============================================================
async function getRecommendation() {
    // Collect all slider values
    const payload = {
        N:           parseFloat(document.getElementById('slider-N').value),
        P:           parseFloat(document.getElementById('slider-P').value),
        K:           parseFloat(document.getElementById('slider-K').value),
        ph:          parseFloat(document.getElementById('slider-ph').value),
        temperature: parseFloat(document.getElementById('slider-temperature').value),
        humidity:    parseFloat(document.getElementById('slider-humidity').value),
        rainfall:    parseFloat(document.getElementById('slider-rainfall').value),
        tehsil:      document.getElementById('tehsil').value || 'Indore',
        farmer_name: document.getElementById('farmer-name').value,
        village:     document.getElementById('farmer-village').value,
    };

    // Show loading spinner, hide other states
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');

    try {
        // Send POST request to our Express server (Kunal's API)
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showResult(data);
        } else {
            alert('Error: ' + (data.error || 'Something went wrong.'));
        }

    } catch (error) {
        alert('Could not reach the server. Make sure it is running.');
        console.error(error);
    } finally {
        // Always hide loading spinner when done
        document.getElementById('loading').classList.add('hidden');
    }
}

// ============================================================
// SHOW RESULT: Display the AI recommendation on screen
// ============================================================
function showResult(data) {
    const recs  = data.recommendations;
    const fert  = data.fertilizer_plan;
    const top   = recs[0];

    // Show primary crop
    document.getElementById('primary-crop-name').textContent = top.crop;
    document.getElementById('primary-confidence').textContent = top.confidence + '%';
    document.getElementById('confidence-fill').style.width = top.confidence + '%';

    // Show alternative crops
    const altList = document.getElementById('alt-crops-list');
    altList.innerHTML = '';
    recs.slice(1).forEach(r => {
        const chip = document.createElement('div');
        chip.className = 'alt-chip';
        chip.textContent = `${r.crop} (${r.confidence}%)`;
        altList.appendChild(chip);
    });

    // Show fertilizer plan
    const fertGrid = document.getElementById('fert-grid');
    fertGrid.innerHTML = `
        <div class="fert-item">
            <div class="fert-name">Urea (46% N)</div>
            <div class="fert-value">${fert.urea_kg}</div>
            <div class="fert-unit">kg / acre</div>
        </div>
        <div class="fert-item">
            <div class="fert-name">DAP (18:46:0)</div>
            <div class="fert-value">${fert.dap_kg}</div>
            <div class="fert-unit">kg / acre</div>
        </div>
        <div class="fert-item">
            <div class="fert-name">MOP (60% K)</div>
            <div class="fert-value">${fert.mop_kg}</div>
            <div class="fert-unit">kg / acre</div>
        </div>
    `;
    document.getElementById('fert-remarks').textContent = fert.remarks || '';

    // Show the result area
    document.getElementById('result-area').classList.remove('hidden');
}

// ============================================================
// HISTORY DRAWER: Load and show past consultations
// ============================================================
let historyOpen = false;

async function toggleHistory() {
    const drawer = document.getElementById('history-drawer');
    historyOpen = !historyOpen;

    if (historyOpen) {
        drawer.classList.remove('hidden');
        loadHistory();
    } else {
        drawer.classList.add('hidden');
    }
}

async function loadHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '<p class="loading-text">Loading...</p>';

    try {
        const response = await fetch('/api/history');
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            list.innerHTML = '';
            data.data.forEach(record => {
                const date = new Date(record.created_at).toLocaleDateString('en-IN');
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-crop">${record.primary_crop} (${record.confidence}%)</div>
                    <div class="history-meta">
                        ${record.farmer_name} | ${record.tehsil} | ${date}
                    </div>
                `;
                list.appendChild(item);
            });
        } else {
            list.innerHTML = '<p class="loading-text">No history yet.</p>';
        }
    } catch (e) {
        list.innerHTML = '<p class="loading-text">Could not load history.</p>';
    }
}

// ============================================================
// LANGUAGE TOGGLE: Switch between English and Hindi
// ============================================================
function toggleLanguage() {
    currentLang = (currentLang === 'en') ? 'hi' : 'en';
    localStorage.setItem('agrosense_lang', currentLang);
    applyLanguage();
    document.getElementById('lang-toggle').textContent = (currentLang === 'en') ? 'हिंदी' : 'English';
}

function applyLanguage() {
    const dict = TRANSLATIONS[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });
}

// ============================================================
// DARK/LIGHT MODE TOGGLE
// ============================================================
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = (current === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('agrosense_theme', next);
    document.getElementById('theme-toggle').textContent = (next === 'dark') ? '☀️ Light' : '🌙 Dark';
}

// ============================================================
// ON PAGE LOAD: Apply saved language
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    document.getElementById('lang-toggle').textContent = (currentLang === 'en') ? 'हिंदी' : 'English';
    const savedTheme = localStorage.getItem('agrosense_theme') || 'dark';
    document.getElementById('theme-toggle').textContent = (savedTheme === 'dark') ? '☀️ Light' : '🌙 Dark';
});
