// ESGGameDemo.jsx - Demo component to test ESG Poker

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatCard } from './CardUtils';
import { GAME_PHASES, initializeGame, playerFold, revealFlop, revealRiver, revealTurn } from './ESGGameEngine';
import { formatHandEvaluation, formatPointsBreakdown, getShowdownSummary } from './ESGScoring';

export default function ESGGameDemo() {
  const [gameState, setGameState] = useState(null);
  const [showdown, setShowdown] = useState(null);

  // Initialize a new game
  const startNewGame = () => {
    const playerNames = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace'];
    const newGame = initializeGame(playerNames, 10, 20);
    setGameState(newGame);
    setShowdown(null);
  };

  // Advance to next phase
  const advancePhase = () => {
    if (!gameState) return;

    let newState = { ...gameState };

    switch (gameState.phase) {
      case GAME_PHASES.PRE_FLOP:
        newState = revealFlop(newState);
        break;
      case GAME_PHASES.FLOP:
        newState = revealTurn(newState);
        break;
      case GAME_PHASES.TURN:
        newState = revealRiver(newState);
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
  };

  // Player folds
  const handleFold = (playerIndex) => {
    if (!gameState) return;
    const newState = playerFold(gameState, playerIndex);
    setGameState(newState);
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
          {gameState.phase !== GAME_PHASES.SHOWDOWN && (
            <TouchableOpacity style={styles.button} onPress={advancePhase}>
              <Text style={styles.buttonText}>
                {gameState.phase === GAME_PHASES.PRE_FLOP && 'Show Flop'}
                {gameState.phase === GAME_PHASES.FLOP && 'Show Turn'}
                {gameState.phase === GAME_PHASES.TURN && 'Show River'}
                {gameState.phase === GAME_PHASES.RIVER && 'Showdown'}
              </Text>
            </TouchableOpacity>
          )}
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
        </View>

        {/* Players */}
        <Text style={styles.sectionTitle}>Players</Text>
        {gameState.players.map((player, index) => (
          <View 
            key={player.id} 
            style={[
              styles.playerBox, 
              player.isFolded && styles.playerFolded
            ]}
          >
            <View style={styles.playerHeader}>
              <Text style={styles.playerName}>
                {player.name} {player.position && `(${player.position})`}
              </Text>
              {!player.isFolded && gameState.phase !== GAME_PHASES.SHOWDOWN && (
                <TouchableOpacity 
                  style={styles.foldButton} 
                  onPress={() => handleFold(index)}
                >
                  <Text style={styles.foldButtonText}>Fold</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.playerInfo}>
              Chips: ${player.chips} | Hand: {player.hand.length} cards
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
          </View>
        ))}

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
            
            <View style={styles.winnerBox}>
              <Text style={styles.winnerText}>
                {showdown.winners.length === 1 ? 'WINNER' : 'WINNERS'}
              </Text>
              {showdown.winners.map(winner => (
                <Text key={winner.playerId} style={styles.winnerName}>
                  {winner.playerName} wins ${winner.potShare.toFixed(2)}
                </Text>
              ))}
            </View>
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