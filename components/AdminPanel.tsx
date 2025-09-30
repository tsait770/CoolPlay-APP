import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Shield, Plus, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useReferral } from '@/providers/ReferralProvider';
import * as Clipboard from 'expo-clipboard';

interface AdminPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function AdminPanel({ visible, onClose }: AdminPanelProps) {
  const { getPromotionalCodes, generateUserCode, validateCode, isAdminCode } = useReferral();
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newCodePrefix, setNewCodePrefix] = useState('');
  const [newCodeCredits, setNewCodeCredits] = useState('300');
  const [newCodeDescription, setNewCodeDescription] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Admin authentication (in production, this would be server-side)
  const ADMIN_PASSWORD = 'ADMIN2025SECRET';

  const handleAuthenticate = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAdminPassword('');
    } else {
      if (Platform.OS === 'web') {
        console.error('Invalid admin password');
      } else {
        Alert.alert('Access Denied', 'Invalid admin password');
      }
    }
  };

  const handleGenerateCode = () => {
    const newCode = generateUserCode();
    handleCopyCode(newCode);
    
    if (Platform.OS === 'web') {
      console.log(`New code generated: ${newCode}`);
    } else {
      Alert.alert('Code Generated', `New code: ${newCode}\nCopied to clipboard!`);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const promotionalCodes = getPromotionalCodes();

  if (!isAuthenticated) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.authContainer}>
            <Shield size={48} color={Colors.primary.accent} />
            <Text style={styles.authTitle}>Admin Access</Text>
            <Text style={styles.authSubtitle}>Enter admin password to continue</Text>
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Admin Password"
                placeholderTextColor={Colors.primary.textSecondary}
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.primary.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.primary.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.authButtons}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleAuthenticate}
              >
                <Text style={styles.primaryButtonText}>Authenticate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Shield size={24} color={Colors.primary.accent} />
            <Text style={styles.title}>Referral Code Management</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Code Generation Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Generate New Codes</Text>
              
              <TouchableOpacity
                style={[styles.button, styles.generateButton]}
                onPress={handleGenerateCode}
              >
                <Plus size={20} color={Colors.primary.text} />
                <Text style={styles.generateButtonText}>Generate User Code</Text>
              </TouchableOpacity>

              <Text style={styles.hint}>
                User codes format: RKU + unique ID{'\n'}
                Credits: 300 for referrer, 300 for referee
              </Text>
            </View>

            {/* Active Promotional Codes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Promotional Codes</Text>
              
              {promotionalCodes.map((code) => (
                <View key={code.code} style={styles.codeCard}>
                  <View style={styles.codeInfo}>
                    <Text style={styles.codeText}>{code.code}</Text>
                    <Text style={styles.codeDescription}>{code.description}</Text>
                    <Text style={styles.codeCredits}>+{code.credits} credits</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopyCode(code.code)}
                  >
                    {copiedCode === code.code ? (
                      <Check size={18} color="#4CAF50" />
                    ) : (
                      <Copy size={18} color={Colors.primary.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Code Validation Rules */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Validation Rules</Text>
              
              <View style={styles.ruleCard}>
                <Text style={styles.ruleTitle}>System Codes (RK prefix)</Text>
                <Text style={styles.ruleText}>
                  • Must start with "RK"{'\n'}
                  • 6-12 characters long{'\n'}
                  • Alphanumeric only
                </Text>
              </View>

              <View style={styles.ruleCard}>
                <Text style={styles.ruleTitle}>User Codes (RKU prefix)</Text>
                <Text style={styles.ruleText}>
                  • Generated for each user{'\n'}
                  • Can be shared with friends{'\n'}
                  • 300 credits reward
                </Text>
              </View>

              <View style={styles.ruleCard}>
                <Text style={styles.ruleTitle}>Promotional Codes</Text>
                <Text style={styles.ruleText}>
                  • Limited use campaigns{'\n'}
                  • Variable credit amounts{'\n'}
                  • Can have expiry dates
                </Text>
              </View>

              <View style={styles.ruleCard}>
                <Text style={styles.ruleTitle}>Admin Codes (Hidden)</Text>
                <Text style={styles.ruleText}>
                  • Not visible to users{'\n'}
                  • For testing purposes{'\n'}
                  • Cannot be redeemed publicly
                </Text>
              </View>
            </View>

            {/* Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Code Types</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>5</Text>
                  <Text style={styles.statLabel}>Promotional</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>∞</Text>
                  <Text style={styles.statLabel}>User Codes</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>4</Text>
                  <Text style={styles.statLabel}>Admin Only</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    width: '95%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  authContainer: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary.text,
    marginTop: 16,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginBottom: 24,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.primary.text,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  eyeButton: {
    position: 'absolute' as const,
    right: 16,
    padding: 4,
  },
  authButtons: {
    width: '100%',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.cardBorder,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: Colors.primary.textSecondary,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 16,
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
  generateButton: {
    backgroundColor: Colors.primary.accent,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  generateButtonText: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  hint: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    lineHeight: 18,
  },
  codeCard: {
    backgroundColor: Colors.primary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  codeInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    letterSpacing: 1,
  },
  codeDescription: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    marginTop: 4,
  },
  codeCredits: {
    fontSize: 14,
    color: Colors.primary.accent,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  copyButton: {
    padding: 12,
  },
  ruleCard: {
    backgroundColor: Colors.primary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary.accent,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 4,
  },
});