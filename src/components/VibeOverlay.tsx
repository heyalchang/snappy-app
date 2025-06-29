import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { VibeCheckResponse } from '@/types/vibe';

interface Props {
  result: VibeCheckResponse & { focalText?: string }; // include optional quote
  anchorY: number; // y position of bubble so we can render relative to it
  onDismiss: () => void;
  autoHideMs?: number;
}
export default function VibeOverlay({
  result,
  anchorY,
  onDismiss,
  autoHideMs = 3000, // quicker auto-dismiss
}: Props) {
  useEffect(() => {
    const to = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(to);
  }, []);

  // Dynamically measure note height so we can keep it outside the finger area
  const screenH = Dimensions.get('window').height;
  const MARGIN = 40;       // larger gap between finger and note
  const SAFE_TOP = 50;     // avoid OS bars
  const SAFE_BOTTOM = 20;  // bottom padding

  // Height measured via onLayout
  const [noteH, setNoteH] = React.useState(0);

  const calcTop = () => {
    if (noteH === 0) return -9999; // hidden until we know size

    // Try placing above finger
    let top = anchorY - noteH - MARGIN;
    if (top < SAFE_TOP) {
      // Not enough room → place below finger
      top = anchorY + MARGIN;
      // Clamp so it doesn't run off bottom
      if (top + noteH > screenH - SAFE_BOTTOM) {
        top = screenH - SAFE_BOTTOM - noteH;
      }
    }
    return top;
  };

  const noteStyle = React.useMemo(() => ({ top: calcTop() }), [noteH, anchorY]);

  return (
    <TouchableOpacity
      style={[StyleSheet.absoluteFill, styles.backdrop]}
      onPress={onDismiss}
    >
      {/* Measure size to compute safe position */}
      <View
        style={[styles.note, noteStyle]}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          if (noteH !== height) setNoteH(height);
        }}
      >
        {/* Quoted message */}
        {result.focalText && (
          <Text style={styles.quote} numberOfLines={3}>
            "{result.focalText.trim()}"
          </Text>
        )}
        <Text style={styles.title}>✨ VIBE CHECK</Text>
        <Text style={styles.label}>Tone:</Text>
        <Text style={styles.value}>{result.tone}</Text>
        <Text style={styles.label}>Means:</Text>
        <Text style={styles.value}>{result.inferred_meaning}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  note: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: 260,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  quote: {
    color: '#CCC',
    fontStyle: 'italic',
    fontSize: 13,
    marginBottom: 6,
  },
  title: {
    color: '#FFFC00',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  label: {
    color: '#999',
    fontSize: 13,
    marginTop: 4,
  },
  value: {
    color: '#fff',
    fontSize: 15,
  },
});