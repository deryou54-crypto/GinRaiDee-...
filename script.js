// State
let selectedSymptoms = new Set();
let selectedDiseases = new Set();
let activeMeal = 'morning';

// BMI State
let userBmi = 22.0;
let bmiCategory = 'normal';
let isBmiFilterActive = false;

// Date
const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const now = new Date();
document.getElementById('today-date').textContent = `วัน${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()+543}`;

// Foods database (fallback loaded locally, updated dynamically from API if online)
let foods = {};

// Fetch food data from the API
async function loadFoods() {
  try {
    const res = await fetch('/api/foods');
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    foods = await res.json();
  } catch (err) {
    console.warn('Failed to load foods from API, using fallback database:', err);
  }
  renderFoods(activeMeal);
}

loadFoods();
// Init slider after DOM is ready
window.addEventListener('load', () => {
  initTabSlider();
  initBmiCalculator();
  checkLoginState();
  initCalorieTracker();
  
  // Close modal when clicking outside of it
  const modalEl = document.getElementById('login-modal');
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        closeLoginModal();
      }
    });
  }
});


function toggleSymptom(btn) {
  const s = btn.dataset.sym;
  if (btn.classList.contains('active')) {
    btn.classList.remove('active');
    selectedSymptoms.delete(s);
  } else {
    btn.classList.add('active');
    selectedSymptoms.add(s);
  }
}

function clearSymptoms() {
  selectedSymptoms.clear();
  document.querySelectorAll('.symptom-btn').forEach(btn => btn.classList.remove('active'));
}

function clearDiseases() {
  selectedDiseases.clear();
  syncDiseaseTags();
}

function toggleDisease(d) {
  if (d === 'ไม่มีโรค') {
    if (selectedDiseases.has('ไม่มีโรค')) {
      selectedDiseases.delete('ไม่มีโรค');
    } else {
      selectedDiseases.clear();
      selectedDiseases.add('ไม่มีโรค');
    }
  } else {
    selectedDiseases.delete('ไม่มีโรค');
    if (selectedDiseases.has(d)) {
      selectedDiseases.delete(d);
    } else {
      selectedDiseases.add(d);
    }
  }
  syncDiseaseTags();
}

function toggleDiseaseTag(el) {
  const d = el.dataset.d;
  toggleDisease(d);
}

function selectDiseaseFromDropdown(val) {
  if (!val) return;
  toggleDisease(val);
  // Reset dropdown to placeholder
  document.getElementById('disease-select').value = '';
}

function syncDiseaseTags() {
  document.querySelectorAll('.d-tag').forEach(t => {
    t.classList.toggle('active', selectedDiseases.has(t.dataset.d));
  });
}

