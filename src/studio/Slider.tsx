import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { useRef, useState, useEffect, useMemo } from 'react';

// Native slider: a custom PanResponder thumb on a track gives 1:1 drag control.
// Web overrides this with Slider.web.tsx (HTML <input type="range">) because
// PanResponder on RN Web doesn't reliably translate macOS pointer/mouse events
// to gestureState.dx on Safari.

export interface SliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}

export function Slider({ label, min, max, value, display, onChange }: SliderProps) {
  const [track, setTrack] = useState(0);
  const startRef = useRef(value);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  /* eslint-disable react-hooks/refs */
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = valueRef.current;
        },
        onPanResponderMove: (_e, g) => {
          const w = track || 1;
          const next = startRef.current + (g.dx / w) * (max - min);
          onChange(Math.max(min, Math.min(max, next)));
        },
      }),
    [track, min, max, onChange],
  );
  /* eslint-enable react-hooks/refs */

  const frac = (value - min) / (max - min || 1);
  // Keep the thumb inside the track (thumb is 24px wide). We use an offset from
  // the left that runs from 0 to (trackWidth - thumbWidth) as frac goes 0→1.
  const thumbLeft = track > 0 ? frac * (track - 24) : 0;

  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View
        style={styles.sliderTrack}
        onLayout={(e) => setTrack(e.nativeEvent.layout.width)}
        {...pan.panHandlers}>
        <View style={[styles.sliderThumb, { left: thumbLeft }]} />
      </View>
      <Text style={styles.sliderValue}>{display}</Text>
    </View>
  );
}

export const sliderStyles = StyleSheet.create({
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { width: 64, fontSize: 13, color: '#c9d1d9' },
  sliderTrack: {
    flex: 1,
    height: 28,
    backgroundColor: '#21262d',
    borderRadius: 14,
    justifyContent: 'center',
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#58a6ff',
  },
  sliderValue: { width: 44, textAlign: 'right', fontSize: 12, color: '#8b949e' },
});

const styles = sliderStyles;
