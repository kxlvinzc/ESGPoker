// CardUtils.js - Deck and Card Management for ESG Poker

/**
 * Card suits and values
 */
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Numerical values for card comparison
 */
export const VALUE_MAP = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

/**
 * Create a single card object
 */
export const createCard = (suit, value) => ({
  suit,
  value,
  numericValue: VALUE_MAP[value],
  id: `${value}_${suit}` // Unique identifier
});

/**
 * Create a standard 52-card deck
 */
export const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push(createCard(suit, value));
    }
  }
  return deck;
};

/**
 * Fisher-Yates shuffle algorithm
 * Returns a new shuffled array (doesn't modify original)
 */
export const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Deal cards from the deck
 * Returns { dealtCards, remainingDeck }
 */
export const dealCards = (deck, count) => {
  if (count > deck.length) {
    console.warn(`Trying to deal ${count} cards but only ${deck.length} available`);
    count = deck.length;
  }
  
  const dealtCards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  
  return {
    dealtCards,
    remainingDeck
  };
};

/**
 * Add cards to an array and shuffle them
 */
export const addAndShuffle = (existingCards, newCards) => {
  return shuffleDeck([...existingCards, ...newCards]);
};

/**
 * Format card for display
 */
export const formatCard = (card) => {
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return `${card.value}${suitSymbols[card.suit]}`;
};

/**
 * Format multiple cards for display
 */
export const formatCards = (cards) => {
  return cards.map(formatCard).join(' ');
};

/**
 * Sort cards by value (high to low)
 */
export const sortCardsByValue = (cards) => {
  return [...cards].sort((a, b) => b.numericValue - a.numericValue);
};

/**
 * Group cards by suit
 */
export const groupBySuit = (cards) => {
  const groups = {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: []
  };
  
  cards.forEach(card => {
    groups[card.suit].push(card);
  });
  
  return groups;
};

/**
 * Group cards by value
 */
export const groupByValue = (cards) => {
  const groups = {};
  
  cards.forEach(card => {
    if (!groups[card.value]) {
      groups[card.value] = [];
    }
    groups[card.value].push(card);
  });
  
  return groups;
};

/**
 * Get all possible 5-card combinations from a hand
 * Used for finding best hand from 6+ cards
 */
export const getCombinations = (cards, size) => {
  const result = [];
  
  const combine = (start, combo) => {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  };
  
  combine(0, []);
  return result;
};

/**
 * Get all 5-card combinations from a hand (for Hand Strength evaluation)
 */
export const get5CardCombinations = (cards) => {
  if (cards.length < 5) {
    return [];
  }
  if (cards.length === 5) {
    return [cards];
  }
  return getCombinations(cards, 5);
};

/**
 * Get all valid board combinations (2 from hand + 3 from board)
 */
export const getBoardCombinations = (handCards, boardCards) => {
  if (handCards.length < 2 || boardCards.length < 3) {
    return [];
  }
  
  const combinations = [];
  const handCombos = getCombinations(handCards, 2);
  const boardCombos = getCombinations(boardCards, 3);
  
  // Combine each 2-card hand combo with each 3-card board combo
  for (const handCombo of handCombos) {
    for (const boardCombo of boardCombos) {
      combinations.push([...handCombo, ...boardCombo]);
    }
  }
  
  return combinations;
};

export default {
  SUITS,
  VALUES,
  VALUE_MAP,
  createCard,
  createDeck,
  shuffleDeck,
  dealCards,
  addAndShuffle,
  formatCard,
  formatCards,
  sortCardsByValue,
  groupBySuit,
  groupByValue,
  getCombinations,
  get5CardCombinations,
  getBoardCombinations
};