function doSearch() {
  const panel = document.getElementById('result-panel');
  const inner = document.getElementById('result-inner');

  if (selectedDiseases.size === 0 && selectedSymptoms.size === 0) {
    inner.innerHTML = `<div class="search-warning">⚠️ กรุณาเลือกอาการ หรือโรคประจำตัวก่อนค้นหา</div>`;
    panel.style.display = 'block';
    return;
  }

  let msg = '<div class="advice-header">📋 คำแนะนำสำหรับคุณ</div><ul class="advice-list">';

  const adviceMap = {
    'เบาหวาน': '🩸 เบาหวาน — หลีกเลี่ยงอาหาร GI สูง เน้นผักใยสูง โปรตีนลีน และคาร์บซับซ้อน',
    'ความดันโลหิตสูง': '❤️ ความดันสูง — ลดโซเดียม หลีกเลี่ยงอาหารเค็ม เน้นโพแทสเซียม เช่น กล้วย ผักใบเขียว',
    'ไขมันสูง': '🫀 ไขมันในเลือดสูง — เน้นโอเมก้า-3 ไขมันดี หลีกเลี่ยงอาหารทอด มันสัตว์',
    'โรคไต': '🫘 โรคไต — จำกัดโปรตีน โพแทสเซียม ฟอสฟอรัส เลือกอาหารที่ไตไม่ต้องทำงานหนัก',
    'โรคหัวใจ': '🫶 โรคหัวใจ — เน้นไขมันดี ลดคอเลสเตอรอล เลี่ยงของทอด เกลือ น้ำตาล',
    'ภูมิแพ้กลูเตน': '🌾 ภูมิแพ้กลูเตน — หลีกเลี่ยงข้าวสาลี ข้าวบาร์เลย์ ข้าวไรย์ เลือกข้าวกล้อง ข้าวโพด มันเทศ',
    'แพ้นม': '🥛 แพ้นม/แลคโตส — หลีกเลี่ยงผลิตภัณฑ์นม เลือกนมพืช เต้าหู้ หรืออาหารเสริมแคลเซียม',
    'ไม่มีโรค': '🌿 สุขภาพดี — กินอาหารหลากหลายครบ 5 หมู่ เน้นผักผลไม้สด ธัญพืชไม่ขัดสี',
  };

  const symptomAdvice = {
    'ปวดหัว': '🤕 ปวดหัว — ดื่มน้ำให้เพียงพอ กินแมกนีเซียม (ผักใบเขียว ถั่ว) หลีกเลี่ยงคาเฟอีน',
    'ลำไส้แปรปรวน': '🤢 ลำไส้แปรปรวน — กินอาหารอ่อน ๆ โยเกิร์ต โปรไบโอติก หลีกเลี่ยงของมัน เผ็ด',
    'ปวดท้อง': '😣 ปวดท้อง — กินข้าวต้ม โจ๊ก ซุป อ่อน ๆ ย่อยง่าย หลีกเลี่ยงของทอด ของแข็ง',
    'กินได้น้อย': '😔 กินได้น้อย — กินมื้อเล็ก ๆ บ่อยครั้ง เน้นอาหารที่มีโภชนาการสูงต่อมื้อ',
    'อ่อนเพลีย': '😴 อ่อนเพลีย — เพิ่มธาตุเหล็ก วิตามินบี โปรตีน และคาร์โบไฮเดรตที่ดีเพื่อพลังงาน',
    'มีอื่น ๆ': '❓ อาการอื่น ๆ — ควรปรึกษาแพทย์หรือนักโภชนาการเพื่อการดูแลที่ตรงจุด',
  };

  selectedDiseases.forEach(d => {
    if (adviceMap[d]) {
      msg += `<li class="advice-item disease-advice">${adviceMap[d]}</li>`;
    }
  });
  selectedSymptoms.forEach(s => {
    if (symptomAdvice[s]) {
      msg += `<li class="advice-item symptom-advice">${symptomAdvice[s]}</li>`;
    }
  });

  msg += '</ul>';
  inner.innerHTML = msg;
  panel.style.display = 'block';
  renderFoods(activeMeal);
  document.getElementById('daily').scrollIntoView({ behavior: 'smooth' });
}

function moveTabSlider(btn) {
  const slider = document.getElementById('tab-slider');
  const tabs = document.getElementById('meal-tabs');
  if (!slider || !tabs) return;
  const tabsRect = tabs.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  slider.style.width = btnRect.width + 'px';
  slider.style.left = (btnRect.left - tabsRect.left) + 'px';
  slider.style.height = btnRect.height + 'px';
  slider.style.top = (btnRect.top - tabsRect.top) + 'px';
}

function initTabSlider() {
  const activeTab = document.querySelector('.meal-tab.active');
  if (activeTab) {
    const slider = document.getElementById('tab-slider');
    if (slider) slider.style.transition = 'none';
    moveTabSlider(activeTab);
    requestAnimationFrame(() => {
      if (slider) slider.style.transition = '';
    });
  }
}

