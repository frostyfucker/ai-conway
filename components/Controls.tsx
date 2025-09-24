
import React from 'react';
import type { Player, GameState } from '../types';
import AgentInfo from './AgentInfo';
import { MAX_TURNS, SIMULATION_STEPS_PER_TURN } from '../constants';

interface ControlsProps {
  onStart: () => void;
  onReset: () => void;
  gameState: GameState;
  currentPlayer: Player;
  turn: number;
  scores: { player1: number; player2: number };
  winner: Player | 'DRAW' | null;
  gameLog: string[];
  simStep: number;
}

const Controls: React.FC<ControlsProps> = ({
  onStart,
  onReset,
  gameState,
  currentPlayer,
  turn,
  scores,
  winner,
  gameLog,
  simStep
}) => {
  const isGameRunning = gameState !== 'IDLE' && gameState !== 'GAME_OVER';

  const getStatusMessage = () => {
    if (winner) {
        if (winner === 'DRAW') return "Game Over: It's a draw!";
        return `Game Over: Player ${winner} wins!`;
    }
    switch(gameState) {
        case 'IDLE': return 'Press Start to begin.';
        case 'PLAYER_1_THINKING': return 'Player 1 is strategizing...';
        case 'PLAYER_2_THINKING': return 'Player 2 is plotting a move...';
        case 'SIMULATING': return `Simulating... (${simStep}/${SIMULATION_STEPS_PER_TURN})`;
        case 'GAME_OVER': return 'Game has ended.';
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">Game Controls</h2>

      <div className="flex gap-4 mb-4">
        <button
          onClick={onStart}
          disabled={isGameRunning}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Start Game
        </button>
        <button
          onClick={onReset}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="text-center mb-4 p-3 bg-gray-900 rounded">
        <p className="font-bold text-lg text-yellow-300">{getStatusMessage()}</p>
        <p className="text-gray-400">Turn: {Math.min(turn + 1, MAX_TURNS)} / {MAX_TURNS}</p>
      </div>

      <div className="flex justify-around items-center mb-4 gap-4">
        <AgentInfo player={1} score={scores.player1} isActive={currentPlayer === 1 && isGameRunning} isThinking={gameState === 'PLAYER_1_THINKING'} />
        <div className="text-2xl font-bold text-gray-500">VS</div>
        <AgentInfo player={2} score={scores.player2} isActive={currentPlayer === 2 && isGameRunning} isThinking={gameState === 'PLAYER_2_THINKING'} />
      </div>

      <div className="flex-grow flex flex-col bg-gray-900 rounded p-3 min-h-[200px]">
        <h3 className="text-lg font-semibold mb-2 text-gray-300">Game Log</h3>
        <div className="flex-grow overflow-y-auto text-sm pr-2">
            {gameLog.length === 0 && <p className="text-gray-500 italic">Events will appear here...</p>}
            {gameLog.map((log, index) => (
                <p key={index} className={`mb-1 ${index === 0 ? 'text-white' : 'text-gray-400'}`}>{log}</p>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Controls;
