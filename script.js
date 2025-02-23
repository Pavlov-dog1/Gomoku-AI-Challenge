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

// プレイヤークリック処理
function onCellClick(e) {
  if(gameOver || currentTurn !== 'player') return;
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  
  if(board[row][col] !== null) return;
  
  makeMove(row, col, playerSymbol);
  if(checkWin(row, col, playerSymbol)) {
    messageP.textContent = 'プレイヤーの勝ち！';
    gameOver = true;
    return;
  }
  
  currentTurn = 'ai';
  // 少し遅延を入れてAIの手番に
  setTimeout(aiMove, 300);
}

// 指定位置に手を打つ
function makeMove(row, col, symbol) {
  board[row][col] = symbol;
  const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
  if(cell) cell.textContent = symbol;
}

// AIの手番
function aiMove() {
  if(gameOver) return;
  if(AI_MODE === 'random') {
    aiRandomMove();
  } else if(AI_MODE === 'rule') {
    aiRuleBasedMove();
  } else if(AI_MODE === 'minimax') {
    aiMinimaxMove();
  }
  currentTurn = 'player';
}

// ★ ランダム手 AI
function aiRandomMove() {
  let emptyCells = [];
  for(let i = 0; i < BOARD_SIZE; i++){
    for(let j = 0; j < BOARD_SIZE; j++){
      if(board[i][j] === null) {
        emptyCells.push({row: i, col: j});
      }
    }
  }
  if(emptyCells.length === 0) return;
  
  const move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  makeMove(move.row, move.col, aiSymbol);
  if(checkWin(move.row, move.col, aiSymbol)){
    messageP.textContent = 'AIの勝ち！';
    gameOver = true;
  }
}

// ★ ルールベース AI
function aiRuleBasedMove() {
  let bestScore = -Infinity;
  let bestMove = null;
  
  // 各空セルについて評価
  for(let i = 0; i < BOARD_SIZE; i++){
    for(let j = 0; j < BOARD_SIZE; j++){
      if(board[i][j] === null) {
        // AI側の評価
        let scoreAI = evaluateMove(i, j, aiSymbol);
        // 防御評価：相手の連続が伸びる可能性に重みを付ける
        let scorePlayer = evaluateMove(i, j, playerSymbol);
        let score = scoreAI + scorePlayer * 1.5;
        if(score > bestScore) {
          bestScore = score;
          bestMove = {row: i, col: j};
        }
      }
    }
  }
  
  if(bestMove) {
    makeMove(bestMove.row, bestMove.col, aiSymbol);
    if(checkWin(bestMove.row, bestMove.col, aiSymbol)){
      messageP.textContent = 'AIの勝ち！';
      gameOver = true;
    }
  }
}

// 指定位置に置いた場合の評価（簡易版）
// 各方向の連続数を調べ、最大値を返す
function evaluateMove(row, col, symbol) {
  let score = 0;
  const directions = [
    { dr: 0, dc: 1 },  // 横
    { dr: 1, dc: 0 },  // 縦
    { dr: 1, dc: 1 },  // 斜め右下
    { dr: 1, dc: -1 }  // 斜め左下
  ];
  
  for(const {dr, dc} of directions){
    let count = 1; // 仮に自分の石が置かれたとする
    count += countDirection(row, col, dr, dc, symbol);
    count += countDirection(row, col, -dr, -dc, symbol);
    score = Math.max(score, count);
  }
  return score;
}

// 指定方向に連続している石の数を返す
function countDirection(row, col, dr, dc, symbol) {
  let r = row + dr;
  let c = col + dc;
  let count = 0;
  while(r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === symbol) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}

// ★ ミニマックス法＋αβ枝刈り AI
function aiMinimaxMove() {
  let bestScore = -Infinity;
  let bestMove = null;
  const depth = 2; // 探索深度（サンプル用なので浅め）
  
  for(let i = 0; i < BOARD_SIZE; i++){
    for(let j = 0; j < BOARD_SIZE; j++){
      if(board[i][j] === null) {
        board[i][j] = aiSymbol;
        let score = minimax(depth - 1, false, -Infinity, Infinity);
        board[i][j] = null;
        if(score > bestScore) {
          bestScore = score;
          bestMove = { row: i, col: j };
        }
      }
    }
  }
  
  if(bestMove) {
    makeMove(bestMove.row, bestMove.col, aiSymbol);
    if(checkWin(bestMove.row, bestMove.col, aiSymbol)){
      messageP.textContent = 'AIの勝ち！';
      gameOver = true;
    }
  }
}

// ミニマックス法（再帰的探索）
function minimax(depth, isMaximizing, alpha, beta) {
  if(depth === 0 || isTerminal()) {
    return evaluateBoard();
  }
  
  if(isMaximizing) {
    let maxEval = -Infinity;
    for(let i = 0; i < BOARD_SIZE; i++){
      for(let j = 0; j < BOARD_SIZE; j++){
        if(board[i][j] === null) {
          board[i][j] = aiSymbol;
          let eval = minimax(depth - 1, false, alpha, beta);
          board[i][j] = null;
          maxEval = Math.max(maxEval, eval);
          alpha = Math.max(alpha, eval);
          if(beta <= alpha) break;
        }
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for(let i = 0; i < BOARD_SIZE; i++){
      for(let j = 0; j < BOARD_SIZE; j++){
        if(board[i][j] === null) {
          board[i][j] = playerSymbol;
          let eval = minimax(depth - 1, true, alpha, beta);
          board[i][j] = null;
          minEval = Math.min(minEval, eval);
          beta = Math.min(beta, eval);
          if(beta <= alpha) break;
        }
      }
    }
    return minEval;
  }
}

// 終局状態：誰かが勝つか、または盤面が全て埋まったら
function isTerminal() {
  for(let i = 0; i < BOARD_SIZE; i++){
    for(let j = 0; j < BOARD_SIZE; j++){
      if(board[i][j] !== null && checkWin(i, j, board[i][j])) {
        return true;
      }
    }
  }
  for(let i = 0; i < BOARD_SIZE; i++){
    for(let j = 0; j < BOARD_SIZE; j++){
      if(board[i][j] === null) return false;
    }
  }
  return true;
}

// 盤面全体の評価（簡易版）
// AI側とプレイヤー側の最大連続数の差を返す
function evaluateBoard() {
  let aiScore = 0;
  let playerScore = 0;
  for(let i = 0; i < BOARD_SIZE; i++){
    for(let j = 0; j < BOARD_SIZE; j++){
      if(board[i][j] === aiSymbol) {
        aiScore = Math.max(aiScore, evaluateMove(i, j, aiSymbol));
      } else if(board[i][j] === playerSymbol) {
        playerScore = Math.max(playerScore, evaluateMove(i, j, playerSymbol));
      }
    }
  }
  return aiScore - playerScore;
}

// 勝敗判定：直近の手から4方向をチェック（合計5つ以上なら勝ち）
function checkWin(row, col, symbol) {
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];
  
  for(const {dr, dc} of directions){
    let count = 1;
    count += countDirection(row, col, dr, dc, symbol);
    count += countDirection(row, col, -dr, -dc, symbol);
    if(count >= 5) return true;
  }
  return false;
}

resetBtn.addEventListener('click', initBoard);
initBoard();
