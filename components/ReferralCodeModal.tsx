import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Gift, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';
import { useReferral } from '@/providers/ReferralProvider';

interface ReferralCodeModalProps {
  visible: boolean;
  onClose: () => void;
  isFirstTime?: boolean;
}

export default function ReferralCodeModal({ visible, onClose, isFirstTime = true }: ReferralCodeModalProps) {
  const { t } = useTranslation();
  const { processReferralCode, userData, validateCode, getCodeInfo } = useReferral();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationMessage, setValidationMessage] = useState('');


  const handleRedeem = async () => {
    const trimmedCode = code.trim().toUpperCase();
    
    if (!trimmedCode) {
      setError(t('referral_code_required'));
      return;
    }

    if (trimmedCode.length < 6 || trimmedCode.length > 12) {
      setError(t('referral_code_invalid_length'));
      return;
    }

    // Validate code format
    const validation = validateCode(trimmedCode);
    if (!validation.isValid) {
      setError(validation.message || t('referral_code_invalid'));
      return;
    }

    if (trimmedCode === userData.referralCode.toUpperCase()) {
      setError(t('referral_code_own'));
      return;
    }

    setLoading(true);
    setError('');
    setValidationMessage('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await processReferralCode(trimmedCode);
      
      if (result.success) {
        Alert.alert(
          t('referral_success_title'),
          result.message,
          [{ text: t('ok'), onPress: onClose }]
        );
        setCode('');
      } else {
        setError(result.message);
      }
    } catch {
      setError(t('referral_code_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
            <Gift size={48} color={Colors.primary.accent} />
          </View>

          <Text style={styles.title}>
            {t('referral_modal_title')}
          </Text>

          <Text style={styles.description}>
            {t('referral_modal_description')}
          </Text>

          <Text style={styles.subDescription}>
            {t('referral_modal_subdescription')}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder={t('referral_code_placeholder')}
              placeholderTextColor={Colors.primary.textSecondary}
              value={code}
              onChangeText={(text) => {
                const upperText = text.toUpperCase();
                setCode(upperText);
                setError('');
                
                // Real-time validation feedback
                if (upperText.length >= 6) {
                  const validation = validateCode(upperText);
                  if (validation.isValid) {
                    const info = getCodeInfo(upperText);
                    if (info.type === 'promotional') {
                      setValidationMessage(`✓ ${info.description || t('valid_promotional_code')} (+${info.credits} ${t('credits')})`); 
                    } else if (info.type === 'user') {
                      setValidationMessage(`✓ ${t('valid_referral_code')}`);
                    }
                  } else {
                    setValidationMessage('');
                  }
                } else {
                  setValidationMessage('');
                }
              }}
              maxLength={12}
              autoCapitalize="characters"
              editable={!loading}
            />
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : validationMessage ? (
              <Text style={[styles.validationText, styles.validText]}>{validationMessage}</Text>
            ) : null}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRedeem}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primary.text} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('redeem')}</Text>
              )}
            </TouchableOpacity>

            {isFirstTime && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSkip}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>{t('skip_for_now')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    position: 'relative' as const,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.primary.text,
    textAlign: 'center' as const,
    marginBottom: 8,
    lineHeight: 22,
  },
  subDescription: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.primary.bg,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.primary.text,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    textAlign: 'center' as const,
    letterSpacing: 2,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  validationText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  validText: {
    color: '#4CAF50',
  },
  warningText: {
    color: '#FF9800',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary.accent,
  },
  primaryButtonText: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    backgroundColor: Colors.primary.cardBorder,
  },
  secondaryButtonText: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: '500' as const,
  },
});