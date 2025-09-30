import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';
import { Mic, Apple, ShieldCheck, ChevronRight } from 'lucide-react-native';

interface VoiceOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onEnableInApp: () => void;
  onEnableSiri: () => void;
}

export default function VoiceOnboardingModal({ visible, onClose, onEnableInApp, onEnableSiri }: VoiceOnboardingModalProps) {
  const { t } = useTranslation();

  const isIOS = Platform.OS === 'ios';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card} testID="voiceOnboardingModal">
          <View style={styles.header}>
            <Text style={styles.title}>{t('voice_control')}</Text>
            <Text style={styles.subtitle}>{t('siri_voice_assistant')}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.iconBubble}>
                <Mic size={20} color={Colors.primary.text} />
              </View>
              <View style={styles.texts}>
                <Text style={styles.rowTitle}>{t('in_app_voice_control')}</Text>
                <Text style={styles.rowDesc}>{t('enable_notifications') /* reuse short text key for localization presence */}</Text>
              </View>
              <ChevronRight size={18} color={Colors.primary.textSecondary} />
            </View>

            <TouchableOpacity
              testID="enableInAppVoiceButton"
              style={styles.primaryButton}
              onPress={onEnableInApp}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t('continue')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.row}>
              <View style={[styles.iconBubble, { backgroundColor: Colors.primary.accent }]}>
                <Apple size={20} color={Colors.primary.text} />
              </View>
              <View style={styles.texts}>
                <Text style={styles.rowTitle}>{t('siri_voice_assistant')}</Text>
                <Text style={styles.rowDesc}>
                  {isIOS ? t('shortcuts') : t('siri_ios_only')}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.primary.textSecondary} />
            </View>

            <TouchableOpacity
              testID="enableSiriButton"
              style={[styles.secondaryButton, !isIOS && styles.secondaryButtonDisabled]}
              onPress={onEnableSiri}
              activeOpacity={0.8}
              disabled={!isIOS}
            >
              <Text style={styles.secondaryButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="dismissVoiceOnboarding" onPress={onClose} style={styles.dismissArea}>
            <ShieldCheck size={18} color={Colors.primary.textSecondary} />
            <Text style={styles.dismissText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.primary.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    color: Colors.primary.text,
    fontWeight: '600' as const,
  },
  rowDesc: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: Colors.primary.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.primary.text,
    fontWeight: '700' as const,
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: Colors.secondary.bg,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: Colors.primary.text,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.primary.cardBorder,
  },
  dismissArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.primary.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
  },
});
