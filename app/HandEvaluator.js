// HandEvaluator.js - Poker Hand Ranking System

import { sortCardsByValue } from './CardUtils';

/**
 * Convert numeric card value to display name
 */
export const valueToDisplayName = (value) => {
  const names = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace'
  };
  return names[value] || value.toString();
};

/**
 * Convert numeric value to plural form for pairs, trips, etc.
 */
export const valueToDisplayNamePlural = (value) => {
  const names = {
    2: '2s', 3: '3s', 4: '4s', 5: '5s', 6: '6s', 7: '7s', 8: '8s', 9: '9s', 10: '10s',
    11: 'Jacks', 12: 'Queens', 13: 'Kings', 14: 'Aces'
  };
  return names[value] || value.toString() + 's';
};

/**
 * Hand rankings (higher is better)
 */
export const HAND_RANKS = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10
};

export const HAND_NAMES = {
  1: 'High Card',
  2: 'Pair',
  3: 'Two Pair',
  4: 'Three of a Kind',
  5: 'Straight',
  6: 'Flush',
  7: 'Full House',
  8: 'Four of a Kind',
  9: 'Straight Flush',
  10: 'Royal Flush'
};

/**
 * Check if cards form a flush (all same suit)
 */
const isFlush = (cards) => {
  if (cards.length < 5) return false;
  const suit = cards[0].suit;
  return cards.every(card => card.suit === suit);
};

/**
 * Check if cards form a straight
 * Returns the high card value if straight, null otherwise
 */
const isStraight = (cards) => {
  if (cards.length < 5) return null;
  
  const sorted = sortCardsByValue(cards);
  const values = sorted.map(c => c.numericValue);
  
  // Check for regular straight
  let isStraightSequence = true;
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      isStraightSequence = false;
      break;
    }
  }
  
  if (isStraightSequence) {
    return values[0]; // High card of the straight
  }
  
  // Check for Ace-low straight (A-2-3-4-5)
  if (values[0] === 14 && values[1] === 5 && values[2] === 4 && 
      values[3] === 3 && values[4] === 2) {
    return 5; // In A-2-3-4-5, the 5 is the high card
  }
  
  return null;
};

/**
 * Get value counts (for pairs, trips, quads)
 */
const getValueCounts = (cards) => {
  const counts = {};
  cards.forEach(card => {
    counts[card.numericValue] = (counts[card.numericValue] || 0) + 1;
  });
  return counts;
};

/**
 * Evaluate a 5-card poker hand
 * Returns { rank, name, tiebreakers, description }
 */
