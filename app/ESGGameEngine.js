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
  totalContributed: 0, // Total amount put in pot this hand (for side pots)
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
export const initializeGame = (playerNames, smallBlind = 1, bigBlind = 3) => {
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

  // Post blinds
  players[sbIndex].chips -= smallBlind;
  players[sbIndex].bet = smallBlind;
  players[sbIndex].totalContributed = smallBlind;

  players[bbIndex].chips -= bigBlind;
  players[bbIndex].bet = bigBlind;
  players[bbIndex].totalContributed = bigBlind;

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
    pot: smallBlind + bigBlind,
    currentBet: bigBlind,
    lastRaiseAmount: bigBlind, // For minimum raise calculation
    phase: GAME_PHASES.PRE_FLOP,
    activePlayerIndex: (bbIndex + 1) % players.length, // UTG starts
    buttonIndex,
    smallBlind,
    bigBlind,
    dealerMessage: `Blinds posted: SB $${smallBlind}, BB $${bigBlind}. Pre-flop betting begins.`,
    history: [],
    bettingRoundComplete: false
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
    currentBet: 0,
    lastRaiseAmount: 0
  };
};

/**
 * Get amount player needs to call
 */
export const getAmountToCall = (gameState, playerIndex) => {
  const player = gameState.players[playerIndex];
  return gameState.currentBet - player.bet;
};

/**
 * Calculate pot-limit maximum raise for a player
 * Formula: (3 × amount_to_call) + (pot - amount_to_call)
 * Simplified: (2 × amount_to_call) + pot
 */
export const calculatePotLimit = (gameState, playerIndex) => {
  const player = gameState.players[playerIndex];
  const amountToCall = getAmountToCall(gameState, playerIndex);

  // Max pot raise = (2 × amount to call) + current pot
  const maxPotRaise = (2 * amountToCall) + gameState.pot;

  // Can't bet more than player has
  const maxPlayerBet = player.chips + player.bet;

  return Math.min(maxPotRaise, maxPlayerBet);
};

/**
 * Player checks (only valid when currentBet = player's bet)
 */
export const playerCheck = (gameState, playerIndex) => {
  const player = gameState.players[playerIndex];

  if (player.isFolded || gameState.activePlayerIndex !== playerIndex) {
    return gameState;
  }

  if (gameState.currentBet !== player.bet) {
    return gameState; // Can't check, must call or fold
  }

  const updatedPlayers = gameState.players.map((p, i) =>
    i === playerIndex ? { ...p, hasActed: true } : p
  );

  return {
    ...gameState,
    players: updatedPlayers,
    dealerMessage: `${player.name} checks`
  };
};

/**
 * Player calls the current bet
 */
export const playerCall = (gameState, playerIndex) => {
  const player = gameState.players[playerIndex];

  if (player.isFolded || gameState.activePlayerIndex !== playerIndex) {
    return gameState;
  }

  const amountToCall = getAmountToCall(gameState, playerIndex);

  if (amountToCall === 0) {
    // No bet to call, should check instead
    return playerCheck(gameState, playerIndex);
  }

  // If player can't afford full call, they go all-in
  const actualCall = Math.min(amountToCall, player.chips);

  const updatedPlayers = gameState.players.map((p, i) =>
    i === playerIndex
      ? {
          ...p,
          chips: p.chips - actualCall,
          bet: p.bet + actualCall,
          totalContributed: p.totalContributed + actualCall,
          hasActed: true
        }
      : p
  );

  return {
    ...gameState,
    players: updatedPlayers,
    pot: gameState.pot + actualCall,
    dealerMessage: `${player.name} calls $${actualCall}`
  };
};

/**
 * Player bets/raises to a specific amount
 */
export const playerBet = (gameState, playerIndex, totalBetAmount) => {
  const player = gameState.players[playerIndex];

  if (player.isFolded || gameState.activePlayerIndex !== playerIndex) {
    return gameState;
  }

  const amountToCall = getAmountToCall(gameState, playerIndex);
  const raiseAmount = totalBetAmount - gameState.currentBet;

  // Validate minimum raise (must raise at least the size of last raise)
  const minRaise = gameState.currentBet + gameState.lastRaiseAmount;
  if (totalBetAmount < minRaise && player.chips + player.bet > minRaise) {
    // Not a valid raise (unless going all-in)
    return gameState;
  }

  // Validate pot limit
  const potLimit = calculatePotLimit(gameState, playerIndex);
  if (totalBetAmount > potLimit) {
    return gameState; // Exceeds pot limit
  }

  // Calculate how much player needs to add
  const amountToAdd = totalBetAmount - player.bet;

  if (amountToAdd > player.chips) {
    // Can't afford this bet
    return gameState;
  }

  const updatedPlayers = gameState.players.map((p, i) => {
    if (i === playerIndex) {
      return {
        ...p,
        chips: p.chips - amountToAdd,
        bet: totalBetAmount,
        totalContributed: p.totalContributed + amountToAdd,
        hasActed: true
      };
    }
    // Other players who have acted need to act again (except all-in players)
    if (p.hasActed && p.chips > 0 && !p.isFolded) {
      return { ...p, hasActed: false };
    }
    return p;
  });

  const isRaise = gameState.currentBet > 0;
  const actionWord = isRaise ? 'raises to' : 'bets';

  return {
    ...gameState,
    players: updatedPlayers,
    pot: gameState.pot + amountToAdd,
    currentBet: totalBetAmount,
    lastRaiseAmount: raiseAmount,
    dealerMessage: `${player.name} ${actionWord} $${totalBetAmount}`
  };
};

