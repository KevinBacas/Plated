import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlateCode } from '@/components/plate-code';
import { RegionPodium } from '@/components/region-podium';
import { SessionControl } from '@/components/session-control';
import { useAppTheme } from '@/components/theme-provider';
import { useObservations } from '@/context/observations';
import { getTargetById } from '@/data/targets';
import { formatDate } from '@/lib/format';
import type { Observation } from '@/lib/observations';
import { formatSessionDuration, summarizeSession, type TripSession } from '@/lib/sessions';
import { buildTargetProgress } from '@/lib/target-stats';

function SessionCard({ session, observations }: { session: TripSession; observations: Observation[] }) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const summary = useMemo(() => summarizeSession(observations, session.id), [observations, session.id]);
  const plates = useMemo(() => [...buildTargetProgress(summary.observations)], [summary.observations]);

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 12 }}>
      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>{session.endedAt ? 'TERMINÉE' : 'EN COURS'}</Text>
      <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>Trajet du {formatDate(session.startedAt)}</Text>
      {session.endedAt && <Text selectable style={{ color: colors.mutedText }}>Fin : {formatDate(session.endedAt)} · {formatSessionDuration(session)}</Text>}
      <Text selectable style={{ color: colors.text, fontWeight: '700' }}>{summary.total} observation{summary.total > 1 ? 's' : ''}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, padding: 12, backgroundColor: colors.surfaceMuted, borderRadius: 12 }}>
          <Text selectable style={{ color: colors.text, fontSize: 23, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{summary.departments}</Text>
          <Text style={{ color: colors.mutedText }}>département{summary.departments > 1 ? 's' : ''}</Text>
        </View>
        <View style={{ flex: 1, padding: 12, backgroundColor: colors.surfaceMuted, borderRadius: 12 }}>
          <Text selectable style={{ color: colors.text, fontSize: 23, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{summary.countries}</Text>
          <Text style={{ color: colors.mutedText }}>pays de l’UE</Text>
        </View>
      </View>
      <RegionPodium regions={summary.topRegions} />
      {summary.total === 0 ? (
        <Text style={{ color: colors.mutedText, lineHeight: 20 }}>Aucune plaque observée pendant cette session.</Text>
      ) : (
        <>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colors.accent, fontWeight: '800' }}>{expanded ? 'Masquer les plaques' : 'Voir les plaques'}</Text>
          </Pressable>
          {expanded && plates.map(([targetId, progress]) => {
            const target = getTargetById(targetId);
            if (!target) return null;
            return (
              <Link key={targetId} href={{ pathname: '/target/[targetId]', params: { targetId } }} asChild>
                <Pressable accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                  <PlateCode code={target.code} type={target.type} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.text, fontWeight: '800' }}>{target.flag ? `${target.flag} ` : ''}{target.name}</Text>
                    <Text style={{ color: colors.mutedText, fontSize: 12 }}>{progress.count} vue{progress.count > 1 ? 's' : ''} · {formatDate(progress.lastSeen)}</Text>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </>
      )}
    </View>
  );
}

export default function SessionsScreen() {
  const { colors } = useAppTheme();
  const { sessions, observations, loading, error } = useObservations();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14 }}>
        <View style={{ gap: 4, marginBottom: 10 }}>
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1.8 }}>PLATED</Text>
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900' }}>Sessions</Text>
          <Text style={{ color: colors.mutedText, fontSize: 15 }}>Chaque trajet a son histoire.</Text>
        </View>
        <SessionControl />
        {loading ? <ActivityIndicator color={colors.accent} accessibilityLabel="Chargement des sessions" /> : !error && (
          <>
            <Text style={{ color: colors.text, fontSize: 19, fontWeight: '800' }}>Vos trajets · {sessions.length}</Text>
            {sessions.length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 24, gap: 10 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>Prêt pour le prochain départ</Text>
                <Text style={{ color: colors.mutedText, lineHeight: 21 }}>Démarrez votre première session, ajoutez vos plaques depuis Collection, puis retrouvez ici le récapitulatif du trajet.</Text>
                <Text style={{ color: colors.mutedText, lineHeight: 21 }}>Vos observations précédentes restent disponibles dans le Journal, hors session.</Text>
              </View>
            ) : sessions.map((session) => <SessionCard key={session.id} session={session} observations={observations} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
