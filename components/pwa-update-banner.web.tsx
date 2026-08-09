import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/components/theme-provider';

const UPDATE_READY_EVENT = 'plated:update-ready';

type UpdateAwareWindow = Window & {
  __PLATED_UPDATE_READY__?: boolean;
};

export function PwaUpdateBanner() {
  const { colors } = useAppTheme();
  const [updateReady, setUpdateReady] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    const updateAwareWindow = window as UpdateAwareWindow;
    const showUpdate = () => setUpdateReady(true);

    if (updateAwareWindow.__PLATED_UPDATE_READY__) {
      showUpdate();
    }

    window.addEventListener(UPDATE_READY_EVENT, showUpdate);
    return () => window.removeEventListener(UPDATE_READY_EVENT, showUpdate);
  }, []);

  const reloadWithUpdate = useCallback(() => {
    if (isReloading) return;

    setIsReloading(true);
    window.location.reload();
  }, [isReloading]);

  if (!updateReady) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 0,
        bottom: 96,
        left: 0,
        alignItems: 'center',
        paddingHorizontal: 16,
      }}>
      <View
        accessibilityRole="alert"
        style={{
          width: '100%',
          maxWidth: 520,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: colors.snackBackground,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
        }}>
        <Text selectable style={{ flex: 1, color: colors.snackText, fontSize: 14, fontWeight: '600' }}>
          Une nouvelle version est disponible.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mettre Plated à jour"
          disabled={isReloading}
          onPress={reloadWithUpdate}
          style={({ pressed }) => ({
            minHeight: 40,
            justifyContent: 'center',
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor: colors.accentStrong,
            opacity: pressed || isReloading ? 0.72 : 1,
          })}>
          <Text style={{ color: '#12302a', fontSize: 14, fontWeight: '800' }}>
            {isReloading ? 'Mise à jour…' : 'Mettre à jour'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
