
import React from 'react';
import type { Player } from '../types';
import Player1Icon from './icons/Player1Icon';
import Player2Icon from './icons/Player2Icon';

interface AgentInfoProps {
  player: Player;
  score: number;
  isActive: boolean;
  isThinking: boolean;
}

const playerConfig = {
    1: { name: 'Cyan AI', color: 'text-p1', icon: <Player1Icon /> },
    2: { name: 'Rose AI', color: 'text-p2', icon: <Player2Icon /> }
}

const AgentInfo: React.FC<AgentInfoProps> = ({ player, score, isActive, isThinking }) => {
  const config = playerConfig[player];
  const activeClasses = isActive ? 'border-yellow-400' : 'border-gray-700';
  
  return (
    <div className={`flex-1 flex flex-col items-center p-3 bg-gray-900/50 rounded-lg border-2 ${activeClasses} transition-all`}>
      <div className={`w-10 h-10 mb-2 ${config.color}`}>
        {config.icon}
      </div>
      <h3 className={`font-bold text-lg ${config.color}`}>{config.name}</h3>
      <p className="text-gray-300">Score: <span className="font-bold text-white">{score}</span></p>
      {isThinking && (
         <div className="flex items-center text-sm text-yellow-300 mt-1">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Thinking...
        </div>
      )}
    </div>
  );
};

export default AgentInfo;
