const BOARD_SIZE = 15;
let board = [];
let gameOver = false;
const playerSymbol = '●';  // プレイヤーは黒
const aiSymbol = '○';      // AIは白
let currentTurn = 'player'; // 'player'または'ai'
let AI_MODE = 'random';     // デフォルトはランダム

const boardDiv = document.getElementById('board');
const messageP = document.getElementById('message');
const resetBtn = document.getElementById('reset');
const aiModeSelect = document.getElementById('aiModeSelect');

// AIモード選択変更
aiModeSelect.addEventListener('change', () => {
  AI_MODE = aiModeSelect.value;
});

// 盤面初期化
function initBoard() {
  board = [];
  boardDiv.innerHTML = '';
  gameOver = false;
  currentTurn = 'player';
  messageP.textContent = '';
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      board[i][j] = null;
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.addEventListener('click', onCellClick);
      boardDiv.appendChild(cell);
    }
  }
}

// プレイヤークリック処理（複数回クリック防止済み）
function onCellClick(e) {
  if (gameOver || currentTurn !== 'player') return;
  
  // クリックされたらすぐに入力を無効化
  currentTurn = 'ai';
  
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  
  if (board[row][col] !== null) {
    // すでに石がある場合はターンを戻す
    currentTurn = 'player';
    return;
  }
  
  makeMove(row, col, playerSymbol);
  if (checkWin(row, col, playerSymbol)) {
    messageP.textContent = 'プレイヤーの勝ち！';
    gameOver = true;
    return;
  }
  
  // AI の手番へ（少し遅延を入れる）
  setTimeout(aiMove, 300);
}

// 指定位置に石を置く
function makeMove(row, col, symbol) {
  board[row][col] = symbol;
  const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
  if (cell) cell.textContent = symbol;
}

// ★ 勝敗判定関数（直近の手から各方向をチェック）
function checkWin(row, col, symbol) {
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];
  
  for (const { dr, dc } of directions) {
    let count = 1;
    count += countDirection(row, col, dr, dc, symbol);
    count += countDirection(row, col, -dr, -dc, symbol);
    if (count >= 5) return true;
  }
  return false;
}

// 指定方向の連続数を返す（盤面全体の石を参照）
function countDirection(row, col, dr, dc, symbol) {
  let r = row + dr;
  let c = col + dc;
  let count = 0;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === symbol) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}

// AIの手番
function aiMove() {
  if (gameOver) return;
  switch (AI_MODE) {
    case 'random':
      aiRandomMove();
      break;
    case 'simpleMinimax':
      aiSimpleMinimaxMove();
      break;
    case 'rule':
      aiRuleBasedMove();
      break;
    case 'minimax2':
      aiMinimaxMoveDepth2();
      break;
    case 'minimax4':
      aiMinimaxMoveDepth4();
      break;
    case 'mcts':
      aiMctsMove();
      break;
    default:
      aiRandomMove();
  }
  currentTurn = 'player';
}

// ★ レベル1：ランダム手 AI
function aiRandomMove() {
  let emptyCells = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === null) {
        emptyCells.push({ row: i, col: j });
      }
    }
  }
  if (emptyCells.length === 0) return;
  
  const move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  makeMove(move.row, move.col, aiSymbol);
  if (checkWin(move.row, move.col, aiSymbol)) {
    messageP.textContent = 'AIの勝ち！';
    gameOver = true;
  }
}

// ★ レベル1.5：簡易ミニマックス（深さ1） AI
function aiSimpleMinimaxMove() {
  let bestScore = -Infinity;
  let bestMove = null;
  const depth = 1; // 深さ1
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === null) {
        board[i][j] = aiSymbol;
        let score = evaluateBoard();
        board[i][j] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = { row: i, col: j };
        }
      }
    }
  }
  
  if (bestMove) {
    makeMove(bestMove.row, bestMove.col, aiSymbol);
    if (checkWin(bestMove.row, bestMove.col, aiSymbol)) {
      messageP.textContent = 'AIの勝ち！';
      gameOver = true;
    }
  }
}

// ★ レベル2：ルールベース AI（初級Ⅰ）
function aiRuleBasedMove() {
  let bestScore = -Infinity;
  let bestMove = null;
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === null) {
        let scoreAI = evaluateMove(i, j, aiSymbol);
        let scorePlayer = evaluateMove(i, j, playerSymbol);
        let score = scoreAI + scorePlayer * 1.5;
        if (score > bestScore) {
          bestScore = score;
          bestMove = { row: i, col: j };
        }
      }
    }
  }
  
  if (bestMove) {
    makeMove(bestMove.row, bestMove.col, aiSymbol);
    if (checkWin(bestMove.row, bestMove.col, aiSymbol)) {
      messageP.textContent = 'AIの勝ち！';
      gameOver = true;
    }
  }
}

// ★ レベル3：ミニマックス（深さ2：初級Ⅱ）
function aiMinimaxMoveDepth2() {
  let bestScore = -Infinity;
  let bestMove = null;
  const depth = 2;
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === null) {
        board[i][j] = aiSymbol;
        let score = minimax(depth - 1, false, -Infinity, Infinity);
        board[i][j] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = { row: i, col: j };
        }
      }
    }
  }
  
  if (bestMove) {
    makeMove(bestMove.row, bestMove.col, aiSymbol);
    if (checkWin(bestMove.row, bestMove.col, aiSymbol)) {
      messageP.textContent = 'AIの勝ち！';
      gameOver = true;
    }
  }
}

// ★ レベル4：ミニマックス（深さ4：中級）
function aiMinimaxMoveDepth4() {
  let bestScore = -Infinity;
  let bestMove = null;
  const depth = 4;
  
  for (let i = 0; i < 
