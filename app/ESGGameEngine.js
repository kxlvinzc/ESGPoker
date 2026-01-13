// ESGGameEngine.js - Main Game Logic for ESG Poker

import {
  addAndShuffle,
  createDeck,
  dealCards,
  shuffleDeck
} from './CardUtils';

/**
 * Game phases
 */
export const GAME_PHASES = {
  PRE_FLOP: 'PRE_FLOP',
  FLOP: 'FLOP',
  TURN: 'TURN',
  RIVER: 'RIVER',
  SHOWDOWN: 'SHOWDOWN',
  COMPLETE: 'COMPLETE'
};

/**
 * Player action types
 */
export const ACTIONS = {
  FOLD: 'FOLD',
  CHECK: 'CHECK',
  CALL: 'CALL',
  BET: 'BET',
  RAISE: 'RAISE',
  ALL_IN: 'ALL_IN'
};

/**
 * Create a new player
 */
const createPlayer = (id, name, chips = 1000) => ({
  id,
  name,
  chips,
  bet: 0,
  hand: [],
  isActive: true,
  isFolded: false,
  hasActed: false,
  cardsOwed: 0, // Cards owed from distributions
  position: null
});

/**
 * Initialize a new ESG poker game
 */
export const initializeGame = (playerNames, smallBlind = 10, bigBlind = 20) => {
  if (playerNames.length < 2 || playerNames.length > 7) {
    throw new Error('ESG Poker requires 2-7 players');
  }
  
  // Create players
  const players = playerNames.map((name, index) => 
    createPlayer(index, name, 1000)
  );
  
  // Assign positions
  const buttonIndex = players.length - 1;
  const sbIndex = 0;
  const bbIndex = 1 % players.length;
  
  players[buttonIndex].position = 'BTN';
  players[sbIndex].position = 'SB';
  players[bbIndex].position = 'BB';
  
  // Create and shuffle deck
  let deck = shuffleDeck(createDeck());
  
  // Deal 6 cards to each player
  const totalCardsForPlayers = players.length * 6;
  const { dealtCards: playerCards, remainingDeck: deckAfterPlayers } = 
    dealCards(deck, totalCardsForPlayers);
  
  // Distribute cards to players
  for (let i = 0; i < players.length; i++) {
    players[i].hand = playerCards.slice(i * 6, (i + 1) * 6);
  }
  
  // Deal 2 boards of 5 cards each (face down initially)
  const { dealtCards: boardCards, remainingDeck: finalDeck } = 
    dealCards(deckAfterPlayers, 10);
  
  const board1 = boardCards.slice(0, 5);
  const board2 = boardCards.slice(5, 10);
  
  // Remaining cards become the Muck Pile
  const muckPile = finalDeck;
  
  return {
    players,
    board1: {
      cards: board1,
      revealed: [] // Cards revealed so far
    },
    board2: {
      cards: board2,
      revealed: [] // Cards revealed so far
    },
    muckPile,
    pot: 0,
    currentBet: bigBlind,
    phase: GAME_PHASES.PRE_FLOP,
    activePlayerIndex: (bbIndex + 1) % players.length, // UTG starts
    buttonIndex,
    smallBlind,
    bigBlind,
    dealerMessage: 'Pre-flop betting begins',
    history: []
  };
};

/**
 * Calculate how many cards each active player should receive
 * Returns { cardsPerPlayer, totalNeeded, canDistribute }
 */
const calculateDistribution = (activePlayers, muckPileSize, cardsOwedTotal) => {
  const cardsNeeded = 3; // Each player should get 3 cards per street
  const totalNeeded = (activePlayers.length * cardsNeeded) + cardsOwedTotal;
  
  if (muckPileSize >= totalNeeded) {
    return {
      cardsPerPlayer: cardsNeeded,
      totalNeeded,
      canDistribute: true,
      cardsOwed: 0
    };
  }
  
  // Not enough cards, distribute evenly
  const availablePerPlayer = Math.floor(muckPileSize / activePlayers.length);
  const totalDistributed = availablePerPlayer * activePlayers.length;
  const newCardsOwed = (cardsNeeded - availablePerPlayer) + 
    (cardsOwedTotal / activePlayers.length);
  
  return {
    cardsPerPlayer: availablePerPlayer,
    totalNeeded: totalDistributed,
    canDistribute: availablePerPlayer > 0,
    cardsOwed: newCardsOwed
  };
};

/**
 * Distribute cards to players from the Muck Pile
 */
