import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddObservationButton } from '@/components/add-observation-button';
import { FilterChip } from '@/components/filter-chip';
import { ObservationFeedback } from '@/components/observation-feedback';
import { PlateCode } from '@/components/plate-code';
import { SessionControl } from '@/components/session-control';
import { useAppTheme } from '@/components/theme-provider';
import { useObservations } from '@/context/observations';
import { COUNTRIES, DEPARTMENTS, EU_COUNTRIES, type Target } from '@/data/targets';
import { groupTargets, scopeObservations, selectTargets, type CollectionFilter, type CollectionKind, type CountryFilter } from '@/lib/collection';
import { formatDate } from '@/lib/format';
import { buildTargetProgress } from '@/lib/target-stats';

export default function CollectionScreen() {
  const { colors } = useAppTheme();
  const { observations, activeSession, loading, error, addObservation } = useObservations();
  const scrollRef = useRef<ScrollView>(null);
  const searchRef = useRef<TextInput>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [kind, setKind] = useState<CollectionKind>('all');
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('all');
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [scope, setScope] = useState<'global' | 'session'>('global');
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const inSession = scope === 'session' && !!activeSession;
  const entries = useMemo(() => scopeObservations(observations, inSession ? activeSession!.id : null), [observations, inSession, activeSession]);
  const progress = useMemo(() => buildTargetProgress(entries), [entries]);
  const visible = useMemo(() => selectTargets(entries, kind, countryFilter, filter, query), [entries, kind, countryFilter, filter, query]);
  const grouped = useMemo(() => groupTargets(visible), [visible]);
  const found = (targets: Target[]) => targets.filter((target) => progress.has(target.id)).length;
  const handleAdd = async (target: Target) => {
    setActionError(null);
    try { return await addObservation(target.id, target.type); }
    catch (cause) { setActionError('Impossible d’enregistrer l’observation. Réessayez.'); throw cause; }
  };
  const changeKind = (next: CollectionKind) => { setKind(next); setCountryFilter('all'); };

  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" onScroll={(event) => setShowScrollTop(event.nativeEvent.contentOffset.y > 300)} scrollEventThrottle={100}>
        <Text style={[styles.kicker, { color: colors.accent }]}>PLATED</Text>
        <Text style={[styles.title, { color: colors.text }]}>{inSession ? 'Ce trajet' : 'Collection globale'}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>{inSession ? 'Vos découvertes pendant la session en cours.' : 'Toutes vos découvertes, sur tous vos trajets.'}</Text>
        <View style={styles.row}>
          <FilterChip active={!inSession} label="Global" onPress={() => setScope('global')} />
          <FilterChip active={inSession} label="Ce trajet" disabled={!activeSession} onPress={() => setScope('session')} />
        </View>
        <View style={styles.progressGrid}>
          {[{ count: found(DEPARTMENTS), total: DEPARTMENTS.length, label: 'départements' }, { count: found(COUNTRIES), total: COUNTRIES.length, label: 'pays' }].map((stat) => (
            <View key={stat.label} style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.progressNumber, { color: colors.text }]}>{stat.count}<Text style={[styles.progressTotal, { color: colors.subduedText }]}> / {stat.total}</Text></Text>
              <Text style={{ color: colors.mutedText }}>{stat.label}</Text>
              {stat.label === 'pays' && <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 4 }}>dont {found(EU_COUNTRIES)} / {EU_COUNTRIES.length} de l’UE</Text>}
            </View>
          ))}
        </View>
        <SessionControl showLink />
        <Link href="/quick-entry" asChild>
          <Pressable accessibilityRole="link" style={{ ...styles.quick, backgroundColor: colors.accent }}>
            <MaterialIcons name="bolt" size={22} color={colors.surface} />
            <Text style={{ color: colors.surface, fontWeight: '800' }}>Saisie rapide</Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.surface} />
          </Pressable>
        </Link>
        <ObservationFeedback />
        {actionError && <Text accessibilityRole="alert" style={{ color: colors.danger, marginBottom: 12 }}>{actionError}</Text>}
        <View style={styles.row}>
          <FilterChip active={kind === 'all'} label="Tout" onPress={() => changeKind('all')} />
          <FilterChip active={kind === 'department'} label="Départements" onPress={() => changeKind('department')} />
          <FilterChip active={kind === 'country'} label="Pays" onPress={() => changeKind('country')} />
        </View>
        {kind !== 'department' && <View style={styles.row}>
          <FilterChip active={countryFilter === 'all'} label="Tous les pays" onPress={() => setCountryFilter('all')} />
          <FilterChip active={countryFilter === 'eu'} label="UE" onPress={() => setCountryFilter('eu')} />
          <FilterChip active={countryFilter === 'other'} label="Hors UE" onPress={() => setCountryFilter('other')} />
        </View>}
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={21} color={colors.subduedText} />
          <TextInput ref={searchRef} accessibilityLabel="Rechercher un code, pays ou département" value={query} onChangeText={setQuery} placeholder="Code ou nom de la plaque" placeholderTextColor={colors.subduedText} autoCapitalize="characters" autoCorrect={false} style={[styles.searchInput, { color: colors.text }]} />
          {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Effacer la recherche" onPress={() => { setQuery(''); searchRef.current?.focus(); }} style={styles.clearSearch}>
            <MaterialIcons name="close" size={20} color={colors.subduedText} />
          </Pressable>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <FilterChip active={filter === 'all'} label="Tous les statuts" onPress={() => setFilter('all')} />
          <FilterChip active={filter === 'found'} label="Trouvés" onPress={() => setFilter('found')} />
          <FilterChip active={filter === 'missing'} label="À trouver" onPress={() => setFilter('missing')} />
        </ScrollView>
        <Text style={{ color: colors.mutedText, fontSize: 12, marginBottom: 16 }}>{visible.length} résultat{visible.length > 1 ? 's' : ''} · {inSession ? 'Ce trajet' : 'Collection globale'}</Text>
        {grouped.map(({ name, targets }) => (
          <View key={name} style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.mutedText }]}>{name}</Text>
            {targets.map((target) => {
              const entry = progress.get(target.id);
              return (
                <View key={target.id} style={[styles.targetRow, { backgroundColor: entry ? colors.foundBackground : colors.surface, borderColor: entry ? colors.foundBorder : colors.border }]}>
                  <Pressable accessibilityRole="link" accessibilityLabel={`Voir ${target.name}`} onPress={() => router.push({ pathname: '/target/[targetId]', params: { targetId: target.id } })} style={styles.targetLink}>
                    <PlateCode code={target.code} type={target.type} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.targetName, { color: colors.text }]}>{target.flag ? `${target.flag}  ` : ''}{target.name}</Text>
                      <Text style={[styles.targetMeta, { color: colors.mutedText }]}>{entry ? `✓ ${entry.count} vue${entry.count > 1 ? 's' : ''} · ${formatDate(entry.lastSeen)}` : 'À trouver'}{target.type === 'country' ? ` · ${target.eu ? 'UE' : 'Hors UE'}` : ''}</Text>
                    </View>
                  </Pressable>
                  <AddObservationButton name={target.name} disabled={!!error} onAdd={() => handleAdd(target)} />
                </View>
              );
            })}
          </View>
        ))}
        {!visible.length && <View style={styles.empty}><Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>Aucune plaque trouvée</Text><Text style={{ color: colors.mutedText, marginTop: 4 }}>Essayez un autre code, nom ou filtre.</Text></View>}
      </ScrollView>
      {showScrollTop && <Pressable accessibilityRole="button" accessibilityLabel="Remonter tout en haut" onPress={() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); setShowScrollTop(false); }} style={[styles.scrollTop, { backgroundColor: colors.accent }]}>
        <MaterialIcons name="arrow-upward" size={24} color={colors.surface} />
      </Pressable>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 100, maxWidth: 760, width: '100%', alignSelf: 'center' },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 1.8 },
  title: { fontSize: 30, fontWeight: '900', marginTop: 2 },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 7 },
  progressGrid: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 18 },
  progressCard: { flex: 1, borderRadius: 18, padding: 16, borderWidth: 1 },
  progressNumber: { fontWeight: '900', fontSize: 24 },
  progressTotal: { fontSize: 15 },
  quick: { minHeight: 50, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  search: { marginTop: 6, minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, fontSize: 16, height: 50, minWidth: 0 },
  clearSearch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  group: { gap: 8, marginBottom: 21 },
  groupTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 5 },
  targetRow: { minHeight: 72, borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetLink: { minHeight: 50, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  targetName: { fontWeight: '800', fontSize: 16 },
  targetMeta: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  empty: { alignItems: 'center', paddingVertical: 44 },
  scrollTop: { position: 'absolute', right: 20, bottom: 16, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
