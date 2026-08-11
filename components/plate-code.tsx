import { StyleSheet, Text, View } from 'react-native';

type PlateCodeProps = {
  code: string;
  type: 'country' | 'department';
  large?: boolean;
};

export function PlateCode({ code, type, large = false }: PlateCodeProps) {
  const isDepartment = type === 'department';

  return (
    <View
      accessibilityLabel={`${isDepartment ? 'Numéro de département' : 'Code pays'} sur la plaque : ${code}`}
      style={[
        styles.plate,
        large ? styles.plateLarge : styles.plateCompact,
        isDepartment && (large ? styles.departmentPlateLarge : styles.departmentPlateCompact),
      ]}>
      <View style={[styles.europeanBand, large && styles.europeanBandLarge]}>
        <Text style={[styles.stars, large && styles.starsLarge]}>•••</Text>
        <Text style={[styles.stars, large && styles.starsLarge]}>•••</Text>
        <Text style={[styles.bandCode, large && styles.bandCodeLarge]}>{isDepartment ? 'F' : code}</Text>
      </View>
      <View style={styles.registrationArea}>
        <View style={[styles.registrationMark, large && styles.registrationMarkLarge]} />
        <View style={[styles.registrationMark, large && styles.registrationMarkLarge]} />
      </View>
      {isDepartment ? (
        <View style={[styles.departmentBand, large && styles.departmentBandLarge]}>
          <View style={[styles.regionMark, large && styles.regionMarkLarge]} />
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.departmentCode, large && styles.departmentCodeLarge]}>
            {code}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: '#f8f9f5',
    borderColor: '#252a2d',
    borderWidth: 1.5,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  plateCompact: { width: 56, height: 40 },
  plateLarge: { width: 106, height: 72, borderRadius: 9, borderWidth: 2 },
  departmentPlateCompact: { width: 76 },
  departmentPlateLarge: { width: 140 },
  europeanBand: {
    width: 25,
    backgroundColor: '#0646a5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  europeanBandLarge: { width: 45, paddingVertical: 5 },
  stars: { color: '#ffd52f', fontSize: 7, lineHeight: 6, letterSpacing: -0.3 },
  starsLarge: { fontSize: 11, lineHeight: 9, letterSpacing: 0 },
  bandCode: { color: '#ffffff', fontSize: 11, lineHeight: 13, fontWeight: '900' },
  bandCodeLarge: { fontSize: 19, lineHeight: 23 },
  registrationArea: { flex: 1, gap: 4, justifyContent: 'center', paddingHorizontal: 5 },
  registrationMark: { height: 3, borderRadius: 2, backgroundColor: '#c3c8c5' },
  registrationMarkLarge: { height: 5 },
  departmentBand: {
    width: 25,
    backgroundColor: '#0646a5',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 1,
  },
  departmentBandLarge: { width: 45, paddingVertical: 8 },
  regionMark: { width: 11, height: 6, borderRadius: 2, backgroundColor: '#ffffff' },
  regionMarkLarge: { width: 20, height: 10, borderRadius: 3 },
  departmentCode: { color: '#ffffff', fontSize: 10, lineHeight: 12, fontWeight: '900', maxWidth: 23 },
  departmentCodeLarge: { fontSize: 18, lineHeight: 21, maxWidth: 42 },
});