function switchMeal(meal, btn) {
  activeMeal = meal;
  document.querySelectorAll('.meal-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  moveTabSlider(btn);
  renderFoods(meal);
}


const tagColors = { 'GI ต่ำ':'green','โปรตีนสูง':'blue','ไขมันต่ำ':'green','ย่อยง่าย':'green','โซเดียมต่ำ':'blue','วิตามินสูง':'green','ใยอาหารสูง':'green','โอเมก้า-3':'blue','คาร์บต่ำ':'orange','เบตาแคโรทีน':'orange','โปรตีนพืช':'green','โปรไบโอติก':'blue','พลังงานเร็ว':'orange','ไขมันดี':'green','สุขภาพหัวใจ':'red','คาร์บสูง':'orange' };

function renderFoods(meal) {
  const cards = document.querySelectorAll('.food-card');
  const list = foods[meal] || [];

  cards.forEach(card => {
    const cardMeal = card.dataset.meal;
    
    // 1. Check Meal
    if (cardMeal !== meal) {
      card.style.display = 'none';
      return;
    }
    card.style.display = 'block';

    const f = list.find(x => x.name === card.dataset.name);
    if (!f) return;

    const avoidList = Array.isArray(f.avoid) ? f.avoid : (typeof f.avoid === 'string' ? [f.avoid] : []);
    const goodList = Array.isArray(f.good) ? f.good : (typeof f.good === 'string' ? [f.good] : []);
    const tagsList = Array.isArray(f.tags) ? f.tags : (typeof f.tags === 'string' ? [f.tags] : []);

    const diseaseAvoided = [...selectedDiseases].some(d => avoidList.includes(d));
    const symptomRecommended = [...selectedSymptoms].some(s => goodList.includes(s));

    let bmiAvoided = false;
    let bmiRecommended = false;

    if (isBmiFilterActive) {
      if (userBmi < 18.5) {
        // Underweight: recommend protein/carb rich, avoid none
        bmiRecommended = tagsList.includes("โปรตีนสูง") || tagsList.includes("คาร์บสูง") || f.p >= 15;
      } else if (userBmi >= 18.5 && userBmi <= 22.9) {
        // Normal: recommend vitamins, fiber, protein
        bmiRecommended = tagsList.includes("วิตามินสูง") || tagsList.includes("ใยอาหารสูง") || tagsList.includes("โปรตีนสูง");
      } else if (userBmi >= 23.0 && userBmi <= 24.9) {
        // Overweight: recommend low-fat, low-sugar, fiber, low GI, avoid high sugar/fat
        bmiRecommended = tagsList.includes("ไขมันต่ำ") || tagsList.includes("GI ต่ำ") || tagsList.includes("ใยอาหารสูง") || tagsList.includes("โซเดียมต่ำ");
        bmiAvoided = avoidList.includes("เบาหวาน") || avoidList.includes("ไขมันสูง") || f.sugar > 15 || f.f > 12;
      } else {
        // Obese 1 & 2: recommend low-fat, low GI, low carb, avoid high sugar/fat/calories
        bmiRecommended = tagsList.includes("ไขมันต่ำ") || tagsList.includes("GI ต่ำ") || tagsList.includes("ใยอาหารสูง") || tagsList.includes("คาร์บต่ำ");
        bmiAvoided = avoidList.includes("เบาหวาน") || avoidList.includes("ไขมันสูง") || avoidList.includes("โรคหัวใจ") || f.sugar > 10 || f.f > 8;
      }
    }

    const finalAvoided = diseaseAvoided || bmiAvoided;
    const finalRecommended = (symptomRecommended || bmiRecommended) && !finalAvoided;

    card.style.boxShadow = finalRecommended ? '0 0 0 3px var(--green),0 8px 24px rgba(58,170,110,0.2)' : '';
    
    if (finalAvoided) {
      card.style.opacity = '0.4';
      card.style.filter = 'grayscale(0.6)';
    } else {
      card.style.opacity = '';
      card.style.filter = '';
    }

    const dTagDisease = card.querySelector('.dynamic-tag-disease');
    if (dTagDisease) dTagDisease.style.display = diseaseAvoided ? 'inline-block' : 'none';

    const dTagBmi = card.querySelector('.dynamic-tag-bmi');
    if (dTagBmi) dTagBmi.style.display = bmiAvoided ? 'inline-block' : 'none';

    const dTagSymp = card.querySelector('.dynamic-tag-symptom');
    if (dTagSymp) dTagSymp.style.display = (symptomRecommended && !finalAvoided) ? 'inline-block' : 'none';

    const dTagBmic = card.querySelector('.dynamic-tag-bmic');
    if (dTagBmic) dTagBmic.style.display = (bmiRecommended && !finalAvoided) ? 'inline-block' : 'none';

    // Update selected state (Calorie Tracker)
    if (typeof selectedFoods !== 'undefined') {
      const isSelected = selectedFoods.some(sf => sf.name === f.name);
      if (isSelected) {
        card.classList.add('selected');
        const badge = card.querySelector('.selected-badge');
        if (badge) badge.style.display = 'block';
      } else {
        card.classList.remove('selected');
        const badge = card.querySelector('.selected-badge');
        if (badge) badge.style.display = 'none';
      }
    }
  });
}

// Scroll observer
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

// Dark Mode Toggle Logic
const themeToggle = document.getElementById('theme-toggle');

// Default to light mode unless explicitly saved as dark in localStorage
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.checked = true;
} else {
  document.body.classList.remove('dark-mode');
  themeToggle.checked = false;
}

themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
  }
});

// ── BMI CALCULATOR LOGIC ──

const bmiAdvices = {
  underweight: {
    label: "น้ำหนักน้อย / ผอม (Underweight)",
    class: "blue",
    text: "ควรเน้นอาหารที่ให้พลังงานและโปรตีนสูงเพื่อสร้างมวลกล้ามเนื้อ เช่น ข้าวต้มไก่ ไข่ต้ม ข้าวกล้อง เต้าหู้ และถั่วต่าง ๆ หลีกเลี่ยงการอดอาหาร"
  },
  normal: {
    label: "น้ำหนักปกติ / สุขภาพดี (Normal)",
    class: "green",
    text: "คุณมีน้ำหนักตัวที่เหมาะสม! ควรรับประทานอาหารที่หลากหลายและครบ 5 หมู่เพื่อรักษาสุขภาพที่ดีอย่างยั่งยืน และออกกำลังกายสม่ำเสมอ"
  },
  overweight: {
    label: "น้ำหนักเกิน / เริ่มอ้วน (Overweight)",
    class: "yellow",
    text: "เริ่มมีความเสี่ยงต่อปัญหาสุขภาพ ควรจำกัดอาหารหวานจัด เค็มจัด และของทอด เน้นผักใบเขียว ใยอาหารสูง และโปรตีนไขมันต่ำ"
  },
  obese1: {
    label: "อ้วนระดับ 1 (Obese Class 1)",
    class: "orange",
    text: "ควรปรับเปลี่ยนพฤติกรรมการรับประทานอาหาร ควบคุมปริมาณคาร์โบไฮเดรตและไขมันอย่างจริงจัง หลีกเลี่ยงอาหารแปรรูป และเน้นผักผลไม้ใยอาหารสูง"
  },
  obese2: {
    label: "อ้วนระดับ 2 / อ้วนมาก (Obese Class 2)",
    class: "red",
    text: "มีความเสี่ยงสูงต่อโรคแทรกซ้อน (เบาหวาน ความดัน ไขมัน) ควรจำกัดแคลอรี่อย่างเข้มงวด ลดการบริโภคแป้งและน้ำตาล และควรปรึกษาแพทย์หรือนักโภชนาการ"
  }
};

let heightInput, heightRange, weightInput, weightRange, ageInput, ageRange;
let bmiValueEl, bmiCategoryBadge, bmiGaugePointer, bmiAdviceText, bmiAdviceCard, bmiFilterBtn;
let bmrValueEl, tdeeValueEl;
let selectedGenderVal = 'male';

function initBmiCalculator() {
  heightInput = document.getElementById('height-input');
  heightRange = document.getElementById('height-range');
  weightInput = document.getElementById('weight-input');
  weightRange = document.getElementById('weight-range');
  ageInput = document.getElementById('age-input');
  ageRange = document.getElementById('age-range');
  
  bmiValueEl = document.getElementById('bmi-value');
  bmiCategoryBadge = document.getElementById('bmi-category-badge');
  bmiGaugePointer = document.getElementById('bmi-gauge-pointer');
  bmiAdviceText = document.getElementById('bmi-advice-text');
  bmiAdviceCard = document.querySelector('.bmi-advice-card');
  bmiFilterBtn = document.getElementById('bmi-filter-btn');

  bmrValueEl = document.getElementById('bmr-value');
  tdeeValueEl = document.getElementById('tdee-value');

  if (!heightInput || !heightRange || !weightInput || !weightRange) return;

  // Sync inputs
  heightInput.addEventListener('input', () => {
    let val = parseFloat(heightInput.value);
    if (val >= 100 && val <= 220) {
      heightRange.value = val;
      calculateBmi();
    }
  });
  
  heightRange.addEventListener('input', () => {
    heightInput.value = heightRange.value;
    calculateBmi();
  });
  
  weightInput.addEventListener('input', () => {
    let val = parseFloat(weightInput.value);
    if (val >= 30 && val <= 150) {
      weightRange.value = val;
      calculateBmi();
    }
  });
  
  weightRange.addEventListener('input', () => {
    weightInput.value = weightRange.value;
    calculateBmi();
  });

  if (ageInput && ageRange) {
    ageInput.addEventListener('input', () => {
      let val = parseInt(ageInput.value, 10);
      if (val >= 1 && val <= 120) {
        ageRange.value = val;
        calculateBmi();
      }
    });
    
    ageRange.addEventListener('input', () => {
      ageInput.value = ageRange.value;
      calculateBmi();
    });
  }

  // Calculate initially
  calculateBmi();
}

