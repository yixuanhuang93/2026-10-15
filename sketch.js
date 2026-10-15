// ==========================================
// 全域變數設定區
// ==========================================
let allQuestions = [];   // 用來存放從 CSV 讀取到的所有 15 題
let questions = [];      // 每次隨機抽出的 5 道題目
let currentQuestion = 0; // 記錄目前是第幾題（從 0 開始計算）
let score = 0;           // 記錄累積答對的題數
let isAnswered = false;  // 記錄當前題目是否已經被作答過，防止重複點擊

let questionP;           // 存放題目文字的 DOM 元素
let optionButtons = [];  // 存放四個選項按鈕的陣列
let nextBtn;             // 「下一題」按鈕的 DOM 元素
let restartBtn;          // 「重新開始」按鈕的 DOM 元素
let resultP;             // 顯示最後結算成績的 DOM 元素
let titleP;              // 標題文字 DOM 元素

// ==========================================
// p5.js 預先載入函數：讀取 CSV 題庫與注入 CSS 樣式
// ==========================================
function preload() {
  // 載入同目錄下的 questions.csv 檔案（header: true 代表第一列為欄位名稱）
  allQuestions = loadTable('questions.csv', 'csv', 'header');

  // 動態引入 Google Fonts 與 RWD CSS 樣式與動畫
  let cssStyles = `
    /* 引入 Google Fonts: LXGW WenKai Mono TC 與 Isometra */
    @import url('https://fonts.googleapis.com/css2?family=Isometra&family=LXGW+WenKai+Mono+TC&display=swap');

    /* 設定網頁邊距為 0 並隱藏外部卷軸，套用自訂中英文字型 */
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: 'Isometra', 'LXGW WenKai Mono TC', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f0f2f5;
    }
    
    /* 測驗外框容器：支援 RWD 響應式與手機橫向高度保護 */
    #quiz-box {
      background: rgba(255, 255, 255, 0.98);
      padding: 25px 35px;
      border-radius: 15px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      width: 90%;
      max-width: 650px;
      max-height: 90vh;
      overflow-y: auto;
      text-align: center;
      box-sizing: border-box;
      z-index: 10;
    }
    
    /* 題目文字樣式 */
    .question-text {
      font-size: clamp(1rem, 2.5vw, 1.4rem);
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    
    /* 選項按鈕的響應式基礎樣式 */
    .option-btn {
      display: block;
      width: 100%;
      padding: 12px 15px;
      margin: 10px 0;
      font-size: clamp(0.9rem, 2vw, 1.1rem);
      background-color: #ffffff;
      border: 2px solid #bdc3c7;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: background-color 0.2s;
      font-family: 'Isometra', 'LXGW WenKai Mono TC', sans-serif;
    }
    
    /* 滑鼠懸停選項時改變背景色 */
    .option-btn:hover:not(:disabled) {
      background-color: #ecf0f1;
      border-color: #7f8c8d;
    }
    
    /* 控制按鈕樣式 */
    .control-btn {
      margin-top: 20px;
      padding: 10px 25px;
      font-size: clamp(0.9rem, 2vw, 1.0rem);
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: none;
      font-family: 'Isometra', 'LXGW WenKai Mono TC', sans-serif;
    }
    .control-btn:hover {
      background-color: #2980b9;
    }

    /* 正確答案的上下跳動動畫（指定背景顏色 #fdffb6） */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .bounce-anim {
      animation: bounce 0.4s ease infinite;
      background-color: #fdffb6 !important;
      border-color: #f1c40f !important;
    }

    /* 錯誤選項的左右移動動畫（指定背景顏色 #ff4d6d） */
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-6px); }
      75% { transform: translateX(6px); }
    }
    .shake-anim {
      animation: shake 0.3s ease infinite;
      background-color: #ff4d6d !important;
      color: white !important;
      border-color: #c0392b !important;
    }

    @media (max-width: 480px) {
      #quiz-box {
        padding: 15px 20px;
        width: 95%;
      }
    }
  `;
  
  let styleElement = document.createElement('style');
  styleElement.innerHTML = cssStyles;
  document.head.appendChild(styleElement);
}

// ==========================================
// 初始化設定函數
// ==========================================
function setup() {
  // 建立全螢幕畫布
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');

  // 初始化並隨機從 15 題中抽出 5 題
  initQuizQuestions();

  // 建立主測驗外框容器
  let quizBox = createDiv();
  quizBox.id('quiz-box');

  // 建立標題
  titleP = createP("p5.js 簡易指令練習測驗");
  titleP.parent(quizBox);
  titleP.style('font-size', 'clamp(0.9rem, 2vw, 1.1rem)');
  titleP.style('color', '#7f8c8d');

  // 建立題目顯示段落
  questionP = createP("");
  questionP.parent(quizBox);
  questionP.addClass('question-text');

  // 建立 4 個選項按鈕
  for (let i = 0; i < 4; i++) {
    let btn = createButton("");
    btn.parent(quizBox);
    btn.addClass('option-btn');
    btn.mousePressed(() => handleAnswer(i));
    optionButtons.push(btn);
  }

  // 建立「下一題」按鈕
  nextBtn = createButton("下一題");
  nextBtn.parent(quizBox);
  nextBtn.addClass('control-btn');
  nextBtn.mousePressed(loadNextQuestion);

  // 建立「重新開始」按鈕
  restartBtn = createButton("重新開始");
  restartBtn.parent(quizBox);
  restartBtn.addClass('control-btn');
  restartBtn.mousePressed(restartQuiz);

  // 建立結算成績段落
  resultP = createP("");
  resultP.parent(quizBox);
  resultP.style('font-size', 'clamp(1.1rem, 2.5vw, 1.3rem)');
  resultP.style('color', '#e74c3c');
  resultP.hide();

  // 載入第一道題目
  updateQuestionUI();
}

