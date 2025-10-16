class EnglishWordsApp { constructor() { this.currentSection = 'about'; this.currentLevel = null; // A1..C2 this.currentCategory = null; // 'IRREGULARS' | 'PREPOSITIONS' | null

this.learningWords = [];
this.customWords = [];

this.audioPlayer = document.getElementById('audioPlayer');

this.studyMode = 'flashcards';     // 'flashcards' | 'quiz' | 'list'
this.practiceMode = 'scheduled';   // 'scheduled' | 'endless'

this.currentReviewIndex = 0;
this.currentReviewWords = [];
this.sessionQueue = [];

this.dbAvailable = false;

try {
  this.init();
} catch (err) {
  console.error('App init error:', err);
  alert('Ошибка инициализации. Проверьте консоль браузера.');
}
}

init() { this.detectDatabase(); this.loadData(); this.migrateExistingWords(); this.setupEventListeners(); this.updateUI(); this.setupTheme();

if (!this.dbAvailable) {
  console.warn('oxford_words_data.js не найден или пуст.');
  this.showNotification('Не найден oxford_words_data.js — проверьте файл и путь', 'warning');
}

if (this.currentSection === 'learning') this.renderLearningWords();
}

detectDatabase() { try { this.dbAvailable = (typeof oxfordWordsDatabase !== 'undefined') && oxfordWordsDatabase && Object.keys(oxfordWordsDatabase).length > 0; } catch { this.dbAvailable = false; } }

/* THEME */ setupTheme() { const savedTheme = localStorage.getItem('theme') || 'light'; document.documentElement.setAttribute('data-theme', savedTheme); this.updateThemeIcon(savedTheme); } toggleTheme() { const currentTheme = document.documentElement.getAttribute('data-theme'); const newTheme = currentTheme === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', newTheme); localStorage.setItem('theme', newTheme); this.updateThemeIcon(newTheme); } updateThemeIcon(theme) { const themeIcon = document.querySelector('#themeToggle i'); if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'; }

/* STORAGE */ loadData() { try { const savedLearning = localStorage.getItem('learningWords'); const savedCustom = localStorage.getItem('customWords'); if (savedLearning) this.learningWords = JSON.parse(savedLearning); if (savedCustom) this.customWords = JSON.parse(savedCustom); } catch (e) { console.error('Load error', e); } } saveData() { try { localStorage.setItem('learningWords', JSON.stringify(this.learningWords)); localStorage.setItem('customWords', JSON.stringify(this.customWords)); this.saveStatistics(); } catch (e) { console.error('Save error', e); this.showNotification('Ошибка сохранения данных', 'error'); } } saveStatistics() { const stats = { totalWordsLearned: this.learningWords.filter(w => w.isLearned).length, totalWordsLearning: this.learningWords.length, customWordsAdded: this.customWords.length, lastActivity: new Date().toISOString(), dailyProgress: this.getDailyProgress() }; localStorage.setItem('appStatistics', JSON.stringify(stats)); } getDailyProgress() { const today = new Date().toDateString(); const todayWords = this.learningWords.filter(w => w.dateLearned && new Date(w.dateLearned).toDateString() === today ); return todayWords.length; }

/* EVENTS */ setupEventListeners() { // Bottom nav (delegation) const bottomNav = document.getElementById('bottomNav'); if (bottomNav) { bottomNav.addEventListener('click', (e) => { const btn = e.target.closest('.nav-item'); if (!btn) return; const section = btn.dataset.section; if (!section) return; this.switchSection(section); }); }

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());

// Level cards
document.querySelectorAll('.level-card[data-level]').forEach(card => {
  card.addEventListener('click', (e) => {
    const level = e.currentTarget.dataset.level;
    this.showLevelWords(level);
  });
});
// Category cards
document.querySelectorAll('.level-card[data-category]').forEach(card => {
  card.addEventListener('click', (e) => {
    const category = e.currentTarget.dataset.category;
    this.showCategoryWords(category);
  });
});

// Back button in words list
const backBtn = document.getElementById('backToLevels');
if (backBtn) backBtn.addEventListener('click', () => this.hideLevelWords());

// Single add
const addWordBtn = document.getElementById('addWordBtn');
if (addWordBtn) addWordBtn.addEventListener('click', () => this.addCustomWord());
const newWordInput = document.getElementById('newWord');
if (newWordInput) newWordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const t = document.getElementById('newTranslation');
    if (t) t.focus();
  }
});
const newTranslationInput = document.getElementById('newTranslation');
if (newTranslationInput) newTranslationInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') this.addCustomWord();
});

// Bulk add
const bulkAddBtn = document.getElementById('bulkAddBtn');
if (bulkAddBtn) bulkAddBtn.addEventListener('click', () => this.addBulkWords());

// Modes
const modeFlashcards = document.getElementById('modeFlashcards');
if (modeFlashcards) modeFlashcards.addEventListener('click', () => {
  this.studyMode = 'flashcards'; this.updateModeButtons();
  if (this.currentSection === 'learning') this.renderLearningWords();
});
const modeQuiz = document.getElementById('modeQuiz');
if (modeQuiz) modeQuiz.addEventListener('click', () => {
  this.studyMode = 'quiz'; this.updateModeButtons();
  if (this.currentSection === 'learning') this.renderLearningWords();
});
const modeList = document.getElementById('modeList');
if (modeList) modeList.addEventListener('click', () => {
  this.studyMode = 'list'; this.updateModeButtons();
  if (this.currentSection === 'learning') this.renderLearningWords();
});

