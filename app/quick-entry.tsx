import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterChip } from '@/components/filter-chip';
import { ObservationFeedback } from '@/components/observation-feedback';
import { PlateCode } from '@/components/plate-code';
import { useAppTheme } from '@/components/theme-provider';
import { useObservations } from '@/context/observations';
import type { TargetType } from '@/data/targets';
import { findCodeTargets } from '@/lib/collection';

export default function QuickEntryScreen() {
  const { colors } = useAppTheme();
  const { activeSession, observations, lastAdded, loading, error, refresh, addObservation } = useObservations();
  const [kind, setKind] = useState<TargetType>('department');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const input = useRef<TextInput>(null);
  const lock = useRef(false);
  const lastAddedId = lastAdded?.id;
  useEffect(() => { input.current?.focus(); }, [lastAddedId]);
  const matches = findCodeTargets(kind, code);
  const target = matches.length === 1 ? matches[0] : null;
  const count = activeSession ? observations.filter((entry) => entry.sessionId === activeSession.id).length : null;
  const changeKind = (next: TargetType) => { setKind(next); setCode(''); setActionError(null); input.current?.focus(); };
  const add = async () => {
    if (!target || loading || error || lock.current) return;
    lock.current = true;
    setBusy(true);
    setActionError(null);
    try { await addObservation(target.id, target.type); setCode(''); }
    catch { setActionError('Impossible d’enregistrer. Votre code est conservé, réessayez.'); }
    finally { lock.current = false; setBusy(false); input.current?.focus(); }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Retour à la collection" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="arrow-back" size={24} color={colors.text} /></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 24 }}>Saisie rapide</Text>
              <Text style={{ color: colors.mutedText, fontSize: 13 }}>{activeSession ? `Ce trajet · ${count} observation${count! > 1 ? 's' : ''}` : 'Hors session · collection globale'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <FilterChip active={kind === 'department'} label="Départements" disabled={busy} onPress={() => changeKind('department')} />
            <FilterChip active={kind === 'country'} label="Pays" disabled={busy} onPress={() => changeKind('country')} />
          </View>
          <TextInput ref={input} accessibilityLabel="Code de la plaque" autoFocus selectTextOnFocus value={code} onChangeText={setCode} editable={!loading && !error} autoCapitalize="characters" autoCorrect={false} spellCheck={false} maxLength={3} returnKeyType="done" blurOnSubmit={false} submitBehavior="submit" onSubmitEditing={() => void add()}
            placeholder={kind === 'department' ? '75, 2A, 971…' : 'D, UK, CH…'} placeholderTextColor={colors.subduedText}
            style={{ borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.surface, color: colors.text, borderRadius: 18, padding: 20, fontSize: 36, fontWeight: '800', textAlign: 'center' }} />
          <View style={{ minHeight: 78, backgroundColor: colors.surface, borderRadius: 16, padding: 16, justifyContent: 'center' }}>
            {target ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><PlateCode code={target.code} type={target.type} /><Text style={{ flex: 1, color: colors.text, fontWeight: '800', fontSize: 20 }}>{target.flag ? `${target.flag} ` : ''}{target.name}</Text></View>
              : <Text accessibilityLiveRegion="polite" style={{ color: colors.mutedText, textAlign: 'center' }}>{code.trim() ? 'Code inconnu. Complétez ou corrigez le code.' : 'Tapez un code, puis validez pour ajouter.'}</Text>}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Valider la plaque" disabled={!target || busy || loading || !!error} onPress={() => void add()} style={{ minHeight: 56, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: !target || busy || loading || error ? 0.45 : 1 }}>
            <Text style={{ color: colors.surface, fontSize: 17, fontWeight: '800' }}>{busy ? 'Enregistrement…' : 'Ajouter l’observation'}</Text>
          </Pressable>
          <ObservationFeedback />
          {(actionError || error) && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{actionError || error}</Text>}
          {error && <Pressable accessibilityRole="button" onPress={refresh} style={{ minHeight: 44 }}><Text style={{ color: colors.accent }}>Réessayer le chargement</Text></Pressable>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
