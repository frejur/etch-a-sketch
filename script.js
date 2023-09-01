/* eslint-sourceType script */
const etch = (
  () => {
    'use strict';

    // Size defaults
    const SZ_DEFAULT = 64;
    const gridSize = {
      x: SZ_DEFAULT,
      y: SZ_DEFAULT,
    };
    
    // Drawable area on an Etch-a-Sketch: 154 mm wide by 108 mm tall.
    const ASP_R = 0.65;
    
    // Polling defaults (Check for idle)
    const POLL_DELAY = 100;
    let pollCount = 0;
    let isPause = false;

    let pixelSize;
    const grid = [];
    const cursorPosition = {};
    const cursorOnScreenPosition = {};
    const cursorPixelPosition = {};
    const pixels = document.getElementById('pixels');
    const borders = document.getElementById('screen-borders');
    let borderWidth = 0; // TODO: Dynamic screen border width
    const screenPause = document.getElementById('screen-pause');
    const area = document.getElementById('screen-area');
    const style = document.createElement('style');
    const screenMaxWidth = getScreenMaxWidth();
    document.head.appendChild(style);

    const debug = {};

    function getScreenMaxWidth() {
      const e = document.getElementById('screen').parentElement;
      const w = e.clientWidth;
      const pad = parseFloat(getComputedStyle(e).paddingLeft);
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
      const oldPos = cursorPixelPosition;
      getPixelFromPosition(
        cursorOnScreenPosition,
        pixelSize,
      );
      if (cursorPixelPosition.x !== oldPos.x ||
        cursorPixelPosition.y !== oldPos.y)
      {
        return true;
      }
      return false;
    }

    function updateSize(x, y) {
      gridSize.x = validateDimension(x);
      gridSize.y = validateDimension(y);
      const widthPx = pixels.getBoundingClientRect().width;
      pixelSize = getPixelSize(gridSize.x, widthPx);
      style.innerHTML = (
        `.pixel { width: ${pixelSize}px; `
        + `padding-bottom: ${pixelSize}px; `
        + 'box-sizing: border-box; }'
      );
      const adjWidthPx = pixelSize * gridSize.x;
      pixels.style.width = `${adjWidthPx}px`;
      area.style.width = `${adjWidthPx}px`;
      const adjHeightPx = pixelSize * gridSize.y;
      area.style.height = `${adjHeightPx}px`;
      const pad = widthPx > adjWidthPx
        ? widthPx - adjWidthPx
        : 0;
      const padLeft = Math.floor(pad / 2);
      const padRight = pad - padLeft;
      const padValues = [
        padLeft,  // Top
        padRight, // Right
        padLeft,  // Bottom
        padLeft,  // Left
      ];
      setPadding(pixels, padValues);
      setPadding(area, padValues);
    }
    
    function setPadding(element, paddingArray) {
      const dirs = [
        'Top',
        'Left',
        'Bottom',
        'Right',
      ];
      dirs.forEach((dir, i) => {
        element.style[`padding${dir}`] = `${paddingArray[i]}px`;
      });
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
          const randA = Math.random() * 0.1;
          newDiv.style.backgroundColor = `rgba(0, 0, 0, ${randA})`;
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
      if (!debug.active) {
        return;
      }
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
      const newPos = {};
      newPos.x = (
        Math.max(
          0,
          Math.min(
            screenPos.right - screenPos.left,
            cursorPosition.x - screenPos.left,
          ),
        )
      );
      newPos.y = (
        Math.max(
          0,
          Math.min(
            screenPos.bottom - screenPos.top,
            cursorPosition.y - screenPos.top,
          ),
        )
      );
      if (newPos.x !== cursorOnScreenPosition.x
        || newPos.y !== cursorOnScreenPosition.y)
      {
        cursorOnScreenPosition.x = newPos.x;
        cursorOnScreenPosition.y = newPos.y;
        return true;
      }
      return false;
    }

    function stopPolling(pos) {
      if (pos) {
        cursorPosition.x = pos.x;
        cursorPosition.y = pos.y;
        if (updateCursorOnScreenPosition()) {
          updateCursorPixelPosition();
        }
      }
      pollCount = 0;
      document.body.style.cursor = 'default';
      updateDebugDashboard();
    }

    function setPauseState(state) {
      isPause = (state === true);
      if (isPause) {
        screenPause.style.display = 'block';
        borders.style.backgroundColor = 'rgba(0,0,0,0.8)';
      } else {
        screenPause.style.display = 'none';
        borders.style.backgroundColor = 'transparent';
      }
    }

    function pollForMouseMovement(skipReset=false) {
      if (pollCount===0) {
        return;
      }
      if (updateCursorOnScreenPosition()) {
        if (updateCursorPixelPosition()) {
          if (!skipReset) {
            resetPollCount();
          }
        }
      }
      updateDebugDashboard();
      if (pollCount <= 1) {
        setPauseState(true);
        stopPolling();
        return;
      }
      pollCount -= 1;
      setTimeout(pollForMouseMovement, POLL_DELAY);
    }

    function startPolling() {
      if (pollCount < 1) {
        document.body.style.cursor = 'crosshair';
        resetPollCount();
        pollForMouseMovement(true);
      }
    }

    function resetPollCount() {
      pollCount = 20;
    }

    function addEventListeners() {
      const screen = document.getElementById('screen-area');
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

    function storeScreenBorderWidth() {
      borderWidth = (borders.offsetWidth - borders.clientWidth) / 2;
    }

    function initNormal() {
      generateNewGrid();
      storeScreenBorderWidth();
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