const distributeCards = (gameState) => {
  const activePlayers = gameState.players.filter(p => !p.isFolded);
  
  if (activePlayers.length === 0) {
    return {
      ...gameState,
      dealerMessage: 'No active players to distribute cards to'
    };
  }
  
  // Calculate total cards owed
  const totalCardsOwed = activePlayers.reduce((sum, p) => sum + p.cardsOwed, 0);
  
  const distribution = calculateDistribution(
    activePlayers,
    gameState.muckPile.length,
    totalCardsOwed
  );
  
  if (!distribution.canDistribute) {
    // Update cards owed for each player
    const updatedPlayers = gameState.players.map(p => {
      if (p.isFolded) return p;
      return {
        ...p,
        cardsOwed: p.cardsOwed + 3
      };
    });
    
    return {
      ...gameState,
      players: updatedPlayers,
      dealerMessage: `Insufficient cards in Muck Pile. Each player owes ${3} more cards.`
    };
  }
  
  // Distribute cards
  const { dealtCards, remainingDeck } = dealCards(
    gameState.muckPile,
    distribution.totalNeeded
  );
  
  let cardIndex = 0;
  const updatedPlayers = gameState.players.map(player => {
    if (player.isFolded) return player;
    
    // Give player their cards + any owed cards
    const cardsToGive = distribution.cardsPerPlayer + Math.floor(player.cardsOwed);
    const newCards = dealtCards.slice(cardIndex, cardIndex + cardsToGive);
    cardIndex += cardsToGive;
    
    return {
      ...player,
      hand: [...player.hand, ...newCards],
      cardsOwed: 0 // Reset owed cards
    };
  });
  
  const message = distribution.cardsOwed > 0
    ? `Each player received ${distribution.cardsPerPlayer} cards. Still owe ${Math.floor(distribution.cardsOwed)} cards.`
    : `Each player received ${distribution.cardsPerPlayer} cards.`;
  
  return {
    ...gameState,
    players: updatedPlayers,
    muckPile: remainingDeck,
    dealerMessage: message
  };
};

/**
 * Reveal flop on both boards (3 cards each)
 */
export const revealFlop = (gameState) => {
  if (gameState.phase !== GAME_PHASES.PRE_FLOP) {
    return gameState;
  }
  
  // Reveal first 3 cards of each board
  const updatedState = {
    ...gameState,
    board1: {
      ...gameState.board1,
      revealed: gameState.board1.cards.slice(0, 3)
    },
    board2: {
      ...gameState.board2,
      revealed: gameState.board2.cards.slice(0, 3)
    },
    phase: GAME_PHASES.FLOP,
    dealerMessage: 'Flop revealed on both boards'
  };
  
  // Distribute cards after flop
  return distributeCards(updatedState);
};

/**
 * Reveal turn on both boards (1 card each)
 */
export const revealTurn = (gameState) => {
  if (gameState.phase !== GAME_PHASES.FLOP) {
    return gameState;
  }
  
  // Reveal 4th card of each board
  const updatedState = {
    ...gameState,
    board1: {
      ...gameState.board1,
      revealed: gameState.board1.cards.slice(0, 4)
    },
    board2: {
      ...gameState.board2,
      revealed: gameState.board2.cards.slice(0, 4)
    },
    phase: GAME_PHASES.TURN,
    dealerMessage: 'Turn revealed on both boards'
  };
  
  // Distribute cards after turn
  return distributeCards(updatedState);
};

/**
 * Reveal river on both boards (1 card each)
 */
export const revealRiver = (gameState) => {
  if (gameState.phase !== GAME_PHASES.TURN) {
    return gameState;
  }
  
  // Reveal 5th card of each board
  const updatedState = {
    ...gameState,
    board1: {
      ...gameState.board1,
      revealed: gameState.board1.cards.slice(0, 5)
    },
    board2: {
      ...gameState.board2,
      revealed: gameState.board2.cards.slice(0, 5)
    },
    phase: GAME_PHASES.RIVER,
    dealerMessage: 'River revealed on both boards'
  };
  
  // Distribute final cards
  return distributeCards(updatedState);
};

/**
 * Player folds their hand
 */
export const playerFold = (gameState, playerIndex) => {
  const player = gameState.players[playerIndex];
  
  if (player.isFolded || !player.isActive) {
    return gameState;
  }
  
  // Add folded cards to Muck Pile and shuffle
  const newMuckPile = addAndShuffle(gameState.muckPile, player.hand);
  
  const updatedPlayers = gameState.players.map((p, i) => 
    i === playerIndex ? { ...p, isFolded: true, hand: [], hasActed: true } : p
  );
  
  return {
    ...gameState,
    players: updatedPlayers,
    muckPile: newMuckPile,
    dealerMessage: `${player.name} folds`
  };
};

/**
 * Check if betting round is complete
 */
export const isBettingRoundComplete = (gameState) => {
  const activePlayers = gameState.players.filter(p => !p.isFolded);
  
  if (activePlayers.length === 0) return true;
  if (activePlayers.length === 1) return true;
  
  // All active players must have acted and matched the current bet
  return activePlayers.every(p => 
    p.hasActed && (p.bet === gameState.currentBet || p.chips === 0)
  );
};

/**
 * Get count of active (non-folded) players
 */
export const getActivePlayerCount = (gameState) => {
  return gameState.players.filter(p => !p.isFolded).length;
};

/**
 * Reset betting round flags
 */
export const resetBettingRound = (gameState) => {
  const updatedPlayers = gameState.players.map(p => ({
    ...p,
    hasActed: false,
    bet: 0
  }));
  
  return {
    ...gameState,
    players: updatedPlayers,
    currentBet: 0
  };
};

export default {
  GAME_PHASES,
  ACTIONS,
  initializeGame,
  revealFlop,
  revealTurn,
  revealRiver,
  playerFold,
  isBettingRoundComplete,
  getActivePlayerCount,
  resetBettingRound
};