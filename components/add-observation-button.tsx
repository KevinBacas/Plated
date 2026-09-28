import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useAppTheme } from '@/components/theme-provider';

export function AddObservationButton({ name, onAdd, disabled = false, label }: { name: string; onAdd: () => Promise<unknown>; disabled?: boolean; label?: string }) {
  const { colors } = useAppTheme();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); };
  }, []);
  const add = async () => {
    if (busy.current) return;
    busy.current = true;
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    try {
      await onAdd();
      if (mounted.current) {
        setStatus('saved');
        timer.current = setTimeout(() => setStatus('idle'), 1000);
      }
    } catch {
      // The caller displays the storage error; never show a check on a failed write.
      if (mounted.current) setStatus('idle');
    } finally { busy.current = false; }
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={status === 'saved' ? `${name} ajouté. Ajouter une autre observation` : `Ajouter ${name} au journal`}
      accessibilityState={{ disabled: disabled || status === 'saving' }} disabled={disabled || status === 'saving'}
      onPress={(event) => { event.stopPropagation(); void add(); }}
      style={{ minWidth: 44, minHeight: 44, borderRadius: 14, paddingHorizontal: label ? 16 : 10, backgroundColor: status === 'saved' ? colors.accentSoft : colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.45 : 1 }}>
      {status === 'saving' ? <ActivityIndicator color={colors.surface} /> : <MaterialIcons name={status === 'saved' ? 'check' : 'add'} size={24} color={status === 'saved' ? colors.accent : colors.surface} />}
      {label && <Text style={{ color: status === 'saved' ? colors.accent : colors.surface, fontWeight: '800' }}>{status === 'saved' ? 'Ajouté' : label}</Text>}
    </Pressable>
  );
}
