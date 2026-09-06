import { Text, View } from 'react-native';

import { useAppTheme } from '@/components/theme-provider';
import type { RegionStanding } from '@/lib/sessions';

export function RegionPodium({ regions }: { regions: RegionStanding[] }) {
  const { colors } = useAppTheme();

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Le podium des régions</Text>
      {regions.length === 0 ? (
        <Text style={{ color: colors.mutedText, lineHeight: 20 }}>Le podium apparaîtra dès qu’un département sera observé pendant ce trajet.</Text>
      ) : (
        <>
          <Text style={{ color: colors.mutedText, fontSize: 12, lineHeight: 18 }}>Les régions les plus rencontrées, selon le nombre d’observations de départements.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            {[1, 0, 2].map((index) => {
              const standing = regions[index];
              if (!standing) return <View key={index} style={{ flex: 1 }} />;
              const first = index === 0;
              return (
                <View
                  key={standing.region}
                  accessible
                  accessibilityLabel={`${index + 1}${first ? 're' : 'e'} place : ${standing.region}, ${standing.count} observation${standing.count > 1 ? 's' : ''}`}
                  style={{ flex: 1, gap: 6, alignItems: 'stretch' }}>
                  <Text style={{ color: colors.text, textAlign: 'center', fontWeight: '800', fontSize: 13 }}>{standing.region}</Text>
                  <Text style={{ color: colors.mutedText, textAlign: 'center', fontSize: 12 }}>{standing.count} vue{standing.count > 1 ? 's' : ''}</Text>
                  <View style={{ minHeight: first ? 94 : index === 1 ? 66 : 44, backgroundColor: first ? colors.accent : colors.accentSoft, borderTopLeftRadius: 12, borderTopRightRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                    <Text style={{ color: first ? colors.surface : colors.accent, fontSize: first ? 32 : 25, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{index + 1}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
