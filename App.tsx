
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Grid from './components/Grid';
import Controls from './components/Controls';
import { getAIMove } from './services/geminiService';
import type { Player, GameState, GridState, AIMove } from './types';
import { GRID_WIDTH, GRID_HEIGHT, SIMULATION_STEPS_PER_TURN, SIMULATION_SPEED_MS, MAX_TURNS } from './constants';

const createEmptyGrid = (): GridState => {
  return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
};

const App: React.FC = () => {
  const [grid, setGrid] = useState<GridState>(createEmptyGrid);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [turn, setTurn] = useState<number>(0);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [simStep, setSimStep] = useState(0);

  const simulationIntervalRef = useRef<number | null>(null);

  const addToLog = useCallback((message: string) => {
    setGameLog(prev => [`[Turn ${turn+1}] ${message}`, ...prev].slice(0, 10));
  }, [turn]);

  const calculateScores = useCallback((currentGrid: GridState) => {
    let p1Score = 0;
    let p2Score = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (currentGrid[y][x] === 1) p1Score++;
        if (currentGrid[y][x] === 2) p2Score++;
      }
    }
    setScores({ player1: p1Score, player2: p2Score });
    return { player1: p1Score, player2: p2Score };
  }, []);

  const runSimulationStep = useCallback(() => {
    setGrid(g => {
      const newGrid = JSON.parse(JSON.stringify(g));
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          let neighbors = { p1: 0, p2: 0, total: 0 };
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (i === 0 && j === 0) continue;
              const newY = y + i;
              const newX = x + j;
              if (newY >= 0 && newY < GRID_HEIGHT && newX >= 0 && newX < GRID_WIDTH) {
                if (g[newY][newX] === 1) {
                  neighbors.p1++;
                  neighbors.total++;
                } else if (g[newY][newX] === 2) {
                  neighbors.p2++;
                  neighbors.total++;
                }
              }
            }
          }

          if (g[y][x] > 0) { // Live cell
            if (neighbors.total < 2 || neighbors.total > 3) newGrid[y][x] = 0; // Dies
          } else { // Dead cell
            if (neighbors.total === 3) {
              newGrid[y][x] = neighbors.p1 > neighbors.p2 ? 1 : 2; // Birth
            }
          }
        }
      }
      calculateScores(newGrid);
      return newGrid;
    });
    setSimStep(s => s + 1);
  }, [calculateScores]);

  const placePattern = useCallback((grid: GridState, move: AIMove, player: Player): GridState => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    const { pattern, position } = move;
    for(let y=0; y<pattern.length; y++) {
        for(let x=0; x<pattern[y].length; x++) {
            if(pattern[y][x] === 1) {
                const gridY = position.y + y;
                const gridX = position.x + x;
                if(gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                    newGrid[gridY][gridX] = player;
                }
            }
        }
    }
    return newGrid;
  }, []);

  const handleReset = useCallback(() => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setGrid(createEmptyGrid());
    setGameState('IDLE');
    setCurrentPlayer(1);
    setTurn(0);
    setScores({ player1: 0, player2: 0 });
    setWinner(null);
    setGameLog([]);
    setSimStep(0);
  }, []);

  const handleStart = useCallback(() => {
    handleReset();
    setGameState('PLAYER_1_THINKING');
    addToLog("Game started! Player 1 is thinking...");
  }, [handleReset, addToLog]);


  useEffect(() => {
    const processTurn = async () => {
      if (gameState === 'PLAYER_1_THINKING' || gameState === 'PLAYER_2_THINKING') {
        try {
          const move = await getAIMove(grid, currentPlayer);
          addToLog(`Player ${currentPlayer} places a pattern. Reasoning: ${move.reasoning}`);
          const newGrid = placePattern(grid, move, currentPlayer);
          setGrid(newGrid);
          calculateScores(newGrid);

          if (currentPlayer === 1) {
            setCurrentPlayer(2);
            setGameState('PLAYER_2_THINKING');
            addToLog("Player 2 is thinking...");
          } else {
            setGameState('SIMULATING');
            addToLog(`Turn ${turn + 1} simulation starts...`);
          }
        } catch (error) {
          console.error(error);
          addToLog(`Error for Player ${currentPlayer}. Stopping game.`);
          setGameState('GAME_OVER');
        }
      } else if (gameState === 'SIMULATING') {
        if(simStep >= SIMULATION_STEPS_PER_TURN) {
          setSimStep(0);
          const newTurn = turn + 1;
          
          if(newTurn >= MAX_TURNS) {
            setGameState('GAME_OVER');
            addToLog("Max turns reached. Game over.");
            const finalScores = calculateScores(grid);
            if(finalScores.player1 > finalScores.player2) setWinner(1);
            else if (finalScores.player2 > finalScores.player1) setWinner(2);
            else setWinner('DRAW');
          } else {
            setTurn(newTurn);
            setCurrentPlayer(1);
            setGameState('PLAYER_1_THINKING');
            addToLog("Player 1 is thinking...");
          }
        }
      }
    };
    processTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, grid]); // Deliberately dependent on grid to trigger after state update
  
  useEffect(() => {
    if (gameState === 'SIMULATING' && simStep < SIMULATION_STEPS_PER_TURN) {
        simulationIntervalRef.current = window.setInterval(runSimulationStep, SIMULATION_SPEED_MS);
    }
    return () => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
        }
    };
}, [gameState, runSimulationStep, simStep]);


  return (
    <div className="bg-gray-900 min-h-screen text-gray-100 flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4">
        <div className="flex-grow flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-p1 to-p2">Conway's Game of Life: AI Battle</h1>
            <p className="text-sm text-gray-400 mb-4">Two AI agents compete for dominance on the cellular battlefield.</p>
            <Grid grid={grid} />
        </div>
        <div className="lg:w-96 w-full flex-shrink-0">
            <Controls
                onStart={handleStart}
                onReset={handleReset}
                gameState={gameState}
                currentPlayer={currentPlayer}
                turn={turn}
                scores={scores}
                winner={winner}
                gameLog={gameLog}
                simStep={simStep}
            />
        </div>
      </div>
    </div>
  );
};

export default App;
