// ESGGameDemo.jsx - Demo component to test ESG Poker

import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Slider } from 'react-native';
import { formatCard } from './CardUtils';
import {
  GAME_PHASES,
  initializeGame,
  playerFold,
  revealFlop,
  revealRiver,
  revealTurn,
  playerCheck,
  playerCall,
  playerBet,
  playerAllIn,
  calculatePotLimit,
  getAmountToCall,
  advanceToNextPlayer,
  isBettingRoundComplete as checkBettingComplete,
  startNewBettingRound
} from './ESGGameEngine';
import { formatHandEvaluation, formatPointsBreakdown, getShowdownSummary } from './ESGScoring';

export default function ESGGameDemo() {
  const [gameState, setGameState] = useState(null);
  const [showdown, setShowdown] = useState(null);
  const [betAmount, setBetAmount] = useState(0);

  // Initialize a new game
  const startNewGame = () => {
    const playerNames = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace'];
    const newGame = initializeGame(playerNames, 1, 3); // $1 SB, $3 BB
    setGameState(newGame);
    setShowdown(null);
    setBetAmount(0);
  };

  // Check if betting is complete and auto-advance
  useEffect(() => {
    if (!gameState || gameState.phase === GAME_PHASES.SHOWDOWN) return;

    const isBettingComplete = checkBettingComplete(gameState);
    if (isBettingComplete && !gameState.bettingRoundComplete) {
      // Mark betting as complete and auto-advance after short delay
      setTimeout(() => {
        advancePhase();
      }, 1000);
    }
  }, [gameState]);

  // Betting action handlers
  const handleCheck = () => {
    if (!gameState) return;
    let newState = playerCheck(gameState, gameState.activePlayerIndex);
    newState = advanceToNextPlayer(newState);
    setGameState(newState);
  };

  const handleCall = () => {
    if (!gameState) return;
    let newState = playerCall(gameState, gameState.activePlayerIndex);
    newState = advanceToNextPlayer(newState);
    setGameState(newState);
  };

  const handleFoldClick = () => {
    if (!gameState) return;
    let newState = playerFold(gameState, gameState.activePlayerIndex);
    newState = advanceToNextPlayer(newState);
    setGameState(newState);
  };

  const handleBet = () => {
    if (!gameState || betAmount === 0) return;
    let newState = playerBet(gameState, gameState.activePlayerIndex, betAmount);
    newState = advanceToNextPlayer(newState);
    setGameState(newState);
    setBetAmount(0);
  };

  const handleAllIn = () => {
    if (!gameState) return;
    let newState = playerAllIn(gameState, gameState.activePlayerIndex);
    newState = advanceToNextPlayer(newState);
    setGameState(newState);
  };

  // Advance to next phase
  const advancePhase = () => {
    if (!gameState) return;

    let newState = { ...gameState };

    switch (gameState.phase) {
      case GAME_PHASES.PRE_FLOP:
        newState = revealFlop(newState);
        newState = startNewBettingRound(newState);
        break;
      case GAME_PHASES.FLOP:
        newState = revealTurn(newState);
        newState = startNewBettingRound(newState);
        break;
      case GAME_PHASES.TURN:
        newState = revealRiver(newState);
        newState = startNewBettingRound(newState);
        break;
      case GAME_PHASES.RIVER:
        newState.phase = GAME_PHASES.SHOWDOWN;
        const summary = getShowdownSummary(newState);
        setShowdown(summary);
        break;
      default:
        break;
    }

    setGameState(newState);
    setBetAmount(0);
  };

  // Render card
  const renderCard = (card) => {
    const suitColors = {
      hearts: '#E74C3C',
      diamonds: '#E74C3C',
      clubs: '#2C3E50',
      spades: '#2C3E50'
    };

    return (
      <View key={card.id} style={[styles.card, { borderColor: suitColors[card.suit] }]}>
        <Text style={[styles.cardText, { color: suitColors[card.suit] }]}>
          {formatCard(card)}
        </Text>
      </View>
    );
  };

  // Render a small card (for showing specific 5-card combinations)
  const renderSmallCard = (card) => {
    const suitColors = {
      hearts: '#E74C3C',
      diamonds: '#E74C3C',
      clubs: '#2C3E50',
      spades: '#2C3E50'
    };

    return (
      <View key={card.id} style={[styles.smallCard, { borderColor: suitColors[card.suit] }]}>
        <Text style={[styles.smallCardText, { color: suitColors[card.suit] }]}>
          {formatCard(card)}
        </Text>
      </View>
    );
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>ESG Poker Demo</Text>
        <Text style={styles.subtitle}>
          Test the game logic{'\n'}
          7 players, dual boards, 3-point scoring
        </Text>
        <TouchableOpacity style={styles.button} onPress={startNewGame}>
          <Text style={styles.buttonText}>Start New Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>ESG Poker - {gameState.phase}</Text>
        <Text style={styles.dealerMessage}>{gameState.dealerMessage}</Text>

        {/* Game Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={startNewGame}>
            <Text style={styles.buttonText}>New Game</Text>
          </TouchableOpacity>
        </View>

        {/* Board 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Board 1</Text>
          <View style={styles.cardRow}>
            {gameState.board1.revealed.map(renderCard)}
            {gameState.board1.revealed.length < 5 && (
              <View style={styles.cardBack}>
                <Text style={styles.cardBackText}>?</Text>
              </View>
            )}
          </View>
        </View>

        {/* Board 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Board 2</Text>
          <View style={styles.cardRow}>
            {gameState.board2.revealed.map(renderCard)}
            {gameState.board2.revealed.length < 5 && (
              <View style={styles.cardBack}>
                <Text style={styles.cardBackText}>?</Text>
              </View>
            )}
          </View>
        </View>

        {/* Muck Pile Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Muck Pile: {gameState.muckPile.length} cards
          </Text>
          <Text style={styles.infoText}>
            Pot: ${gameState.pot}
          </Text>
          {gameState.phase !== GAME_PHASES.SHOWDOWN && (
            <>
              <Text style={styles.infoText}>
                Current Bet: ${gameState.currentBet}
              </Text>
              <Text style={styles.infoText}>
                To Act: {gameState.players[gameState.activePlayerIndex]?.name}
              </Text>
            </>
          )}
        </View>

        {/* Players */}
        <Text style={styles.sectionTitle}>Players</Text>
        {gameState.players.map((player, index) => {
          const isActivePlayer = index === gameState.activePlayerIndex;
          const amountToCall = isActivePlayer ? getAmountToCall(gameState, index) : 0;
          const potLimit = isActivePlayer ? calculatePotLimit(gameState, index) : 0;
          const minRaise = gameState.currentBet + gameState.lastRaiseAmount;

          return (
            <View
              key={player.id}
              style={[
                styles.playerBox,
                player.isFolded && styles.playerFolded,
                isActivePlayer && gameState.phase !== GAME_PHASES.SHOWDOWN && styles.playerActive
              ]}
            >
              <View style={styles.playerHeader}>
                <Text style={styles.playerName}>
                  {player.name} {player.position && `(${player.position})`}
                  {isActivePlayer && gameState.phase !== GAME_PHASES.SHOWDOWN && ' 👈 YOUR ACTION'}
                </Text>
              </View>

              <Text style={styles.playerInfo}>
                Chips: ${player.chips} | Bet: ${player.bet} | Hand: {player.hand.length} cards
                {player.cardsOwed > 0 && ` | Owed: ${player.cardsOwed}`}
              </Text>

              {!player.isFolded && (
                <View style={styles.cardRow}>
                  {player.hand.map(renderCard)}
                </View>
              )}

              {player.isFolded && (
                <Text style={styles.foldedText}>FOLDED</Text>
              )}

              {/* Betting Controls for Active Player */}
              {isActivePlayer && !player.isFolded && gameState.phase !== GAME_PHASES.SHOWDOWN && (
                <View style={styles.bettingControls}>
                  <View style={styles.actionButtons}>
                    {/* Check or Call */}
                    {amountToCall === 0 ? (
                      <TouchableOpacity style={styles.actionButton} onPress={handleCheck}>
                        <Text style={styles.actionButtonText}>Check</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                        <Text style={styles.actionButtonText}>Call ${amountToCall}</Text>
                      </TouchableOpacity>
                    )}

                    {/* Fold */}
                    <TouchableOpacity style={styles.foldButton} onPress={handleFoldClick}>
                      <Text style={styles.foldButtonText}>Fold</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bet Slider */}
                  {player.chips > 0 && (
                    <View style={styles.betSliderContainer}>
                      <Text style={styles.betLabel}>Bet Amount: ${betAmount || minRaise}</Text>
                      <Slider
                        style={styles.betSlider}
                        minimumValue={Math.max(minRaise, player.bet + 1)}
                        maximumValue={potLimit}
                        value={betAmount || minRaise}
                        onValueChange={(value) => setBetAmount(Math.round(value))}
                        step={1}
                        minimumTrackTintColor="#2ECC71"
                        maximumTrackTintColor="#BDC3C7"
                        thumbTintColor="#2ECC71"
                      />
                      <View style={styles.betButtonsRow}>
                        <TouchableOpacity style={styles.betButton} onPress={handleBet}>
                          <Text style={styles.betButtonText}>Bet ${betAmount || minRaise}</Text>
                        </TouchableOpacity>
                        {potLimit > player.bet && (
                          <TouchableOpacity style={styles.potButton} onPress={handleAllIn}>
                            <Text style={styles.potButtonText}>
                              {player.chips + player.bet >= potLimit ? `Pot ($${potLimit})` : `All-In ($${player.chips + player.bet})`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Showdown Results */}
        {showdown && (
          <View style={styles.showdownSection}>
            <Text style={styles.showdownTitle}>🏆 SHOWDOWN RESULTS 🏆</Text>
            
            {showdown.allScores.map((score, index) => (
              <View key={score.playerId} style={styles.scoreBox}>
                <Text style={styles.scoreName}>
                  {index === 0 && '👑 '}{score.playerName}
                </Text>
                <Text style={styles.scorePoints}>
                  Total Points: {score.totalPoints.toFixed(2)}
                </Text>
                <Text style={styles.scoreBreakdown}>
                  {formatPointsBreakdown(score.breakdown)}
                </Text>

                <Text style={styles.handLabel}>Board 1:</Text>
                <Text style={styles.handDesc}>
                  {formatHandEvaluation(score.board1Hand)}
                </Text>
                {score.board1Hand && score.board1Hand.cards && (
                  <View style={styles.cardRow}>
                    {score.board1Hand.cards.map(renderSmallCard)}
                  </View>
                )}

                <Text style={styles.handLabel}>Board 2:</Text>
                <Text style={styles.handDesc}>
                  {formatHandEvaluation(score.board2Hand)}
                </Text>
                {score.board2Hand && score.board2Hand.cards && (
                  <View style={styles.cardRow}>
                    {score.board2Hand.cards.map(renderSmallCard)}
                  </View>
                )}

                <Text style={styles.handLabel}>Hand Strength:</Text>
                <Text style={styles.handDesc}>
                  {formatHandEvaluation(score.handStrength)}
                </Text>
                {score.handStrength && score.handStrength.usedCards && (
                  <View style={styles.cardRow}>
                    {score.handStrength.usedCards.map(renderSmallCard)}
                  </View>
                )}
              </View>
            ))}
            
            {/* Pot Winners */}
            {showdown.pots && showdown.pots.map((pot, potIndex) => (
              <View key={potIndex} style={styles.winnerBox}>
                <Text style={styles.winnerText}>
                  {pot.isMainPot ? '🏆 MAIN POT' : `💰 SIDE POT ${potIndex}`} - ${pot.amount}
                </Text>
                {pot.isUncontested ? (
                  <Text style={styles.winnerName}>
                    {pot.winners[0].playerName} wins ${pot.amount.toFixed(2)} (uncontested)
                  </Text>
                ) : (
                  pot.winners.map(winner => (
                    <Text key={winner.playerId} style={styles.winnerName}>
                      {winner.playerName} wins ${winner.potShare.toFixed(2)}
                    </Text>
                  ))
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
  },
  dealerMessage: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 5,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2ECC71',
    padding: 15,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 8,
    minWidth: 45,
    alignItems: 'center',
    borderWidth: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallCard: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 5,
    minWidth: 35,
    alignItems: 'center',
    borderWidth: 2,
  },
  smallCardText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBack: {
    backgroundColor: '#3498DB',
    borderRadius: 5,
    padding: 8,
    minWidth: 45,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2980B9',
  },
  cardBackText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginBottom: 5,
  },
  playerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  playerFolded: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  playerInfo: {
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: 10,
  },
  foldButton: {
    backgroundColor: '#E74C3C',
    padding: 8,
    borderRadius: 5,
  },
  foldButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  foldedText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerActive: {
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  bettingControls: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#2ECC71',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  betSliderContainer: {
    marginTop: 10,
  },
  betLabel: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  betSlider: {
    width: '100%',
    height: 40,
  },
  betButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  betButton: {
    backgroundColor: '#3498DB',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  betButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  potButton: {
    backgroundColor: '#E67E22',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  potButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  showdownSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderRadius: 10,
  },
  showdownTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  scoreName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  scorePoints: {
    fontSize: 18,
    color: '#2ECC71',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreBreakdown: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 10,
  },
  handLabel: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 5,
  },
  handDesc: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 5,
  },
  winnerBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 20,
    color: '#2ECC71',
    fontWeight: 'bold',
  },
});