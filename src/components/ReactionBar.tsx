import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  anchor: { x: number; y: number };
  onVibePress: () => void;
  onDismiss: () => void;
}

export default function ReactionBar({ anchor, onVibePress, onDismiss }: Props) {
  return (
    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onDismiss}>
      <View
        style={[
          styles.bar,
          { top: anchor.y - 50, left: anchor.x - 40 }, // centre under finger
        ]}
      >
        <TouchableOpacity onPress={onVibePress}>
          <Text style={styles.vibe}>✨</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  vibe: {
    fontSize: 24,
    color: '#FFFC00',
  },
});