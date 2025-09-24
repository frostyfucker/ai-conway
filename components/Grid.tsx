
import React from 'react';
import type { GridState } from '../types';
import { PLAYER_COLORS, DEAD_COLOR, GRID_BG_COLOR, GRID_WIDTH, GRID_HEIGHT } from '../constants';

interface GridProps {
  grid: GridState;
}

const Grid: React.FC<GridProps> = ({ grid }) => {
  return (
    <div className={`p-2 rounded-lg shadow-lg ${GRID_BG_COLOR}`}>
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_HEIGHT}, minmax(0, 1fr))`,
          width: 'min(80vw, 80vh)',
          height: 'min(64vw, 64vh)',
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className={`w-full h-full rounded-sm transition-colors duration-300 ${
                cell === 0 ? DEAD_COLOR : PLAYER_COLORS[cell]
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Grid;
