// ===== DATA SOAL (bank soal — bisa ditambah / diganti) =====
const questionPool = [
    { question: "Tag HTML mana yang dipakai untuk judul terbesar?", options: ["<h6>", "<h1>", "<head>", "<title>"], answer: 1 },
    { question: "Properti CSS untuk mengubah warna teks adalah...", options: ["font-color", "text-color", "color", "foreground"], answer: 2 },
    { question: "Method JavaScript untuk menambah elemen di akhir array adalah...", options: ["push()", "pop()", "shift()", "unshift()"], answer: 0 },
    { question: "Atribut HTML yang wajib ada pada <img> untuk aksesibilitas adalah...", options: ["title", "alt", "href", "name"], answer: 1 },
    { question: "Keyword untuk mendeklarasikan variabel yang tidak bisa diubah nilainya (ES6) adalah...", options: ["var", "let", "const", "static"], answer: 2 },
    { question: "Elemen semantik HTML5 untuk bagian navigasi adalah...", options: ["<menu>", "<nav>", "<links>", "<navigate>"], answer: 1 },
    { question: "Layout CSS satu dimensi yang cocok untuk menata item dalam baris/kolom adalah...", options: ["Flexbox", "Float", "Table", "Position"], answer: 0 },
    { question: "Method untuk memilih elemen berdasarkan ID di DOM adalah...", options: ["getElement()", "querySelectorAll()", "getElementById()", "findById()"], answer: 2 },
    { question: "Hasil dari typeof \"halo\" di JavaScript adalah...", options: ["text", "string", "char", "word"], answer: 1 },
    { question: "Event JavaScript yang terjadi saat elemen diklik adalah...", options: ["onpress", "onhover", "onclick", "ontouch"], answer: 2 }
];

// ===== KONSTANTA & STATE =====
const TOTAL_QUESTIONS = 5;
const TIME_PER_QUESTION = 15;
const HIGH_SCORE_KEY = "quizHighScore";
const THEME_KEY = "quizTheme";

let questions = [];
let currentIndex = 0;
let score = 0;
let timeLeft = TIME_PER_QUESTION;
let timerId = null;
let answered = false;

// ===== ELEMEN DOM =====
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const questionText = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const questionCard = document.getElementById("questionCard");
const nextBtn = document.getElementById("nextBtn");
const timerEl = document.getElementById("timer");
const counterEl = document.getElementById("questionCounter");
const progressFill = document.getElementById("progressFill");
const progressTrack = document.getElementById("progressTrack");

// ===== UTILITAS =====
// Fisher-Yates shuffle agar urutan soal acak setiap sesi
const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const showScreen = (screen) => {
    [startScreen, quizScreen, resultScreen].forEach((s) => s.classList.add("hidden"));
    screen.classList.remove("hidden");
};

// ===== HIGH SCORE (localStorage) =====
const getHighScore = () => Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;

const renderHighScore = () => {
    const value = getHighScore();
    document.getElementById("highScoreStart").textContent = value;
    document.getElementById("highScoreResult").textContent = value;
};

// ===== TIMER PER SOAL =====
const stopTimer = () => clearInterval(timerId);

const startTimer = () => {
    timeLeft = TIME_PER_QUESTION;
    updateTimerDisplay();
    stopTimer();

    timerId = setInterval(() => {
        timeLeft -= 1;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            stopTimer();
            handleTimeout();
        }
    }, 1000);
};

const updateTimerDisplay = () => {
    timerEl.textContent = `⏱ ${timeLeft}`;
    timerEl.classList.toggle("danger", timeLeft <= 5);
};

// ===== RENDER SOAL (createElement + textContent, tanpa innerHTML) =====
const renderQuestion = () => {
    const current = questions[currentIndex];
    answered = false;

    questionText.textContent = current.question;
    feedbackEl.textContent = "";
    nextBtn.classList.add("hidden");
    optionsEl.replaceChildren(); // kosongkan pilihan lama

    current.options.forEach((optionText, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-btn";
        btn.textContent = optionText;
        btn.dataset.index = index;
        optionsEl.appendChild(btn);
    });

    counterEl.textContent = `Soal ${currentIndex + 1} / ${questions.length}`;
    const percent = (currentIndex / questions.length) * 100;
    progressFill.style.width = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", Math.round(percent));

    // animasi transisi antar soal: restart animasi CSS
    questionCard.classList.remove("animate");
    void questionCard.offsetWidth;
    questionCard.classList.add("animate");

    startTimer();
};

// ===== EVENT DELEGATION — satu listener untuk semua pilihan jawaban =====
optionsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".option-btn");
    if (!btn || answered) return;
    handleAnswer(Number(btn.dataset.index));
});

const lockOptions = (correctIndex, chosenIndex) => {
    // Array method: Array.from + forEach untuk memberi feedback visual ke tiap pilihan
    Array.from(optionsEl.children).forEach((btn, index) => {
        btn.disabled = true;
        if (index === correctIndex) btn.classList.add("correct");
        else if (index === chosenIndex) btn.classList.add("wrong");
    });
};

const handleAnswer = (chosenIndex) => {
    answered = true;
    stopTimer();

    const correctIndex = questions[currentIndex].answer;
    const isCorrect = chosenIndex === correctIndex;

    if (isCorrect) {
        score += 1;
        feedbackEl.textContent = "✅ Benar!";
    } else {
        feedbackEl.textContent = "❌ Salah. Jawaban yang benar ditandai hijau.";
    }

    lockOptions(correctIndex, chosenIndex);
    showNextButton();
};

const handleTimeout = () => {
    answered = true;
    feedbackEl.textContent = "⏰ Waktu habis! Jawaban yang benar ditandai hijau.";
    lockOptions(questions[currentIndex].answer, -1);
    showNextButton();
};

const showNextButton = () => {
    const isLast = currentIndex === questions.length - 1;
    nextBtn.textContent = isLast ? "Lihat Hasil" : "Soal Berikutnya";
    nextBtn.classList.remove("hidden");
};

nextBtn.addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
        currentIndex += 1;
        renderQuestion();
    } else {
        finishQuiz();
    }
});

// ===== SELESAI & HASIL =====
const finishQuiz = () => {
    stopTimer();
    progressFill.style.width = "100%";

    document.getElementById("finalScore").textContent = score;

    const highScore = getHighScore();
    let message = "Terus berlatih, kamu pasti bisa lebih baik!";

    if (score > highScore) {
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
        message = "🎉 Rekor baru! Skor tertinggi kamu diperbarui.";
    } else if (score === questions.length) {
        message = "Sempurna! Semua jawaban benar.";
    } else if (score >= 3) {
        message = "Bagus! Kamu sudah cukup menguasai materi ini.";
    }

    document.getElementById("resultMessage").textContent = message;
    renderHighScore();
    showScreen(resultScreen);
};

// ===== MULAI / RESTART (SPA — tanpa reload halaman) =====
const startQuiz = () => {
    questions = shuffle(questionPool).slice(0, TOTAL_QUESTIONS);
    currentIndex = 0;
    score = 0;
    showScreen(quizScreen);
    renderQuestion();
};

document.getElementById("startBtn").addEventListener("click", startQuiz);
document.getElementById("restartBtn").addEventListener("click", startQuiz);

// ===== DARK MODE =====
const root = document.documentElement;
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) root.setAttribute("data-theme", savedTheme);

document.getElementById("themeBtn").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
});

// ===== INISIALISASI =====
renderHighScore();