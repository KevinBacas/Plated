import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useObservations } from '@/context/observations';
import { COUNTRIES, DEPARTMENTS, type Target, type TargetType } from '@/data/targets';
import { formatDate, normalize } from '@/lib/format';
import type { Observation } from '@/lib/observations';

type Filter = 'all' | 'found' | 'missing';

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
}

function TargetRow({ target, count, lastSeen, onAdd }: { target: Target; count: number; lastSeen?: string; onAdd: () => void }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/target/[targetId]', params: { targetId: target.id } })} style={[styles.targetRow, count > 0 && styles.targetRowFound]}>
      <View style={styles.code}><Text style={styles.codeText}>{target.flag ?? target.code}</Text></View>
      <View style={styles.targetCopy}>
        <Text style={styles.targetName}>{target.name}</Text>
        <Text style={styles.targetMeta}>{target.region ?? `Plaque ${target.code}`} · {count ? `${count} vue${count > 1 ? 's' : ''} · ${formatDate(lastSeen!)}` : 'À trouver'}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ajouter ${target.name} au journal`} hitSlop={10} onPress={(event) => { event.stopPropagation(); onAdd(); }} style={styles.addButton}>
        <MaterialIcons name="add" size={24} color="#fff" />
      </Pressable>
    </Pressable>
  );
}

export default function CollectionScreen() {
  const { observations, loading, addObservation, undoObservation } = useObservations();
  const [kind, setKind] = useState<TargetType>('department');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<{ observation: Observation; target: Target } | null>(null);

  const stats = useMemo(() => {
    const values = new Map<string, { count: number; lastSeen: string }>();
    observations.forEach((observation) => {
      const current = values.get(observation.targetId);
      if (!current) values.set(observation.targetId, { count: 1, lastSeen: observation.observedAt });
      else values.set(observation.targetId, { count: current.count + 1, lastSeen: current.lastSeen > observation.observedAt ? current.lastSeen : observation.observedAt });
    });
    return values;
  }, [observations]);
  const departmentsFound = DEPARTMENTS.filter((target) => stats.has(target.id)).length;
  const countriesFound = COUNTRIES.filter((target) => stats.has(target.id)).length;
  const targets = kind === 'department' ? DEPARTMENTS : COUNTRIES;
  const visible = targets.filter((target) => {
    const targetStats = stats.get(target.id);
    const matchesQuery = !query || normalize(`${target.code} ${target.name} ${target.region ?? ''}`).includes(normalize(query));
    return matchesQuery && (filter === 'all' || (filter === 'found' ? !!targetStats : !targetStats));
  });
  const grouped = kind === 'department' ? visible.reduce<Record<string, Target[]>>((groups, target) => ({ ...groups, [target.region!]: [...(groups[target.region!] ?? []), target] }), {}) : { 'Pays de l’Union européenne': visible };

  const handleAdd = async (target: Target) => {
    const observation = await addObservation(target.id, target.type);
    setPending({ observation, target });
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#0d6e63" /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><View><Text style={styles.kicker}>PLATED</Text><Text style={styles.title}>Sur la route</Text><Text style={styles.subtitle}>Notez les plaques croisées, une à une.</Text></View><View style={styles.carBadge}><MaterialIcons name="directions-car-filled" size={25} color="#0d6e63" /></View></View>
        <View style={styles.progressGrid}>
          <View style={styles.progressCard}><Text style={styles.progressNumber}>{departmentsFound}<Text style={styles.progressTotal}> / 101</Text></Text><Text style={styles.progressLabel}>départements</Text></View>
          <View style={styles.progressCard}><Text style={styles.progressNumber}>{countriesFound}<Text style={styles.progressTotal}> / 26</Text></Text><Text style={styles.progressLabel}>pays de l’UE</Text></View>
        </View>
        <View style={styles.segment}><Chip active={kind === 'department'} label="Départements" onPress={() => { setKind('department'); setFilter('all'); }} /><Chip active={kind === 'country'} label="Pays UE" onPress={() => { setKind('country'); setFilter('all'); }} /></View>
        <View style={styles.search}><MaterialIcons name="search" size={21} color="#75808a" /><TextInput value={query} onChangeText={setQuery} placeholder="Code ou nom de la plaque" placeholderTextColor="#75808a" autoCapitalize="characters" style={styles.searchInput} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><Chip active={filter === 'all'} label="Tous" onPress={() => setFilter('all')} /><Chip active={filter === 'found'} label="Trouvés" onPress={() => setFilter('found')} /><Chip active={filter === 'missing'} label="À trouver" onPress={() => setFilter('missing')} /></ScrollView>
        {Object.entries(grouped).map(([group, groupTargets]) => <View key={group} style={styles.group}><Text style={styles.groupTitle}>{group}</Text>{groupTargets.map((target) => { const entry = stats.get(target.id); return <TargetRow key={target.id} target={target} count={entry?.count ?? 0} lastSeen={entry?.lastSeen} onAdd={() => handleAdd(target)} />; })}</View>)}
        {!visible.length && <View style={styles.empty}><Text style={styles.emptyTitle}>Aucune plaque trouvée</Text><Text style={styles.emptyCopy}>Essaie un autre code, nom ou filtre.</Text></View>}
      </ScrollView>
      {pending && <View style={styles.snack}><View style={styles.snackCopy}><Text style={styles.snackTitle}>{pending.target.name} ajouté</Text><Text style={styles.snackText}>Observation enregistrée maintenant</Text></View><Pressable onPress={async () => { await undoObservation(pending.observation.id); setPending(null); }} style={styles.snackAction}><Text style={styles.snackActionText}>ANNULER</Text></Pressable></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8f7' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f8f7' }, content: { padding: 20, paddingBottom: 118 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }, kicker: { color: '#0d6e63', fontSize: 12, fontWeight: '900', letterSpacing: 1.8 }, title: { color: '#15202b', fontSize: 32, fontWeight: '900', marginTop: 2 }, subtitle: { color: '#64717b', fontSize: 15, marginTop: 4 }, carBadge: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#e0f1ed', alignItems: 'center', justifyContent: 'center' },
  progressGrid: { flexDirection: 'row', gap: 12, marginBottom: 18 }, progressCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e6eaec' }, progressNumber: { color: '#15202b', fontWeight: '900', fontSize: 24 }, progressTotal: { color: '#8a949c', fontSize: 15 }, progressLabel: { color: '#65717a', marginTop: 3, fontSize: 13, fontWeight: '600' },
  segment: { backgroundColor: '#e9eeed', padding: 4, borderRadius: 14, flexDirection: 'row', gap: 4, marginBottom: 14 }, chip: { minHeight: 40, paddingHorizontal: 15, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, chipActive: { backgroundColor: '#fff', shadowColor: '#24303a', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }, chipText: { color: '#68747d', fontWeight: '700', fontSize: 14 }, chipTextActive: { color: '#0d6e63' },
  search: { minHeight: 50, borderWidth: 1, borderColor: '#dfe5e7', backgroundColor: '#fff', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 }, searchInput: { flex: 1, color: '#15202b', fontSize: 16, height: 50 }, filters: { gap: 8, paddingVertical: 13 },
  group: { gap: 8, marginBottom: 21 }, groupTitle: { color: '#52606b', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 5 }, targetRow: { minHeight: 72, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5eaec', borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 }, targetRowFound: { borderColor: '#bce3da', backgroundColor: '#fbfffe' }, code: { width: 45, height: 45, borderRadius: 13, backgroundColor: '#eff3f4', alignItems: 'center', justifyContent: 'center' }, codeText: { color: '#22303a', fontWeight: '900', fontSize: 14 }, targetCopy: { flex: 1 }, targetName: { color: '#16212b', fontWeight: '800', fontSize: 16 }, targetMeta: { color: '#74808a', marginTop: 3, fontSize: 12, lineHeight: 17 }, addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0d6e63', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 44 }, emptyTitle: { color: '#26333d', fontSize: 17, fontWeight: '800' }, emptyCopy: { color: '#75808a', marginTop: 4 },
  snack: { position: 'absolute', left: 14, right: 14, bottom: 12, borderRadius: 18, padding: 14, backgroundColor: '#152c35', flexDirection: 'row', alignItems: 'center', gap: 12 }, snackCopy: { flex: 1 }, snackTitle: { color: '#fff', fontWeight: '800' }, snackText: { color: '#c8d7d9', fontSize: 12, marginTop: 2 }, snackAction: { paddingVertical: 9 }, snackActionText: { color: '#79dbc7', fontSize: 11, fontWeight: '900' },
});
