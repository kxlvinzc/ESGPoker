import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PokerCard from '../PokerCard';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poker App Demo</Text>
      
      <Text style={styles.subtitle}>Your Hand:</Text>
      <View style={styles.hand}>
        <PokerCard suit="hearts" value="A" />
        <PokerCard suit="hearts" value="K" />
        <PokerCard suit="diamonds" value="Q" />
        <PokerCard suit="spades" value="J" />
        <PokerCard suit="clubs" value="10" />
      </View>

      <Text style={styles.subtitle}>Opponent's Hand:</Text>
      <View style={styles.hand}>
        <PokerCard suit="spades" value="?" faceDown={true} />
        <PokerCard suit="spades" value="?" faceDown={true} />
        <PokerCard suit="spades" value="?" faceDown={true} />
        <PokerCard suit="spades" value="?" faceDown={true} />
        <PokerCard suit="spades" value="?" faceDown={true} />
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