// ==========================================
// 繪圖函數：每秒 60 次更新全螢幕背景
// ==========================================
function draw() {
  background(240, 242, 245);
}

// ==========================================
// 視窗大小改變時保持全螢幕
// ==========================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ==========================================
// 從 15 題中隨機抽取出 5 道題目的處理函數
// ==========================================
function initQuizQuestions() {
  let tempArr = [];
  
  // 將 CSV 表格資料轉換為結構化物件陣列
  for (let i = 0; i < allQuestions.getRowCount(); i++) {
    let qObj = {
      prompt: allQuestions.getString(i, 'prompt'),
      options: [
        allQuestions.getString(i, 'opt0'),
        allQuestions.getString(i, 'opt1'),
        allQuestions.getString(i, 'opt2'),
        allQuestions.getString(i, 'opt3')
      ],
      correct: int(allQuestions.getString(i, 'correct'))
    };
    tempArr.push(qObj);
  }

  // 使用 Fisher-Yates 演算法將 15 題隨機洗牌
  for (let i = tempArr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = tempArr[i];
    tempArr[i] = tempArr[j];
    tempArr[j] = temp;
  }

  // 取出前 5 題作為本次的測驗題庫
  questions = tempArr.slice(0, 5);
}

// ==========================================
// 更新題目與選項介面的函數
// ==========================================
function updateQuestionUI() {
  isAnswered = false;
  nextBtn.style('display', 'none');

  let q = questions[currentQuestion];
  
  // 顯示目前進度與題目
  questionP.html(`第 ${currentQuestion + 1} 題 / 共 ${questions.length} 題<br><br>${q.prompt}`);
  questionP.show();

  // 更新四個選項按鈕內容與狀態
  for (let i = 0; i < 4; i++) {
    optionButtons[i].html(q.options[i]);
    optionButtons[i].show();
    optionButtons[i].removeAttribute('disabled');
    optionButtons[i].removeClass('bounce-anim');
    optionButtons[i].removeClass('shake-anim');
    optionButtons[i].style('background-color', '#ffffff');
    optionButtons[i].style('color', '#000000');
  }
}

// ==========================================
// 處理使用者點選選項的邏輯函數
// ==========================================
function handleAnswer(selectedIndex) {
  if (isAnswered) return;
  isAnswered = true;

  let q = questions[currentQuestion];
  let correctIndex = q.correct;

  // 鎖定所有選項按鈕
  for (let i = 0; i < 4; i++) {
    optionButtons[i].attribute('disabled', '');
  }

  // 判斷對錯並套用指定動畫與背景色
  if (selectedIndex === correctIndex) {
    score++; // 答對加一分
    optionButtons[correctIndex].addClass('bounce-anim'); // 正確：#fdffb6 + 上下跳動
  } else {
    optionButtons[correctIndex].addClass('bounce-anim'); // 正確答案顯示提示
    optionButtons[selectedIndex].addClass('shake-anim');  // 答錯：#ff4d6d + 左右移動
  }

  // 切換下一題或查看結果按鈕文字
  if (currentQuestion < questions.length - 1) {
    nextBtn.html("下一題");
  } else {
    nextBtn.html("查看測驗結果");
  }
  nextBtn.style('display', 'inline-block');
}

// ==========================================
// 載入下一題或進入結算畫面
// ==========================================
function loadNextQuestion() {
  currentQuestion++;

  if (currentQuestion < questions.length) {
    updateQuestionUI();
  } else {
    showResultScreen();
  }
}

// ==========================================
// 顯示最終結算結果的函數
// ==========================================
function showResultScreen() {
  questionP.hide();
  for (let i = 0; i < 4; i++) {
    optionButtons[i].hide();
  }
  nextBtn.style('display', 'none');

  titleP.html("測驗結束！");
  resultP.html(`你總共答對了 <b>${score}</b> 題（滿分 ${questions.length} 題）`);
  resultP.show();

  restartBtn.style('display', 'inline-block');
}

// ==========================================
// 重新開始測驗的初始化函數（重新抽題）
// ==========================================
function restartQuiz() {
  currentQuestion = 0;
  score = 0;
  initQuizQuestions(); // 重新隨機抽出新的一輪 5 道題目
  resultP.hide();
  restartBtn.style('display', 'none');
  titleP.html("p5.js 簡易指令練習測驗");
  updateQuestionUI();
}