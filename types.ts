
export type Player = 1 | 2;
export type CellState = 0 | Player;
export type GridState = CellState[][];
export type GameState = 'IDLE' | 'PLAYER_1_THINKING' | 'PLAYER_2_THINKING' | 'SIMULATING' | 'GAME_OVER';

export interface AIMove {
  pattern: number[][];
  position: {
    x: number;
    y: number;
  };
  reasoning: string;
}