function selectGender(gender) {
  selectedGenderVal = gender;
  const mLabel = document.getElementById('gender-male-label');
  const fLabel = document.getElementById('gender-female-label');
  if (mLabel) mLabel.classList.toggle('active', gender === 'male');
  if (fLabel) fLabel.classList.toggle('active', gender === 'female');
  calculateBmi();
}

function calculateBmrTdee() {
  calculateBmi();
}

function calculateBmi() {
  const height = parseFloat(heightInput.value);
  const weight = parseFloat(weightInput.value);
  const age = ageInput ? parseInt(ageInput.value, 10) : 30;
  const activitySelect = document.getElementById('activity-select');
  const activityMultiplier = activitySelect ? parseFloat(activitySelect.value) : 1.55;
  
  if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) return;
  
  const heightMeters = height / 100;
  userBmi = weight / (heightMeters * heightMeters);
  
  // Format to 1 decimal place
  const bmiFormatted = userBmi.toFixed(1);
  if (bmiValueEl) bmiValueEl.textContent = bmiFormatted;
  
  // Categorize
  let category = 'normal';
  if (userBmi < 18.5) {
    category = 'underweight';
  } else if (userBmi < 23.0) {
    category = 'normal';
  } else if (userBmi < 25.0) {
    category = 'overweight';
  } else if (userBmi < 30.0) {
    category = 'obese1';
  } else {
    category = 'obese2';
  }
  
  bmiCategory = category;
  const advice = bmiAdvices[category];
  
  // Update Badge
  if (bmiCategoryBadge) {
    bmiCategoryBadge.textContent = advice.label;
    bmiCategoryBadge.className = `bmi-badge ${advice.class}`;
  }
  
  // Update Advice
  if (bmiAdviceText) bmiAdviceText.textContent = advice.text;
  if (bmiAdviceCard) bmiAdviceCard.className = `bmi-advice-card ${advice.class}`;

  // Update calorie goal recommended by BMI
  let recommendedGoal = 2000;
  if (category === 'underweight') {
    recommendedGoal = 2200;
  } else if (category === 'normal') {
    recommendedGoal = 2000;
  } else if (category === 'overweight') {
    recommendedGoal = 1800;
  } else {
    recommendedGoal = 1500;
  }
  
  // ── BMR & TDEE Calculations (Mifflin-St Jeor) ──
  let bmr = 0;
  if (selectedGenderVal === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  const tdee = Math.round(bmr * activityMultiplier);
  const bmrRound = Math.round(bmr);
  
  if (bmrValueEl) bmrValueEl.textContent = bmrRound.toLocaleString();
  if (tdeeValueEl) tdeeValueEl.textContent = tdee.toLocaleString();
  
  // Update Gauge Pointer
  // Map BMI range [15, 35] to left percentage [0%, 100%]
  if (bmiGaugePointer) {
    let percent = ((userBmi - 15) / (35 - 15)) * 100;
    percent = Math.max(0, Math.min(100, percent));
    bmiGaugePointer.style.left = `${percent}%`;
  }
  
  // If BMI filter is active, re-render foods to reflect the changes
  if (isBmiFilterActive) {
    renderFoods(activeMeal);
  }
}

