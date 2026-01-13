import { StyleSheet, Text, View } from 'react-native';

// Simple PokerCard component
const PokerCard = ({ suit, value, faceDown = false }) => {
  // Define suit symbols
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };

  // Define suit colors
  const suitColors = {
    hearts: '#E74C3C',
    diamonds: '#E74C3C',
    clubs: '#2C3E50',
    spades: '#2C3E50'
  };

  // If card is face down, show card back
  if (faceDown) {
    return (
      <View style={styles.card}>
        <View style={styles.cardBack}>
          <Text style={styles.cardBackText}>🂠</Text>
        </View>
      </View>
    );
  }

  // Show the actual card
  return (
    <View style={styles.card}>
      <View style={styles.cardFront}>
        {/* Top left corner */}
        <View style={styles.cornerTop}>
          <Text style={[styles.value, { color: suitColors[suit] }]}>
            {value}
          </Text>
          <Text style={[styles.suit, { color: suitColors[suit] }]}>
            {suitSymbols[suit]}
          </Text>
        </View>

        {/* Center suit symbol */}
        <Text style={[styles.centerSuit, { color: suitColors[suit] }]}>
          {suitSymbols[suit]}
        </Text>

        {/* Bottom right corner (upside down) */}
        <View style={styles.cornerBottom}>
          <Text style={[styles.suit, { color: suitColors[suit] }]}>
            {suitSymbols[suit]}
          </Text>
          <Text style={[styles.value, { color: suitColors[suit] }]}>
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 100,
    margin: 5,
  },
  cardFront: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    padding: 8,
    justifyContent: 'space-between',
  },
  cardBack: {
    flex: 1,
    backgroundColor: '#3498DB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2980B9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackText: {
    fontSize: 50,
    color: 'white',
  },
  cornerTop: {
    alignItems: 'flex-start',
  },
  cornerBottom: {
    alignItems: 'flex-end',
    transform: [{ rotate: '180deg' }],
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  suit: {
    fontSize: 16,
  },
  centerSuit: {
    fontSize: 40,
    textAlign: 'center',
  },
});

export default PokerCard;