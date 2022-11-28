const etch = (
  () => {
    'use strict';

    const SZ_DEFAULT = 64;
    const gridSize = {
      x: SZ_DEFAULT,
      y: SZ_DEFAULT,
    };

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
    }

    return {
      generateGrid: (size) => updateSize(size, size),
      drawGrid: () => console.log('Draw'),
    };
  }
)();
