import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from '@/components/theme-provider';
import paths from '@/data/department-map.json';
import { DEPARTMENTS, getTargetById } from '@/data/targets';
import { heatLevel } from '@/lib/heatmap';
import type { TargetProgress } from '@/lib/target-stats';

export function DepartmentHeatmap({ progress }: { progress: Map<string, TargetProgress> }) {
  const { colors, colorScheme } = useAppTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const palette = [colors.surfaceMuted, ...(colorScheme === 'dark' ? ['#284c43', '#3f8373', '#77dac7'] : ['#cbe8dc', '#70b69c', '#0d6e63'])];
  const department = selected ? getTargetById(`department-${selected}`) : null;
  const count = selected ? progress.get(`department-${selected}`)?.count ?? 0 : 0;
  const renderPath = (entry: { code: string; path: string }) => {
    const sightings = progress.get(`department-${entry.code}`)?.count ?? 0;
    return <Path key={entry.code} d={entry.path} fill={palette[heatLevel(sightings)]} stroke={selected === entry.code ? colors.text : colors.border} strokeWidth={selected === entry.code ? 2 : 0.65}
      accessibilityLabel={`${entry.code} ${getTargetById(`department-${entry.code}`)?.name}, ${sightings} observations`} onPress={() => setSelected(entry.code)} />;
  };
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 19 }}>Les départements croisés</Text>
      <Text style={{ color: colors.mutedText, fontSize: 13, lineHeight: 19 }}>Origine indiquée sur les plaques, sans géolocalisation. Touchez un département pour voir son nombre d’observations.</Text>
      <Svg width="100%" height={310} viewBox="0 0 420 390">{paths.filter((entry) => entry.code.length < 3).map(renderPath)}</Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {paths.filter((entry) => entry.code.length === 3).map((entry) => (
          <Pressable key={entry.code} accessibilityRole="button" accessibilityLabel={`Sélectionner ${getTargetById(`department-${entry.code}`)?.name}`} onPress={() => setSelected(entry.code)} style={{ flexBasis: '30%', flexGrow: 1, backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 8, alignItems: 'center' }}>
            <Svg width={70} height={65} viewBox="0 0 100 100">{renderPath(entry)}</Svg>
            <Text style={{ color: colors.text, fontSize: 11, textAlign: 'center' }}>{getTargetById(`department-${entry.code}`)?.name}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {['0', '1', '2–4', '5+'].map((label, index) => <View key={label} style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: palette[index] }} /><Text style={{ color: colors.mutedText, fontSize: 12 }}>{label}</Text></View>)}
      </View>
      <Text accessibilityLiveRegion="polite" style={{ minHeight: 44, color: colors.text, fontWeight: '700' }}>{department ? `${department.code} · ${department.name} : ${count} observation${count > 1 ? 's' : ''}` : 'Sélectionnez un département sur la carte ou dans la liste ci-dessous.'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 6 }}>
        {DEPARTMENTS.map((target) => <Pressable key={target.id} accessibilityRole="button" accessibilityLabel={`Sélectionner ${target.name}`} accessibilityState={{ selected: selected === target.code }} onPress={() => setSelected(target.code)} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, paddingHorizontal: 8, backgroundColor: selected === target.code ? colors.accentSoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.accent, fontWeight: '700' }}>{target.code}</Text></Pressable>)}
      </ScrollView>
      <Text style={{ color: colors.mutedText, fontSize: 11 }}>Contours : IGN Admin Express 2018 / France GeoJSON · Licence ouverte. Outre-mer à des échelles distinctes.</Text>
    </View>
  );
}
