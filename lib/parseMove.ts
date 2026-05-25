import type { Chess, Move } from 'chess.js'

const PIECE_NAMES: Record<string, string> = {
  king: 'K',
  queen: 'Q',
  rook: 'R',
  bishop: 'B',
  knight: 'N',
  pawn: '',
}

const PROMO_NAMES: Record<string, string> = {
  queen: 'Q',
  rook: 'R',
  bishop: 'B',
  knight: 'N',
}

/**
 * Parses a natural language or standard-notation move string into a chess.js Move.
 * Handles input like "bishop takes pawn at b2", "king castles", "pawn to e4".
 * Returns the Move object on success, null if the input can't be resolved to a legal move.
 *
 * IMPORTANT: This function modifies `chess` on success (move is applied).
 * The caller is responsible for undoing if needed — in normal use, we don't undo.
 */
export function parseMove(input: string, chess: Chess): Move | null {
  const raw = input.trim()

  // 1. Try raw input directly (handles standard SAN and relaxed forms)
  try {
    const result = chess.move(raw, { strict: false })
    if (result) return result
  } catch { /* fall through */ }

  const s = raw.toLowerCase()

  // 2. Castling
  const isQueenside =
    /queen\s*side|castle.*queen|long\s*castle|q[\s-]?side/.test(s) || /o-?o-?o/i.test(s)
  const isKingside =
    !isQueenside &&
    (/king\s*side|castle.*king|short\s*castle|k[\s-]?side/.test(s) ||
      /castl(e|es|ing)/.test(s) ||
      /o-?o(?!-?o)/i.test(s))

  if (isQueenside) {
    try { return chess.move('O-O-O') } catch { /* fall through */ }
  }
  if (isKingside) {
    try { return chess.move('O-O') } catch { /* fall through */ }
  }

  // 3. Find all squares mentioned (e.g. "b2", "e4")
  const squares = s.match(/\b[a-h][1-8]\b/g) ?? []
  const dest = squares.at(-1)
  const fromSquare = squares.length >= 2 ? squares[0] : ''

  if (!dest) return null

  // 4. Identify piece
  let pieceLetter = ''
  for (const [name, letter] of Object.entries(PIECE_NAMES)) {
    if (s.includes(name)) {
      pieceLetter = letter
      break
    }
  }

  // 5. Capture?
  const isCapture = /\btakes?\b|\bcaptures?\b/.test(s)

  // 6. Promotion?
  const promoMatch =
    s.match(/promot(?:e|es|ing|ion)?\s*(?:to\s*)?(queen|rook|bishop|knight)/) ??
    s.match(/becomes?\s*(queen|rook|bishop|knight)/)
  const promo = promoMatch ? '=' + PROMO_NAMES[promoMatch[1]] : ''

  // 7. Build candidate notations and try each
  const candidates: string[] = []

  if (fromSquare) {
    candidates.push(pieceLetter + fromSquare + (isCapture ? 'x' : '') + dest + promo)
    candidates.push(pieceLetter + fromSquare + dest + promo)
  }
  candidates.push(pieceLetter + (isCapture ? 'x' : '') + dest + promo)
  candidates.push(pieceLetter + dest + promo)

  // For pawn captures without a source square, enumerate source files
  if (isCapture && !pieceLetter && !fromSquare) {
    for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      candidates.push(file + 'x' + dest + promo)
    }
  }

  for (const candidate of candidates) {
    if (!candidate.match(/[a-h][1-8]/)) continue
    try {
      const r = chess.move(candidate, { strict: false })
      if (r) return r
    } catch { /* keep trying */ }
  }

  // 8. Last resort: find a unique legal move matching destination + optional constraints
  let legal: Move[]
  try {
    legal = chess.moves({ verbose: true }) as Move[]
  } catch { return null }

  const pieceCode = pieceLetter ? pieceLetter.toLowerCase() : ''

  const matching = legal.filter(m => {
    if (m.to !== dest) return false
    if (pieceCode && m.piece !== pieceCode) return false
    if (fromSquare && m.from !== fromSquare) return false
    if (isCapture && !m.captured) return false
    return true
  })

  if (matching.length === 1) {
    try { return chess.move(matching[0].san) } catch { /* fall through */ }
  }

  return null
}