function applyTdeeGoal() {
  const tdeeText = document.getElementById('tdee-value').textContent.replace(/,/g, '');
  const tdee = parseInt(tdeeText, 10);
  if (!isNaN(tdee)) {
    const goalInput = document.getElementById('calorie-goal-input');
    if (goalInput) {
      goalInput.value = tdee;
      updateCalorieSummary();
      const calSec = document.getElementById('calorie-section');
      if (calSec) calSec.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

function toggleBmiFilter() {
  isBmiFilterActive = !isBmiFilterActive;
  
  if (isBmiFilterActive) {
    bmiFilterBtn.classList.add('active');
    bmiFilterBtn.innerHTML = `🥗 กรองเมนูแนะนำตามค่า BMI (เปิดอยู่)`;
  } else {
    bmiFilterBtn.classList.remove('active');
    bmiFilterBtn.innerHTML = `🥗 กรองเมนูแนะนำตามค่า BMI`;
  }
  
  renderFoods(activeMeal);
}

// ── USER AUTHENTICATION LOGIC ──

let currentUser = null;

function checkLoginState() {
  const firstname = localStorage.getItem('user_firstname');
  const lastname = localStorage.getItem('user_lastname');
  
  const loginBtn = document.getElementById('login-btn');
  const userProfile = document.getElementById('user-profile');
  const userDisplayName = document.getElementById('user-display-name');
  const heroUsername = document.getElementById('hero-username');
  
  if (firstname && lastname) {
    currentUser = { firstname, lastname };
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfile) userProfile.style.display = 'flex';
    if (userDisplayName) userDisplayName.textContent = `คุณ ${firstname}`;
    if (heroUsername) heroUsername.textContent = `, คุณ ${firstname}`;
  } else {
    currentUser = null;
    if (loginBtn) loginBtn.style.display = 'block';
    if (userProfile) userProfile.style.display = 'none';
    if (heroUsername) heroUsername.textContent = '';
  }
}

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('active');
    const firstInput = document.getElementById('firstname-input');
    if (firstInput) firstInput.focus();
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('active');
}

function handleLogin(event) {
  event.preventDefault();
  const firstname = document.getElementById('firstname-input').value.trim();
  const lastname = document.getElementById('lastname-input').value.trim();
  
  if (firstname && lastname) {
    localStorage.setItem('user_firstname', firstname);
    localStorage.setItem('user_lastname', lastname);
    checkLoginState();
    closeLoginModal();
    
    // Reset form
    const form = document.getElementById('login-form');
    if (form) form.reset();
  }
}

function logout() {
  localStorage.removeItem('user_firstname');
  localStorage.removeItem('user_lastname');
  checkLoginState();
}

// ── DAILY CALORIE CALCULATOR LOGIC ──

let selectedFoods = [];

function parseKcal(kcalStr) {
  if (!kcalStr) return 0;
  const numbers = kcalStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) return 0;
  if (numbers.length === 1) {
    return parseInt(numbers[0], 10);
  }
  if (numbers.length >= 2) {
    const val1 = parseInt(numbers[0], 10);
    const val2 = parseInt(numbers[1], 10);
    return Math.round((val1 + val2) / 2);
  }
  return 0;
}

function initCalorieTracker() {
  const savedFoods = localStorage.getItem('selected_foods');
  const savedGoal = localStorage.getItem('calorie_goal');
  
  if (savedFoods) {
    try {
      selectedFoods = JSON.parse(savedFoods);
    } catch(e) {
      selectedFoods = [];
    }
  }
  
  const goalInput = document.getElementById('calorie-goal-input');
  if (goalInput) {
    if (savedGoal) {
      goalInput.value = savedGoal;
    } else {
      goalInput.value = 2000;
    }
  }
  
  renderFoods(activeMeal);
  updateCalorieSummary();
}

function toggleFoodSelection(name, meal) {
  const mealFoods = foods[meal] || [];
  const foodObj = mealFoods.find(f => f.name === name);
  if (!foodObj) return;

  const index = selectedFoods.findIndex(sf => sf.name === name);
  if (index > -1) {
    selectedFoods.splice(index, 1);
  } else {
    const kcalVal = parseKcal(foodObj.kcal);
    selectedFoods.push({
      name: foodObj.name,
      emoji: foodObj.emoji,
      kcalStr: foodObj.kcal,
      kcalVal: kcalVal
    });
  }

  renderFoods(activeMeal);
  updateCalorieSummary();
}

