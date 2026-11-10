/**
 * HAAS PRESENTS – DISCOVER KELAA
 * Advanced Interactive Quiz Engine (js/quiz.js)
 * Features:
 * - Fisher-Yates shuffle algorithm for true randomisation
 * - Selects 15 random MCQs (from 60) + 15 random True/False questions (from 60) = 30 marks per attempt
 * - Randomises MCQ answer option positions while preserving correct answer tracking
 * - Fresh question set generated every time Quiz tab opens or "NEW QUIZ" is clicked
 * - Step-by-step OR Full-list view modes, live progress bar, Next/Prev navigation, in-page confirmation modal
 * - Results breakdown, performance tier badge, HTML5 Canvas celebratory confetti, and full answer review
 */

(function() {
  const QUIZ_STATE = {
    mcqList: [],       // 15 selected & option-shuffled MCQs
    tfList: [],        // 15 selected T/F questions
    mcqAnswers: {},    // index (0..14) -> selected option string
    tfAnswers: {},     // index (0..14) -> boolean (true / false)
    activeSection: 'mcq', // 'mcq' | 'tf' | 'all'
    currentIndex: 0,   // 0..29 in step-by-step mode
    displayMode: 'all', // 'all' | 'step'
    submitted: false,
    attemptCount: 0,
    confettiFrame: null
  };

  /**
   * Fisher-Yates Shuffle Algorithm
   * Returns a new shuffled shallow copy of the array.
   */
  function fisherYatesShuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  /**
   * Generates a fresh 30-question quiz (15 MCQs + 15 True/False)
   */
  function generateNewQuiz(showToastMsg) {
    const mcqBank = window.KELAA_MCQ_BANK || [];
    const tfBank = window.KELAA_TF_BANK || [];

    const shuffledMcq = fisherYatesShuffle(mcqBank).slice(0, 15).map(function(q, idx) {
      return {
        id: q.id,
        num: idx + 1,
        category: q.category,
        question: q.question,
        options: fisherYatesShuffle(q.options),
        answer: q.answer,
        explanation: q.explanation
      };
    });

    const shuffledTf = fisherYatesShuffle(tfBank).slice(0, 15).map(function(q, idx) {
      return {
        id: q.id,
        num: idx + 1,
        category: q.category,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation
      };
    });

    QUIZ_STATE.mcqList = shuffledMcq;
    QUIZ_STATE.tfList = shuffledTf;
    QUIZ_STATE.mcqAnswers = {};
    QUIZ_STATE.tfAnswers = {};
    QUIZ_STATE.activeSection = 'mcq';
    QUIZ_STATE.currentIndex = 0;
    QUIZ_STATE.submitted = false;
    QUIZ_STATE.attemptCount += 1;

    stopConfetti();
    closeQuizConfirmModal();
    renderQuizUI();

    if (showToastMsg && typeof window.showHaasToast === 'function') {
      window.showHaasToast('Fresh set of 30 random questions generated! (Attempt #' + QUIZ_STATE.attemptCount + ')');
    }
  }

  /**
   * Retries the exact same 30-question set (clearing answers but reshuffling MCQ option order)
   */
  function retrySameQuizSet() {
    QUIZ_STATE.mcqList = QUIZ_STATE.mcqList.map(function(q) {
      return Object.assign({}, q, { options: fisherYatesShuffle(q.options) });
    });
    QUIZ_STATE.mcqAnswers = {};
    QUIZ_STATE.tfAnswers = {};
    QUIZ_STATE.activeSection = 'mcq';
    QUIZ_STATE.currentIndex = 0;
    QUIZ_STATE.submitted = false;
    stopConfetti();
    renderQuizUI();
    if (typeof window.showHaasToast === 'function') {
      window.showHaasToast('Quiz reset! Try this question set again.');
    }
  }

  function getAnsweredCounts() {
    const mcqCount = Object.keys(QUIZ_STATE.mcqAnswers).length;
    const tfCount = Object.keys(QUIZ_STATE.tfAnswers).length;
    return {
      mcq: mcqCount,
      tf: tfCount,
      total: mcqCount + tfCount
    };
  }

  function selectQuizSection(section) {
    QUIZ_STATE.activeSection = section;
    if (section === 'mcq' && QUIZ_STATE.currentIndex >= 15) {
      QUIZ_STATE.currentIndex = 0;
    } else if (section === 'tf' && QUIZ_STATE.currentIndex < 15) {
      QUIZ_STATE.currentIndex = 15;
    }
    renderQuizUI();
  }

  function setQuizDisplayMode(mode) {
    QUIZ_STATE.displayMode = mode;
    renderQuizUI();
  }

  function selectMcqOption(qIdx, optIndex) {
    if (QUIZ_STATE.submitted) return;
    const q = QUIZ_STATE.mcqList[qIdx];
    if (!q) return;
    QUIZ_STATE.mcqAnswers[qIdx] = q.options[optIndex];
    renderQuizUI();
  }

  function selectTfOption(qIdx, boolVal) {
    if (QUIZ_STATE.submitted) return;
    QUIZ_STATE.tfAnswers[qIdx] = boolVal;
    renderQuizUI();
  }

  function jumpToQuizQuestion(globalIdx) {
    if (globalIdx < 0) globalIdx = 0;
    if (globalIdx > 29) globalIdx = 29;
    QUIZ_STATE.currentIndex = globalIdx;
    QUIZ_STATE.activeSection = globalIdx < 15 ? 'mcq' : 'tf';
    if (QUIZ_STATE.displayMode !== 'step') {
      const targetId = globalIdx < 15 ? 'quiz-card-mcq-' + globalIdx : 'quiz-card-tf-' + (globalIdx - 15);
      renderQuizUI();
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      renderQuizUI();
    }
  }

  function stepQuizQuestion(delta) {
    let next = QUIZ_STATE.currentIndex + delta;
    if (next < 0) next = 0;
    if (next > 29) next = 29;
    QUIZ_STATE.currentIndex = next;
    QUIZ_STATE.activeSection = next < 15 ? 'mcq' : 'tf';
    renderQuizUI();
  }

  function openQuizConfirmModal() {
    if (QUIZ_STATE.submitted) return;
    const counts = getAnsweredCounts();
    const modal = document.getElementById('quiz-confirm-modal');
    const summaryEl = document.getElementById('quiz-confirm-summary');
    if (summaryEl) {
      const unanswered = 30 - counts.total;
      summaryEl.innerHTML =
        '<div class="confirm-stat-grid">' +
          '<div class="confirm-stat-box"><span>Section A (MCQ)</span><strong>' + counts.mcq + ' / 15</strong></div>' +
          '<div class="confirm-stat-box"><span>Section B (True/False)</span><strong>' + counts.tf + ' / 15</strong></div>' +
          '<div class="confirm-stat-box"><span>Total Answered</span><strong>' + counts.total + ' / 30</strong></div>' +
        '</div>' +
        (unanswered > 0
          ? '<p class="confirm-warning-text">You have <strong>' + unanswered + ' unanswered question(s)</strong>. Unanswered questions receive 0 marks without additional penalty. Would you like to submit now or keep reviewing?</p>'
          : '<p class="confirm-ready-text">All 30 questions answered! Ready to calculate your official Kelaa Knowledge Score?</p>');
    }
    if (modal) {
      modal.classList.add('active');
    }
  }

  function closeQuizConfirmModal() {
    const modal = document.getElementById('quiz-confirm-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  function finalizeQuizSubmission() {
    closeQuizConfirmModal();
    QUIZ_STATE.submitted = true;
    renderQuizUI();
    const resultsPanel = document.getElementById('quiz-results-container');
    if (resultsPanel) {
      resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderMcqCard(q, idx) {
    const selected = QUIZ_STATE.mcqAnswers[idx];
    const letters = ['A', 'B', 'C', 'D'];
    let optionsHtml = '';
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i];
      const isSelected = selected === opt;
      optionsHtml +=
        '<button type="button" class="quiz-option-btn ' + (isSelected ? 'selected' : '') + '" ' +
        'onclick="selectMcqOption(' + idx + ', ' + i + ')">' +
          '<span class="opt-letter">' + letters[i] + '</span>' +
          '<span class="opt-text">' + escapeHtml(opt) + '</span>' +
        '</button>';
    }
    return (
      '<article class="quiz-question-card glass-card" id="quiz-card-mcq-' + idx + '">' +
        '<div class="quiz-q-header">' +
          '<span class="quiz-q-badge">MCQ #' + q.num + ' of 15</span>' +
          '<span class="quiz-cat-pill">' + escapeHtml(q.category) + '</span>' +
          '<span class="quiz-mark-pill">1 Mark</span>' +
        '</div>' +
        '<h4 class="quiz-q-title">' + escapeHtml(q.question) + '</h4>' +
        '<div class="quiz-options-grid">' + optionsHtml + '</div>' +
      '</article>'
    );
  }

  function renderTfCard(q, idx) {
    const selected = QUIZ_STATE.tfAnswers[idx];
    const isTrue = selected === true;
    const isFalse = selected === false;
    return (
      '<article class="quiz-question-card glass-card" id="quiz-card-tf-' + idx + '">' +
        '<div class="quiz-q-header">' +
          '<span class="quiz-q-badge tf-badge">TRUE / FALSE #' + q.num + ' of 15</span>' +
          '<span class="quiz-cat-pill">' + escapeHtml(q.category) + '</span>' +
          '<span class="quiz-mark-pill">1 Mark</span>' +
        '</div>' +
        '<h4 class="quiz-q-title">' + escapeHtml(q.question) + '</h4>' +
        '<div class="quiz-tf-grid">' +
          '<button type="button" class="quiz-tf-btn ' + (isTrue ? 'selected-true' : '') + '" onclick="selectTfOption(' + idx + ', true)">' +
            '<span class="tf-icon">✓</span> TRUE' +
          '</button>' +
          '<button type="button" class="quiz-tf-btn ' + (isFalse ? 'selected-false' : '') + '" onclick="selectTfOption(' + idx + ', false)">' +
            '<span class="tf-icon">✕</span> FALSE' +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function renderQuizUI() {
    const counts = getAnsweredCounts();
    const pct = Math.round((counts.total / 30) * 100);

    // Update top progress indicators
    const progFill = document.getElementById('quiz-live-progress-fill');
    const progText = document.getElementById('quiz-live-progress-text');
    const mcqTabBtn = document.getElementById('quiz-sec-btn-mcq');
    const tfTabBtn = document.getElementById('quiz-sec-btn-tf');
    const allTabBtn = document.getElementById('quiz-sec-btn-all');
    const modeAllBtn = document.getElementById('quiz-mode-all-btn');
    const modeStepBtn = document.getElementById('quiz-mode-step-btn');
    const attemptBadge = document.getElementById('quiz-attempt-badge');

    if (progFill) progFill.style.width = pct + '%';
    if (progText) progText.textContent = counts.total + ' / 30 Answered (' + pct + '%) — MCQ: ' + counts.mcq + '/15 | T/F: ' + counts.tf + '/15';
    if (attemptBadge) attemptBadge.textContent = 'Set #' + QUIZ_STATE.attemptCount + ' (Fisher-Yates Randomised from 120-Question Bank)';

    if (mcqTabBtn) mcqTabBtn.classList.toggle('active', QUIZ_STATE.activeSection === 'mcq');
    if (tfTabBtn) tfTabBtn.classList.toggle('active', QUIZ_STATE.activeSection === 'tf');
    if (allTabBtn) allTabBtn.classList.toggle('active', QUIZ_STATE.activeSection === 'all');

    if (modeAllBtn) modeAllBtn.classList.toggle('active', QUIZ_STATE.displayMode === 'all');
    if (modeStepBtn) modeStepBtn.classList.toggle('active', QUIZ_STATE.displayMode === 'step');

    // Render Question Quick Navigator Pills (1..15 MCQ, 1..15 TF)
    const navGrid = document.getElementById('quiz-question-nav-pills');
    if (navGrid) {
      let pillsHtml = '<div class="q-pill-group"><span class="q-pill-label">Quiz A (MCQ):</span>';
      for (let i = 0; i < 15; i++) {
        const answered = QUIZ_STATE.mcqAnswers[i] !== undefined;
        const isCurrent = QUIZ_STATE.displayMode === 'step' && QUIZ_STATE.currentIndex === i;
        pillsHtml += '<button type="button" class="q-nav-pill ' + (answered ? 'answered' : '') + ' ' + (isCurrent ? 'current' : '') + '" onclick="jumpToQuizQuestion(' + i + ')">' + (i + 1) + '</button>';
      }
      pillsHtml += '</div><div class="q-pill-group"><span class="q-pill-label">Quiz B (T/F):</span>';
      for (let i = 0; i < 15; i++) {
        const answered = QUIZ_STATE.tfAnswers[i] !== undefined;
        const isCurrent = QUIZ_STATE.displayMode === 'step' && QUIZ_STATE.currentIndex === (i + 15);
        pillsHtml += '<button type="button" class="q-nav-pill ' + (answered ? 'answered' : '') + ' ' + (isCurrent ? 'current' : '') + '" onclick="jumpToQuizQuestion(' + (i + 15) + ')">' + (i + 1) + '</button>';
      }
      pillsHtml += '</div>';
      navGrid.innerHTML = pillsHtml;
    }

    const stageEl = document.getElementById('quiz-questions-stage');
    const resultsContainer = document.getElementById('quiz-results-container');
    const activeControlsBar = document.getElementById('quiz-active-controls');

    if (QUIZ_STATE.submitted) {
      if (stageEl) stageEl.style.display = 'none';
      if (activeControlsBar) activeControlsBar.style.display = 'none';
      if (resultsContainer) {
        resultsContainer.style.display = 'block';
        renderQuizResults(resultsContainer);
      }
      return;
    }

    if (resultsContainer) resultsContainer.style.display = 'none';
    if (activeControlsBar) activeControlsBar.style.display = 'flex';
    if (!stageEl) return;
    stageEl.style.display = 'block';

    if (QUIZ_STATE.displayMode === 'step') {
      const gIdx = QUIZ_STATE.currentIndex;
      let cardHtml = '';
      if (gIdx < 15) {
        cardHtml = renderMcqCard(QUIZ_STATE.mcqList[gIdx], gIdx);
      } else {
        const tfIdx = gIdx - 15;
        cardHtml = renderTfCard(QUIZ_STATE.tfList[tfIdx], tfIdx);
      }
      stageEl.innerHTML =
        '<div class="step-mode-wrapper">' +
          '<div class="step-counter-banner">Question ' + (gIdx + 1) + ' of 30 (' + (gIdx < 15 ? 'Quiz A: Multiple Choice' : 'Quiz B: True or False') + ')</div>' +
          cardHtml +
          '<div class="step-nav-bar">' +
            '<button type="button" class="btn-secondary" onclick="stepQuizQuestion(-1)" ' + (gIdx === 0 ? 'disabled' : '') + '>← Previous Question</button>' +
            (gIdx < 29
              ? '<button type="button" class="btn-primary" onclick="stepQuizQuestion(1)">Next Question →</button>'
              : '<button type="button" class="btn-gold" onclick="openQuizConfirmModal()">Review &amp; Submit Quiz ✓</button>') +
          '</div>' +
        '</div>';
    } else {
      let html = '';
      if (QUIZ_STATE.activeSection === 'mcq' || QUIZ_STATE.activeSection === 'all') {
        html +=
          '<div class="quiz-section-block">' +
            '<div class="quiz-section-banner">' +
              '<div><h3>QUIZ A – MULTIPLE CHOICE QUESTIONS</h3><p>15 randomly selected questions • 4 shuffled options per question • 1 mark each (Total: 15 Marks)</p></div>' +
              '<span class="sec-score-badge">' + counts.mcq + ' / 15 Answered</span>' +
            '</div>' +
            '<div class="quiz-cards-list">' +
              QUIZ_STATE.mcqList.map(function(q, i) { return renderMcqCard(q, i); }).join('') +
            '</div>' +
            (QUIZ_STATE.activeSection === 'mcq'
              ? '<div class="quiz-section-footer-nav"><button type="button" class="btn-primary" onclick="selectQuizSection(\'tf\')">Proceed to Quiz B: True or False (15 Marks) →</button></div>'
              : '') +
          '</div>';
      }
      if (QUIZ_STATE.activeSection === 'tf' || QUIZ_STATE.activeSection === 'all') {
        html +=
          '<div class="quiz-section-block">' +
            '<div class="quiz-section-banner tf-banner">' +
              '<div><h3>QUIZ B – TRUE OR FALSE</h3><p>15 randomly selected statements • Choose TRUE or FALSE • 1 mark each (Total: 15 Marks)</p></div>' +
              '<span class="sec-score-badge">' + counts.tf + ' / 15 Answered</span>' +
            '</div>' +
            '<div class="quiz-cards-list">' +
              QUIZ_STATE.tfList.map(function(q, i) { return renderTfCard(q, i); }).join('') +
            '</div>' +
            (QUIZ_STATE.activeSection === 'tf'
              ? '<div class="quiz-section-footer-nav"><button type="button" class="btn-secondary" onclick="selectQuizSection(\'mcq\')">← Back to Quiz A (MCQ)</button></div>'
              : '') +
          '</div>';
      }
      stageEl.innerHTML = html;
    }
  }

  function renderQuizResults(container) {
    let mcqScore = 0;
    let tfScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    let reviewMcqHtml = '';
    for (let i = 0; i < QUIZ_STATE.mcqList.length; i++) {
      const q = QUIZ_STATE.mcqList[i];
      const userAns = QUIZ_STATE.mcqAnswers[i];
      const isUnanswered = userAns === undefined;
      const isCorrect = !isUnanswered && userAns === q.answer;
      if (isCorrect) {
        mcqScore += 1;
        correctCount += 1;
      } else if (isUnanswered) {
        unansweredCount += 1;
      } else {
        incorrectCount += 1;
      }
      reviewMcqHtml +=
        '<div class="review-item-card ' + (isCorrect ? 'review-correct' : (isUnanswered ? 'review-unanswered' : 'review-wrong')) + '">' +
          '<div class="review-item-top">' +
            '<span class="review-q-num">MCQ #' + q.num + ' (' + escapeHtml(q.category) + ')</span>' +
            '<span class="review-status-pill">' + (isCorrect ? '✓ Correct (+1)' : (isUnanswered ? '○ Unanswered (0)' : '✕ Incorrect (0)')) + '</span>' +
          '</div>' +
          '<p class="review-q-text">' + escapeHtml(q.question) + '</p>' +
          '<div class="review-ans-comparison">' +
            '<div><strong>Your Answer:</strong> ' + (isUnanswered ? '<em>Not Answered</em>' : escapeHtml(userAns)) + '</div>' +
            '<div><strong>Correct Answer:</strong> <span class="correct-highlight">' + escapeHtml(q.answer) + '</span></div>' +
          '</div>' +
          '<p class="review-explanation"><strong>Heritage Insight:</strong> ' + escapeHtml(q.explanation) + '</p>' +
        '</div>';
    }

    let reviewTfHtml = '';
    for (let i = 0; i < QUIZ_STATE.tfList.length; i++) {
      const q = QUIZ_STATE.tfList[i];
      const userAns = QUIZ_STATE.tfAnswers[i];
      const isUnanswered = userAns === undefined;
      const isCorrect = !isUnanswered && userAns === q.answer;
      if (isCorrect) {
        tfScore += 1;
        correctCount += 1;
      } else if (isUnanswered) {
        unansweredCount += 1;
      } else {
        incorrectCount += 1;
      }
      reviewTfHtml +=
        '<div class="review-item-card ' + (isCorrect ? 'review-correct' : (isUnanswered ? 'review-unanswered' : 'review-wrong')) + '">' +
          '<div class="review-item-top">' +
            '<span class="review-q-num">T/F #' + q.num + ' (' + escapeHtml(q.category) + ')</span>' +
            '<span class="review-status-pill">' + (isCorrect ? '✓ Correct (+1)' : (isUnanswered ? '○ Unanswered (0)' : '✕ Incorrect (0)')) + '</span>' +
          '</div>' +
          '<p class="review-q-text">' + escapeHtml(q.question) + '</p>' +
          '<div class="review-ans-comparison">' +
            '<div><strong>Your Answer:</strong> ' + (isUnanswered ? '<em>Not Answered</em>' : (userAns ? 'TRUE' : 'FALSE')) + '</div>' +
            '<div><strong>Correct Answer:</strong> <span class="correct-highlight">' + (q.answer ? 'TRUE' : 'FALSE') + '</span></div>' +
          '</div>' +
          '<p class="review-explanation"><strong>Heritage Insight:</strong> ' + escapeHtml(q.explanation) + '</p>' +
        '</div>';
    }

    const totalScore = mcqScore + tfScore;
    const percentage = Math.round((totalScore / 30) * 100);

    let levelTitle = '';
    let levelMessage = '';
    let levelBadgeClass = '';
    if (totalScore >= 27) {
      levelTitle = '27–30: Kelaa Expert! 🏆';
      levelMessage = 'Extraordinary achievement! You possess deep, museum-grade mastery of Kelaa Island\'s history, 1701 coral architecture, Maliku Dhandi traditions, and rare Kelavaki biodiversity.';
      levelBadgeClass = 'tier-expert';
    } else if (totalScore >= 23) {
      levelTitle = '23–26: Excellent Knowledge! 🌟';
      levelMessage = 'Impressive performance! You know Kelaa\'s landmarks, people, and lagoon ecosystems remarkably well.';
      levelBadgeClass = 'tier-excellent';
    } else if (totalScore >= 18) {
      levelTitle = '18–22: Good Understanding! 🌊';
      levelMessage = 'Well done! You have a solid grasp of Kelaa\'s heritage and natural beauty. Review the explanations below to reach Expert status!';
      levelBadgeClass = 'tier-good';
    } else if (totalScore >= 12) {
      levelTitle = '12–17: Keep Exploring! 🧭';
      levelMessage = 'A promising start! Explore the Historical Journey, Culture, and Natural Wonders tabs to uncover more of Kelaa\'s hidden treasures.';
      levelBadgeClass = 'tier-keep';
    } else {
      levelTitle = '0–11: Time to Discover Kelaa! 🏝️';
      levelMessage = 'Every great journey begins with curiosity! Browse the interactive tabs above and try a fresh quiz set whenever you are ready.';
      levelBadgeClass = 'tier-discover';
    }

    container.innerHTML =
      '<div class="results-hero-card glass-card ' + levelBadgeClass + '">' +
        '<canvas id="quiz-confetti-canvas" class="confetti-canvas"></canvas>' +
        '<div class="results-header-content">' +
          '<span class="results-eyebrow">OFFICIAL HAAS KNOWLEDGE ASSESSMENT</span>' +
          '<h3 class="results-tier-heading">' + levelTitle + '</h3>' +
          '<p class="results-encouragement">' + levelMessage + '</p>' +
          '<div class="results-score-grid">' +
            '<div class="res-score-card"><span>Quiz A (MCQ)</span><strong>' + mcqScore + ' / 15</strong></div>' +
            '<div class="res-score-card"><span>Quiz B (True/False)</span><strong>' + tfScore + ' / 15</strong></div>' +
            '<div class="res-score-card highlight-total"><span>Total Score</span><strong>' + totalScore + ' / 30</strong></div>' +
            '<div class="res-score-card highlight-pct"><span>Percentage</span><strong>' + percentage + '%</strong></div>' +
            '<div class="res-score-card"><span>Correct Answers</span><strong class="text-emerald">' + correctCount + '</strong></div>' +
            '<div class="res-score-card"><span>Incorrect / Unanswered</span><strong class="text-coral">' + (incorrectCount + unansweredCount) + ' (' + incorrectCount + 'W / ' + unansweredCount + 'U)</strong></div>' +
          '</div>' +
          '<div class="results-action-buttons">' +
            '<button type="button" class="btn-gold" onclick="generateNewQuiz(true)">🔀 New Question Set (Fresh 30 Questions)</button>' +
            '<button type="button" class="btn-secondary" onclick="retrySameQuizSet()">↻ Retry This Question Set</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="results-review-section">' +
        '<h3 class="section-subheading">Complete Answer Review &amp; Educational Explanations</h3>' +
        '<h4 class="review-group-title">Section A: Multiple Choice Review (' + mcqScore + ' / 15)</h4>' +
        '<div class="review-list-grid">' + reviewMcqHtml + '</div>' +
        '<h4 class="review-group-title">Section B: True or False Review (' + tfScore + ' / 15)</h4>' +
        '<div class="review-list-grid">' + reviewTfHtml + '</div>' +
      '</div>';

    if (totalScore >= 18) {
      startConfetti();
    }
  }

  function startConfetti() {
    stopConfetti();
    const canvas = document.getElementById('quiz-confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 800;
    canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : 420;

    const colors = ['#00f5d4', '#00b4d8', '#f9c74f', '#ff6b6b', '#ffffff'];
    const particles = [];
    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: Math.random() * 2.5 + 1.5,
        vx: (Math.random() - 0.5) * 1.8,
        angle: Math.random() * Math.PI * 2
      });
    }

    let ticks = 0;
    function frame() {
      ticks++;
      if (ticks > 280) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.angle) * 0.6;
        p.angle += 0.05;
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      QUIZ_STATE.confettiFrame = requestAnimationFrame(frame);
    }
    QUIZ_STATE.confettiFrame = requestAnimationFrame(frame);
  }

  function stopConfetti() {
    if (QUIZ_STATE.confettiFrame) {
      cancelAnimationFrame(QUIZ_STATE.confettiFrame);
      QUIZ_STATE.confettiFrame = null;
    }
  }

  // Expose quiz functions globally for HTML onclick handlers
  window.generateNewQuiz = generateNewQuiz;
  window.retrySameQuizSet = retrySameQuizSet;
  window.selectQuizSection = selectQuizSection;
  window.setQuizDisplayMode = setQuizDisplayMode;
  window.selectMcqOption = selectMcqOption;
  window.selectTfOption = selectTfOption;
  window.jumpToQuizQuestion = jumpToQuizQuestion;
  window.stepQuizQuestion = stepQuizQuestion;
  window.openQuizConfirmModal = openQuizConfirmModal;
  window.closeQuizConfirmModal = closeQuizConfirmModal;
  window.finalizeQuizSubmission = finalizeQuizSubmission;
})();
