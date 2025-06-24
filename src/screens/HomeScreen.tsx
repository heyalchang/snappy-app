import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Snappy</Text>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.emoji}>📸</Text>
          <Text style={styles.navText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('SnapInbox')}
        >
          <Text style={styles.emoji}>📬</Text>
          <Text style={styles.navText}>Inbox</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.disabled]}
          disabled
        >
          <Text style={styles.emoji}>👥</Text>
          <Text style={styles.navText}>Friends</Text>
          <Text style={styles.comingSoon}>Week 4</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.disabled]}
          disabled
        >
          <Text style={styles.emoji}>💬</Text>
          <Text style={styles.navText}>Chat</Text>
          <Text style={styles.comingSoon}>Week 5</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFC00',
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 60,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  navButton: {
    backgroundColor: '#FFF',
    width: 140,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  disabled: {
    opacity: 0.5,
  },
  comingSoon: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});