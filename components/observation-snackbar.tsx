import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/components/theme-provider';

const DURATION_MS = 5000;

type Props = {
  observationId: string;
  title: string;
  onDismiss: (id: string) => void;
  onUndo: (id: string) => Promise<void>;
};

export function ObservationSnackbar({ observationId, title, onDismiss, onUndo }: Props) {
  const { colors } = useAppTheme();
  const remaining = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    remaining.setValue(1);
    const animation = Animated.timing(remaining, {
      toValue: 0,
      duration: DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    const timeout = setTimeout(() => onDismiss(observationId), DURATION_MS);
    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [observationId, onDismiss, remaining]);

  return (
    <View testID="observation-snackbar" style={[styles.snack, { backgroundColor: colors.snackBackground }]}>
      <View style={styles.content}>
        <View accessibilityLiveRegion="polite" style={styles.copy}>
          <Text style={[styles.title, { color: colors.snackTitle }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.snackText }]}>Observation enregistrée maintenant</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Annuler l’observation" onPress={() => onUndo(observationId)} style={styles.action}>
          <Text style={[styles.actionText, { color: colors.accentStrong }]}>ANNULER</Text>
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.snackText, opacity: 0.2 }]} />
        <Animated.View
          testID="observation-snackbar-progress"
          style={[styles.progress, { backgroundColor: colors.accentStrong, width: remaining.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  snack: { position: 'absolute', left: 14, right: 14, bottom: 12, borderRadius: 18, overflow: 'hidden' },
  content: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1 },
  title: { fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  action: { paddingVertical: 9 },
  actionText: { fontSize: 11, fontWeight: '900' },
  track: { height: 4 },
  progress: { height: '100%' },
});
