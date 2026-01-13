import { StyleSheet, Text, View } from 'react-native';
import PokerCard from './PokerCard';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poker App Demo</Text>
      
      {/* Example: Show a poker hand */}
      <Text style={styles.subtitle}>Your Hand:</Text>
      <View style={styles.hand}>
        <PokerCard suit="hearts" value="A" />
        <PokerCard suit="hearts" value="K" />
        <PokerCard suit="diamonds" value="Q" />
        <PokerCard suit="spades" value="J" />
        <PokerCard suit="clubs" value="10" />
      </View>

      {/* Example: Show face-down cards */}
      <Text style={styles.subtitle}>Opponent's Hand:</Text>
      <View style={styles.hand}>
        <PokerCard faceDown={true} />
        <PokerCard faceDown={true} />
        <PokerCard faceDown={true} />
        <PokerCard faceDown={true} />
        <PokerCard faceDown={true} />
      </View>

      {/* Example: Community cards */}
      <Text style={styles.subtitle}>Community Cards:</Text>
      <View style={styles.hand}>
        <PokerCard suit="hearts" value="9" />
        <PokerCard suit="diamonds" value="9" />
        <PokerCard suit="clubs" value="2" />
        <PokerCard faceDown={true} />
        <PokerCard faceDown={true} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#27AE60',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  hand: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});