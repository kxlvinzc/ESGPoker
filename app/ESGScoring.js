// ESGScoring.js - ESG Poker 3-Point Scoring System

import {
  get5CardCombinations,
  getBoardCombinations,
  createDeck,
  getCombinations
} from './CardUtils';
import {
  findBestHand,
  findWinners,
  evaluateHand,
  compareHands
} from './HandEvaluator';

/**
 * Find the nuts (best possible hand) for a given board
 * Returns array of 2-card combinations that make the nuts
 */
const findNutsForBoard = (boardCards) => {
  if (boardCards.length < 3) {
    return { nutsCombos: [], nutsEvaluation: null };
  }

  // Get all cards in a full deck
  const fullDeck = createDeck();

  // Create a set of board card IDs for quick lookup
  const boardCardIds = new Set(boardCards.map(card => card.id));

  // Get all cards NOT on the board (47 cards)
  const availableCards = fullDeck.filter(card => !boardCardIds.has(card.id));

  // Generate all possible 2-card combinations from available cards
  const twoCardCombos = getCombinations(availableCards, 2);

  // Generate all possible 3-card combinations from the board
  const threeCardCombos = getCombinations(boardCards, 3);

  let bestEvaluation = null;
  const nutsCombos = [];

  // Try every 2-card combo with every 3-card board combo
  for (const twoCards of twoCardCombos) {
    for (const threeCards of threeCardCombos) {
      const fiveCardHand = [...twoCards, ...threeCards];
      const evaluation = evaluateHand(fiveCardHand);

      if (!bestEvaluation || compareHands(evaluation, bestEvaluation) > 0) {
        // Found a better hand - this is the new nuts
        bestEvaluation = evaluation;
        nutsCombos.length = 0; // Clear previous nuts combos
        nutsCombos.push({
          cards: twoCards,
          cardIds: twoCards.map(c => c.id).sort().join(',')
        });
      } else if (compareHands(evaluation, bestEvaluation) === 0) {
        // This combo also makes the nuts
        const comboId = twoCards.map(c => c.id).sort().join(',');
        // Only add if not already in the list
        if (!nutsCombos.find(nc => nc.cardIds === comboId)) {
          nutsCombos.push({
            cards: twoCards,
            cardIds: comboId
          });
        }
      }
    }
  }

  return {
    nutsCombos,
    nutsEvaluation: bestEvaluation
  };
};

/**
 * Evaluate a player's best hand for a specific board
 * Returns the best 5-card combination using 2 from hand + 3 from board
 */
const evaluatePlayerBoard = (playerHand, boardCards, nutsInfo = null) => {
  if (playerHand.length < 2 || boardCards.length < 3) {
    return null;
  }

  const combinations = getBoardCombinations(playerHand, boardCards);

  if (combinations.length === 0) {
    return null;
  }

  // Find best hand from all combinations
  let bestHand = null;
  let bestEvaluation = null;
  let bestHoleCards = null;
  let bestBoardCards = null;

  // Get all 2-card combinations from player's hand
  const handCombos = getCombinations(playerHand, 2);
  // Get all 3-card combinations from board
  const boardCombos = getCombinations(boardCards, 3);

  for (const holeCards of handCombos) {
    for (const threeCards of boardCombos) {
      const fiveCardHand = [...holeCards, ...threeCards];
      const evaluation = evaluateHand(fiveCardHand);

      if (!bestEvaluation || compareHands(evaluation, bestEvaluation) > 0) {
        bestHand = fiveCardHand;
        bestEvaluation = evaluation;
        bestHoleCards = holeCards;
        bestBoardCards = threeCards;
      }
    }
  }

  // Check if player has the nuts
  let hasNuts = false;
  if (nutsInfo && nutsInfo.nutsCombos.length > 0 && bestHoleCards) {
    const playerHoleCardIds = bestHoleCards.map(c => c.id).sort().join(',');
    hasNuts = nutsInfo.nutsCombos.some(nc => nc.cardIds === playerHoleCardIds);
  }

  return {
    cards: bestHand,
    evaluation: bestEvaluation,
    holeCards: bestHoleCards,
    boardCards: bestBoardCards,
    hasNuts
  };
};

/**
 * Evaluate a player's Hand Strength (best 5 from all their cards)
 */
const evaluatePlayerHandStrength = (playerHand) => {
  if (playerHand.length < 5) {
    return null;
  }

  const combinations = get5CardCombinations(playerHand);

  if (combinations.length === 0) {
    return null;
  }

  // Find the best 5-card hand
  let bestHand = null;
  let bestEvaluation = null;

  for (const combo of combinations) {
    const evaluation = evaluateHand(combo);

    if (!bestEvaluation || compareHands(evaluation, bestEvaluation) > 0) {
      bestHand = combo;
      bestEvaluation = evaluation;
    }
  }

  return {
    cards: bestHand,
    evaluation: bestEvaluation,
    usedCards: bestHand // The 5 cards used for hand strength
  };
};

/**
 * Calculate scores for all players at showdown
 * Returns array of player scores with breakdown
 */
