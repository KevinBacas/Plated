import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/components/theme-provider';
import { PlateCode } from '@/components/plate-code';
import { useObservations } from '@/context/observations';
import { getTargetById } from '@/data/targets';
import { formatDate } from '@/lib/format';
import type { Observation } from '@/lib/observations';

export default function TargetScreen() {
  const { colors } = useAppTheme();
  const { targetId } = useLocalSearchParams<{ targetId: string }>();
  const target = getTargetById(targetId);
  const { observations, addObservation, deleteObservation, undoObservation } = useObservations();
  const [pending, setPending] = useState<Observation | null>(null);
  const entries = useMemo(() => observations.filter((observation) => observation.targetId === targetId), [observations, targetId]);

  if (!target) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}><View style={styles.notFound}><Text style={[styles.notFoundTitle, { color: colors.text }]}>Plaque introuvable</Text><Pressable onPress={() => router.back()}><Text style={[styles.link, { color: colors.accent }]}>Retour</Text></Pressable></View></SafeAreaView>;
  }

  const firstSeen = entries.length ? entries[entries.length - 1].observedAt : null;
  const lastSeen = entries[0]?.observedAt;
  const remove = (entry: Observation) => Alert.alert('Supprimer l’observation ?', 'Cette action ne peut pas être annulée.', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: () => deleteObservation(entry.id) },
  ]);
  const add = async () => setPending(await addObservation(target.id, target.type));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}><MaterialIcons name="arrow-back" size={22} color={colors.text} /><Text style={[styles.backText, { color: colors.text }]}>Collection</Text></Pressable>
        <View style={styles.hero}>
          <PlateCode code={target.code} type={target.type} large />
          <View style={styles.heroCopy}><Text style={[styles.title, { color: colors.text }]}>{target.flag ? `${target.flag}  ` : ''}{target.name}</Text><Text style={[styles.region, { color: colors.mutedText }]}>{target.region ?? `Code visible sur la plaque : ${target.code}`}</Text></View>
        </View>
        <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.stat}><Text style={[styles.statNumber, { color: colors.text }]}>{entries.length}</Text><Text style={[styles.statLabel, { color: colors.subduedText }]}>observation{entries.length > 1 ? 's' : ''}</Text></View>
          <View style={styles.stat}><Text style={[styles.statDate, { color: colors.text }]}>{firstSeen ? formatDate(firstSeen) : '—'}</Text><Text style={[styles.statLabel, { color: colors.subduedText }]}>première fois</Text></View>
        </View>
        <Pressable style={[styles.add, { backgroundColor: colors.accent }]} onPress={add}><MaterialIcons name="add" size={23} color={colors.surface} /><Text style={[styles.addText, { color: colors.surface }]}>Ajouter une observation</Text></Pressable>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Historique {lastSeen ? `· dernière le ${formatDate(lastSeen)}` : ''}</Text>
        {entries.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.emptyTitle, { color: colors.text }]}>Pas encore observé</Text><Text style={[styles.emptyCopy, { color: colors.subduedText }]}>Lorsque vous croiserez cette plaque, ajoutez-la ici.</Text></View>
        ) : entries.map((entry) => (
          <View key={entry.id} style={[styles.entry, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.entryTop}><Text style={[styles.entryDate, { color: colors.text }]}>{formatDate(entry.observedAt)}</Text><Pressable onPress={() => remove(entry)} hitSlop={10}><MaterialIcons name="delete-outline" size={22} color={colors.danger} /></Pressable></View></View>
        ))}
      </ScrollView>
      {pending ? <View style={[styles.snack, { backgroundColor: colors.snackBackground }]}><Text style={[styles.snackCopy, { color: colors.snackTitle }]}>Observation ajoutée</Text><Pressable onPress={async () => { await undoObservation(pending.id); setPending(null); }}><Text style={[styles.snackAction, { color: colors.accentStrong }]}>ANNULER</Text></Pressable></View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 42 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 44 },
  backText: { fontWeight: '800' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, marginBottom: 24 },
  heroCopy: { flex: 1 },
  title: { fontSize: 28, fontWeight: '900' },
  region: { marginTop: 4, fontSize: 15 },
  stats: { flexDirection: 'row', borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 14 },
  stat: { flex: 1, padding: 16 },
  statNumber: { fontSize: 25, fontWeight: '900' },
  statDate: { fontSize: 13, fontWeight: '800', minHeight: 30 },
  statLabel: { marginTop: 3, fontSize: 12 },
  add: { minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 26 },
  addText: { fontWeight: '900', fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 10 },
  entry: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 9 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryDate: { fontWeight: '800' },
  empty: { borderRadius: 17, padding: 22, borderWidth: 1 },
  emptyTitle: { fontWeight: '800', fontSize: 16 },
  emptyCopy: { lineHeight: 20, marginTop: 4 },
  snack: { position: 'absolute', left: 14, right: 14, bottom: 12, padding: 15, borderRadius: 18, flexDirection: 'row', gap: 16, alignItems: 'center' },
  snackCopy: { flex: 1, fontWeight: '800' },
  snackAction: { fontWeight: '900', fontSize: 11 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundTitle: { fontWeight: '800', fontSize: 18 },
  link: { fontWeight: '800' },
});
