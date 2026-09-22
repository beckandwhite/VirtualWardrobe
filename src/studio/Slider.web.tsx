import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web-only slider: a native <input type="range"> replaces the PanResponder-based
// custom thumb. PanResponder on React Native Web doesn't reliably translate macOS
// pointer/mouse events to gestureState.dx — Safari in particular does nothing when
// you drag a PanResponder track with a mouse. A real range input works in all
// browsers including Safari, is keyboard-accessible, and costs zero dependencies.
// React.createElement is used instead of JSX <input> to stay inside the RN
// component type system without importing React DOM types.

import type { SliderProps } from './Slider';

export function Slider({ label, min, max, value, display, onChange }: SliderProps) {
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      {React.createElement('input', {
        type: 'range',
        min,
        max,
        step: (max - min) / 200,
        value,
        onChange: (e: { target: { value: string } }) => onChange(Number(e.target.value)),
        style: {
          flex: 1,
          width: '100%',
          accentColor: '#58a6ff',
          cursor: 'pointer',
          height: 28,
        },
      })}
      <Text style={styles.sliderValue}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { width: 64, fontSize: 13, color: '#c9d1d9' },
  sliderValue: { width: 44, textAlign: 'right', fontSize: 12, color: '#8b949e' },
});