export const calculateShowdownScores = (gameState) => {
  const activePlayers = gameState.players.filter(p => !p.isFolded);

  if (activePlayers.length === 0) {
    return [];
  }

  // Find the nuts for both boards
  const board1Nuts = findNutsForBoard(gameState.board1.revealed);
  const board2Nuts = findNutsForBoard(gameState.board2.revealed);

  // Evaluate all players for Board 1
  const board1Evaluations = activePlayers.map(player => ({
    playerId: player.id,
    playerName: player.name,
    evaluation: evaluatePlayerBoard(player.hand, gameState.board1.revealed, board1Nuts)
  }));

  // Evaluate all players for Board 2
  const board2Evaluations = activePlayers.map(player => ({
    playerId: player.id,
    playerName: player.name,
    evaluation: evaluatePlayerBoard(player.hand, gameState.board2.revealed, board2Nuts)
  }));

  // Evaluate all players for Hand Strength
  const handStrengthEvaluations = activePlayers.map(player => ({
    playerId: player.id,
    playerName: player.name,
    evaluation: evaluatePlayerHandStrength(player.hand)
  }));
  
  // Find winners for Board 1
  const board1Winners = findWinners(
    board1Evaluations.map(e => e.evaluation.evaluation)
  );
  
  // Find winners for Board 2
  const board2Winners = findWinners(
    board2Evaluations.map(e => e.evaluation.evaluation)
  );
  
  // Find winners for Hand Strength
  const handStrengthWinners = findWinners(
    handStrengthEvaluations.map(e => e.evaluation.evaluation)
  );
  
  // Calculate points (1 point divided among winners)
  const board1Points = 1.0 / board1Winners.length;
  const board2Points = 1.0 / board2Winners.length;
  const handStrengthPoints = 1.0 / handStrengthWinners.length;
  
  // Build score results for each player
  const results = activePlayers.map((player, index) => {
    let totalPoints = 0;
    const breakdown = {
      board1: 0,
      board2: 0,
      handStrength: 0
    };
    
    // Board 1 points
    if (board1Winners.includes(index)) {
      breakdown.board1 = board1Points;
      totalPoints += board1Points;
    }
    
    // Board 2 points
    if (board2Winners.includes(index)) {
      breakdown.board2 = board2Points;
      totalPoints += board2Points;
    }
    
    // Hand Strength points
    if (handStrengthWinners.includes(index)) {
      breakdown.handStrength = handStrengthPoints;
      totalPoints += handStrengthPoints;
    }
    
    return {
      playerId: player.id,
      playerName: player.name,
      totalPoints: Math.round(totalPoints * 100) / 100, // Round to 2 decimals
      breakdown,
      board1Hand: board1Evaluations[index].evaluation,
      board2Hand: board2Evaluations[index].evaluation,
      handStrength: handStrengthEvaluations[index].evaluation
    };
  });
  
  // Sort by total points (highest first)
  results.sort((a, b) => b.totalPoints - a.totalPoints);
  
  return results;
};

/**
 * Determine the winner(s) of the pot
 * Returns array of winners with their share of the pot
 */
export const determineWinners = (gameState) => {
  const scores = calculateShowdownScores(gameState);
  
  if (scores.length === 0) {
    return [];
  }
  
  // Find the highest score
  const highestScore = scores[0].totalPoints;
  
  // Get all players with the highest score
  const winners = scores.filter(s => s.totalPoints === highestScore);
  
  // Calculate pot share for each winner
  const potShare = gameState.pot / winners.length;
  
  return winners.map(winner => ({
    ...winner,
    potShare: Math.round(potShare * 100) / 100
  }));
};

/**
 * Get a detailed showdown summary
 */
export const getShowdownSummary = (gameState) => {
  const scores = calculateShowdownScores(gameState);
  const winners = determineWinners(gameState);
  
  return {
    totalPot: gameState.pot,
    allScores: scores,
    winners,
    board1: gameState.board1.revealed,
    board2: gameState.board2.revealed
  };
};

/**
 * Format a player's hand evaluation for display
 */
export const formatHandEvaluation = (handResult) => {
  if (!handResult || !handResult.evaluation) {
    return 'No hand';
  }

  let description = handResult.evaluation.description;

  // Append "(nuts)" if player has the nuts
  if (handResult.hasNuts) {
    description += ' (nuts)';
  }

  return description;
};

/**
 * Format points breakdown for display
 */
export const formatPointsBreakdown = (breakdown) => {
  const parts = [];
  
  if (breakdown.board1 > 0) {
    parts.push(`Board 1: ${breakdown.board1.toFixed(2)}`);
  }
  if (breakdown.board2 > 0) {
    parts.push(`Board 2: ${breakdown.board2.toFixed(2)}`);
  }
  if (breakdown.handStrength > 0) {
    parts.push(`Hand Strength: ${breakdown.handStrength.toFixed(2)}`);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'No points';
};

/**
 * Check if there's only one player left (everyone else folded)
 */
export const checkEarlyWinner = (gameState) => {
  const activePlayers = gameState.players.filter(p => !p.isFolded);
  
  if (activePlayers.length === 1) {
    return {
      hasWinner: true,
      winner: activePlayers[0],
      potShare: gameState.pot
    };
  }
  
  return {
    hasWinner: false
  };
};

export default {
  calculateShowdownScores,
  determineWinners,
  getShowdownSummary,
  formatHandEvaluation,
  formatPointsBreakdown,
  checkEarlyWinner
};