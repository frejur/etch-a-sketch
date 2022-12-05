/* eslint-sourceType script */
const etch = (
  () => {
    'use strict';

    const SZ_DEFAULT = 32;
    const gridSize = {
      x: SZ_DEFAULT,
      y: SZ_DEFAULT,
    };
    let pixelSize;
    const grid = [];
    const ASP_R = 0.65;
    const cursorPosition = {};
    const cursorOnScreenPosition = {};
    const cursorPixelPosition = {};
    const pixels = document.getElementById('pixels');
    const style = document.createElement('style');
    const screenMaxWidth = getScreenMaxWidth();
    document.head.appendChild(style);
    const debug = {};

    const POLL_DELAY = 100;
    let pollCount = 0;

    function getScreenMaxWidth() {
      const e = document.getElementById('screen').parentElement;
      const w = e.clientWidth;
      const pad = parseFloat(getComputedStyle(e).paddingLeft);
      console.log(`Width: ${w - pad * 2}`);
      return w - pad * 2;
    }

    function getDebugParameter() {
      const q = window.location.search;
      const params = new URLSearchParams(q);
      return (params.get('debug') === 'true');
    }

    function initDebug() {
      const cont = document.getElementById('debug');
      if (getDebugParameter() !== true) {
        debug.active = false;
        cont.style.display = 'none';
        return false;
      }
      debug.active = true;
      const d = document;
      debug.elements = {
        container: cont,
        screenWidth: d.getElementById('screen-width'),
        pollStatus: d.getElementById('poll-status'),
        pollCount: d.getElementById('poll-count'),
        pollDelay: d.getElementById('poll-delay'),
        cursorPos: d.getElementById('cursor-pos'),
        pixelSize: d.getElementById('pixel-size'),
        pixelPos: d.getElementById('pixel-pos'),
      };

      debug.elements.screenWidth.innerText = screenMaxWidth;
      debug.elements.pollDelay.innerText = POLL_DELAY;
      return true;
    }

    function validateDimension(dim) {
      if (typeof dim !== 'number') {
        return SZ_DEFAULT;
      }
      return (
        Math.max(2, Math.min(128, Math.round(dim)))
      );
    }

    function getPixelSize(pixelCountX, dSizeX) {
      return Math.max(
        1,
        Math.floor(dSizeX / pixelCountX),
      );
    }

    function getPixelFromPosition(pos, pxSize) {
      cursorPixelPosition.x = Math.round(pos.x / pxSize) + 1;
      cursorPixelPosition.y = Math.round(pos.y / pxSize) + 1;
    }

    function updateCursorPixelPosition() {
      getPixelFromPosition(
        cursorOnScreenPosition,
        pixelSize,
      );
    }

    function updateSize(x, y) {
      gridSize.x = validateDimension(x);
      gridSize.y = validateDimension(y);
      style.innerHTML = (
        `.pixel { width: ${100 / gridSize.x}%; `
        + `padding-bottom: ${100 / gridSize.x}%; `
        + 'box-sizing: border-box; }'
      );
      pixelSize = getPixelSize(
        gridSize.x,
        pixels.getBoundingClientRect().width,
      );
    }

    function populateGrid() {
      grid.length = gridSize.y;
      let row = 0;
      do {
        grid[row] = 0;
        row += 1;
      } while (row < gridSize.y);
    }

    function generateRowDivs(row) {
      let rowNodes;
      let newRow = false;
      try {
        rowNodes = Array.prototype.slice.call(
          pixels.childNodes(),
        );
        rowNodes.slice(
          row * gridSize.x,
          (row + 1) * gridSize.x,
        );
      } catch (ignore) {
        let col = 0;
        rowNodes = [];
        do {
          const newDiv = document.createElement('div');
          pixels.appendChild(newDiv);
          rowNodes.push(newDiv);
          col += 1;
        } while (col < gridSize.x);
        newRow = true;
      }
      let i = 0;
      let div = 1;
      do {
        if (newRow) {
          rowNodes[i].setAttribute('data-row', row);
          rowNodes[i].setAttribute('data-col', div);
          rowNodes[i].classList.add('pixel');
        }
        div *= 2;
        i += 1;
      } while (i < rowNodes.length);
    }

    function generateDivs(row) {
      let thisRow = 0;
      let maxRow;
      if (!row) {
        pixels.innerHTML = '';
        maxRow = gridSize.y;
      } else {
        thisRow = row;
        maxRow = row;
      }
      do {
        generateRowDivs(thisRow);
        thisRow += 1;
      } while (thisRow < maxRow);
    }

    function generateNewGrid(size) {
      let newSize = size;
      if (!size) {
        newSize = SZ_DEFAULT;
      }
      updateSize(newSize, Math.round(newSize * ASP_R));
      populateGrid();
      generateDivs();
    }

    function updateDebugDashboard() {
      const e = debug.elements;
      e.pollStatus.innerText = (
        (pollCount > 0)
          ? 'Active'
          : 'Inactive'
      );
      e.pollCount.innerText = pollCount;
      const cp = cursorOnScreenPosition;
      e.cursorPos.innerText = `x: ${cp.x}, y: ${cp.y}`;
      e.pixelSize.innerText = `${pixelSize}x${pixelSize}`;
      const pp = cursorPixelPosition;
      e.pixelPos.innerText = `x: ${pp.x}, y: ${pp.y}`;
    }

    function updateCursorOnScreenPosition() {
      const screenPos = pixels.getBoundingClientRect();
      cursorOnScreenPosition.x = (
        Math.max(
          0,
          Math.min(
            screenPos.right - screenPos.left,
            cursorPosition.x - screenPos.left,
          ),
        )
      );
      cursorOnScreenPosition.y = (
        Math.max(
          0,
          Math.min(
            screenPos.bottom - screenPos.top,
            cursorPosition.y - screenPos.top,
          ),
        )
      );
    }

    function stopPolling(pos) {
      if (pos) {
        cursorPosition.x = pos.x;
        cursorPosition.y = pos.y;
        updateCursorOnScreenPosition();
      }
      pollCount = 0;
      updateDebugDashboard();
    }

    function pollForMouseMovement() {
      updateCursorOnScreenPosition();
      updateCursorPixelPosition();
      updateDebugDashboard();
      if (pollCount <= 1) {
        stopPolling();
        return;
      }
      pollCount -= 1;
      setTimeout(pollForMouseMovement, POLL_DELAY);
    }

    function startPolling() {
      if (pollCount < 1) {
        pollCount = 20;
        pollForMouseMovement();
      }
    }

    function addEventListeners() {
      const screen = document.getElementById('screen');
      screen.addEventListener('mouseenter', (event) => {
        const pos = {
          x: event.pageX,
          y: event.pageY,
        };
        startPolling(pos);
      });
      screen.addEventListener('mouseleave', (event) => {
        const pos = {
          x: event.pageX,
          y: event.pageY,
        };
        stopPolling(pos);
      });
      document.onmousemove = (e) => {
        if (pollCount < 1) {
          return;
        }
        cursorPosition.x = e.pageX;
        cursorPosition.y = e.pageY;
      };
    }

    function initNormal() {
      generateNewGrid();
      addEventListeners();
    }

    if (!initDebug()) {
      initNormal();
    }

    return {
      generateGrid() {
        generateNewGrid();
      },
      init: initNormal,
    };
  }
)();
