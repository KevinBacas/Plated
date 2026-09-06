import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/components/theme-provider';
import { useObservations } from '@/context/observations';
import { formatDate } from '@/lib/format';
import { formatSessionDuration } from '@/lib/sessions';

export function SessionControl({ showLink = false }: { showLink?: boolean }) {
  const { colors } = useAppTheme();
  const { activeSession, loading, error, refresh, startSession, endSession } = useObservations();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const startedAt = activeSession?.startedAt;

  useEffect(() => {
    if (!startedAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [startedAt]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      if (activeSession) await endSession(activeSession.id);
      else await startSession();
    } catch {
      setActionError('Impossible d’enregistrer la session. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ backgroundColor: colors.accentSoft, borderRadius: 18, padding: 16, gap: 10, marginBottom: 18 }}>
      <Text style={{ fontWeight: '800', fontSize: 17, color: colors.text }}>
        {loading ? 'Chargement des sessions…' : activeSession ? 'Session en cours' : 'Un nouveau trajet ?'}
      </Text>
      <Text selectable style={{ color: colors.mutedText, lineHeight: 20 }}>
        {activeSession
          ? `Depuis le ${formatDate(activeSession.startedAt)} · ${formatSessionDuration(activeSession, now)}`
          : 'Démarrez une session pour regrouper les plaques de votre trajet. Sans session, elles restent dans le journal.'}
      </Text>
      {error ? (
        <>
          <Text selectable accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={refresh} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colors.accent, fontWeight: '800' }}>Réessayer</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy || loading }}
          disabled={busy || loading}
          onPress={toggle}
          style={{ backgroundColor: colors.accent, borderRadius: 12, minHeight: 46, padding: 12, alignItems: 'center', justifyContent: 'center', opacity: busy || loading ? 0.5 : 1 }}>
          <Text style={{ color: colors.surface, fontWeight: '800', textAlign: 'center' }}>
            {busy ? 'Enregistrement…' : activeSession ? 'Terminer la session' : 'Démarrer une session'}
          </Text>
        </Pressable>
      )}
      {actionError && <Text selectable accessibilityRole="alert" style={{ color: colors.danger }}>{actionError}</Text>}
      {showLink && <Link href="/sessions" style={{ color: colors.accent, fontWeight: '700', paddingVertical: 8 }}>Voir les sessions →</Link>}
    </View>
  );
}