function updateCalorieSummary() {
  const goalInput = document.getElementById('calorie-goal-input');
  if (!goalInput) return;
  
  const goal = parseInt(goalInput.value, 10) || 2000;
  
  let totalKcal = 0;
  let totalCarbs = 0;
  let totalProtein = 0;
  let totalFats = 0;
  let totalSugar = 0;

  selectedFoods.forEach(sf => {
    let found = null;
    for (let meal in foods) {
      const fObj = foods[meal].find(f => f.name === sf.name);
      if (fObj) {
        found = fObj;
        break;
      }
    }
    
    if (found) {
      totalKcal += sf.kcalVal;
      totalCarbs += found.c || 0;
      totalProtein += found.p || 0;
      totalFats += found.f || 0;
      totalSugar += found.sugar || 0;
    } else {
      totalKcal += sf.kcalVal;
    }
  });
  
  const totalTextEl = document.getElementById('calorie-total-text');
  if (totalTextEl) {
    totalTextEl.textContent = `${totalKcal} / ${goal} kcal`;
  }
  
  const progressBar = document.getElementById('calorie-progress-bar-fill');
  if (progressBar) {
    let percent = (totalKcal / goal) * 100;
    percent = Math.min(100, Math.max(0, percent));
    progressBar.style.width = `${percent}%`;
    
    if (totalKcal > goal) {
      progressBar.style.backgroundColor = 'var(--red)';
    } else if (totalKcal >= goal * 0.8) {
      progressBar.style.backgroundColor = 'var(--orange)';
    } else {
      progressBar.style.backgroundColor = 'var(--green)';
    }
  }
  
  const statusBox = document.getElementById('calorie-status-box');
  const statusText = document.getElementById('calorie-status-text');
  
  if (statusBox && statusText) {
    if (selectedFoods.length === 0) {
      statusBox.className = "calorie-status-box info";
      statusText.innerHTML = "คลิกเลือกเมนูอาหารด้านล่างเพื่อเพิ่มเข้าไปในรายการวันนี้";
    } else if (totalKcal < goal) {
      const diff = goal - totalKcal;
      statusBox.className = "calorie-status-box under";
      statusText.innerHTML = `🥗 ตอนนี้ทานไปแล้ว <strong>${totalKcal} kcal</strong> ยังขาดอีก <strong>${diff} kcal</strong> จะครบเป้าหมายประจำวัน`;
    } else if (totalKcal === goal) {
      statusBox.className = "calorie-status-box perfect";
      statusText.innerHTML = `🎉 ยอดเยี่ยมมาก! คุณทานได้ตรงเป้าหมาย <strong>${totalKcal} kcal</strong> พอดีเป๊ะ!`;
    } else {
      const diff = totalKcal - goal;
      statusBox.className = "calorie-status-box over";
      statusText.innerHTML = `⚠ ระวัง! คุณทานไป <strong>${totalKcal} kcal</strong> ซึ่งเกินเป้าหมายไปแล้ว <strong>${diff} kcal</strong>`;
    }
  }
  
  const listEl = document.getElementById('selected-food-list');
  const countEl = document.getElementById('selected-count');
  const clearBtn = document.getElementById('clear-selected-btn');
  
  if (countEl) countEl.textContent = selectedFoods.length;
  
  if (listEl) {
    if (selectedFoods.length === 0) {
      listEl.innerHTML = '<div class="empty-list-msg">ยังไม่มีเมนูที่เลือก</div>';
      if (clearBtn) clearBtn.style.display = 'none';
    } else {
      if (clearBtn) clearBtn.style.display = 'block';
      listEl.innerHTML = selectedFoods.map((sf, idx) => `
        <div class="selected-food-item">
          <span class="sf-emoji">${sf.emoji}</span>
          <div class="sf-info">
            <div class="sf-name">${sf.name}</div>
            <div class="sf-kcal">${sf.kcalStr} (~${sf.kcalVal} kcal)</div>
          </div>
          <button class="sf-remove-btn" onclick="removeSelectedFood(event, ${idx})">✕</button>
        </div>
      `).join('');
    }
  }

  // ── UPDATE MACROS AND GRAPHS ──
  const targetCarbs = Math.round((goal * 0.45) / 4);
  const targetProtein = Math.round((goal * 0.25) / 4);
  const targetFats = Math.round((goal * 0.30) / 9);
  const targetSugar = Math.min(50, Math.round((goal * 0.10) / 4));

  const valCarbsEl = document.getElementById('macro-val-carbs');
  const valProteinEl = document.getElementById('macro-val-protein');
  const valFatsEl = document.getElementById('macro-val-fats');
  const valSugarEl = document.getElementById('macro-val-sugar');

  if (valCarbsEl) valCarbsEl.textContent = `${totalCarbs}g / ${targetCarbs}g`;
  if (valProteinEl) valProteinEl.textContent = `${totalProtein}g / ${targetProtein}g`;
  if (valFatsEl) valFatsEl.textContent = `${totalFats}g / ${targetFats}g`;
  if (valSugarEl) valSugarEl.textContent = `${totalSugar}g / ${targetSugar}g`;

  const carbPct = Math.min(100, (totalCarbs / targetCarbs) * 100);
  const protPct = Math.min(100, (totalProtein / targetProtein) * 100);
  const fatPct = Math.min(100, (totalFats / targetFats) * 100);
  const sugarPct = Math.min(100, (totalSugar / targetSugar) * 100);

  const fillCarbs = document.getElementById('macro-bar-fill-carbs');
  const fillProtein = document.getElementById('macro-bar-fill-protein');
  const fillFats = document.getElementById('macro-bar-fill-fats');
  const fillSugar = document.getElementById('macro-bar-fill-sugar');

  if (fillCarbs) fillCarbs.style.width = `${carbPct}%`;
  if (fillProtein) fillProtein.style.width = `${protPct}%`;
  if (fillFats) fillFats.style.width = `${fatPct}%`;
  if (fillSugar) {
    fillSugar.style.width = `${sugarPct}%`;
    if (totalSugar > targetSugar) {
      fillSugar.style.backgroundColor = 'var(--red)';
    } else {
      fillSugar.style.backgroundColor = 'var(--orange)';
    }
  }

  const carbKcal = totalCarbs * 4;
  const protKcal = totalProtein * 4;
  const fatKcal = totalFats * 9;
  const totalMacroKcal = carbKcal + protKcal + fatKcal;

  let pctC = 0, pctP = 0, pctF = 0;
  if (totalMacroKcal > 0) {
    pctC = Math.round((carbKcal / totalMacroKcal) * 100);
    pctP = Math.round((protKcal / totalMacroKcal) * 100);
    pctF = 100 - pctC - pctP;
  }

  const labelCarbs = document.getElementById('pct-carbs');
  const labelProtein = document.getElementById('pct-protein');
  const labelFats = document.getElementById('pct-fats');
  const centerKcal = document.getElementById('donut-center-kcal');

  if (labelCarbs) labelCarbs.textContent = pctC;
  if (labelProtein) labelProtein.textContent = pctP;
  if (labelFats) labelFats.textContent = pctF;
  if (centerKcal) centerKcal.textContent = totalKcal;

  const segmentCarbs = document.getElementById('donut-segment-carbs');
  const segmentProtein = document.getElementById('donut-segment-protein');
  const segmentFats = document.getElementById('donut-segment-fats');

  const circumference = 2 * Math.PI * 55; // 345.57

  if (segmentCarbs && segmentProtein && segmentFats) {
    if (totalMacroKcal > 0) {
      const shareC = carbKcal / totalMacroKcal;
      const shareP = protKcal / totalMacroKcal;
      const shareF = fatKcal / totalMacroKcal;

      const strokeCarbs = shareC * circumference;
      const strokeProtein = shareP * circumference;
      const strokeFats = shareF * circumference;

      segmentCarbs.setAttribute('stroke-dasharray', `${strokeCarbs} ${circumference}`);
      segmentProtein.setAttribute('stroke-dasharray', `${strokeProtein} ${circumference}`);
      segmentFats.setAttribute('stroke-dasharray', `${strokeFats} ${circumference}`);

      segmentCarbs.setAttribute('stroke-dashoffset', '0');
      segmentProtein.setAttribute('stroke-dashoffset', `-${strokeCarbs}`);
      segmentFats.setAttribute('stroke-dashoffset', `-${strokeCarbs + strokeProtein}`);
    } else {
      segmentCarbs.setAttribute('stroke-dasharray', `0 ${circumference}`);
      segmentProtein.setAttribute('stroke-dasharray', `0 ${circumference}`);
      segmentFats.setAttribute('stroke-dasharray', `0 ${circumference}`);
    }
  }

  localStorage.setItem('selected_foods', JSON.stringify(selectedFoods));
  localStorage.setItem('calorie_goal', goal.toString());
}

function removeSelectedFood(event, index) {
  if (event) event.stopPropagation();
  selectedFoods.splice(index, 1);
  renderFoods(activeMeal);
  updateCalorieSummary();
}

function clearSelectedFoods() {
  selectedFoods = [];
  renderFoods(activeMeal);
  updateCalorieSummary();
}



