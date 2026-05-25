export function buildPlayerMoveMessage(move: string, fen: string, history: string[]): string {
  return `I just played ${move}.
Current position (FEN): ${fen}
Move history: ${history.join(' ')}

Please give me a rich, qualitative analysis of what just changed with this move. How has the character of the position shifted — in terms of piece activity, pawn structure, space, king safety, or coordination? What ideas opened up, and what did I give up or close off? Name specific squares and pieces. End with a question or two to help me think deeper.`
}

export function buildOpponentMoveMessage(move: string, fen: string, history: string[]): string {
  return `My opponent just played ${move}.
Current position (FEN): ${fen}
Move history: ${history.join(' ')}

Help me understand what just changed with this move. What is my opponent building toward — their plan, not just their immediate threat? How has the character of the position shifted? Offer 2-3 different ways of thinking about where things stand now, and end with a question to help me find my own direction.`
}

export function buildMissingMessage(fen: string, history: string[]): string {
  return `What might I be missing in this position?
Current position (FEN): ${fen}
Move history: ${history.join(' ')}
Please ask me exactly 2-3 probing questions without giving any answers or hints.`
}
