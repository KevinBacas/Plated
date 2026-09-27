import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/components/theme-provider';
import { useObservations } from '@/context/observations';
import { getTargetById } from '@/data/targets';

export function ObservationFeedback() {
  const { colors } = useAppTheme();
  const { lastAdded, undoObservation, dismissLastAdded } = useObservations();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const undo = async () => {
    if (!lastAdded || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try { await undoObservation(lastAdded.id); }
    catch { setError('Impossible d’annuler. Réessayez.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return (
    <View style={{ minHeight: 58, justifyContent: 'center' }}>
      {lastAdded && <View style={{ backgroundColor: colors.accentSoft, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text accessibilityLiveRegion="polite" style={{ flex: 1, color: colors.text, fontSize: 13 }}>{getTargetById(lastAdded.targetId)?.name} ajouté</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Annuler la dernière observation" disabled={busy} onPress={undo} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13 }}>{busy ? '…' : 'Annuler'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Masquer la confirmation" disabled={busy} onPress={dismissLastAdded} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.mutedText, fontSize: 20 }}>×</Text>
        </Pressable>
      </View>}
      {lastAdded && error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>}
    </View>
  );
}
