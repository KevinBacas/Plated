import { Pressable, Text } from 'react-native';

import { useAppTheme } from '@/components/theme-provider';

export function FilterChip({ active, label, onPress, disabled = false }: { active: boolean; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={onPress}
      style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.accentSoft : colors.surfaceMuted, opacity: disabled ? 0.45 : 1 }}>
      <Text style={{ color: active ? colors.accent : colors.mutedText, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}
