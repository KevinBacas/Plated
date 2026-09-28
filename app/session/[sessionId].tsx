import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DepartmentHeatmap } from '@/components/department-heatmap';
import { FilterChip } from '@/components/filter-chip';
import { PlateCode } from '@/components/plate-code';
import { RegionPodium } from '@/components/region-podium';
import { useAppTheme } from '@/components/theme-provider';
import { useObservations } from '@/context/observations';
import { COUNTRIES, DEPARTMENTS, EU_COUNTRIES, getTargetById } from '@/data/targets';
import { formatDate } from '@/lib/format';
import { formatSessionDuration, sessionInsights } from '@/lib/sessions';
import { buildTargetProgress } from '@/lib/target-stats';

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { colors } = useAppTheme();
  const { sessions, observations, loading, error, refresh } = useObservations();
  const session = sessions.find((item) => item.id === sessionId);
  const insights = useMemo(() => session ? sessionInsights(observations, session) : null, [observations, session]);
  const progress = useMemo(() => buildTargetProgress(insights?.observations ?? []), [insights]);
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState<'all' | 'discoveries'>('all');
  useEffect(() => {
    if (!session || session.endedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [session]);
  const frequencies = insights?.frequencies.filter(([id]) => view === 'all' || insights.discoveries.includes(id)) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, maxWidth: 760, width: '100%', alignSelf: 'center', paddingBottom: 50 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour aux sessions" onPress={() => router.dismissTo('/sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}><MaterialIcons name="arrow-back" size={22} color={colors.text} /><Text style={{ color: colors.text, fontWeight: '800' }}>Sessions</Text></Pressable>
        {loading ? <ActivityIndicator color={colors.accent} /> : error ? <View><Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text><Pressable accessibilityRole="button" onPress={refresh} style={{ minHeight: 44 }}><Text style={{ color: colors.accent }}>Réessayer</Text></Pressable></View> : !session || !insights ? <Text style={{ color: colors.text }}>Session introuvable.</Text> : <>
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '900' }}>{session.endedAt ? 'TRAJET TERMINÉ' : 'SESSION EN COURS'}</Text>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900' }}>Le bilan du trajet</Text>
            <Text style={{ color: colors.mutedText }}>Début : {formatDate(session.startedAt)}</Text>
            {session.endedAt && <Text style={{ color: colors.mutedText }}>Fin : {formatDate(session.endedAt)}</Text>}
            <Text style={{ color: colors.mutedText }}>Durée : {formatSessionDuration(session, now)}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[{ label: 'observations', value: String(insights.total) }, { label: 'départements distincts', value: `${insights.departments} / ${DEPARTMENTS.length}` }, { label: `pays distincts · ${insights.euCountries}/${EU_COUNTRIES.length} UE`, value: `${insights.countries} / ${COUNTRIES.length}` }, { label: 'nouvelles découvertes globales', value: String(insights.discoveries.length) }].map((stat) => <View key={stat.label} style={{ flexBasis: '45%', flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 16, gap: 5 }}><Text style={{ color: colors.text, fontSize: 25, fontWeight: '900' }}>{stat.value}</Text><Text style={{ color: colors.mutedText, fontSize: 13 }}>{stat.label}</Text></View>)}
          </View>
          <Text style={{ color: colors.mutedText, fontSize: 13, lineHeight: 19 }}>Une découverte globale est une plaque observée pour la première fois pendant ce trajet. Les observations répétées comptent dans les fréquences.</Text>
          <RegionPodium regions={insights.topRegions} />
          <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 18 }}><DepartmentHeatmap progress={progress} /></View>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Plaques les plus fréquentes</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><FilterChip active={view === 'all'} label="Toutes les plaques" onPress={() => setView('all')} /><FilterChip active={view === 'discoveries'} label="Nouvelles découvertes" onPress={() => setView('discoveries')} /></View>
          {!frequencies.length && <Text style={{ color: colors.mutedText }}>{view === 'discoveries' ? 'Aucune nouvelle découverte globale sur ce trajet.' : 'Aucune observation pendant ce trajet.'}</Text>}
          {frequencies.map(([id, entry]) => {
            const target = getTargetById(id);
            if (!target) return null;
            return <Link key={id} href={{ pathname: '/target/[targetId]', params: { targetId: id } }} asChild><Pressable accessibilityRole="link" style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}><PlateCode code={target.code} type={target.type} /><View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.text, fontWeight: '800' }}>{target.flag ? `${target.flag} ` : ''}{target.name}</Text><Text style={{ color: colors.mutedText, fontSize: 12 }}>{entry.count} vue{entry.count > 1 ? 's' : ''} · {formatDate(entry.lastSeen)}</Text>{insights.discoveries.includes(id) && <Text style={{ color: colors.accent, fontSize: 12 }}>Nouvelle découverte globale</Text>}</View></Pressable></Link>;
          })}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
