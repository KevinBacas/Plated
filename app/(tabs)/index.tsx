import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/components/theme-provider';
import { PlateCode } from '@/components/plate-code';
import type { AppThemeColors } from '@/constants/app-theme';
import { useObservations } from '@/context/observations';
import { COUNTRIES, DEPARTMENTS, type Target, type TargetType } from '@/data/targets';
import { formatDate, normalize } from '@/lib/format';
import type { Observation } from '@/lib/observations';

type Filter = 'all' | 'found' | 'missing';

function Chip({ active, colors, label, onPress }: { active: boolean; colors: AppThemeColors; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && [styles.chipActive, { backgroundColor: colors.surface }]]}>
      <Text style={[styles.chipText, { color: colors.mutedText }, active && { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

function TargetRow({ target, count, lastSeen, onAdd }: { target: Target; count: number; lastSeen?: string; onAdd: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/target/[targetId]', params: { targetId: target.id } })}
      style={[
        styles.targetRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
        count > 0 && { backgroundColor: colors.foundBackground, borderColor: colors.foundBorder },
      ]}>
      <PlateCode code={target.code} type={target.type} />
      <View style={styles.targetCopy}>
        <Text style={[styles.targetName, { color: colors.text }]}>{target.flag ? `${target.flag}  ` : ''}{target.name}</Text>
        <Text style={[styles.targetMeta, { color: colors.subduedText }]}>
          {target.region ?? `Plaque ${target.code}`} · {count ? `${count} vue${count > 1 ? 's' : ''} · ${formatDate(lastSeen!)}` : 'À trouver'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ajouter ${target.name} au journal`}
        hitSlop={10}
        onPress={(event) => {
          event.stopPropagation();
          onAdd();
        }}
        style={[styles.addButton, { backgroundColor: colors.accent }]}>
        <MaterialIcons name="add" size={24} color={colors.surface} />
      </Pressable>
    </Pressable>
  );
}

export default function CollectionScreen() {
  const { colors } = useAppTheme();
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
  const grouped = kind === 'department'
    ? visible.reduce<Record<string, Target[]>>((groups, target) => ({ ...groups, [target.region!]: [...(groups[target.region!] ?? []), target] }), {})
    : { 'Pays de l’Union européenne': visible };

  const handleAdd = async (target: Target) => {
    const observation = await addObservation(target.id, target.type);
    setPending({ observation, target });
  };

  if (loading) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.accent }]}>PLATED</Text>
            <Text style={[styles.title, { color: colors.text }]}>Sur la route</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>Notez les plaques croisées, une à une.</Text>
          </View>
          <View style={[styles.carBadge, { backgroundColor: colors.accentSoft }]}>
            <MaterialIcons name="directions-car-filled" size={25} color={colors.accent} />
          </View>
        </View>
        <View style={styles.progressGrid}>
          <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.progressNumber, { color: colors.text }]}>{departmentsFound}<Text style={[styles.progressTotal, { color: colors.subduedText }]}> / 101</Text></Text>
            <Text style={[styles.progressLabel, { color: colors.mutedText }]}>départements</Text>
          </View>
          <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.progressNumber, { color: colors.text }]}>{countriesFound}<Text style={[styles.progressTotal, { color: colors.subduedText }]}> / 26</Text></Text>
            <Text style={[styles.progressLabel, { color: colors.mutedText }]}>pays de l’UE</Text>
          </View>
        </View>
        <View style={[styles.segment, { backgroundColor: colors.surfaceMuted }]}>
          <Chip active={kind === 'department'} colors={colors} label="Départements" onPress={() => { setKind('department'); setFilter('all'); }} />
          <Chip active={kind === 'country'} colors={colors} label="Pays UE" onPress={() => { setKind('country'); setFilter('all'); }} />
        </View>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={21} color={colors.subduedText} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Code ou nom de la plaque" placeholderTextColor={colors.subduedText} autoCapitalize="characters" style={[styles.searchInput, { color: colors.text }]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Chip active={filter === 'all'} colors={colors} label="Tous" onPress={() => setFilter('all')} />
          <Chip active={filter === 'found'} colors={colors} label="Trouvés" onPress={() => setFilter('found')} />
          <Chip active={filter === 'missing'} colors={colors} label="À trouver" onPress={() => setFilter('missing')} />
        </ScrollView>
        {Object.entries(grouped).map(([group, groupTargets]) => (
          <View key={group} style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.mutedText }]}>{group}</Text>
            {groupTargets.map((target) => {
              const entry = stats.get(target.id);
              return <TargetRow key={target.id} target={target} count={entry?.count ?? 0} lastSeen={entry?.lastSeen} onAdd={() => handleAdd(target)} />;
            })}
          </View>
        ))}
        {!visible.length && <View style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune plaque trouvée</Text><Text style={[styles.emptyCopy, { color: colors.subduedText }]}>Essaie un autre code, nom ou filtre.</Text></View>}
      </ScrollView>
      {pending && (
        <View style={[styles.snack, { backgroundColor: colors.snackBackground }]}>
          <View style={styles.snackCopy}>
            <Text style={[styles.snackTitle, { color: colors.surface }]}>{pending.target.name} ajouté</Text>
            <Text style={[styles.snackText, { color: colors.snackText }]}>Observation enregistrée maintenant</Text>
          </View>
          <Pressable onPress={async () => { await undoObservation(pending.observation.id); setPending(null); }} style={styles.snackAction}><Text style={[styles.snackActionText, { color: colors.accentStrong }]}>ANNULER</Text></Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 118 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 1.8 },
  title: { fontSize: 32, fontWeight: '900', marginTop: 2 },
  subtitle: { fontSize: 15, marginTop: 4 },
  carBadge: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progressGrid: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  progressCard: { flex: 1, borderRadius: 18, padding: 16, borderWidth: 1 },
  progressNumber: { fontWeight: '900', fontSize: 24 },
  progressTotal: { fontSize: 15 },
  progressLabel: { marginTop: 3, fontSize: 13, fontWeight: '600' },
  segment: { padding: 4, borderRadius: 14, flexDirection: 'row', gap: 4, marginBottom: 14 },
  chip: { minHeight: 40, paddingHorizontal: 15, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chipActive: { boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)' },
  chipText: { fontWeight: '700', fontSize: 14 },
  search: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, fontSize: 16, height: 50 },
  filters: { gap: 8, paddingVertical: 13 },
  group: { gap: 8, marginBottom: 21 },
  groupTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 5 },
  targetRow: { minHeight: 72, borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  targetCopy: { flex: 1 },
  targetName: { fontWeight: '800', fontSize: 16 },
  targetMeta: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  addButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 44 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyCopy: { marginTop: 4 },
  snack: { position: 'absolute', left: 14, right: 14, bottom: 12, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  snackCopy: { flex: 1 },
  snackTitle: { fontWeight: '800' },
  snackText: { fontSize: 12, marginTop: 2 },
  snackAction: { paddingVertical: 9 },
  snackActionText: { fontSize: 11, fontWeight: '900' },
});
