import {
   Text,
   View,
   StyleSheet,
   TouchableOpacity,
   ScrollView,
   StatusBar,
} from 'react-native';
import * as Camera from 'expo-camera';
import { type PermissionResponse } from 'expo';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { r } from '@/store';
import { useI18n } from '@/i18n/useI18n';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';

export default function OnboardingScreen() {
  const [status, setStatus] = useState<PermissionResponse | null>(null);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const { t } = useI18n();

  const requestCamera = useCallback(async () => {
       try {
          const res = await Camera.Camera.requestCameraPermissionsAsync();
           setStatus(res);
           } catch (e) {
            console.error(e);
            setStatus(null);
             }
       setPermissionAsked(true);
         }, []);

   const finish = useCallback(async () => {
      await r.setOnboarded();
      router.replace('/wardrobe');
       }, []);

   const granted = status?.status === 'granted';
   const canAskAgain = status?.canAskAgain ?? true;

   return (
      <ScrollView
         style={styles.screen}
         contentContainerStyle={styles.content}>
         <StatusBar />
         <View style={styles.card}>
             <Text style={styles.title}>{t('onboarding.welcome')}</Text>
              <Text style={styles.body}>{t('onboarding.body')}</Text>

              <View style={styles.section}>
                 <Text style={styles.sectionTitle}>{t('onboarding.camera')}</Text>
                 {granted ? (
                    <Text style={styles.ok}>{t('onboarding.camera.granted')}</Text>
                 ) : permissionAsked && !canAskAgain ? (
                    <Text style={styles.deny}>{t('onboarding.camera.denied')}</Text>
                 ) : permissionAsked ? (
                    <Text style={styles.deny}>{t('onboarding.camera.notgranted')}</Text>
                 ) : null}

                 {!granted ? (
                   <TouchableOpacity
                     style={styles.button}
                     activeOpacity={0.8}
                     onPress={requestCamera}>
                       <Text style={styles.buttonText}>{t('onboarding.camera.enable')}</Text>
                   </TouchableOpacity>
                 ) : null}

                 <Text style={styles.hint}>{t('onboarding.camera.hint')}</Text>
                </View>

                 <LanguageSwitcher />

                <View style={styles.footer}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={finish}>
                  <Text style={styles.primaryText}>{t('onboarding.start')}</Text>
               </TouchableOpacity>
              </View>
         </View>
       </ScrollView>
   );
}

const styles = StyleSheet.create({
   screen: { flex: 1 },
   content: {
      padding: 24,
      justifyContent: 'center',
      flexGrow: 1,
      },
   card: { gap: 16 },
   title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
   body: { fontSize: 15, lineHeight: 22, color: '#4a4a4a' },
   section: { marginTop: 12, gap: 8 },
   sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase' as 'uppercase',
      letterSpacing: 1,
      color: '#888',
      },
   ok: { color: '#1a7f37', fontWeight: '600' },
   deny: { color: '#b22222' },
   hint: { fontSize: 12, color: '#888', lineHeight: 18 },
   button: {
      backgroundColor: '#f2f2f2',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 12,
      alignSelf: 'flex-start',
      },
   buttonText: { fontSize: 15, fontWeight: '600' },
   footer: { marginTop: 24 },
   primaryButton: {
      backgroundColor: '#111',
      paddingVertical: 16,
      paddingHorizontal: 28,
      borderRadius: 14,
      alignSelf: 'flex-start',
      },
   primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
