import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/components/theme-provider';
import { useObservations } from '@/context/observations';
import { getTargetById } from '@/data/targets';
import { formatDate } from '@/lib/format';
import type { Observation } from '@/lib/observations';

export default function JournalScreen() {
  const { colors } = useAppTheme();
  const { observations, deleteObservation } = useObservations();
  const remove = (observation: Observation) => Alert.alert('Supprimer l’observation ?', 'Cette action ne peut pas être annulée.', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: () => deleteObservation(observation.id) },
  ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: colors.accent }]}>PLATED</Text>
        <Text style={[styles.title, { color: colors.text }]}>Journal</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {observations.length ? `${observations.length} observation${observations.length > 1 ? 's' : ''} enregistrée${observations.length > 1 ? 's' : ''}` : 'Toutes vos plaques croisées apparaîtront ici.'}
        </Text>
        {observations.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="history" size={42} color={colors.subduedText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>La route est encore à écrire</Text>
            <Text style={[styles.emptyText, { color: colors.subduedText }]}>Ajoute une plaque depuis Collection pour démarrer le journal.</Text>
          </View>
        ) : observations.map((observation) => {
          const target = getTargetById(observation.targetId);
          if (!target) return null;

          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} key={observation.id}>
              <View style={styles.cardTop}>
                <View style={[styles.code, { backgroundColor: colors.codeBackground }]}><Text style={[styles.codeText, { color: colors.codeText }]}>{target.flag ?? target.code}</Text></View>
                <View style={styles.copy}>
                  <Text style={[styles.name, { color: colors.text }]}>{target.name}</Text>
                  <Text style={[styles.date, { color: colors.subduedText }]}>{formatDate(observation.observedAt)}</Text>
                </View>
                <Pressable hitSlop={10} onPress={() => remove(observation)}><MaterialIcons name="delete-outline" size={23} color={colors.danger} /></Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 110 },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 1.8 },
  title: { fontSize: 32, fontWeight: '900', marginTop: 2 },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 24 },
  card: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  code: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  codeText: { fontWeight: '900', fontSize: 14 },
  copy: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800' },
  date: { fontSize: 12, marginTop: 3 },
  empty: { borderRadius: 20, borderWidth: 1, padding: 30, alignItems: 'center', gap: 10, marginTop: 14 },
  emptyTitle: { fontWeight: '800', fontSize: 17 },
  emptyText: { textAlign: 'center', lineHeight: 20 },
});
