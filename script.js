const etch = (
  () => {
    'use strict';

    const SZ_DEFAULT = 64;
    const gridSize = {
      x: SZ_DEFAULT,
      y: SZ_DEFAULT,
    };
    const grid = [];
    const ASP_R = 0.65;
    const pixels = document.getElementById('pixels');
    const style = document.createElement('style');
    document.head.appendChild(style);

    function validateDimension(dim) {
      if (typeof dim !== 'number') {
        return SZ_DEFAULT;
      }
      return (
        Math.max(2, Math.min(100, Math.round(dim)))
      );
    }

    function updateSize(x, y) {
      gridSize.x = validateDimension(x);
      gridSize.y = validateDimension(y);
      style.innerHTML = (
        `.pixel { width: ${100 / gridSize.x}%; `
        + `padding-bottom: ${100 / gridSize.x}%; `
        + `box-sizing: border-box; }`
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

    return {
      generateGrid: (size) => {
        let newSize = size;
        if (!size) {
          newSize = SZ_DEFAULT;
        }
        updateSize(newSize, Math.round(newSize * ASP_R));
        populateGrid();
        generateDivs();
      },
      drawGrid: () => console.log('Draw'),
    };
  }
)();