/**
 * Player goes all-in
 */
export const playerAllIn = (gameState, playerIndex) => {
  const player = gameState.players[playerIndex];

  if (player.isFolded || gameState.activePlayerIndex !== playerIndex) {
    return gameState;
  }

  if (player.chips === 0) {
    return gameState; // Already all-in
  }

  const allInAmount = player.chips + player.bet;

  // Check if this is a call all-in or raise all-in
  if (allInAmount <= gameState.currentBet) {
    // Call all-in
    return playerCall(gameState, playerIndex);
  } else {
    // Raise all-in
    return playerBet(gameState, playerIndex, allInAmount);
  }
};

/**
 * Advance to next active player
 */
export const advanceToNextPlayer = (gameState) => {
  const activePlayers = gameState.players.filter(p => !p.isFolded);

  if (activePlayers.length <= 1) {
    return gameState;
  }

  let nextIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;

  // Find next player who hasn't folded
  while (gameState.players[nextIndex].isFolded) {
    nextIndex = (nextIndex + 1) % gameState.players.length;
  }

  return {
    ...gameState,
    activePlayerIndex: nextIndex
  };
};

/**
 * Start new betting round for a new street
 */
export const startNewBettingRound = (gameState) => {
  const updatedPlayers = gameState.players.map(p => ({
    ...p,
    hasActed: false,
    bet: 0
  }));

  // Find first active player after button (small blind position for post-flop)
  let firstPlayerIndex = (gameState.buttonIndex + 1) % gameState.players.length;
  while (updatedPlayers[firstPlayerIndex].isFolded &&
         updatedPlayers.filter(p => !p.isFolded).length > 0) {
    firstPlayerIndex = (firstPlayerIndex + 1) % gameState.players.length;
  }

  return {
    ...gameState,
    players: updatedPlayers,
    currentBet: 0,
    lastRaiseAmount: 0,
    activePlayerIndex: firstPlayerIndex,
    bettingRoundComplete: false
  };
};

/**
 * Calculate side pots based on player contributions
 * Returns array of pots with eligible players
 */
export const calculateSidePots = (gameState) => {
  const activePlayers = gameState.players.filter(p => !p.isFolded);

  if (activePlayers.length === 0) {
    return [];
  }

  if (activePlayers.length === 1) {
    // Only one player, they get everything
    return [{
      amount: gameState.pot,
      eligiblePlayerIds: [activePlayers[0].id]
    }];
  }

  // Sort players by total contributed (ascending)
  const sortedPlayers = [...activePlayers].sort(
    (a, b) => a.totalContributed - b.totalContributed
  );

  const pots = [];
  let remainingContributions = activePlayers.map(p => ({
    id: p.id,
    amount: p.totalContributed
  }));

  for (let i = 0; i < sortedPlayers.length; i++) {
    const capAmount = sortedPlayers[i].totalContributed;

    if (capAmount === 0) continue;

    // Count how many players contributed at this level
    const eligiblePlayers = remainingContributions.filter(rc => rc.amount > 0);

    if (eligiblePlayers.length < 2) {
      // Only one player at this level, award directly (no pot to contest)
      if (eligiblePlayers.length === 1) {
        pots.push({
          amount: eligiblePlayers[0].amount,
          eligiblePlayerIds: [eligiblePlayers[0].id],
          isUncontested: true
        });
      }
      break;
    }

    // Calculate pot amount at this level
    let potAmount = 0;
    remainingContributions = remainingContributions.map(rc => {
      const contribution = Math.min(rc.amount, capAmount);
      potAmount += contribution;
      return {
        ...rc,
        amount: rc.amount - contribution
      };
    });

    // Create pot with eligible players
    pots.push({
      amount: potAmount,
      eligiblePlayerIds: eligiblePlayers.map(p => p.id)
    });
  }

  return pots;
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
  resetBettingRound,
  getAmountToCall,
  calculatePotLimit,
  playerCheck,
  playerCall,
  playerBet,
  playerAllIn,
  advanceToNextPlayer,
  startNewBettingRound,
  calculateSidePots
};