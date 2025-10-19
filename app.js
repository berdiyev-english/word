class EnglishWordsApp {
  constructor() {
    this.currentSection = 'about';
    this.currentLevel = null;
    this.currentCategory = null;
    this.learningWords = [];
    this.customWords = [];
    this.wordStats = {};
    this.currentMode = 'flashcards';
    this.currentPractice = 'scheduled';
    this.currentReviewIndex = 0;
    this.showFilter = 'all';
    this.loadData();
    this.initializeUI();
    this.renderProgress();
  }

  initializeUI() {
    document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', e => {
        const section = e.currentTarget.getAttribute('data-section');
        this.switchSection(section);
      });
    });
    document.querySelectorAll('.level-card[data-level]').forEach(card => {
      card.addEventListener('click', e => {
        const level = e.currentTarget.getAttribute('data-level');
        this.showLevelWords(level);
      });
    });
    document.querySelectorAll('.level-card[data-category]').forEach(card => {
      card.addEventListener('click', e => {
        const cat = e.currentTarget.getAttribute('data-category');
        this.showCategoryWords(cat);
      });
    });
    document.getElementById('backToLevels')?.addEventListener('click', () => this.backToLevels());
    document.getElementById('addWordBtn')?.addEventListener('click', () => this.addSingleWord());
    document.getElementById('bulkAddBtn')?.addEventListener('click', () => this.bulkAddWords());
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.currentMode = e.target.getAttribute('data-mode');
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.renderLearningSection();
      });
    });
    document.querySelectorAll('.practice-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.currentPractice = e.target.getAttribute('data-practice');
        document.querySelectorAll('.practice-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.renderLearningSection();
      });
    });
    document.getElementById('addAllLevelBtn')?.addEventListener('click', () => this.addAllLevelWords());
    document.getElementById('removeAllLevelBtn')?.addEventListener('click', () => this.removeAllLevelWords());
    document.getElementById('raceStartBtn')?.addEventListener('click', () => this.openRaceGame());
    document.getElementById('dashStartBtn')?.addEventListener('click', () => this.openDashGame());
    document.getElementById('game2048StartBtn')?.addEventListener('click', () => this.open2048Game());
    this.updateLevelCounts();
    this.renderLearningSection();
    this.renderCustomWords();
  }

  switchSection(section) {
    this.currentSection = section;
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelector(`#${section}`)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    if (section === 'levels') this.backToLevels();
    if (section === 'learning') this.renderLearningSection();
    if (section === 'progress') this.renderProgress();
  }

  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', newTheme);
  }

  updateLevelCounts() {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    levels.forEach(lv => {
      const count = (oxfordWordsDatabase[lv] || []).length;
      const card = document.querySelector(`[data-level="${lv}"] .word-count`);
      if (card) card.textContent = `${count} слов`;
    });
    const irregCount = this.getIrregularVerbs().length;
    const prepCount = this.getPrepositions().length;
    const irregCard = document.querySelector('[data-category="IRREGULARS"] .word-count');
    const prepCard = document.querySelector('[data-category="PREPOSITIONS"] .word-count');
    if (irregCard) irregCard.textContent = `${irregCount} слов`;
    if (prepCard) prepCard.textContent = `${prepCount} слов`;
  }

  showLevelWords(level) {
    this.currentLevel = level;
    this.currentCategory = null;
    const words = oxfordWordsDatabase[level] || [];
    const container = document.getElementById('wordsContainer');
    const title = document.getElementById('currentLevelTitle');
    const list = document.getElementById('wordsList');
    if (container) container.classList.remove('hidden');
    if (title) title.textContent = `${level} (${words.length} слов)`;
    if (list) {
      list.innerHTML = words.map(w => this.renderWordCard(w, level)).join('');
      this.attachWordCardListeners();
    }
  }

  showCategoryWords(cat) {
    this.currentCategory = cat;
    this.currentLevel = null;
    const words = cat === 'IRREGULARS' ? this.getIrregularVerbs() : this.getPrepositions();
    const container = document.getElementById('wordsContainer');
    const title = document.getElementById('currentLevelTitle');
    const list = document.getElementById('wordsList');
    if (container) container.classList.remove('hidden');
    if (title) title.textContent = `${cat} (${words.length} слов)`;
    if (list) {
      list.innerHTML = words.map(w => this.renderWordCard(w, cat)).join('');
      this.attachWordCardListeners();
    }
  }

  backToLevels() {
    this.currentLevel = null;
    this.currentCategory = null;
    const container = document.getElementById('wordsContainer');
    if (container) container.classList.add('hidden');
  }

  renderWordCard(word, level) {
    const isLearning = this.learningWords.some(w => w.word === word.word && w.level === level);
    return `
      <div class="word-card">
        <div class="word-header">
          <div>
            <div class="word-text">${word.word}</div>
            <div class="word-translation">${word.translation}</div>
          </div>
          <div class="word-actions">
            <button class="action-btn play-btn" onclick="app.playAudio('${word.word}')" title="Произношение">
              <i class="fas fa-volume-up"></i>
            </button>
            ${isLearning ? 
              `<button class="action-btn remove-btn" onclick="app.removeFromLearning('${word.word}', '${level}')" title="Удалить">
                <i class="fas fa-trash"></i>
              </button>` :
              `<button class="action-btn add-btn" onclick="app.addToLearning('${word.word}', '${level}')" title="Добавить">
                <i class="fas fa-plus"></i>
              </button>`
            }
          </div>
        </div>
        <span class="word-level">${level}</span>
      </div>`;
  }

  attachWordCardListeners() {}

  addToLearning(word, level) {
    const source = this.currentCategory || level;
    let wordData;
    if (this.currentCategory === 'IRREGULARS') wordData = this.getIrregularVerbs().find(w => w.word === word);
    else if (this.currentCategory === 'PREPOSITIONS') wordData = this.getPrepositions().find(w => w.word === word);
    else wordData = (oxfordWordsDatabase[level] || []).find(w => w.word === word);
    if (!wordData) return;
    const exists = this.learningWords.some(w => w.word === word && w.level === source);
    if (!exists) {
      this.learningWords.push({ ...wordData, level: source, isLearned: false });
      this.saveData();
      this.showNotification('Слово добавлено в «Изучаю»', 'success');
      this.renderLearningSection();
      if (this.currentLevel) this.showLevelWords(this.currentLevel);
      if (this.currentCategory) this.showCategoryWords(this.currentCategory);
    }
  }

  removeFromLearning(word, level) {
    this.learningWords = this.learningWords.filter(w => !(w.word === word && w.level === level));
    this.saveData();
    this.showNotification('Слово удалено из «Изучаю»', 'warning');
    this.renderLearningSection();
    if (this.currentLevel) this.showLevelWords(this.currentLevel);
    if (this.currentCategory) this.showCategoryWords(this.currentCategory);
  }

  addAllLevelWords() {
    const source = this.currentCategory || this.currentLevel;
    if (!source) return;
    let words = [];
    if (this.currentCategory === 'IRREGULARS') words = this.getIrregularVerbs();
    else if (this.currentCategory === 'PREPOSITIONS') words = this.getPrepositions();
    else words = oxfordWordsDatabase[this.currentLevel] || [];
    let added = 0;
    words.forEach(w => {
      const exists = this.learningWords.some(lw => lw.word === w.word && lw.level === source);
      if (!exists) {
        this.learningWords.push({ ...w, level: source, isLearned: false });
        added++;
      }
    });
    this.saveData();
    this.showNotification(`Добавлено слов: ${added}`, 'success');
    this.renderLearningSection();
    if (this.currentLevel) this.showLevelWords(this.currentLevel);
    if (this.currentCategory) this.showCategoryWords(this.currentCategory);
  }

  removeAllLevelWords() {
    const source = this.currentCategory || this.currentLevel;
    if (!source) return;
    const before = this.learningWords.length;
    this.learningWords = this.learningWords.filter(w => w.level !== source);
    const removed = before - this.learningWords.length;
    this.saveData();
    this.showNotification(`Удалено слов: ${removed}`, 'warning');
    this.renderLearningSection();
    if (this.currentLevel) this.showLevelWords(this.currentLevel);
    if (this.currentCategory) this.showCategoryWords(this.currentCategory);
  }

  addSingleWord() {
    const word = document.getElementById('newWord')?.value.trim();
    const trans = document.getElementById('newTranslation')?.value.trim();
    const level = document.getElementById('newLevel')?.value || 'A1';
    if (!word || !trans) {
      this.showNotification('Заполните слово и перевод', 'warning');
      return;
    }
    this.customWords.push({ word, translation: trans, level, category: 'custom' });
    this.saveData();
    this.showNotification('Слово добавлено', 'success');
    document.getElementById('newWord').value = '';
    document.getElementById('newTranslation').value = '';
    this.renderCustomWords();
  }

  bulkAddWords() {
    const text = document.getElementById('bulkTextarea')?.value.trim();
    const level = document.getElementById('bulkLevel')?.value || 'A1';
    if (!text) {
      this.showNotification('Введите текст', 'warning');
      return;
    }
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let added = 0;
    lines.forEach(line => {
      if (line.includes(' - ')) {
        const [eng, ru] = line.split(' - ').map(p => p.trim());
        if (eng && ru) {
          this.customWords.push({ word: eng, translation: ru, level, category: 'custom' });
          added++;
        }
      }
    });
    this.saveData();
    this.showNotification(`Добавлено слов: ${added}`, 'success');
    document.getElementById('bulkTextarea').value = '';
    this.renderCustomWords();
  }

  renderCustomWords() {
    const container = document.getElementById('customWords');
    if (!container) return;
    if (!this.customWords.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-plus-circle"></i>
          <h3>Нет добавленных слов</h3>
          <p>Используйте формы выше для добавления новых слов</p>
        </div>`;
      return;
    }
    container.innerHTML = this.customWords.map((w, i) => `
      <div class="word-card">
        <div class="word-header">
          <div>
            <div class="word-text">${w.word}</div>
            <div class="word-translation">${w.translation}</div>
          </div>
          <div class="word-actions">
            <button class="action-btn play-btn" onclick="app.playAudio('${w.word}')">
              <i class="fas fa-volume-up"></i>
            </button>
            <button class="action-btn remove-btn" onclick="app.deleteCustomWord(${i})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <span class="word-level">${w.level}</span>
      </div>`).join('');
  }

  deleteCustomWord(index) {
    this.customWords.splice(index, 1);
    this.saveData();
    this.showNotification('Слово удалено', 'warning');
    this.renderCustomWords();
  }

  renderLearningSection() {
    const container = document.getElementById('learningWordsList');
    const countEl = document.getElementById('learningCount');
    if (countEl) countEl.textContent = `${this.learningWords.length} слов`;
    if (!container) return;
    if (!this.learningWords.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-book-open"></i>
          <h3>Пока нет слов для изучения</h3>
          <p>Добавьте слова из списка по уровням или создайте новые</p>
        </div>`;
      return;
    }
    if (this.currentMode === 'list') {
      this.renderListMode(container);
    } else if (this.currentMode === 'flashcards') {
      this.renderFlashcardsMode(container);
    } else if (this.currentMode === 'quiz') {
      this.renderQuizMode(container);
    }
  }

  renderListMode(container) {
    let words = this.learningWords;
    if (this.currentPractice === 'scheduled') {
      words = words.filter(w => !w.isLearned);
    }
    if (!words.length) {
      container.innerHTML = `<div class="empty-state"><h3>Все слова изучены!</h3></div>`;
      return;
    }
    const html = `
      <div class="all-words-container">
        <div class="all-words-header">
          <div class="all-words-title">Все слова (${words.length})</div>
          <div class="words-filter">
            <button class="filter-btn ${this.showFilter === 'all' ? 'active' : ''}" onclick="app.setFilter('all')">Все</button>
            <button class="filter-btn ${this.showFilter === 'learned' ? 'active' : ''}" onclick="app.setFilter('learned')">Изучены</button>
            <button class="filter-btn ${this.showFilter === 'learning' ? 'active' : ''}" onclick="app.setFilter('learning')">Изучаю</button>
          </div>
        </div>
        <div class="learning-words-grid">
          ${words.filter(w => {
            if (this.showFilter === 'all') return true;
            if (this.showFilter === 'learned') return w.isLearned;
            if (this.showFilter === 'learning') return !w.isLearned;
            return true;
          }).map(w => this.renderLearningWordCard(w)).join('')}
        </div>
      </div>`;
    container.innerHTML = html;
  }

  setFilter(filter) {
    this.showFilter = filter;
    this.renderLearningSection();
  }

  renderLearningWordCard(word) {
    const stats = this.wordStats[word.word] || { correct: 0, total: 0, difficulty: 0 };
    const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return `
      <div class="learning-word-card ${word.isLearned ? 'learned' : ''}">
        <div class="learning-word-header">
          <div>
            <div class="learning-word-text">${word.word}</div>
            <div class="learning-word-translation">${word.translation}</div>
          </div>
          <button class="action-btn play-btn" onclick="app.playAudio('${word.word}')">
            <i class="fas fa-volume-up"></i>
          </button>
        </div>
        <div class="learning-word-meta">
          <div class="word-progress">
            <span>Точность: ${acc}%</span>
            <div class="progress-indicator">
              <div class="progress-fill-mini" style="width:${acc}%"></div>
            </div>
          </div>
          <div class="word-level-info">
            <span class="word-level">${word.level}</span>
          </div>
        </div>
      </div>`;
  }

  renderFlashcardsMode(container) {
    let words = this.learningWords;
    if (this.currentPractice === 'scheduled') {
      words = words.filter(w => !w.isLearned);
    }
    if (!words.length) {
      container.innerHTML = `<div class="empty-state"><h3>Все слова изучены!</h3></div>`;
      return;
    }
    const word = words[this.currentReviewIndex % words.length];
    const imgUrl = `https://britlex.ru/images/${word.word}.jpg`;
    container.innerHTML = `
      <div class="review-container">
        <div class="review-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${((this.currentReviewIndex + 1) / words.length) * 100}%"></div>
          </div>
          <div class="progress-text">${this.currentReviewIndex + 1} / ${words.length}</div>
        </div>
        <div class="flashcard" id="flashcardEl">
          <img src="${imgUrl}" alt="${word.word}" class="flashcard-image" onerror="this.src='nophoto.jpg'">
          <div class="flashcard-body">
            <div class="flashcard-title">${word.word}</div>
            <div class="flashcard-subtitle" style="display:none;" id="flashcardAnswer">${word.translation}</div>
            <button class="btn btn-primary" onclick="app.showFlashcardAnswer()">Показать ответ</button>
          </div>
        </div>
        <div class="review-controls">
          <button class="btn btn-secondary" onclick="app.prevFlashcard()">
            <i class="fas fa-arrow-left"></i> Назад
          </button>
          <button class="btn btn-success" onclick="app.markAsLearned('${word.word}')">
            <i class="fas fa-check"></i> Выучено
          </button>
          <button class="btn btn-secondary" onclick="app.nextFlashcard()">
            Далее <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>`;
  }

  showFlashcardAnswer() {
    const answer = document.getElementById('flashcardAnswer');
    if (answer) answer.style.display = 'block';
  }

  prevFlashcard() {
    this.currentReviewIndex = Math.max(0, this.currentReviewIndex - 1);
    this.renderLearningSection();
  }

  nextFlashcard() {
    this.currentReviewIndex++;
    this.renderLearningSection();
  }

  markAsLearned(word) {
    const w = this.learningWords.find(lw => lw.word === word);
    if (w) {
      w.isLearned = true;
      this.saveData();
      this.showNotification('Слово отмечено как выученное!', 'success');
      this.nextFlashcard();
    }
  }

  renderQuizMode(container) {
    let words = this.learningWords;
    if (this.currentPractice === 'scheduled') {
      words = words.filter(w => !w.isLearned);
    }
    if (!words.length) {
      container.innerHTML = `<div class="empty-state"><h3>Все слова изучены!</h3></div>`;
      return;
    }
    const word = words[this.currentReviewIndex % words.length];
    const direction = Math.random() < 0.5 ? 'EN_RU' : 'RU_EN';
    const questionText = direction === 'EN_RU' ? word.word : word.translation;
    const correctAnswer = direction === 'EN_RU' ? word.translation : word.word;
    const options = this.buildQuizOptions(word, direction);
    const shuffled = this.shuffle(options);
    const showAudio = direction === 'EN_RU';
    container.innerHTML = `
      <div class="review-container">
        <div class="review-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${((this.currentReviewIndex + 1) / words.length) * 100}%"></div>
          </div>
          <div class="progress-text">${this.currentReviewIndex + 1} / ${words.length}</div>
        </div>
        <div class="quiz-container">
          <div class="quiz-question">${questionText} ${showAudio ? `<button class="action-btn play-btn" onclick="app.playAudio('${word.word}')" style="margin-left:10px;"><i class="fas fa-volume-up"></i></button>` : ''}</div>
          <div class="quiz-sub">Выберите правильный вариант</div>
          <div class="quiz-options" id="quizOptions">
            ${shuffled.map(opt => `<div class="quiz-option" data-answer="${this.safeAttr(opt)}">${opt}</div>`).join('')}
          </div>
        </div>
        <div class="review-controls">
          <button class="btn btn-secondary" onclick="app.prevQuiz()">
            <i class="fas fa-arrow-left"></i> Назад
          </button>
          <button class="btn btn-secondary" onclick="app.nextQuiz()">
            Далее <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>`;
    setTimeout(() => {
      document.querySelectorAll('#quizOptions .quiz-option').forEach(opt => {
        opt.addEventListener('click', () => this.handleQuizAnswer(opt, correctAnswer, word.word, direction));
      });
    }, 0);
  }

  buildQuizOptions(word, direction) {
    const correct = direction === 'EN_RU' ? word.translation : word.word;
    const pool = [...this.learningWords, ...this.customWords];
    const others = pool.filter(w => w.word !== word.word).map(w => direction === 'EN_RU' ? w.translation : w.word);
    const unique = [...new Set(others)];
    const distractors = [];
    while (distractors.length < 3 && unique.length > 0) {
      const idx = Math.floor(Math.random() * unique.length);
      distractors.push(unique.splice(idx, 1)[0]);
    }
    return [correct, ...distractors];
  }

  shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  handleQuizAnswer(optEl, correct, wordText, direction) {
    const chosen = optEl.getAttribute('data-answer');
    const isCorrect = chosen === correct;
    optEl.classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      document.querySelectorAll('#quizOptions .quiz-option').forEach(o => {
        if (o.getAttribute('data-answer') === correct) o.classList.add('correct');
      });
    } else {
      if (direction === 'RU_EN') {
        this.playAudio(wordText);
      }
    }
    this.updateStats(wordText, isCorrect);
    setTimeout(() => this.nextQuiz(), 1000);
  }

  prevQuiz() {
    this.currentReviewIndex = Math.max(0, this.currentReviewIndex - 1);
    this.renderLearningSection();
  }

  nextQuiz() {
    this.currentReviewIndex++;
    this.renderLearningSection();
  }

  updateStats(word, isCorrect) {
    if (!this.wordStats[word]) {
      this.wordStats[word] = { correct: 0, total: 0, difficulty: 0 };
    }
    this.wordStats[word].total++;
    if (isCorrect) this.wordStats[word].correct++;
    this.saveData();
  }

  safeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  playAudio(word) {
    const audioPlayer = document.getElementById('audioPlayer');
    if (!audioPlayer) return;
    const tryUrls = [
      `https://wooordhunt.ru/data/sound/word/uk/${word}.mp3`,
      `https://wooordhunt.ru/data/sound/word/us/${word}.mp3`
    ];
    let index = 0;
    const tryNext = () => {
      if (index >= tryUrls.length) return;
      audioPlayer.src = tryUrls[index];
      audioPlayer.play().catch(() => {
        index++;
        tryNext();
      });
    };
    tryNext();
  }

  renderProgress() {
    const container = document.getElementById('progressContent');
    if (!container) return;
    const learned = this.learningWords.filter(w => w.isLearned).length;
    const total = this.learningWords.length;
    const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
    const weeklyData = this.getWeeklyProgress();
    const overallData = this.getOverallProgress();
    container.innerHTML = `
      <div class="progress-card">
        <h3>Общий прогресс</h3>
        <div class="progress-row">
          <span>Изучено слов</span>
          <span>${learned} / ${total}</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${percent}%"></div>
        </div>
      </div>
      <div class="progress-card">
        <h3>Недельный прогресс</h3>
        <div style="height:200px;background:var(--bg-tertiary);border-radius:8px;display:flex;align-items:flex-end;padding:10px;gap:4px;">
          ${weeklyData.map((val, i) => {
            const height = val > 0 ? Math.max(10, (val / Math.max(...weeklyData, 1)) * 180) : 0;
            const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;">
              <div style="width:100%;background:linear-gradient(to top,var(--primary-color),var(--accent-color));border-radius:4px;height:${height}px;"></div>
              <div style="font-size:10px;margin-top:4px;color:var(--text-secondary);">${days[i]}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="progress-card">
        <h3>Динамика обучения</h3>
        <div style="height:200px;background:var(--bg-tertiary);border-radius:8px;display:flex;align-items:flex-end;padding:10px;gap:4px;">
          ${overallData.map((val, i) => {
            const height = val > 0 ? Math.max(10, (val / Math.max(...overallData, 1)) * 180) : 0;
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;">
              <div style="width:100%;background:linear-gradient(to top,var(--primary-color),var(--accent-color));border-radius:4px;height:${height}px;"></div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  getWeeklyProgress() {
    return [5, 8, 12, 7, 15, 10, 20];
  }

  getOverallProgress() {
    const total = this.learningWords.length;
    const learned = this.learningWords.filter(w => w.isLearned).length;
    const data = [];
    for (let i = 0; i < 10; i++) {
      data.push(Math.floor((learned / 10) * (i + 1)));
    }
    return data;
  }

  getIrregularVerbs() {
    return [
      { word: 'be', translation: 'быть, находиться', pos: 'v.' },
      { word: 'have', translation: 'иметь', pos: 'v.' },
      { word: 'do', translation: 'делать', pos: 'v.' },
      { word: 'go', translation: 'идти, ехать', pos: 'v.' },
      { word: 'get', translation: 'получать', pos: 'v.' },
      { word: 'make', translation: 'делать, создавать', pos: 'v.' },
      { word: 'see', translation: 'видеть', pos: 'v.' },
      { word: 'know', translation: 'знать', pos: 'v.' },
      { word: 'take', translation: 'брать', pos: 'v.' },
      { word: 'come', translation: 'приходить', pos: 'v.' }
    ];
  }

  getPrepositions() {
    return [
      { word: 'in', translation: 'в, внутри', pos: 'prep.' },
      { word: 'on', translation: 'на', pos: 'prep.' },
      { word: 'at', translation: 'у, в, на', pos: 'prep.' },
      { word: 'by', translation: 'у, около, к', pos: 'prep.' },
      { word: 'for', translation: 'для, за', pos: 'prep.' },
      { word: 'with', translation: 'с', pos: 'prep.' },
      { word: 'about', translation: 'о, около', pos: 'prep.' },
      { word: 'from', translation: 'из, от', pos: 'prep.' },
      { word: 'to', translation: 'к, в, на', pos: 'prep.' },
      { word: 'of', translation: 'из, о', pos: 'prep.' }
    ];
  }

  showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--bg-secondary);color:var(--text-primary);padding:12px 20px;border-radius:12px;box-shadow:var(--shadow-lg);z-index:9999;border:1px solid var(--border-color);`;
    if (type === 'success') notif.style.background = '#d1fae5';
    if (type === 'warning') notif.style.background = '#fef3c7';
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  }

  saveData() {
    localStorage.setItem('learningWords', JSON.stringify(this.learningWords));
    localStorage.setItem('customWords', JSON.stringify(this.customWords));
    localStorage.setItem('wordStats', JSON.stringify(this.wordStats));
  }

  loadData() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    const learning = localStorage.getItem('learningWords');
    if (learning) this.learningWords = JSON.parse(learning);
    const custom = localStorage.getItem('customWords');
    if (custom) this.customWords = JSON.parse(custom);
    const stats = localStorage.getItem('wordStats');
    if (stats) this.wordStats = JSON.parse(stats);
  }

  openRaceGame() {
    if ((this.learningWords || []).filter(w => !w.isLearned).length < 4) {
      this.showNotification('Чтобы играть, добавьте минимум 4 слова в «Изучаю»', 'warning');
      return;
    }
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'radial-gradient(1200px 800px at 50% -10%, #0a1a26 0%, #070e16 60%, #04080d 100%)',
      display: 'grid', placeItems: 'center', touchAction: 'none'
    });
    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
      position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
      width: 'min(96vw, 520px)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
      zIndex: 1000000, pointerEvents: 'auto'
    });
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    Object.assign(closeBtn.style, {
      width: '42px', height: '42px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.25)',
      color: '#fff', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', cursor: 'pointer',
      fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    topBar.appendChild(closeBtn);
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { position: 'relative', width: 'min(96vw, 520px)', aspectRatio: '9 / 16', maxHeight: '96vh' });
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 854;
    Object.assign(canvas.style, {
      width: '100%', height: '100%', display: 'block',
      borderRadius: '16px', background: 'linear-gradient(#0e1520, #0a111a)',
      boxShadow: '0 20px 60px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06)'
    });
    const hud = document.createElement('div');
    Object.assign(hud.style, {
      position: 'absolute', inset: '10px 10px auto 10px', display: 'flex', gap: '10px',
      alignItems: 'center', background: 'rgba(0,0,0,.45)', padding: '8px 10px',
      borderRadius: '10px', backdropFilter: 'blur(6px)', fontWeight: '700', zIndex: 5
    });
    hud.innerHTML = `
      <div>Дистанция: <b style="color:#00d6a1"><span id="raceDist">0</span> м</b></div>
      <div>Попытка: <b style="color:#00d6a1"><span id="raceAttempts">1</span></b></div>
      <div>Скорость: <b style="color:#00d6a1"><span id="raceSpeed">0</span> км/ч</b></div>`;
    const help = document.createElement('div');
    help.innerHTML = 'Управление: <span class="badge">←</span> <span class="badge">→</span> или тап по сторонам экрана. <span class="badge">P</span> — пауза.';
    Object.assign(help.style, {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,.45)', padding: '14px 16px', borderRadius: '12px',
      textAlign: 'center', backdropFilter: 'blur(6px)', fontWeight: '600', maxWidth: '90%',
      opacity: .95, transition: 'opacity .25s ease', zIndex: 4
    });
    const pausedOv = document.createElement('div');
    pausedOv.textContent = 'Пауза';
    Object.assign(pausedOv.style, {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,.45)', padding: '14px 16px', borderRadius: '12px',
      textAlign: 'center', backdropFilter: 'blur(6px)', fontWeight: '700', display: 'none', zIndex: 6
    });
    const gameoverOv = document.createElement('div');
    Object.assign(gameoverOv.style, {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,.45)', padding: '14px 16px', borderRadius: '12px',
      textAlign: 'center', backdropFilter: 'blur(6px)', fontWeight: '700', display: 'none', zIndex: 7
    });
    gameoverOv.innerHTML = `
      💥 Проигрыш!<br/>
      Дистанция: <span id="raceFinalDist">0</span> м<br/>
      <div style="margin-top:10px;">
        <button id="raceContinueBtn" class="btn btn-primary" style="border:none;background:#00d6a1;color:#fff;padding:10px 14px;border-radius:10px;cursor:pointer;font-weight:800;">
          Продолжить игру
        </button>
      </div>`;
    const quizModal = document.createElement('div');
    Object.assign(quizModal.style, { position: 'absolute', inset: 0, display: 'none', placeItems: 'center', background: 'rgba(0,0,0,.45)', borderRadius: '16px', zIndex: 8 });
    const quizCard = document.createElement('div');
    Object.assign(quizCard.style, { background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.15)', padding: '14px 16px', borderRadius: '12px', textAlign: 'center', fontWeight: '800', minWidth: '60%' });
    const quizContent = document.createElement('div');
    quizCard.appendChild(quizContent);
    quizModal.appendChild(quizCard);
    wrap.appendChild(canvas);
    wrap.appendChild(hud);
    wrap.appendChild(help);
    wrap.appendChild(pausedOv);
    wrap.appendChild(gameoverOv);
    wrap.appendChild(quizModal);
    overlay.appendChild(topBar);
    overlay.appendChild(wrap);
    document.body.appendChild(overlay);
    const W = 480, H = 854;
    const ctx = canvas.getContext('2d');
    const elDist = hud.querySelector('#raceDist');
    const elSpeed = hud.querySelector('#raceSpeed');
    const elAttempts = hud.querySelector('#raceAttempts');
    const elFinalDist = gameoverOv.querySelector('#raceFinalDist');
    const CAR_W = 48, CAR_H = 80, CAR_X = W / 2 - CAR_W / 2;
    const LANE_COUNT = 3, LANE_W = W / LANE_COUNT;
    const car = { lane: 1, y: H - 150, targetX: LANE_W + LANE_W / 2 - CAR_W / 2, x: LANE_W + LANE_W / 2 - CAR_W / 2 };
    let obstacles = [], speed = 220, accel = 8, maxSpeed = 420, distWorld = 0, attempts = 1;
    let paused = false, gameOver = false, shakeT = 0, hitFlash = 0;
    const M_PER_PX = 0.05;
    let leftHeld = false, rightHeld = false;
    function spawn() {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const x = lane * LANE_W + LANE_W / 2 - CAR_W / 2;
      obstacles.push({ x, y: -CAR_H - 100, lane, type: 'car' });
    }
    function keyHandler(e) {
      const c = e.code;
      if (gameOver) return;
      if (c === 'ArrowLeft' || c === 'KeyA') { e.preventDefault(); leftHeld = e.type === 'keydown'; if (leftHeld) moveLeft(); }
      if (c === 'ArrowRight' || c === 'KeyD') { e.preventDefault(); rightHeld = e.type === 'keydown'; if (rightHeld) moveRight(); }
      if (c === 'KeyP' && e.type === 'keydown') { e.preventDefault(); togglePause(); }
    }
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyHandler);
    function clearHolds() { leftHeld = false; rightHeld = false; }
    const tapMargin = W / 3;
    canvas.addEventListener('click', e => {
      if (gameOver || paused) return;
      const rect = canvas.getBoundingClientRect();
      const cX = (e.clientX - rect.left) / rect.width * W;
      if (cX < tapMargin) moveLeft();
      else if (cX > W - tapMargin) moveRight();
      hideHelpSoon();
    }, { passive: true });
    function moveLeft() {
      if (car.lane > 0) {
        car.lane--;
        car.targetX = car.lane * LANE_W + LANE_W / 2 - CAR_W / 2;
      }
      hideHelpSoon();
    }
    function moveRight() {
      if (car.lane < LANE_COUNT - 1) {
        car.lane++;
        car.targetX = car.lane * LANE_W + LANE_W / 2 - CAR_W / 2;
      }
      hideHelpSoon();
    }
    function togglePause() {
      if (gameOver) return;
      paused = !paused;
      pausedOv.style.display = paused ? 'block' : 'none';
    }
    let helpTimer = null;
    function hideHelpSoon() {
      if (helpTimer) return;
      helpTimer = setTimeout(() => help.style.opacity = '0', 450);
    }
    let spawnTimer = 0, spawnInterval = 2.2;
    let started = false, rafId = null, prev = performance.now();
    function startLoop() {
      if (started) return;
      started = true; prev = performance.now();
      rafId = requestAnimationFrame(loop);
    }
    function stopLoop() { started = false; if (rafId) cancelAnimationFrame(rafId); }
    function loop(t) {
      const dt = Math.min(0.033, (t - prev) / 1000);
      prev = t;
      if (!paused && !gameOver) update(dt);
      render();
      rafId = requestAnimationFrame(loop);
    }
    function update(dt) {
      speed = Math.min(speed + accel * dt, maxSpeed);
      distWorld += speed * dt;
      elDist.textContent = Math.floor(distWorld * M_PER_PX);
      elSpeed.textContent = Math.round(speed * (M_PER_PX * 3.6));
      car.x += (car.targetX - car.x) * Math.min(1, dt * 10);
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawn();
        spawnTimer = Math.max(0.8, spawnInterval - speed / 1000);
      }
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.y += speed * dt;
        if (o.y > H + 100) obstacles.splice(i, 1);
        if (boxOverlap(car.x, car.y, CAR_W, CAR_H, o.x, o.y, CAR_W, CAR_H)) {
          onCrash();
          return;
        }
      }
    }
    function boxOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
      return !(x1 + w1 <= x2 || x1 >= x2 + w2 || y1 + h1 <= y2 || y1 >= y2 + h2);
    }
    function onCrash() {
      gameOver = true; shakeT = 0.5; hitFlash = 0.35;
      elFinalDist.textContent = Math.floor(distWorld * M_PER_PX);
      gameoverOv.style.display = 'block';
      pausedOv.style.display = 'none';
      stopLoop();
    }
    function restart() {
      obstacles = []; distWorld = 0; speed = 220; car.lane = 1; car.x = LANE_W + LANE_W / 2 - CAR_W / 2; car.targetX = car.x;
      car.y = H - 150; paused = false; gameOver = false; spawnTimer = 1; attempts++; elAttempts.textContent = attempts;
      gameoverOv.style.display = 'none'; pausedOv.style.display = 'none'; shakeT = 0; hitFlash = 0;
    }
    function render() {
      const shakeAmt = (shakeT > 0) ? (6 * Math.pow(shakeT, 0.6)) : 0;
      const sx = (Math.random() * 2 - 1) * shakeAmt;
      const sy = (Math.random() * 2 - 1) * shakeAmt;
      if (shakeT > 0) shakeT -= 1 / 60;
      if (hitFlash > 0) hitFlash -= 1 / 60;
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.translate(sx, sy);
      ctx.fillStyle = '#0a111a'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
      for (let i = 1; i < LANE_COUNT; i++) {
        ctx.beginPath(); ctx.moveTo(i * LANE_W, 0); ctx.lineTo(i * LANE_W, H); ctx.stroke();
      }
      ctx.save(); ctx.strokeStyle = '#ffe033'; ctx.lineWidth = 4; ctx.setLineDash([20, 30]);
      const dashOffset = -(distWorld % 50);
      ctx.lineDashOffset = dashOffset;
      for (let i = 1; i < LANE_COUNT; i++) {
        ctx.beginPath(); ctx.moveTo(i * LANE_W, 0); ctx.lineTo(i * LANE_W, H); ctx.stroke();
      }
      ctx.restore();
      for (const o of obstacles) {
        const gr = ctx.createLinearGradient(0, o.y, 0, o.y + CAR_H);
        gr.addColorStop(0, '#ef4444'); gr.addColorStop(1, '#b91c1c');
        ctx.fillStyle = gr; roundRect(ctx, o.x, o.y, CAR_W, CAR_H, 6); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(ctx, o.x + 6, o.y + 6, CAR_W - 12, 16, 4); ctx.fill();
      }
      const shW = CAR_W * (0.95 - Math.min(0.3, Math.abs(car.x - car.targetX) / 40) * 0.6);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, car.x + (CAR_W - shW) / 2, car.y + CAR_H + 4, shW, 10, 6); ctx.fill();
      const grP = ctx.createLinearGradient(0, car.y, 0, car.y + CAR_H);
      grP.addColorStop(0, '#00d6a1'); grP.addColorStop(1, '#0ea5e9');
      ctx.fillStyle = grP; roundRect(ctx, car.x, car.y, CAR_W, CAR_H, 6); ctx.fill();
      ctx.fillStyle = '#1e293b'; roundRect(ctx, car.x + 8, car.y + 12, CAR_W - 16, 24, 6); ctx.fill();
      if (hitFlash > 0) {
        const a = Math.max(0, Math.min(0.35, hitFlash * 1.5));
        ctx.fillStyle = `rgba(255,0,0,${a})`; ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      function roundRect(ctx2, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx2.beginPath(); ctx2.moveTo(x + r, y);
        ctx2.arcTo(x + w, y, x + w, y + h, r); ctx2.arcTo(x + w, y + h, x, y + h, r);
        ctx2.arcTo(x, y + h, x, y, r); ctx2.arcTo(x, y, x + w, y, r);
        ctx2.closePath();
      }
    }
    function hexToRgb(hex) {
      const h = hex.replace('#', '');
      return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
    }
    function rgbToHex(c) {
      const h = x => x.toString(16).padStart(2, '0');
      return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
    }
    function lighten(hex, p = 0.1) {
      const c = hexToRgb(hex);
      c.r = Math.round(c.r + (255 - c.r) * p); c.g = Math.round(c.g + (255 - c.g) * p); c.b = Math.round(c.b + (255 - c.b) * p);
      return rgbToHex(c);
    }
    function darken(hex, p = 0.1) {
      const c = hexToRgb(hex);
      c.r = Math.round(c.r * (1 - p)); c.g = Math.round(c.g * (1 - p)); c.b = Math.round(c.b * (1 - p));
      return rgbToHex(c);
    }
    const appRef = this;
    function showGate(onSuccess) {
      let correctNeeded = 3, correctCount = 0;
      paused = true;
      quizModal.style.display = 'flex';
      updateCard();
      function updateCard() {
        const word = pickLearningWord();
        if (!word) {
          quizContent.innerHTML = `<div class="quiz-container"><div class="quiz-question">Недостаточно слов</div><div class="quiz-sub">Добавьте слова в «Изучаю»</div></div>`;
          return;
        }
        const direction = Math.random() < 0.5 ? 'EN_RU' : 'RU_EN';
        const questionText = direction === 'EN_RU' ? word.word : word.translation;
        const correct = direction === 'EN_RU' ? word.translation : word.word;
        const options = appRef.buildQuizOptions(word, direction);
        const shuffled = appRef.shuffle(options);
        quizContent.innerHTML = `
          <div style="font-weight:700;margin-bottom:6px;">Ответьте правильно на 3 слова, чтобы продолжить</div>
          <div style="font-size:12px;color:var(--text-secondary,#cbd5e1);margin-bottom:10px;">Правильных ответов: ${correctCount}/${correctNeeded}</div>
          <div class="quiz-container">
            <div class="quiz-question">${questionText}</div>
            <div class="quiz-sub">Выберите правильный вариант</div>
            <div class="quiz-options" id="raceQuizOpts">
              ${shuffled.map(opt => `<div class="quiz-option" data-val="${appRef.safeAttr(opt)}">${opt}</div>`).join('')}
            </div>
          </div>`;
        const opts = quizContent.querySelectorAll('.quiz-option');
        opts.forEach(o => o.addEventListener('click', () => {
          const chosen = o.getAttribute('data-val');
          const isCorrect = chosen === correct;
          o.classList.add(isCorrect ? 'correct' : 'wrong');
          if (!isCorrect) {
            opts.forEach(el => { if (el.getAttribute('data-val') === correct) el.classList.add('correct'); });
          }
          setTimeout(() => {
            if (isCorrect) correctCount++;
            if (correctCount >= correctNeeded) {
              quizModal.style.display = 'none';
              paused = false;
              onSuccess?.();
            } else {
              updateCard();
            }
          }, 450);
        }));
      }
      function pickLearningWord() {
        const pool = (appRef.learningWords || []).filter(w => !w.isLearned);
        if (!pool.length) return null;
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }
    showGate(() => startLoop());
    gameoverOv.querySelector('#raceContinueBtn').addEventListener('click', () => {
      showGate(() => { restart(); startLoop(); });
    });
    closeBtn.onclick = () => {
      destroy();
      overlay.remove();
    };
    function destroy() {
      stopLoop();
      document.removeEventListener('keydown', keyHandler);
      clearHolds();
    }
  }

  openDashGame() {
    if ((this.learningWords || []).filter(w => !w.isLearned).length < 4) {
      this.showNotification('Чтобы играть, добавьте минимум 4 слова в «Изучаю»', 'warning');
      return;
    }
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'radial-gradient(1200px 800px at 50% -10%, #0a1a26 0%, #070e16 60%, #04080d 100%)',
      display: 'grid', placeItems: 'center', touchAction: 'none'
    });
    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
      position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
      width: 'min(96vw, 520px)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
      zIndex: 1000000, pointerEvents: 'auto'
    });
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    Object.assign(closeBtn.style, {
      width: '42px', height: '42px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.25)',
      color: '#fff', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', cursor: 'pointer',
      fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    topBar.appendChild(closeBtn);
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { position: 'relative', width: 'min(96vw, 520px)', aspectRatio: '9 / 16', maxHeight: '96vh' });
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 854;
    Object.assign(canvas.style, {
      width: '100%', height: '100%', display: 'block',
      borderRadius: '16px', background: 'linear-gradient(#0e1520, #0a111a)',
      boxShadow: '0 20px 60px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06)'
    });
    const hud = document.createElement('div');
    Object.assign(hud.style, {
      position: 'absolute', inset: '10px 10px auto 10px', display: 'flex', gap: '10px',
      alignItems: 'center', background: 'rgba(0,0,0,.45)', padding: '8px 10px',
      borderRadius: '10px', backdropFilter: 'blur(6px)', fontWeight: '700', zIndex: 5
    });
    hud.innerHTML = `
      <div>Прогресс: <b style="color:#00d6a1"><span id="gdProgress">0</span>%</b></div>
      <div>Попытка: <b style="color:#00d6a1"><span id="gdAttempts">1</span></b></div>
      <div>Скорость: <b style="color:#00d6a1"><span id="gdSpeed">0</span> км/ч</b></div>`;
    const help = document.createElement('div');
    help.innerHTML = 'Прыжок: тап по экрану. Держи — автопрыжок. <span class="badge">P</span> — пауза.';
    Object.assign(help.style, {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,.45)', padding: '14px 16px', borderRadius: '12px',
      textAlign: 'center', backdropFilter: 'blur(6px)', fontWeight: '600', maxWidth: '90%',
      opacity: .95, transition: 'opacity .25s ease', zIndex: 4
    });
    const pausedOv = document.createElement('div');
    pausedOv.textContent = 'Пауза';
    Object.assign(pausedOv.style, {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,.45)', padding: '14px 16px', borderRadius: '12px',
      textAlign: 'center', backdropFilter: 'blur(6px)', fontWeight: '700', display: 'none', zIndex: 6
    });
    const gameoverOv = document.createElement('div');
    Object.assign(gameoverOv.style, {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,.45)', padding: '14px 16px', borderRadius: '12px',
      textAlign: 'center', backdropFilter: 'blur(6px)', fontWeight: '700', display: 'none', zIndex: 7
    });
    gameoverOv.innerHTML = `
      💥 Проигрыш!<br/>
      Прогресс: <span id="gdFinalProgress">0</span>%<br/>
      <div style="margin-top:10px;">
        <button id="gdContinueBtn" class="btn btn-primary" style="border:none;background:#00d6a1;color:#fff;padding:10px 14px;border-radius:10px;cursor:pointer;font-weight:800;">
          Продолжить игру
        </button>
      </div>`;
    const winOv = document.createElement('div');
    Object.assign(winOv.style, {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,.45)', padding: '14px 16px', borderRadius: '12px',
      textAlign: 'center', backdropFilter: 'blur(6px)', fontWeight: '700', display: 'none', zIndex: 7
    });
    winOv.innerHTML = `
      ⭐ Победа!<br/>
      Пройдено: <span id="gdFinalProgressWin">100</span>%<br/>
      <div style="margin-top:10px;">
        <button id="gdContinueAfterWin" class="btn btn-primary" style="border:none;background:#00d6a1;color:#fff;padding:10px 14px;border-radius:10px;cursor:pointer;font-weight:800;">
          Продолжить игру
        </button>
      </div>`;
    const quizModal = document.createElement('div');
    Object.assign(quizModal.style, { position: 'absolute', inset: 0, display: 'none', placeItems: 'center', background: 'rgba(0,0,0,.45)', borderRadius: '16px', zIndex: 8 });
    const quizCard = document.createElement('div');
    Object.assign(quizCard.style, { background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.15)', padding: '14px 16px', borderRadius: '12px', textAlign: 'center', fontWeight: '800', minWidth: '60%' });
    const quizContent = document.createElement('div');
    quizCard.appendChild(quizContent);
    quizModal.appendChild(quizCard);
    wrap.appendChild(canvas);
    wrap.appendChild(hud);
    wrap.appendChild(help);
    wrap.appendChild(pausedOv);
    wrap.appendChild(gameoverOv);
    wrap.appendChild(winOv);
    wrap.appendChild(quizModal);
    overlay.appendChild(topBar);
    overlay.appendChild(wrap);
    document.body.appendChild(overlay);
    const W = 480, H = 854;
    const ctx = canvas.getContext('2d');
    const elProgress = hud.querySelector('#gdProgress');
    const elAttempts = hud.querySelector('#gdAttempts');
    const elSpeed = hud.querySelector('#gdSpeed');
    const elFinalProgress = gameoverOv.querySelector('#gdFinalProgress');
    const elFinalProgressWin = winOv.querySelector('#gdFinalProgressWin');
    const groundY = H - 120, groundH = 24;
    const cube = { x: 140, y: groundY - 42, w: 42, h: 42, vy: 0, onGround: true, angle: 0 };
    const GRAV = 2600, JUMP_V = 720, COYOTE = 0.08, JUMP_BUFFER = 0.18;
    let coyoteTimer = 0, jumpBufferTimer = 0, inputHeld = false;
    let speed = 320, minSpeed = 320, maxSpeed = 520, accel = 10, M_PER_PX = 0.05;
    let scrollX = 0, distWorld = 0;
    let obstacles = [];
    let finishX = 7000;
    let cursorX = 0;
    let rngSeed = (Math.random() * 1e9) | 0;
    let paused = false, gameOver = false, win = false, attempts = 1;
    let shakeT = 0, hitFlash = 0;
    const keyDown = (e) => {
      const c = e.code;
      if (gameOver || win) return;
      if (c === 'Space' || c === 'KeyW' || c === 'ArrowUp') { e.preventDefault(); pressJump(); }
      if (c === 'KeyP') { e.preventDefault(); togglePause(); }
    };
    const keyUp = (e) => {
      const c = e.code;
      if (c === 'Space' || c === 'KeyW' || c === 'ArrowUp') releaseJump();
    };
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
    canvas.addEventListener('pointerdown', () => pressJump(), { passive: true });
    canvas.addEventListener('pointerup', () => releaseJump(), { passive: true });
    canvas.addEventListener('touchstart', () => pressJump(), { passive: true });
    canvas.addEventListener('touchend', () => releaseJump(), { passive: true });
    function pressJump() {
      inputHeld = true;
      jumpBufferTimer = JUMP_BUFFER;
      hideHelpSoon();
    }
    function releaseJump() { inputHeld = false; }
    function togglePause() {
      if (gameOver || win) return;
      paused = !paused;
      pausedOv.style.display = paused ? 'block' : 'none';
    }
    let helpTimer = null;
    function hideHelpSoon() {
      if (helpTimer) return;
      helpTimer = setTimeout(() => help.style.opacity = '0', 450);
    }
    function rnd() {
      rngSeed = (1103515245 * rngSeed + 12345) & 0x7fffffff;
      return rngSeed / 0x7fffffff;
    }
    function choice(arr) { return arr[Math.floor(rnd() * arr.length)]; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function resetLevel() {
      scrollX = 0; distWorld = 0; speed = 320;
      obstacles = []; rngSeed = (Math.random() * 1e9) | 0;
      cursorX = 520; finishX = 6800 + Math.floor(rnd() * 1200);
      while (cursorX < finishX - 400) placePattern();
      makeBlock(finishX, 240, 36, groundY - 36);
    }
    function space(d = 120) { cursorX += d; }
    function patSingleSpike() { space(140); makeSpike(cursorX, groundY, 30, 36); space(150); }
    function patDoubleSpike() { space(150); makeSpike(cursorX, groundY, 28, 34); makeSpike(cursorX + 48, groundY, 28, 34); space(170); }
    function patTripleSpike() { space(160); const w = 28, h = 34, gap = 38; makeSpike(cursorX, groundY, w, h); makeSpike(cursorX + gap, groundY, w, h); makeSpike(cursorX + gap * 2, groundY, w, h); space(200); }
    function patBlockLow() { space(140); const bw = 160, bh = 48; makeBlock(cursorX, bw, bh, groundY - bh); space(bw + 140); }
    function patBlockHigh() { space(160); const bw = 180, bh = 70; makeBlock(cursorX, bw, bh, groundY - bh); makeSpike(cursorX + bw - 44, groundY - bh, 26, 30); space(bw + 200); }
    function patBlockThenSpike() { space(140); const bw = 140, bh = 52; makeBlock(cursorX, bw, bh, groundY - bh); makeSpike(cursorX + bw + 36, groundY, 28, 34); space(bw + 200); }
    function patStairs() { space(140); const bw = 120, step = 36; makeBlock(cursorX, bw, step, groundY - step); makeBlock(cursorX + bw + 20, bw, step * 2, groundY - step * 2); makeSpike(cursorX + bw * 2 + 40, groundY, 28, 34); space(bw * 2 + 220); }
    function placePattern() { choice([patSingleSpike, patDoubleSpike, patTripleSpike, patBlockLow, patBlockHigh, patBlockThenSpike, patStairs])(); }
    function makeBlock(x, w, h, yTop) { obstacles.push({ type: 'block', x, y: yTop, w, h }); }
    function makeSpike(xLeft, baseY, w = 28, h = 34) { obstacles.push({ type: 'spike', x: xLeft, y: baseY, w, h }); }
    function doJump() { cube.vy = -JUMP_V; cube.onGround = false; coyoteTimer = 0; jumpBufferTimer = 0; }
    let started = false, rafId = null, prev = performance.now();
    function startLoop() {
      if (started) return;
      started = true; prev = performance.now();
      rafId = requestAnimationFrame(loop);
    }
    function stopLoop() { started = false; if (rafId) cancelAnimationFrame(rafId); }
    function loop(t) {
      const dt = Math.min(0.033, (t - prev) / 1000);
      prev = t;
      if (!paused && !gameOver && !win) update(dt);
      render();
      rafId = requestAnimationFrame(loop);
    }
    function update(dt) {
      speed = clamp(speed + accel * dt, minSpeed, maxSpeed);
      scrollX += speed * dt;
      distWorld += speed * dt;
      const progress = clamp(Math.floor((scrollX / finishX) * 100), 0, 100);
      elProgress.textContent = progress;
      elSpeed.textContent = Math.round(speed * (M_PER_PX * 3.6));
      if (jumpBufferTimer > 0) jumpBufferTimer -= dt;
      if (!cube.onGround && coyoteTimer > 0) coyoteTimer -= dt;
      if ((cube.onGround || coyoteTimer > 0) && (inputHeld || jumpBufferTimer > 0)) {
        doJump();
      }
      const prevY = cube.y;
      cube.vy += GRAV * dt;
      cube.y += cube.vy * dt;
      cube.onGround = false;
      if (cube.y + cube.h >= groundY) {
        if (prevY + cube.h <= groundY) {
          cube.y = groundY - cube.h; cube.vy = 0; cube.onGround = true; coyoteTimer = COYOTE;
        } else {
          cube.y = groundY - cube.h; cube.vy = 0; cube.onGround = true; coyoteTimer = COYOTE;
        }
      }
      const px = cube.x, py = cube.y, pw = cube.w, ph = cube.h;
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        const sx = o.x - scrollX;
        if (sx + (o.w || 30) < -200) { obstacles.splice(i, 1); continue; }
        if (o.type === 'block') {
          const bx = sx, by = o.y, bw = o.w, bh = o.h;
          if (rectOverlap(px, py, pw, ph, bx, by, bw, bh)) {
            const prevBottom = prevY + ph; const top = by;
            if (prevBottom <= top + 0.5 && cube.vy >= 0) {
              cube.y = top - ph; cube.vy = 0; cube.onGround = true; coyoteTimer = COYOTE;
            } else {
              return onHit(progress);
            }
          }
        } else if (o.type === 'spike') {
          const tri = { x: sx, y: o.y, w: o.w, h: o.h };
          const bl = { x: px + 4, y: py + ph - 2 };
          const br = { x: px + pw - 4, y: py + ph - 2 };
          const bc = { x: px + pw / 2, y: py + ph - 2 };
          if (pointInSpike(bl, tri) || pointInSpike(br, tri) || pointInSpike(bc, tri)) {
            return onHit(progress);
          }
        }
      }
      if (!cube.onGround) {
        cube.angle += 6.0 * dt;
        if (cube.angle > Math.PI * 2) cube.angle -= Math.PI * 2;
      } else {
        const snap = Math.round(cube.angle / (Math.PI / 2)) * (Math.PI / 2);
        cube.angle = lerp(cube.angle, snap, Math.min(1, dt * 12));
      }
      if (scrollX + cube.x + cube.w >= finishX) {
        onWin();
      }
    }
    function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
      return !(ax + aw <= bx || ax >= bx + bw || ay + ah <= by || ay >= by + bh);
    }
    function pointInSpike(p, tri) {
      const x0 = tri.x, y0 = tri.y, w = tri.w, h = tri.h;
      if (p.x < x0 || p.x > x0 + w || p.y < y0 - h || p.y > y0) return false;
      const ax = x0 + w / 2, ay = y0 - h;
      const mL = -2 * h / w; const mR = 2 * h / w;
      const yLeft = ay + mL * (p.x - ax);
      const yRight = ay + mR * (p.x - ax);
      return p.y >= yLeft && p.y >= yRight && p.y <= y0;
    }
    function onHit(progress) {
      gameOver = true; shakeT = 0.5; hitFlash = 0.35;
      elFinalProgress.textContent = String(progress);
      gameoverOv.style.display = 'block';
      pausedOv.style.display = 'none';
      stopLoop();
    }
    function onWin() {
      win = true;
      elFinalProgressWin.textContent = '100';
      winOv.style.display = 'block';
      pausedOv.style.display = 'none';
      stopLoop();
    }
    function restart() {
      attempts += 1; elAttempts.textContent = attempts;
      cube.x = 140; cube.y = groundY - cube.h; cube.vy = 0; cube.onGround = true; cube.angle = 0;
      paused = false; gameOver = false; win = false;
      gameoverOv.style.display = 'none';
      winOv.style.display = 'none';
      pausedOv.style.display = 'none';
      resetLevel();
    }
    function render() {
      const shakeAmt = (shakeT > 0) ? (6 * Math.pow(shakeT, 0.6)) : 0;
      const sx = (Math.random() * 2 - 1) * shakeAmt;
      const sy = (Math.random() * 2 - 1) * shakeAmt;
      if (shakeT > 0) shakeT -= 1 / 60;
      if (hitFlash > 0) hitFlash -= 1 / 60;
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.translate(sx, sy);
      ctx.save();
      const stripes = 8;
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#9ad1ff';
      for (let i = 0; i <= stripes; i++) {
        const y = (i / stripes) * H + ((scrollX * 0.2) % (H / stripes));
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y + 30);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#1d2733';
      ctx.fillRect(0, groundY, W, groundH);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      const grid = 30;
      const off = -((scrollX * 0.6) % grid);
      for (let x = off; x < W; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, groundY); ctx.lineTo(x, H); ctx.stroke();
      }
      ctx.restore();
      for (const o of obstacles) {
        const x = o.x - scrollX;
        if (x > W + 200) continue;
        if (o.type === 'block') {
          ctx.fillStyle = '#2e3b47';
          roundRect(ctx, x, o.y, o.w, o.h, 6); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          roundRect(ctx, x + 6, o.y + 6, o.w - 12, 10, 4); ctx.fill();
        } else if (o.type === 'spike') {
          drawSpike(x, o.y, o.w, o.h);
        }
      }
      const shW = cube.w * (0.9 - Math.min(0.6, Math.max(0, -cube.vy) / 900) * 0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, cube.x + (cube.w - shW) / 2, groundY + 12, shW, 10, 6); ctx.fill();
      const cx = cube.x + cube.w / 2;
      const cy = cube.y + cube.h / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(cube.angle);
      const bodyGrad = ctx.createLinearGradient(-cube.w / 2, -cube.h / 2, cube.w / 2, cube.h / 2);
      bodyGrad.addColorStop(0, '#ff8a65');
      bodyGrad.addColorStop(1, '#ff5252');
      ctx.fillStyle = bodyGrad;
      roundRect(ctx, -cube.w / 2, -cube.h / 2, cube.w, cube.h, 6); ctx.fill();
      ctx.fillStyle = '#111';
      roundRect(ctx, -cube.w * 0.15, -cube.h * 0.15, cube.w * 0.3, cube.h * 0.3, 3); ctx.fill();
      ctx.restore();
      if (hitFlash > 0) {
        const a = Math.max(0, Math.min(0.35, hitFlash * 1.5));
        ctx.fillStyle = `rgba(255,0,0,${a})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      function roundRect(ctx2, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx2.beginPath();
        ctx2.moveTo(x + r, y);
        ctx2.arcTo(x + w, y, x + w, y + h, r);
        ctx2.arcTo(x + w, y + h, x, y + h, r);
        ctx2.arcTo(x, y + h, x, y, r);
        ctx2.arcTo(x, y, x + w, y, r);
        ctx2.closePath();
      }
      function drawSpike(x, baseY, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.moveTo(x + 2, baseY + 6);
        ctx.lineTo(x + w - 2, baseY + 6);
        ctx.lineTo(x + w / 2, baseY - h + 10);
        ctx.closePath(); ctx.fill();
        const grad = ctx.createLinearGradient(0, baseY - h, 0, baseY);
        grad.addColorStop(0, '#8bd0ff');
        grad.addColorStop(1, '#4ea6e0');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x + w, baseY);
        ctx.lineTo(x + w / 2, baseY - h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(x + 4, baseY - 2);
        ctx.lineTo(x + w / 2, baseY - h + 4);
        ctx.lineTo(x + w - 4, baseY - 2);
        ctx.stroke();
      }
    }
    const appRef = this;
    function showGate(onSuccess) {
      let needed = 3, count = 0;
      paused = true;
      quizModal.style.display = 'grid';
      nextCard();
      function nextCard() {
        const pool = (appRef.learningWords || []).filter(w => !w.isLearned);
        if (!pool.length) {
          quizContent.innerHTML = `<div>Недостаточно слов для игры</div>`;
          return;
        }
        const word = pool[Math.floor(Math.random() * pool.length)];
        const direction = Math.random() < 0.5 ? 'EN_RU' : 'RU_EN';
        const questionText = direction === 'EN_RU' ? word.word : word.translation;
        const correct = direction === 'EN_RU' ? word.translation : word.word;
        const options = appRef.buildQuizOptions(word, direction);
        const shuffled = appRef.shuffle(options);
        quizContent.innerHTML = `
          <div style="font-weight:700;margin-bottom:6px;">Ответьте правильно на 3 слова, чтобы продолжить</div>
          <div style="font-size:12px;color:var(--text-secondary,#cbd5e1);margin-bottom:10px;">Правильных ответов: ${count}/${needed}</div>
          <div class="quiz-container">
            <div class="quiz-question">${questionText}</div>
            <div class="quiz-sub">Выберите правильный вариант</div>
            <div class="quiz-options">
              ${shuffled.map(opt => `<div class="quiz-option" data-v="${appRef.safeAttr(opt)}">${opt}</div>`).join('')}
            </div>
          </div>`;
        quizContent.querySelectorAll('.quiz-option').forEach(o => o.addEventListener('click', () => {
          const chosen = o.getAttribute('data-v');
          const ok = chosen === correct;
          o.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) quizContent.querySelectorAll('.quiz-option').forEach(x => { if (x.getAttribute('data-v') === correct) x.classList.add('correct'); });
          setTimeout(() => {
            if (ok) count++;
            if (count >= needed) {
              quizModal.style.display = 'none';
              paused = false;
              onSuccess?.();
            } else {
              nextCard();
            }
          }, 450);
        }));
      }
    }
    showGate(() => { resetLevel(); startLoop(); });
    gameoverOv.querySelector('#gdContinueBtn').addEventListener('click', () => {
      showGate(() => { restart(); startLoop(); });
    });
    winOv.querySelector('#gdContinueAfterWin').addEventListener('click', () => {
      showGate(() => { restart(); startLoop(); });
    });
    closeBtn.onclick = () => {
      stopLoop();
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', keyDown);
      document.removeEventListener('keyup', keyUp);
    };
  }

 function open2048Game() { if ((this.learningWords || []).filter(w => !w.isLearned).length < 4) { this.showNotification('Чтобы играть, добавьте минимум 4 слова в «Изучаю»', 'warning'); return; }

const overlay = document.createElement('div'); Object.assign(overlay.style, { position: 'fixed', inset: 0, zIndex: 999999, background: 'radial-gradient(1200px 800px at 50% -10%, #0a1a26 0%, #070e16 60%, #04080d 100%)', display: 'grid', placeItems: 'center', touchAction: 'none' });

// Topbar const topBar = document.createElement('div'); Object.assign(topBar.style, { position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: 'min(96vw, 900px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000000, pointerEvents: 'auto', gap: '10px', padding: '0 10px' });

const pauseQuizBtn = document.createElement('button'); pauseQuizBtn.textContent = 'Пауза/Квиз'; Object.assign(pauseQuizBtn.style, { height: '42px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.25)', color: '#fff', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', cursor: 'pointer', fontSize: '14px', padding: '0 14px', fontWeight: '800' });

const closeBtn = document.createElement('button'); closeBtn.innerHTML = '<i class="fas fa-times"></i>'; Object.assign(closeBtn.style, { width: '42px', height: '42px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.25)', color: '#fff', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' });

topBar.appendChild(pauseQuizBtn); topBar.appendChild(closeBtn);

// Wrapper под игру (соотношение 9:16 как у мобилки) const wrap = document.createElement('div'); Object.assign(wrap.style, { position: 'relative', width: 'min(96vw, 900px)', aspectRatio: '9 / 16', maxHeight: '96vh', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06)', background: 'linear-gradient(#0e1520, #0a111a)' });

// Квиз-модалка (оверлей) const quizModal = document.createElement('div'); Object.assign(quizModal.style, { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.55)', borderRadius: '16px', zIndex: 8 });

const quizCard = document.createElement('div'); Object.assign(quizCard.style, { background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.15)', padding: '14px 16px', borderRadius: '12px', textAlign: 'center', fontWeight: '800', minWidth: '60%', color: '#fff' });

const quizContent = document.createElement('div'); quizCard.appendChild(quizContent); quizModal.appendChild(quizCard);

// iframe с Subway Surfers (через srcdoc + base href и скрипты) const iframe = document.createElement('iframe'); Object.assign(iframe.style, { width: '100%', height: '100%', border: '0', display: 'block', background: '#000' }); iframe.setAttribute('allow', 'fullscreen');

const srcdocHtml = `<!DOCTYPE html>

<html> <head> <base href="https://rawcdn.githack.com/genizy/subway-surfers/829234f4d9f0bc46347e67b0a8d3b033dc70a589/"> <meta charset="utf-8" /> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <title>Subway Surfers</title> <link rel="icon" href="img/FirstAvatar.png"> <script type="text/javascript" src="4399.z.js"></script> <script> window.config = { loader: "unity", debug: false, maxRatio: 16 / 9, minRatio: 9 / 16, title: "Subway Surfers: San Francisco", unityVersion: "2019.4.18f1", unityWebglBuildUrl: "Build/SanFrancisco.json", fileSize: 35, cachedDecompressedFileSizes: { "SanFrancisco.asm.code.unityweb": 9077143, "SanFrancisco.asm.framework.unityweb": 86369, "SanFrancisco.asm.memory.unityweb": 951447, "SanFrancisco.data.unityweb": 18323917, "SanFrancisco.wasm.code.unityweb": 7279617, "SanFrancisco.wasm.framework.unityweb": 90693 } }; </script> </head> <body style="margin:0; background:#000;"> <script src="master-loader.js"></script> </body> </html>`;
iframe.srcdoc = srcdocHtml;

wrap.appendChild(quizModal); // сначала показываем квиз; сам iframe добавим после прохождения ворот overlay.appendChild(topBar); overlay.appendChild(wrap); document.body.appendChild(overlay);

const appRef = this;

function showGate(onSuccess) { let needed = 3, count = 0;

// Обновление карточки квиза
function updateCard() {
  const pool = (appRef.learningWords || []).filter(w => !w.isLearned);
  if (!pool.length) {
    quizContent.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-question" style="margin-bottom:8px;">Недостаточно слов</div>
        <div class="quiz-sub" style="opacity:.8;">Добавьте слова в «Изучаю»</div>
      </div>`;
    return;
  }
  const word = pool[Math.floor(Math.random() * pool.length)];
  const direction = Math.random() < 0.5 ? 'EN_RU' : 'RU_EN';
  const questionText = direction === 'EN_RU' ? word.word : word.translation;
  const correct = direction === 'EN_RU' ? word.translation : word.word;
  const options = appRef.buildQuizOptions(word, direction);
  const shuffled = appRef.shuffle(options);

  quizContent.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px;">Ответьте правильно на 3 слова, чтобы продолжить</div>
    <div style="font-size:12px;color:#cbd5e1;margin-bottom:10px;">Правильных ответов: ${count}/${needed}</div>
    <div class="quiz-container">
      <div class="quiz-question">${questionText} ${direction === 'EN_RU' ? `<button class="action-btn play-btn" style="margin-left:10px;border:none;background:transparent;color:#fff;cursor:pointer;" onclick="window.parent && window.parent.app ? window.parent.app.playAudio('${appRef.safeAttr(word.word)}') : null"><i class="fas fa-volume-up"></i></button>` : ''}</div>
      <div class="quiz-sub">Выберите правильный вариант</div>
      <div class="quiz-options" id="subwayQuizOpts">
        ${shuffled.map(opt => `<div class="quiz-option" data-val="${appRef.safeAttr(opt)}">${opt}</div>`).join('')}
      </div>
    </div>`;

  const opts = quizContent.querySelectorAll('.quiz-option');
  opts.forEach(o => o.addEventListener('click', () => {
    const chosen = o.getAttribute('data-val');
    const ok = chosen === correct;
    o.classList.add(ok ? 'correct' : 'wrong');
    if (!ok) opts.forEach(x => { if (x.getAttribute('data-val') === correct) x.classList.add('correct'); });
    if (direction === 'RU_EN' && ok) {
      appRef.playAudio(word.word);
    }
    setTimeout(() => {
      if (ok) count++;
      if (count >= needed) {
        quizModal.style.display = 'none';
        onSuccess && onSuccess();
      } else {
        updateCard();
      }
    }, 450);
  }));
}

// Показ модалки
quizModal.style.display = 'grid';
updateCard();
}

// Стартовые «квиз-ворота» → по прохождению добавляем iframe (чтобы не грел движок пока нет доступа) showGate(() => { // Только после прохождения квиза добавляем саму игру wrap.appendChild(iframe); });

// Кнопка «Пауза/Квиз» — вызывает тот же квиз; после 3 правильных оверлей исчезнет pauseQuizBtn.onclick = () => { showGate(() => { // ничего не делаем — просто скрыли квиз }); };

closeBtn.onclick = () => { // Удаляем оверлей и все вложенное document.body.removeChild(overlay); }; }

document.addEventListener('DOMContentLoaded', () => { window.app = new EnglishWordsApp(); });