export const evaluateHand = (cards) => {
  if (cards.length !== 5) {
    throw new Error('Hand must contain exactly 5 cards');
  }
  
  const sorted = sortCardsByValue(cards);
  const valueCounts = getValueCounts(cards);
  const countValues = Object.entries(valueCounts).map(([value, count]) => ({
    value: parseInt(value),
    count
  }));
  countValues.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.value - a.value;
  });
  
  const flush = isFlush(cards);
  const straightHigh = isStraight(cards);
  
  // Royal Flush (A-K-Q-J-10 of same suit)
  if (flush && straightHigh === 14) {
    return {
      rank: HAND_RANKS.ROYAL_FLUSH,
      name: HAND_NAMES[HAND_RANKS.ROYAL_FLUSH],
      tiebreakers: [14],
      description: 'Royal Flush'
    };
  }
  
  // Straight Flush
  if (flush && straightHigh) {
    return {
      rank: HAND_RANKS.STRAIGHT_FLUSH,
      name: HAND_NAMES[HAND_RANKS.STRAIGHT_FLUSH],
      tiebreakers: [straightHigh],
      description: `${valueToDisplayName(straightHigh)}-high straight flush`
    };
  }
  
  // Four of a Kind
  if (countValues[0].count === 4) {
    return {
      rank: HAND_RANKS.FOUR_OF_KIND,
      name: HAND_NAMES[HAND_RANKS.FOUR_OF_KIND],
      tiebreakers: [countValues[0].value, countValues[1].value],
      description: `Four ${valueToDisplayNamePlural(countValues[0].value)}`
    };
  }
  
  // Full House
  if (countValues[0].count === 3 && countValues[1].count === 2) {
    return {
      rank: HAND_RANKS.FULL_HOUSE,
      name: HAND_NAMES[HAND_RANKS.FULL_HOUSE],
      tiebreakers: [countValues[0].value, countValues[1].value],
      description: `${valueToDisplayNamePlural(countValues[0].value)} over ${valueToDisplayNamePlural(countValues[1].value)}`
    };
  }
  
  // Flush
  if (flush) {
    const kickers = sorted.map(c => c.numericValue);
    return {
      rank: HAND_RANKS.FLUSH,
      name: HAND_NAMES[HAND_RANKS.FLUSH],
      tiebreakers: kickers,
      description: `${valueToDisplayName(kickers[0])}-high flush`
    };
  }
  
  // Straight
  if (straightHigh) {
    return {
      rank: HAND_RANKS.STRAIGHT,
      name: HAND_NAMES[HAND_RANKS.STRAIGHT],
      tiebreakers: [straightHigh],
      description: `${valueToDisplayName(straightHigh)}-high straight`
    };
  }
  
  // Three of a Kind
  if (countValues[0].count === 3) {
    return {
      rank: HAND_RANKS.THREE_OF_KIND,
      name: HAND_NAMES[HAND_RANKS.THREE_OF_KIND],
      tiebreakers: [countValues[0].value, countValues[1].value, countValues[2].value],
      description: `Three ${valueToDisplayNamePlural(countValues[0].value)}`
    };
  }
  
  // Two Pair
  if (countValues[0].count === 2 && countValues[1].count === 2) {
    return {
      rank: HAND_RANKS.TWO_PAIR,
      name: HAND_NAMES[HAND_RANKS.TWO_PAIR],
      tiebreakers: [countValues[0].value, countValues[1].value, countValues[2].value],
      description: `${valueToDisplayNamePlural(countValues[0].value)} and ${valueToDisplayNamePlural(countValues[1].value)}`
    };
  }
  
  // Pair
  if (countValues[0].count === 2) {
    return {
      rank: HAND_RANKS.PAIR,
      name: HAND_NAMES[HAND_RANKS.PAIR],
      tiebreakers: [countValues[0].value, countValues[1].value, countValues[2].value, countValues[3].value],
      description: `Pair of ${valueToDisplayNamePlural(countValues[0].value)}`
    };
  }
  
  // High Card
  const kickers = sorted.map(c => c.numericValue);
  return {
    rank: HAND_RANKS.HIGH_CARD,
    name: HAND_NAMES[HAND_RANKS.HIGH_CARD],
    tiebreakers: kickers,
    description: `${valueToDisplayName(kickers[0])} high`
  };
};

/**
 * Compare two evaluated hands
 * Returns: 1 if hand1 wins, -1 if hand2 wins, 0 if tie
 */
export const compareHands = (evaluatedHand1, evaluatedHand2) => {
  // Compare ranks first
  if (evaluatedHand1.rank > evaluatedHand2.rank) return 1;
  if (evaluatedHand1.rank < evaluatedHand2.rank) return -1;
  
  // Same rank, compare tiebreakers
  const tie1 = evaluatedHand1.tiebreakers;
  const tie2 = evaluatedHand2.tiebreakers;
  
  for (let i = 0; i < Math.max(tie1.length, tie2.length); i++) {
    const val1 = tie1[i] || 0;
    const val2 = tie2[i] || 0;
    
    if (val1 > val2) return 1;
    if (val1 < val2) return -1;
  }
  
  return 0; // Perfect tie
};

/**
 * Find the best 5-card hand from a set of cards
 * Used for Hand Strength evaluation (6+ cards)
 */
export const findBestHand = (cards, combinations) => {
  if (cards.length < 5) {
    return null;
  }
  
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
    evaluation: bestEvaluation
  };
};

/**
 * Find winners from multiple evaluated hands
 * Returns array of player indices who tied for the win
 */
export const findWinners = (evaluatedHands) => {
  if (evaluatedHands.length === 0) return [];
  if (evaluatedHands.length === 1) return [0];
  
  let bestHandIndices = [0];
  let bestEvaluation = evaluatedHands[0];
  
  for (let i = 1; i < evaluatedHands.length; i++) {
    const comparison = compareHands(evaluatedHands[i], bestEvaluation);
    
    if (comparison > 0) {
      // New best hand
      bestHandIndices = [i];
      bestEvaluation = evaluatedHands[i];
    } else if (comparison === 0) {
      // Tie with current best
      bestHandIndices.push(i);
    }
  }
  
  return bestHandIndices;
};

export default {
  HAND_RANKS,
  HAND_NAMES,
  evaluateHand,
  compareHands,
  findBestHand,
  findWinners
};