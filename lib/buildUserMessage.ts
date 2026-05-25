export function buildPlayerMoveMessage(move: string, fen: string, history: string[]): string {
  return `I just played ${move}.
Current position (FEN): ${fen}
Move history: ${history.join(' ')}
Please give me your reflective analysis of my move.`
}

export function buildOpponentMoveMessage(move: string, fen: string, history: string[]): string {
  return `My opponent just played ${move}.
Current position (FEN): ${fen}
Move history: ${history.join(' ')}
Help me read this move and think through my options.`
}

export function buildMissingMessage(fen: string, history: string[]): string {
  return `What might I be missing in this position?
Current position (FEN): ${fen}
Move history: ${history.join(' ')}
Please ask me 2-3 probing questions without giving any answers.`
}
