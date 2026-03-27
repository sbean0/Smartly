const gridSize = 10;
const defaultWords = ["CLAW", "CODE", "SEARCH", "GRID", "PUZZLE"];
const allRandomWords = ["AI", "SMART", "PUZZLE", "BRAIN", "LEARN", "THINK", "CODE", "MATH", "ART", "MUSIC", "GAME", "BOOK", "STAR", "MOON", "TREE", "FLOWER", "HOUSE", "CAR", "DOG", "CAT", "BIRD", "FISH", "APPLE", "BANANA", "CHERRY", "DATE", "ELBOW", "FINGER"];
let words = [...defaultWords];
let grid = [];
let wordPositions = new Map(); // Map word to set of positions
let userSelected = new Set();
let foundSelected = new Set(); // Persistent selection for found words
let isDragging = false;
let dragStartR, dragStartC;
let moved = false;
let cells = []; // Cache cell elements for quick access

const directions = [
  {dr: 0, dc: 1},   // right
  {dr: 0, dc: -1},  // left
  {dr: 1, dc: 0},   // down
  {dr: -1, dc: 0},  // up
  {dr: 1, dc: 1},   // down-right
  {dr: -1, dc: -1}, // up-left
  {dr: 1, dc: -1},  // down-left
  {dr: -1, dc: 1}   // up-right
];

function placeWord(word, attempts = 0) {
  if (attempts > 200) return false;
  const dir = directions[Math.floor(Math.random() * directions.length)];
  const reverse = Math.random() > 0.5;
  let placedWord = reverse ? word.split('').reverse().join('') : word;
  const len = placedWord.length;
  const dr = dir.dr;
  const dc = dir.dc;

  // Calculate start range for r
  let minR = 0;
  let maxR = gridSize - 1;
  if (dr > 0) {
    minR = 0;
    maxR = gridSize - len;
  } else if (dr < 0) {
    minR = len - 1;
    maxR = gridSize - 1;
  }
  minR = Math.max(0, minR);
  maxR = Math.min(gridSize - 1, maxR);
  if (minR > maxR) return placeWord(word, attempts + 1);

  // Same for c
  let minC = 0;
  let maxC = gridSize - 1;
  if (dc > 0) {
    minC = 0;
    maxC = gridSize - len;
  } else if (dc < 0) {
    minC = len - 1;
    maxC = gridSize - 1;
  }
  minC = Math.max(0, minC);
  maxC = Math.min(gridSize - 1, maxC);
  if (minC > maxC) return placeWord(word, attempts + 1);

  const rStart = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
  const cStart = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

  // Check valid
  let valid = true;
  for (let i = 0; i < len; i++) {
    const rr = rStart + i * dr;
    const cc = cStart + i * dc;
    if (rr < 0 || rr >= gridSize || cc < 0 || cc >= gridSize || (grid[rr][cc] !== "" && grid[rr][cc] !== placedWord[i])) {
      valid = false;
      break;
    }
  }
  if (valid) {
    // Place
    for (let i = 0; i < len; i++) {
      const rr = rStart + i * dr;
      const cc = cStart + i * dc;
      grid[rr][cc] = placedWord[i];
    }
    // Record positions
    const positions = new Set();
    for (let i = 0; i < len; i++) {
      const rr = rStart + i * dr;
      const cc = cStart + i * dc;
      positions.add(`${rr},${cc}`);
    }
    wordPositions.set(word, positions);
    return true;
  }
  return placeWord(word, attempts + 1);
}

function getLinePositions(r1, c1, r2, c2) {
  const positions = new Set();
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  let r = r1, c = c1;
  while (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
    positions.add(`${r},${c}`);
    if (r === r2 && c === c2) break;
    r += dr;
    c += dc;
  }
  return positions;
}

function updateCellSelection(pos, selected) {
  const [r, c] = pos.split(',').map(Number);
  const index = r * gridSize + c;
  if (index < cells.length) {
    const cell = cells[index];
    if (selected) {
      if (!foundSelected.has(pos)) {
        cell.classList.add('selected');
      }
    } else {
      cell.classList.remove('selected');
    }
  }
}

function clearAll() {
  userSelected.clear();
  foundSelected.clear();
  document.querySelectorAll("li").forEach(li => li.classList.remove("found"));
  cells.forEach(cell => {
    cell.classList.remove('selected', 'found-cell');
  });
}

function generateCustomPuzzle() {
  const input = document.getElementById("customWordsInput");
  const customInput = input.value.trim();
  if (customInput) {
    words = customInput.split(',').map(w => w.trim().toUpperCase()).filter(w => w.length > 1 && w.length <= gridSize);
    if (words.length === 0) {
      alert("Please enter valid words (2+ letters, comma-separated).");
      return;
    }
  } else {
    words = [...defaultWords];
  }
  initGrid();
  input.value = ''; // Clear input
}

function generateRandomPuzzle() {
  // Pick 5 random words from allRandomWords
  const shuffled = allRandomWords.sort(() => 0.5 - Math.random()).slice(0, 5);
  words = shuffled;
  initGrid();
}

