import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme, type ThemePreference } from '@/components/theme-provider';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

export default function SettingsScreen() {
  const { colors, setThemePreference, themePreference } = useAppTheme();
  const selectedIndex = THEME_OPTIONS.indexOf(themePreference);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: colors.accent }]}>PLATED</Text>
        <Text style={[styles.title, { color: colors.text }]}>Options</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>Personnalisez l’apparence de l’application.</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Apparence</Text>
          <Text style={[styles.cardCopy, { color: colors.mutedText }]}>Choisissez le thème utilisé par Plated.</Text>
          <SegmentedControl
            values={['Système', 'Clair', 'Sombre']}
            selectedIndex={selectedIndex}
            tintColor={colors.accent}
            onChange={({ nativeEvent }) => {
              const preference = THEME_OPTIONS[nativeEvent.selectedSegmentIndex];
              if (preference) setThemePreference(preference);
            }}
            accessibilityLabel="Thème de l’application"
          />
          <Text style={[styles.hint, { color: colors.subduedText }]}>Le mode Système suit les réglages de votre téléphone.</Text>
        </View>
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
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardCopy: { fontSize: 14, lineHeight: 20 },
  hint: { fontSize: 12, lineHeight: 17 },
});
