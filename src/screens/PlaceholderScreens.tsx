import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function FriendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Friends Screen</Text>
    </View>
  );
}

export function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chat Screen</Text>
    </View>
  );
}

export function StoriesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Stories Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#FFF',
    fontSize: 18,
  },
});