// Practice
const practiceScheduled = document.getElementById('practiceScheduled');
if (practiceScheduled) practiceScheduled.addEventListener('click', () => {
  this.practiceMode = 'scheduled'; this.updatePracticeButtons();
  if (this.currentSection === 'learning') this.renderLearningWords();
});
const practiceEndless = document.getElementById('practiceEndless');
if (practiceEndless) practiceEndless.addEventListener('click', () => {
  this.practiceMode = 'endless'; this.updatePracticeButtons();
  if (this.currentSection === 'learning') this.renderLearningWords();
});

// Bulk actions for level/category
const addAllBtn = document.getElementById('addAllLevelBtn');
if (addAllBtn) addAllBtn.addEventListener('click', () => {
  if (this.currentLevel) this.addAllFromLevel(this.currentLevel);
  else if (this.currentCategory) this.addAllFromCategory(this.currentCategory);
});
const removeAllBtn = document.getElementById('removeAllLevelBtn');
if (removeAllBtn) removeAllBtn.addEventListener('click', () => {
  if (this.currentLevel) this.removeAllFromLevel(this.currentLevel);
  else if (this.currentCategory) this.removeAllFromCategory(this.currentCategory);
});
}

updateModeButtons() { document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active')); const id = this.studyMode === 'flashcards' ? '#modeFlashcards' : this.studyMode === 'quiz' ? '#modeQuiz' : '#modeList'; const el = document.querySelector(id); if (el) el.classList.add('active'); } updatePracticeButtons() { document.querySelectorAll('.practice-btn').forEach(b => b.classList.remove('active')); const el = document.querySelector(this.practiceMode === 'scheduled' ? '#practiceScheduled' : '#practiceEndless'); if (el) el.classList.add('active'); }

/* NAV */ switchSection(sectionName) { document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active')); const navBtn = document.querySelector(.nav-item[data-section="${sectionName}"]); if (navBtn) navBtn.classList.add('active');

document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
const sec = document.getElementById(sectionName);
if (sec) sec.classList.add('active');

this.currentSection = sectionName;

if (sectionName === 'learning') this.renderLearningWords();
else if (sectionName === 'new-words') this.renderCustomWords();
else if (sectionName === 'progress') this.renderProgress();
}

/* LEVELS & CATEGORIES */ showLevelWords(level) { this.currentCategory = null; this.currentLevel = level; const wordsContainer = document.getElementById('wordsContainer'); const levelsGrid = document.getElementById('levelsGrid'); const categoriesGrid = document.getElementById('categoriesGrid'); const currentLevelTitle = document.getElementById('currentLevelTitle');

if (levelsGrid) levelsGrid.style.display = 'none';
if (categoriesGrid) categoriesGrid.style.display = 'none';
if (wordsContainer) wordsContainer.classList.remove('hidden');
if (currentLevelTitle) currentLevelTitle.textContent = `Слова уровня ${level}`;

this.renderLevelWords(level);
} showCategoryWords(category) { this.currentLevel = null; this.currentCategory = category; const wordsContainer = document.getElementById('wordsContainer'); const levelsGrid = document.getElementById('levelsGrid'); const categoriesGrid = document.getElementById('categoriesGrid'); const currentLevelTitle = document.getElementById('currentLevelTitle');

if (levelsGrid) levelsGrid.style.display = 'none';
if (categoriesGrid) categoriesGrid.style.display = 'none';
if (wordsContainer) wordsContainer.classList.remove('hidden');
if (currentLevelTitle) currentLevelTitle.textContent = category === 'IRREGULARS' ? 'Неправильные глаголы' : 'Предлоги';

this.renderCategoryWords(category);
} hideLevelWords() { const wordsContainer = document.getElementById('wordsContainer'); const levelsGrid = document.getElementById('levelsGrid'); const categoriesGrid = document.getElementById('categoriesGrid'); if (levelsGrid) levelsGrid.style.display = 'grid'; if (categoriesGrid) categoriesGrid.style.display = 'grid'; if (wordsContainer) wordsContainer.classList.add('hidden'); this.currentLevel = null; this.currentCategory = null; } safe(s) { return String(s).replace(/\/g, '\\').replace(/'/g, "\'"); }

renderLevelWords(level) { const wordsList = document.getElementById('wordsList'); if (!wordsList) return;

const db = this.dbAvailable ? (oxfordWordsDatabase[level] || []) : [];
const customs = this.customWords
  .filter(w => w.level === level)
  .map(w => ({ word: w.word, translation: w.translation, category: 'custom', pos: 'n.' }));
const words = [...db, ...customs];

if (words.length === 0) {
  wordsList.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-book"></i>
      <h3>Нет слов для этого уровня</h3>
      <p>Слова для уровня ${level} пока не добавлены</p>
    </div>`;
  return;
}
wordsList.innerHTML = words.map(wd => {
  const isLearning = this.learningWords.some(w => w.word === wd.word);
  const w = this.safe(wd.word);
  const t = this.safe(wd.translation);
  return `
    <div class="word-card">
      <div class="word-header">
        <span class="word-text">${wd.word}</span>
        <div class="word-actions">
          <button class="action-btn add-btn" onclick="app.addToLearning('${w}', '${t}', '${level}')" title="Добавить в изучение">
            <i class="fas fa-plus"></i>
          </button>
          ${isLearning ? `
          <button class="action-btn remove-btn" onclick="app.removeFromLearning('${w}')" title="Убрать из изучения">
            <i class="fas fa-minus"></i>
          </button>` : ''}
        </div>
      </div>
      <div class="word-translation">${wd.translation}</div>
      <div class="word-level">${level} • ${wd.category || ''}</div>
    </div>`;
}).join('');
}

renderCategoryWords(category) { const wordsList = document.getElementById('wordsList'); if (!wordsList) return;

let db = [];
if (this.dbAvailable) {
  if (category === 'IRREGULARS') db = (oxfordWordsDatabase.irregular_verbs || []);
  if (category === 'PREPOSITIONS') db = (oxfordWordsDatabase.prepositions || []);
}
const customs = this.customWords
  .filter(w => w.level === category)
  .map(w => ({ word: w.word, translation: w.translation, category: 'custom', pos: 'n.' }));
const words = [...db, ...customs];

if (words.length === 0) {
  wordsList.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-book"></i>
      <h3>Нет слов для этой категории</h3>
      <p>Слова для категории пока не добавлены</p>
    </div>`;
  return;
}
wordsList.innerHTML = words.map(wd => {
  const isLearning = this.learningWords.some(w => w.word === wd.word);
  const w = this.safe(wd.word);
  const t = this.safe(wd.translation);
  return `
    <div class="word-card">
      <div class="word-header">
        <span class="word-text">${wd.word}</span>
        <div class="word-actions">
          <button class="action-btn add-btn" onclick="app.addToLearning('${w}', '${t}', '${category}')" title="Добавить в изучение">
            <i class="fas fa-plus"></i>
          </button>
          ${isLearning ? `
          <button class="action-btn remove-btn" onclick="app.removeFromLearning('${w}')" title="Убрать из изучения">
            <i class="fas fa-minus"></i>
          </button>` : ''}
        </div>
      </div>
      <div class="word-translation">${wd.translation}</div>
      <div class="word-level">${category} • ${wd.category || ''}</div>
    </div>`;
}).join('');
}

addAllFromLevel(level) { const pool = this.getWordsByLevel(level); if (!pool.length) return this.showNotification(Нет слов уровня ${level} для добавления, 'warning'); let added = 0; pool.forEach(w => { if (!this.learningWords.find(x => x.word === w.word)) { this.learningWords.push(this.createLearningWord(w.word, w.translation, level)); added++; } }); if (added === 0) this.showNotification('Все слова этого уровня уже добавлены', 'info'); else { this.saveData(); this.updateUI(); this.showNotification(Добавлено ${added} слов из уровня ${level}, 'success'); } this.renderLevelWords(level); } removeAllFromLevel(level) { const inLevel = this.learningWords.filter(w => w.level === level).length; if (inLevel === 0) return this.showNotification('В изучении нет слов этого уровня', 'info'); const before = this.learningWords.length; this.learningWords = this.learningWords.filter(w => w.level !== level); const removed = before - this.learningWords.length; this.saveData(); this.updateUI(); this.showNotification(Удалено ${removed} слов уровня ${level}, 'info'); this.renderLevelWords(level); } addAllFromCategory(category) { const pool = this.getWordsByCategory(category); if (!pool.length) return this.showNotification('Нет слов категории', 'warning'); let added = 0; pool.forEach(w => { if (!this.learningWords.find(x => x.word === w.word)) { this.learningWords.push(this.createLearningWord(w.word, w.translation, category)); added++; } }); if (added === 0) this.showNotification('Все слова этой категории уже добавлены', 'info'); else { this.saveData(); this.updateUI(); this.showNotification(Добавлено ${added} слов из категории, 'success'); } this.renderCategoryWords(category); } removeAllFromCategory(category) { const inCat = this.learningWords.filter(w => w.level === category).length; if (inCat === 0) return this.showNotification('В изучении нет слов этой категории', 'info'); const before = this.learningWords.length; this.learningWords = this.learningWords.filter(w => w.level !== category); const removed = before - this.learningWords.length; this.saveData(); this.updateUI(); this.showNotification(Удалено ${removed} слов категории, 'info'); this.renderCategoryWords(category); } getWordsByLevel(level) { const db = this.dbAvailable ? (oxfordWordsDatabase[level] || []) : []; const customs = this.customWords.filter(w => w.level === level).map(w => ({ word: w.word, translation: w.translation })); return [...db, ...customs]; } getWordsByCategory(category) { let db = []; if (this.dbAvailable) { if (category === 'IRREGULARS') db = (oxfordWordsDatabase.irregular_verbs || []); if (category === 'PREPOSITIONS') db = (oxfordWordsDatabase.prepositions || []); } const customs = this.customWords.filter(w => w.level === category).map(w => ({ word: w.word, translation: w.translation })); return [...db, ...customs]; }

/* STUDY */ createLearningWord(word, translation, level) { return { id: Date.now().toString() + Math.random().toString(36).slice(2), word, translation, level, dateAdded: new Date().toISOString(), isLearned: false, repetitionData: this.defaultRepetitionData() }; } defaultRepetitionData() { return { easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: new Date().toISOString(), lastReview: null, correctAnswers: 0, totalAnswers: 0, difficulty: 0 }; } addToLearning(word, translation, level) { const exists = this.learningWords.find(w => w.word === word); if (exists) return this.showNotification('Слово уже добавлено в изучение', 'warning'); this.learningWords.push(this.createLearningWord(word, translation, level)); this.saveData(); this.updateUI(); this.showNotification('Слово добавлено в изучение', 'success'); if (this.currentLevel) this.renderLevelWords(this.currentLevel); if (this.currentCategory) this.renderCategoryWords(this.currentCategory); } removeFromLearning(word) { this.learningWords = this.learningWords.filter(w => w.word !== word); this.saveData(); this.updateUI(); this.showNotification('Слово убрано из изучения', 'info'); if (this.currentSection === 'learning') this.renderLearningWords(); else if (this.currentLevel) this.renderLevelWords(this.currentLevel); else if (this.currentCategory) this.renderCategoryWords(this.currentCategory); }

renderLearningWords() { const learningWordsList = document.getElementById('learningWordsList'); const learningCount = document.getElementById('learningCount'); if (!learningWordsList) return;

if (this.studyMode === 'list') {
  this.showAllLearningWords();
  if (learningCount) learningCount.textContent = `${this.learningWords.length} слов`;
  return;
}

this.sessionQueue = this.buildPracticeQueue();
if (learningCount) learningCount.textContent = `${this.learningWords.length} слов (${this.sessionQueue.length} в очереди)`;

if (this.learningWords.length === 0) {
  learningWordsList.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-book-open"></i>
      <h3>Пока нет слов для изучения</h3>
      <p>Добавьте слова из списка по уровням или создайте новые</p>
    </div>`;
  return;
}

if (this.sessionQueue.length === 0) {
  learningWordsList.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-clock"></i>
      <h3>По расписанию на сейчас слов нет</h3>
      <p>Переключитесь на «Бесконечно» или покажите все слова</p>
      <div class="review-controls">
        <button class="btn btn-primary" onclick="app.practiceMode='endless'; app.updatePracticeButtons(); app.renderLearningWords()">Включить бесконечную практику</button>
        <button class="btn btn-secondary" onclick="app.showAllLearningWords()">Показать все слова</button>
      </div>
    </div>`;
  return;
}

this.currentReviewIndex = 0;
this.currentReviewWords = this.sessionQueue.slice();
this.renderStudyUI();
}

buildPracticeQueue() { const now = new Date(); const active = this.learningWords.filter(w => !w.isLearned);

const due = active.filter(w => new Date(w.repetitionData.nextReview) <= now);
due.sort((a, b) => {
  if (a.repetitionData.difficulty !== b.repetitionData.difficulty) {
    return b.repetitionData.difficulty - a.repetitionData.difficulty;
  }
  return new Date(a.repetitionData.nextReview) - new Date(b.repetitionData.nextReview);
});
if (this.practiceMode === 'scheduled') return due;

const notDue = active.filter(w => new Date(w.repetitionData.nextReview) > now);
notDue.sort((a, b) => {
  const accA = a.repetitionData.totalAnswers ? (a.repetitionData.correctAnswers / a.repetitionData.totalAnswers) : 0;
  const accB = b.repetitionData.totalAnswers ? (b.repetitionData.correctAnswers / b.repetitionData.totalAnswers) : 0;
  if (a.repetitionData.difficulty !== b.repetitionData.difficulty) {
    return b.repetitionData.difficulty - a.repetitionData.difficulty;
  }
  return accA - accB;
});
const combined = [...due, ...notDue];
return combined.slice(0, 50);
}

renderStudyUI() { if (this.studyMode === 'flashcards') this.showFlashcard(); else if (this.studyMode === 'quiz') this.showQuiz(); else this.showAllLearningWords(); }

/* IMAGES: britlex + fallback */ buildPrimaryImageUrl(word) { const w = (word || '').toLowerCase().replace(/[^a-z]/g, ''); return https://britlex.ru/images/${w}.jpg; } handleMediaImageError(evt) { const img = evt.target; img.onerror = null; img.src = '/nophoto.jpg'; }

/* FLASHCARDS */ showFlashcard() { const learningWordsList = document.getElementById('learningWordsList'); if (!learningWordsList) return;

const currentWord = this.currentReviewWords[this.currentReviewIndex];
if (!currentWord) return this.showReviewComplete();

const direction = Math.random() < 0.5 ? 'EN_RU' : 'RU_EN';
const prompt = direction === 'EN_RU' ? currentWord.word : currentWord.translation;
const answer = direction === 'EN_RU' ? currentWord.translation : currentWord.word;

const accuracy = currentWord.repetitionData.totalAnswers > 0
  ? Math.round((currentWord.repetitionData.correctAnswers / currentWord.repetitionData.totalAnswers) * 100) : 0;

const progress = this.currentReviewIndex + 1;
const total = this.currentReviewWords.length;
const imgUrl = this.buildPrimaryImageUrl(currentWord.word);

learningWordsList.innerHTML = `
  <div class="review-container">
    <div class="review-progress">
      <div class="progress-bar"><div class="progress-fill" style="width: ${(progress / total) * 100}%"></div></div>
      <span class="progress-text">${progress} из ${total}</span>
    </div>

    <div class="flashcard">
      <img src="${imgUrl}" data-word="${this.safe(currentWord.word)}" alt="image for ${currentWord.word}" class="flashcard-image" onerror="app.handleMediaImageError(event)"/>
      <div class="flashcard-body">
        <div class="flashcard-title">${prompt}</div>
        <div class="flashcard-subtitle">${currentWord.level} • Точность: ${accuracy}%</div>

        <div class="card-actions">
          <button class="btn btn-primary" onclick="app.showFlashcardAnswer()">Показать ответ</button>
        </div>

        <div id="flashcardAnswer" class="hidden mt-3">
          <div class="review-translation">${answer}</div>
          <div class="answer-buttons">
            <button class="btn btn-danger" onclick="app.handleAnswer(0)">Не знаю</button>
            <button class="btn btn-warning" onclick="app.handleAnswer(3)">Частично</button>
            <button class="btn btn-success" onclick="app.handleAnswer(5)">Знаю</button>
          </div>
        </div>
      </div>
    </div>

    <div class="review-controls">
      <button class="btn btn-secondary" onclick="app.showAllLearningWords()">Показать все слова</button>
      <button class="btn btn-secondary" onclick="app.skipWord()">Пропустить</button>
    </div>
  </div>`;
} showFlashcardAnswer() { const el = document.getElementById('flashcardAnswer'); if (el) el.classList.remove('hidden'); }

/* QUIZ: no play button; speak correct after answer */ showQuiz() { const learningWordsList = document.getElementById('learningWordsList'); if (!learningWordsList) return;

const currentWord = this.currentReviewWords[this.currentReviewIndex];
if (!currentWord) return this.showReviewComplete();

const direction = Math.random() < 0.5 ? 'EN_RU' : 'RU_EN';
const questionText = direction === 'EN_RU' ? currentWord.word : currentWord.translation;
const correct = direction === 'EN_RU' ? currentWord.translation : currentWord.word;
const correctEnglish = currentWord.word; // for audio

const options = this.buildQuizOptions(currentWord, direction);
const shuffled = this.shuffle(options);

const progress = this.currentReviewIndex + 1;
const total = this.currentReviewWords.length;
const imgUrl = this.buildPrimaryImageUrl(currentWord.word);

learningWordsList.innerHTML = `
  <div class="review-container">
    <div class="review-progress">
      <div class="progress-bar"><div class="progress-fill" style="width: ${(progress / total) * 100}%"></div></div>
      <span class="progress-text">${progress} из ${total}</span>
    </div>

    <div class="quiz-container">
      <img src="${imgUrl}" data-word="${this.safe(currentWord.word)}" alt="image for ${currentWord.word}" class="flashcard-image" onerror="app.handleMediaImageError(event)"/>
      <div class="quiz-question">${questionText}</div>
      <div class="quiz-sub">${currentWord.level} • Выберите правильный вариант</div>

      <div class="quiz-options" id="quizOptions">
        ${shuffled.map((opt) => `
          <div class="quiz-option" data-value="${this.safe(opt)}" onclick="app.answerQuiz('${this.safe(correct)}','${this.safe(opt)}','${this.safe(correctEnglish)}', this)">${opt}</div>
        `).join('')}
      </div>
    </div>

    <div class="review-controls">
      <button class="btn btn-secondary" onclick="app.showAllLearningWords()">Показать все слова</button>
      <button class="btn btn-secondary" onclick="app.skipWord()">Пропустить</button>
    </div>
  </div>`;
} buildQuizOptions(currentWord, direction) { const pool = this.getAllWordsPool(); const correct = direction === 'EN_RU' ? currentWord.translation : currentWord.word;

const set = new Set();
set.add(correct);

const sameLevel = pool.filter(w => w.level === currentWord.level && (direction === 'EN_RU' ? w.translation : w.word) !== correct);
const others = pool.filter(w => w.level !== currentWord.level && (direction === 'EN_RU' ? w.translation : w.word) !== correct);

this.shuffle(sameLevel);
this.shuffle(others);

const pick = (arr) => {
  for (let i = 0; i < arr.length && set.size < 4; i++) {
    const val = direction === 'EN_RU' ? arr[i].translation : arr[i].word;
    if (!set.has(val)) set.add(val);
  }
};
pick(sameLevel);
pick(others);

const options = Array.from(set);
return options.slice(0, Math.max(2, Math.min(4, options.length)));
} getAllWordsPool() { const pool = []; if (this.dbAvailable) { const levelKeys = ['A1','A2','B1','B2','C1','C2']; levelKeys.forEach(lvl => { (oxfordWordsDatabase[lvl] || []).forEach(w => pool.push({ word: w.word, translation: w.translation, level: lvl })); }); (oxfordWordsDatabase.irregular_verbs || []).forEach(w => pool.push({ word: w.word, translation: w.translation, level: 'IRREGULARS' })); (oxfordWordsDatabase.prepositions || []).forEach(w => pool.push({ word: w.word, translation: w.translation, level: 'PREPOSITIONS' })); } this.customWords.forEach(w => pool.push({ word: w.word, translation: w.translation, level: w.level })); return pool; } answerQuiz(correct, chosen, correctEnglish, el) { const isCorrect = correct === chosen; if (el) { el.classList.add(isCorrect ? 'correct' : 'wrong'); if (!isCorrect) { const options = Array.from(document.querySelectorAll('.quiz-option')); const corr = options.find(o => o.dataset.value === correct); if (corr) corr.classList.add('correct'); } } // Play correct English after answer setTimeout(() => { this.playAudio(correctEnglish).catch(()=>{}); }, 100);

const q = isCorrect ? 5 : 0;
setTimeout(() => this.handleAnswer(q), 450);
}

/* SESSION */ handleAnswer(quality) { const currentWord = this.currentReviewWords[this.currentReviewIndex]; this.updateSpacedRepetition(currentWord, quality);

if (this.practiceMode === 'endless' && quality < 5) {
  const offset = quality === 0 ? 3 : 6;
  const insertIndex = Math.min(this.currentReviewWords.length, this.currentReviewIndex + offset);
  this.currentReviewWords.splice(insertIndex, 0, currentWord);
}

this.currentReviewIndex++;
if (this.currentReviewIndex >= this.currentReviewWords.length) this.showReviewComplete();
else this.renderStudyUI();
} skipWord() { this.currentReviewIndex++; if (this.currentReviewIndex >= this.currentReviewWords.length) this.showReviewComplete(); else this.renderStudyUI(); } showReviewComplete() { const learningWordsList = document.getElementById('learningWordsList'); if (!learningWordsList) return;

const completedCount = this.currentReviewWords.length;
learningWordsList.innerHTML = `
  <div class="review-complete">
    <div class="completion-icon"><i class="fas fa-trophy"></i></div>
    <h2 class="completion-title">Отличная работа!</h2>
    <p class="completion-message">Вы завершили повторение ${completedCount} слов</p>
    <div class="completion-actions">
      <button class="btn btn-primary" onclick="app.renderLearningWords()"><i class="fas fa-redo"></i> Новая сессия</button>
      <button class="btn btn-secondary" onclick="app.showAllLearningWords()"><i class="fas fa-list"></i> Показать все слова</button>
    </div>
  </div>`;
}

showAllLearningWords() { const learningWordsList = document.getElementById('learningWordsList'); if (!learningWordsList) return;

if (this.learningWords.length === 0) {
  learningWordsList.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-book-open"></i>
      <h3>Пока нет слов для изучения</h3>
      <p>Добавьте слова из списка по уровням или создайте новые</p>
    </div>`;
  return;
}

const learnedWords = this.learningWords.filter(w => w.isLearned);
const learningWords = this.learningWords.filter(w => !w.isLearned);

learningWordsList.innerHTML = `
  <div class="all-words-container">
    <div class="all-words-header">
      <h3 class="all-words-title">Все слова (${this.learningWords.length})</h3>
      <div class="words-filter">
        <button class="filter-btn active" data-filter="all">Все</button>
        <button class="filter-btn" data-filter="learning">Изучаю (${learningWords.length})</button>
        <button class="filter-btn" data-filter="learned">Изучено (${learnedWords.length})</button>
      </div>
    </div>

    <div class="learning-words-grid" id="wordsGrid">
      ${this.renderAllWordsGrid(this.learningWords)}
    </div>

    <div class="completion-actions" style="margin-top: 2rem;">
      <button class="btn btn-primary" onclick="app.renderLearningWords()"><i class="fas fa-arrow-left"></i> Вернуться к изучению</button>
    </div>
  </div>`;

const filterButtons = learningWordsList.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    filterButtons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const filter = e.target.dataset.filter;
    let filtered = this.learningWords;
    if (filter === 'learning') filtered = learningWords;
    else if (filter === 'learned') filtered = learnedWords;
    document.getElementById('wordsGrid').innerHTML = this.renderAllWordsGrid(filtered);
  });
});
} renderAllWordsGrid(words) { if (words.length === 0) { return <div class="empty-state"> <i class="fas fa-search"></i> <h3>Нет слов в этой категории</h3> <p>Попробуйте другой фильтр</p> </div>; } return words.map(word => { const accuracy = word.repetitionData.totalAnswers > 0 ? Math.round((word.repetitionData.correctAnswers / word.repetitionData.totalAnswers) * 100) : 0; const progressWidth = Math.min(accuracy, 100); const difficultyText = this.getDifficultyText(word.repetitionData.difficulty); return
<div class="learning-word-card ${word.isLearned ? 'learned' : ''}"> <div class="learning-word-header"> <div> <div class="learning-word-text">${word.word}</div> <div class="learning-word-translation">${word.translation}</div> </div> <div class="word-actions"> <button class="action-btn remove-btn" onclick="app.removeFromLearning('${this.safe(word.word)}')" title="Убрать из изучения"><i class="fas fa-minus"></i></button> </div> </div> <div class="learning-word-meta"> <div class="word-progress"> <span>Точность: ${accuracy}%</span> <div class="progress-indicator"><div class="progress-fill-mini" style="width: ${progressWidth}%"></div></div> </div> <div class="word-level-info"> <span class="word-level">${word.level}</span> <span class="difficulty-display ${difficultyText.toLowerCase()}">${difficultyText}</span> </div> </div> </div>
; }).join(''); } getDifficultyText(difficulty) { switch (difficulty) { case 0: return 'Легко'; case 1: return 'Средне'; case 2: return 'Сложно'; default: return 'Новое'; } }

/* CUSTOM WORDS (single + bulk) */ addCustomWord() { const wordInput = document.getElementById('newWord'); const translationInput = document.getElementById('newTranslation'); const levelSelect = document.getElementById('newLevel'); if (!wordInput || !translationInput || !levelSelect) return;

const word = wordInput.value.trim().toLowerCase();
const translation = translationInput.value.trim();
const level = levelSelect.value;

if (!word || !translation) return this.showNotification('Заполните все поля', 'error');

const existsInDatabase = this.existsInDb(word);
const existsInCustom = this.customWords.some(w => w.word === word);
if (existsInDatabase || existsInCustom) return this.showNotification('Это слово уже существует', 'warning');

const newWord = { id: Date.now().toString() + Math.random().toString(36).slice(2), word, translation, level, dateAdded: new Date().toISOString(), isCustom: true };
this.customWords.push(newWord);
this.saveData();
this.renderCustomWords();
this.updateUI();
this.showNotification('Слово добавлено', 'success');

wordInput.value = '';
translationInput.value = '';
levelSelect.value = 'A1';
} addBulkWords() { const bulkLevel = document.getElementById('bulkLevel').value; const text = document.getElementById('bulkTextarea').value; if (!text.trim()) return this.showNotification('Вставьте строки со словами', 'warning');

const parsed = this.parseBulkText(text);
if (parsed.length === 0) return this.showNotification('Не удалось распознать слова', 'warning');

let added = 0, skipped = 0;
parsed.forEach(item => {
  const word = item.word.toLowerCase();
  const translation = item.translations.join(', ');
  const existsInDatabase = this.existsInDb(word);
  const existsInCustom = this.customWords.some(w => w.word === word);
  if (existsInDatabase || existsInCustom) { skipped++; return; }
  const newWord = { id: Date.now().toString() + Math.random().toString(36).slice(2), word, translation, level: bulkLevel, dateAdded: new Date().toISOString(), isCustom: true };
  this.customWords.push(newWord);
  added++;
});
this.saveData(); this.renderCustomWords(); this.updateUI();
this.showNotification(`Добавлено: ${added}, пропущено (уже есть): ${skipped}`, 'info');
document.getElementById('bulkTextarea').value = '';
} parseBulkText(text) { const lines = text.split(/\r?\n/); const result = []; let current = null; for (let raw of lines) { const line = raw.trim(); if (!line) continue; const dashIdx = line.indexOf(' - '); if (dashIdx !== -1) { if (current && current.word && current.translations.length) { current.translations = current.translations.join(',').split(',').map(s => s.trim()).filter(Boolean); result.push(current); } const eng = line.slice(0, dashIdx).trim(); const rusPart = line.slice(dashIdx + 3).trim(); current = { word: eng, translations: rusPart ? rusPart.split(',').map(s => s.trim()) : [] }; } else { if (current) current.translations.push(...line.split(',').map(s => s.trim())); } } if (current && current.word && current.translations.length) { current.translations = current.translations.join(',').split(',').map(s => s.trim()).filter(Boolean); result.push(current); } return result; } existsInDb(word) { if (!this.dbAvailable) return false; const inLevels = ['A1','A2','B1','B2','C1','C2'].some(l => (oxfordWordsDatabase[l] || []).some(w => w.word === word)); const inIr = (oxfordWordsDatabase.irregular_verbs || []).some(w => w.word === word); const inPrep = (oxfordWordsDatabase.prepositions || []).some(w => w.word === word); return inLevels || inIr || inPrep; } removeCustomWord(wordId) { this.customWords = this.customWords.filter(w => w.id !== wordId); this.saveData(); this.renderCustomWords(); this.updateUI(); this.showNotification('Слово удалено', 'info'); } renderCustomWords() { const customWordsContainer = document.getElementById('customWords'); if (!customWordsContainer) return;

if (this.customWords.length === 0) {
  customWordsContainer.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-plus-circle"></i>
      <h3>Нет добавленных слов</h3>
      <p>Используйте формы выше для добавления новых слов</p>
    </div>`;
  return;
}
customWordsContainer.innerHTML = this.customWords.map(wd => {
  const isLearning = this.learningWords.some(w => w.word === wd.word);
  return `
    <div class="word-card">
      <div class="word-header">
        <span class="word-text">${wd.word}</span>
        <div class="word-actions">
          <button class="action-btn add-btn" onclick="app.addToLearning('${this.safe(wd.word)}', '${this.safe(wd.translation)}', '${wd.level}')" title="Добавить в изучение"><i class="fas fa-plus"></i></button>
          ${isLearning ? `<button class="action-btn remove-btn" onclick="app.removeFromLearning('${this.safe(wd.word)}')" title="Убрать из изучения"><i class="fas fa-minus"></i></button>` : ''}
          <button class="action-btn remove-btn" onclick="app.removeCustomWord('${wd.id}')" title="Удалить слово"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="word-translation">${wd.translation}</div>
      <div class="word-level">${wd.level} • Пользовательское</div>
    </div>`;
}).join('');
}

/* AUDIO */ async playAudio(word, accent = 'uk') { const processedWord = (word || '').toLowerCase().replace(/[^a-z]/g, ''); const selectorsafe = this.safe(word); const playButtons = document.querySelectorAll([onclick*="playAudio('${selectorsafe}')"]); playButtons.forEach(btn => { const originalContent = btn.innerHTML; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; btn.dataset.originalContent = originalContent; });

const ukUrl = `https://wooordhunt.ru/data/sound/sow/uk/${processedWord}.mp3`;
const usUrl = `https://wooordhunt.ru/data/sound/sow/us/${processedWord}.mp3`;

try {
  const primaryUrl = accent === 'uk' ? ukUrl : usUrl;
  const fallbackUrl = accent === 'uk' ? usUrl : ukUrl;
  let audioPlayed = false;
  try {
    await this.tryPlayAudio(primaryUrl);
    audioPlayed = true;
  } catch {
    try {
      await this.tryPlayAudio(fallbackUrl);
      audioPlayed = true;
    } catch {}
  }
  if (!audioPlayed) this.showNotification('Аудио для этого слова недоступно', 'warning');
} catch (error) {
  console.error('Audio error:', error);
  this.showNotification('Ошибка воспроизведения аудио', 'error');
} finally {
  setTimeout(() => {
    playButtons.forEach(btn => {
      const originalContent = btn.dataset.originalContent || '<i class="fas fa-play"></i>';
      btn.innerHTML = originalContent;
      btn.disabled = false;
      delete btn.dataset.originalContent;
    });
  }, 600);
}
} tryPlayAudio(url) { return new Promise((resolve, reject) => { const audio = new Audio(); const timeout = setTimeout(() => reject(new Error('Audio load timeout')), 8000); audio.oncanplaythrough = () => { clearTimeout(timeout); audio.play().then(resolve).catch(reject); }; audio.onerror = () => { clearTimeout(timeout); reject(new Error(Failed to load audio: ${url})); }; audio.src = url; audio.load(); }); }

/* UI + NOTIFS */ updateUI() { const learningCount = document.getElementById('learningCount'); if (learningCount) learningCount.textContent = ${this.learningWords.length} слов;

// Levels count
document.querySelectorAll('.level-card[data-level]').forEach(card => {
  const level = card.dataset.level;
  const wordCount = card.querySelector('.word-count');
  const dbWords = this.dbAvailable && oxfordWordsDatabase[level] ? oxfordWordsDatabase[level].length : 0;
  const customWords = this.customWords.filter(w => w.level === level).length;
  const total = dbWords + customWords;
  if (wordCount) wordCount.textContent = `${total} слов`;
});
// Categories count
const irregularCount = (this.dbAvailable ? (oxfordWordsDatabase.irregular_verbs || []).length : 0) + this.customWords.filter(w => w.level === 'IRREGULARS').length;
const prepCount = (this.dbAvailable ? (oxfordWordsDatabase.prepositions || []).length : 0) + this.customWords.filter(w => w.level === 'PREPOSITIONS').length;
const catIr = document.querySelector('[data-category="IRREGULARS"] .word-count');
const catPr = document.querySelector('[data-category="PREPOSITIONS"] .word-count');
if (catIr) catIr.textContent = `${irregularCount} слов`;
if (catPr) catPr.textContent = `${prepCount} слов`;

if (this.currentSection === 'progress') this.renderProgress();
}

showNotification(message, type = 'info') { const notification = document.createElement('div'); notification.className = notification notification-${type}; notification.innerHTML = <i class="fas fa-${this.getNotificationIcon(type)}"></i><span>${message}</span>; Object.assign(notification.style, { position: 'fixed', top: '20px', right: '20px', background: this.getNotificationColor(type), color: 'white', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: '1000', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', transform: 'translateX(100%)', transition: 'transform 0.3s ease' }); document.body.appendChild(notification); setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 50); setTimeout(() => { notification.style.transform = 'translateX(100%)'; setTimeout(() => notification.parentNode && notification.parentNode.removeChild(notification), 250); }, 2200); } getNotificationIcon(type) { const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' }; return icons[type] || 'info-circle'; } getNotificationColor(type) { const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' }; return colors[type] || '#3b82f6'; }

/* SM-2 */ updateSpacedRepetition(word, quality) { const d = word.repetitionData; d.totalAnswers++; if (quality >= 3) { d.correctAnswers++; d.easeFactor = d.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)); if (d.easeFactor < 1.3) d.easeFactor = 1.3;

  if (d.repetitions === 0) d.interval = 1;
  else if (d.repetitions === 1) d.interval = 6;
  else d.interval = Math.round(d.interval * d.easeFactor);

  d.repetitions++;
  d.difficulty = Math.max(0, d.difficulty - (quality === 5 ? 0.2 : 0.1));
} else {
  d.repetitions = 0;
  d.interval = 1;
  d.easeFactor = Math.max(1.3, d.easeFactor - 0.2);
  d.difficulty = Math.min(2, d.difficulty + 0.3);
}

const next = new Date();
next.setDate(next.getDate() + Math.max(1, d.interval));
d.nextReview = next.toISOString();
d.lastReview = new Date().toISOString();

if (d.totalAnswers >= 3) {
  const acc = d.correctAnswers / d.totalAnswers;
  if (acc >= 0.8) d.difficulty = 0;
  else if (acc >= 0.6) d.difficulty = 1;
  else d.difficulty = 2;
}
if (d.repetitions >= 6 && d.interval >= 30) {
  word.isLearned = true;
  word.dateLearned = new Date().toISOString();
}

this.saveData();
this.updateUI();
}

migrateExistingWords() { let migrated = false; this.learningWords.forEach(w => { if (!w.repetitionData) { w.repetitionData = this.defaultRepetitionData(); migrated = true; } }); if (migrated) this.saveData(); }

/* PROGRESS */ renderProgress() { const el = document.getElementById('progressContent'); if (!el) return;

const totalLearning = this.learningWords.length;
const totalLearned = this.learningWords.filter(w => w.isLearned).length;
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IRREGULARS', 'PREPOSITIONS'];

const levelCards = levels.map(lvl => {
  let dbTotal = 0;
  if (this.dbAvailable) {
    if (['A1','A2','B1','B2','C1','C2'].includes(lvl)) dbTotal = (oxfordWordsDatabase[lvl] || []).length;
    if (lvl === 'IRREGULARS') dbTotal = (oxfordWordsDatabase.irregular_verbs || []).length;
    if (lvl === 'PREPOSITIONS') dbTotal = (oxfordWordsDatabase.prepositions || []).length;
  }
  const total = dbTotal + this.customWords.filter(w => w.level === lvl).length;
  const inLearning = this.learningWords.filter(w => w.level === lvl).length;
  const learned = this.learningWords.filter(w => w.level === lvl && w.isLearned).length;
  const pct = total ? Math.round((learned / total) * 100) : 0;
  const label = (lvl === 'IRREGULARS') ? 'Неправильные глаголы' : (lvl === 'PREPOSITIONS' ? 'Предлоги' : lvl);
  return `
    <div class="progress-card">
      <div class="progress-row">
        <div><strong>${label}</strong> • В изучении: ${inLearning} • Изучено: ${learned}/${total}</div>
        <div>${pct}%</div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
}).join('');

el.innerHTML = `
  <div class="progress-card">
    <div class="progress-row"><div><strong>Всего в изучении:</strong></div><div>${totalLearning}</div></div>
    <div class="progress-row"><div><strong>Всего изучено:</strong></div><div>${totalLearned}</div></div>
  </div>
  ${levelCards}`;
}

/* HELPERS */ shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; } }

// Init document.addEventListener('DOMContentLoaded', () => { window.app = new EnglishWordsApp(); });