function initGrid() {
  grid = Array(gridSize).fill().map(() => Array(gridSize).fill(""));
  wordPositions.clear();
  cells = []; // Reset cells cache
  // Place words
  for (let word of words) {
    placeWord(word);
  }
  // Fill remaining
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (!grid[i][j]) {
        grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }
  // Render grid
  const con = document.getElementById("grid-container");
  con.innerHTML = "";
  con.style.gridTemplateColumns = "repeat(10, 40px)";
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.textContent = grid[r][c];
      cell.addEventListener("mousedown", handleMouseDown);
      cell.addEventListener("touchstart", handleTouchStart, { passive: false });
      con.appendChild(cell);
      cells.push(cell);
    }
  }
  // Word list
  const wl = document.getElementById("word-list");
  wl.innerHTML = "<ul>" + words.map(w => `<li data-word="${w}">${w}</li>`).join("") + "</ul>" +
                 "<br><button onclick=\"initGrid()\">New Puzzle</button><button onclick=\"clearAll()\">Clear All</button>";
  clearAll();
}

function handleMouseDown(e) {
  e.preventDefault();
  const cell = e.currentTarget;
  dragStartR = parseInt(cell.dataset.row);
  dragStartC = parseInt(cell.dataset.col);
  isDragging = true;
  moved = false;
  // Initial cell - add it
  const initialPos = `${dragStartR},${dragStartC}`;
  if (!foundSelected.has(initialPos)) {
    userSelected.add(initialPos);
    updateCellSelection(initialPos, true);
  }
  checkFound();
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  moved = true;
  const elem = document.elementFromPoint(e.clientX, e.clientY);
  if (elem && elem.classList.contains("cell")) {
    const r = parseInt(elem.dataset.row);
    const c = parseInt(elem.dataset.col);
    const linePos = getLinePositions(dragStartR, dragStartC, r, c);
    linePos.forEach(pos => {
      if (!foundSelected.has(pos) && !userSelected.has(pos)) {
        userSelected.add(pos);
        updateCellSelection(pos, true);
      }
    });
    checkFound();
  }
}

function handleMouseUp(e) {
  if (isDragging) {
    e.preventDefault();
    isDragging = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    if (!moved) {
      // Single click: toggle the initial cell
      const k = `${dragStartR},${dragStartC}`;
      if (!foundSelected.has(k)) {
        if (userSelected.has(k)) {
          userSelected.delete(k);
          updateCellSelection(k, false);
        } else {
          userSelected.add(k);
          updateCellSelection(k, true);
        }
      }
    }
    checkFound();
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const elem = document.elementFromPoint(touch.clientX, touch.clientY);
  if (elem && elem.classList.contains("cell")) {
    const cell = elem;
    dragStartR = parseInt(cell.dataset.row);
    dragStartC = parseInt(cell.dataset.col);
    isDragging = true;
    moved = false;
    const initialPos = `${dragStartR},${dragStartC}`;
    if (!foundSelected.has(initialPos)) {
      userSelected.add(initialPos);
      updateCellSelection(initialPos, true);
    }
    checkFound();
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }
}

function handleTouchMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  const touch = e.touches[0];
  const elem = document.elementFromPoint(touch.clientX, touch.clientY);
  if (elem && elem.classList.contains("cell")) {
    moved = true;
    const r = parseInt(elem.dataset.row);
    const c = parseInt(elem.dataset.col);
    const linePos = getLinePositions(dragStartR, dragStartC, r, c);
    linePos.forEach(pos => {
      if (!foundSelected.has(pos) && !userSelected.has(pos)) {
        userSelected.add(pos);
        updateCellSelection(pos, true);
      }
    });
    checkFound();
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  if (isDragging) {
    isDragging = false;
    document.removeEventListener("touchmove", handleTouchMove, { passive: false });
    document.removeEventListener("touchend", handleTouchEnd, { passive: false });
    if (!moved) {
      const k = `${dragStartR},${dragStartC}`;
      if (!foundSelected.has(k)) {
        if (userSelected.has(k)) {
          userSelected.delete(k);
          updateCellSelection(k, false);
        } else {
          userSelected.add(k);
          updateCellSelection(k, true);
        }
      }
    }
    checkFound();
  }
}

function checkFound() {
  let changed = false;
  document.querySelectorAll("li").forEach(li => {
    const w = li.dataset.word;
    const wordPos = wordPositions.get(w);
    if (wordPos) {
      const allSelected = new Set([...userSelected, ...foundSelected]);
      const allFound = Array.from(wordPos).every(pos => allSelected.has(pos));
      if (allFound && !li.classList.contains("found")) {
        li.classList.add("found");
        wordPos.forEach(pos => {
          foundSelected.add(pos);
          const [r, c] = pos.split(',').map(Number);
          const index = r * gridSize + c;
          if (index < cells.length) {
            const cell = cells[index];
            cell.classList.add('found-cell');
            cell.classList.remove('selected');
          }
        });
        changed = true;
      } else if (!allFound && li.classList.contains("found")) {
        li.classList.remove("found");
        changed = true;
      }
    }
  });
  if (changed) {
    // Re-highlight if needed, but since classes handle it, no need
  }
}

initGrid();
