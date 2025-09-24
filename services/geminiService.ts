
import { GoogleGenAI, Type } from "@google/genai";
import type { Player, GridState, AIMove } from "../types";
import { GRID_WIDTH, GRID_HEIGHT } from "../constants";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = "gemini-2.5-flash";

const moveSchema = {
    type: Type.OBJECT,
    properties: {
        pattern: {
            type: Type.ARRAY,
            description: "A small 2D array of 0s and 1s representing the pattern to place. 1s are new live cells. Should be compact, max 5x5.",
            items: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
            }
        },
        position: {
            type: Type.OBJECT,
            description: `Top-left {x, y} coordinate to place the pattern. x must be between 0 and ${GRID_WIDTH - 1}, y between 0 and ${GRID_HEIGHT - 1}.`,
            properties: {
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER }
            }
        },
        reasoning: {
            type: Type.STRING,
            description: "A brief, single-sentence explanation of the strategic reason for this move."
        }
    },
    required: ["pattern", "position", "reasoning"]
};

const getGridString = (grid: GridState, player: Player): string => {
    const opponent = player === 1 ? 2 : 1;
    return grid.map(row => 
        row.map(cell => {
            if (cell === 0) return '.';
            if (cell === player) return 'P';
            if (cell === opponent) return 'O';
            return '.';
        }).join('')
    ).join('\n');
}

export const getAIMove = async (grid: GridState, player: Player): Promise<AIMove> => {
  const opponent = player === 1 ? 2 : 1;
  const gridString = getGridString(grid, player);

  const prompt = `
You are a master strategist in a territorial version of Conway's Game of Life.
Your goal is to have more cells than your opponent after a simulation period.

THE RULES:
1.  A dead cell with exactly 3 neighbors becomes alive. Its ownership is determined by the player with the majority of those 3 neighbors.
2.  A live cell (yours or opponent's) with 2 or 3 live neighbors survives.
3.  All other live cells die from overpopulation (>3) or loneliness (<2).

YOUR TASK:
Analyze the grid and decide on a strategic move. Your move involves placing a small pattern of new cells.

GRID STATE:
The grid is ${GRID_WIDTH}x${GRID_HEIGHT}. 'P' are your cells (Player ${player}). 'O' are the opponent's cells (Player ${opponent}). '.' are dead cells.
\`\`\`
${gridString}
\`\`\`

STRATEGY:
- Place patterns that will survive and grow (e.g., gliders, blinkers).
- Attack opponent's formations to disrupt them.
- Claim empty territory to expand your influence.
- Avoid placing patterns that will die immediately or help your opponent.

Return your move as a JSON object matching the required schema. Your reasoning should be concise and strategic.
A good move would be placing a glider that travels into an open area or attacks an opponent's weak structure.
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: moveSchema,
        temperature: 0.9,
      }
    });

    const jsonString = response.text.trim();
    const parsedResponse = JSON.parse(jsonString);

    // Basic validation
    if (!parsedResponse.pattern || !parsedResponse.position || !parsedResponse.reasoning) {
        throw new Error("AI response is missing required fields.");
    }
    
    return parsedResponse as AIMove;

  } catch (error) {
    console.error("Error generating AI move:", error);
    // Fallback move in case of API error
    return {
        pattern: [[1]],
        position: { x: Math.floor(Math.random() * GRID_WIDTH), y: Math.floor(Math.random() * GRID_HEIGHT) },
        reasoning: "Executing fallback maneuver due to a strategic calculation error."
    };
  }
};
