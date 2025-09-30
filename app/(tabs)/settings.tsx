import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Platform,
  Pressable,
  Animated,
} from "react-native";
import {
  Settings as SettingsIcon,
  User,
  CreditCard,
  Smartphone,
  Brain,
  RefreshCw,
  Keyboard,
  Bell,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
  LogIn,
  Moon,
  Globe,
  Download,
  Trash2,
  RotateCcw,
  Cloud,
  Lock,
  MessageSquare,
  FileText,
  AlertCircle,
  Gift,
  Mic,
  Apple,
} from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage, Language } from "@/hooks/useLanguage";
import { useReferral } from "@/providers/ReferralProvider";
import ReferralCodeModal from "@/components/ReferralCodeModal";
import AdminPanel from "@/components/AdminPanel";
import CategoryManagement from "@/components/CategoryManagement";
import { useVoiceControl } from '@/providers/VoiceControlProvider';
import { useSiriIntegration } from '@/providers/SiriIntegrationProvider';
import { useSound } from '@/providers/SoundProvider';

const AnimatedSettingItem: React.FC<{ onPress: () => void; children: React.ReactNode; testID?: string }> = ({ onPress, children, testID }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 0.9, duration: 80, useNativeDriver: true }),
    ]).start();
  };
  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      android_ripple={{ color: 'rgba(108,212,255,0.15)', borderless: false }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      testID={testID}
    >
      <Animated.View style={[styles.settingItem, { transform: [{ scale }], opacity }]}> 
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { userData } = useReferral();
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [autoClassification, setAutoClassification] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);

  const voice = useVoiceControl();
  const siri = useSiriIntegration();
  const sound = useSound();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'zh-CN', name: '简体中文' },
    { code: 'es', name: 'Español' },
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'pt', name: 'Português' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
  ];

  const getCurrentLanguageName = () => {
    const currentLang = languages.find(lang => lang.code === language);
    return currentLang ? currentLang.name : 'English';
  };

  const clearAllStorage = async () => {
    try {
      // Clear all AsyncStorage data to fix JSON parse errors
      await AsyncStorage.clear();
      console.log('All storage cleared successfully');
      
      // Show success message
      Alert.alert(
        t("success"),
        "All app data has been cleared. Please restart the app.",
        [{ text: t("ok") }]
      );
    } catch (error) {
      console.error('Error clearing storage:', error);
      Alert.alert(
        t("error"),
        "Failed to clear storage. Please try again.",
        [{ text: t("ok") }]
      );
    }
  };

  type SettingItem = {
    icon: any;
    label: string;
    action: string;
    hasSwitch?: boolean;
    value?: boolean | string;
  };

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: t("account_settings"),
      items: [
        { icon: LogIn, label: t("login"), action: "login" },
        { icon: User, label: t("account_info"), action: "account_info" },
        { icon: CreditCard, label: t("subscription_plan"), action: "subscription" },
        { icon: Gift, label: t("enter_referral_code"), action: "referral_code", value: userData.hasUsedReferralCode ? t("code_used") : undefined },
        { icon: Smartphone, label: t("device_management"), action: "devices" },
      ],
    },
    {
      title: t("appearance_language"),
      items: [
        { icon: Moon, label: t("dark_mode"), action: "toggle_dark", hasSwitch: true, value: darkMode },
        { icon: Globe, label: t("language"), action: "language", value: getCurrentLanguageName() },
      ],
    },
    {
      title: t("data_management"),
      items: [
        { icon: Cloud, label: t("auto_backup"), action: "toggle_backup", hasSwitch: true, value: autoBackup },
        { icon: Download, label: t("export_backup"), action: "export" },
        { icon: Trash2, label: t("clear_cache"), action: "clear_cache" },
        { icon: RotateCcw, label: t("reset_data"), action: "reset" },
      ],
    },
    {
      title: t("smart_classification"),
      items: [
        { icon: Brain, label: t("enable_auto_classification"), action: "toggle_classification", hasSwitch: true, value: autoClassification },
        { icon: SettingsIcon, label: t("manage_classification_rules"), action: "rules" },
        { icon: SettingsIcon, label: t("advanced_classification_settings"), action: "advanced" },
      ],
    },
    {
      title: t("sync_settings"),
      items: [
        { icon: Cloud, label: t("sync_service"), action: "sync_service", value: "Google Drive" },
        { icon: RefreshCw, label: t("sync_frequency"), action: "sync_frequency", value: t("daily") },
      ],
    },
    {
      title: t("voice_control"),
      items: [],
    },
    {
      title: t("shortcuts"),
      items: [
        { icon: Keyboard, label: t("quick_toggle"), action: "quick_toggle" },
        { icon: Keyboard, label: t("custom_shortcuts"), action: "shortcuts" },
      ],
    },
    {
      title: t("notification_settings"),
      items: [
        { icon: Bell, label: t("enable_notifications"), action: "toggle_notifications", hasSwitch: true, value: notifications },
        { icon: Bell, label: t("notification_types"), action: "notification_types" },
        { icon: Bell, label: t("push_frequency"), action: "push_frequency" },
      ],
    },
    {
      title: t("sound_settings"),
      items: [
        { icon: Bell, label: t("sound_effects"), action: "toggle_sound_effects", hasSwitch: true, value: sound.enabled },
      ],
    },
    {
      title: t("privacy_security"),
      items: [
        { icon: Lock, label: t("biometric_lock"), action: "toggle_biometric", hasSwitch: true, value: biometricLock },
        { icon: Shield, label: t("data_encryption"), action: "encryption" },
        { icon: Shield, label: t("privacy_settings"), action: "privacy" },
      ],
    },
    {
      title: t("help_support"),
      items: [
        { icon: HelpCircle, label: t("faq"), action: "faq" },
        { icon: MessageSquare, label: t("contact_us"), action: "contact" },
        { icon: FileText, label: t("tutorial"), action: "tutorial" },
        { icon: AlertCircle, label: t("report_problem"), action: "report" },
        { icon: MessageSquare, label: t("user_feedback"), action: "feedback" },
      ],
    },
    {
      title: t("about"),
      items: [
        { icon: Info, label: t("version_info"), action: "version", value: "v1.0.0" },
        { icon: Download, label: t("check_updates"), action: "updates" },
      ],
    },
  ];

  const handleAction = (action: string, currentValue?: any) => {
    switch (action) {
      case "toggle_dark":
        setDarkMode(!darkMode);
        break;
      case "toggle_backup":
        setAutoBackup(!autoBackup);
        break;
      case "toggle_classification":
        setAutoClassification(!autoClassification);
        break;
      case "toggle_notifications":
        setNotifications(!notifications);
        void sound.play('click');
        break;
      case "toggle_sound_effects":
        sound.toggle();
        void sound.play('success');
        break;
      case "toggle_biometric":
        setBiometricLock(!biometricLock);
        break;
      case "language":
        setShowLanguageModal(true);
        break;
      case "referral_code":
        if (userData.hasUsedReferralCode) {
          Alert.alert(
            t("referral_code_used_title"),
            t("referral_code_used_message"),
            [{ text: t("ok") }]
          );
        } else {
          setShowReferralModal(true);
        }
        break;
      case "rules":
        setShowCategoryManagement(true);
        break;
      case "clear_cache":
        Alert.alert(
          t("clear_cache"),
          t("clear_cache_confirm"),
          [
            { text: t("cancel"), style: "cancel" },
            { text: t("ok"), onPress: clearAllStorage },
          ]
        );
        break;
      case "reset":
        Alert.alert(
          t("reset_data"),
          t("reset_data_confirm"),
          [
            { text: t("cancel"), style: "cancel" },
            { text: t("ok"), style: "destructive", onPress: clearAllStorage },
          ]
        );
        break;
      case "logout":
        Alert.alert(
          t("logout"),
          t("logout_confirm"),
          [
            { text: t("cancel"), style: "cancel" },
            { text: t("ok"), onPress: () => console.log("Logged out") },
          ]
        );
        break;
      case "version":
        // Hidden admin panel trigger - tap version 5 times
        const newCount = adminTapCount + 1;
        setAdminTapCount(newCount);
        
        if (newCount >= 5) {
          setShowAdminPanel(true);
          setAdminTapCount(0);
        }
        
        // Reset counter after 2 seconds
        setTimeout(() => setAdminTapCount(0), 2000);
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Referral Code Modal */}
      <ReferralCodeModal
        visible={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        isFirstTime={false}
      />

      {/* Admin Panel (Hidden) */}
      <AdminPanel
        visible={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      {/* Category Management Modal */}
      <CategoryManagement
        visible={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
      />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <ChevronRight size={24} color={Colors.primary.textSecondary} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    language === lang.code && styles.languageItemActive
                  ]}
                  onPress={() => {
                    setLanguage(lang.code as Language);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={[
                    styles.languageText,
                    language === lang.code && styles.languageTextActive
                  ]}>
                    {lang.name}
                  </Text>
                  {language === lang.code && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.title === t('voice_control') ? (
              <View style={styles.voiceCard} testID="voiceControlCard">
                <View style={styles.voiceRow}>
                  <View style={styles.settingContent}>
                    <Mic size={20} color={Colors.primary.accent} />
                    <Text style={styles.settingText}>{t('in_app_voice_control')}</Text>
                  </View>
                  <Switch
                    testID="toggleAlwaysListening"
                    value={voice?.alwaysListening ?? false}
                    onValueChange={() => { void sound.play('click'); voice?.toggleAlwaysListening?.(); }}
                    trackColor={{ false: Colors.primary.cardBorder, true: Colors.primary.accent }}
                    thumbColor={(voice?.alwaysListening ?? false) ? Colors.primary.text : Colors.primary.textSecondary}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.voiceRow}>
                  <View style={styles.settingContent}>
                    <Apple size={20} color={Colors.primary.accent} />
                    <Text style={styles.settingText}>{t('siri_voice_assistant')}</Text>
                  </View>
                  <Switch
                    testID="toggleSiri"
                    value={siri?.isSiriEnabled ?? false}
                    onValueChange={async (val) => {
                      void sound.play('click');
                      if (Platform.OS === 'ios') {
                        if (val && typeof siri?.enableSiri === 'function') {
                          await siri.enableSiri();
                        } else if (!val) {
                          Alert.alert(t('info'), t('siri_disable_hint'));
                        }
                      } else {
                        Alert.alert(t('info'), t('siri_ios_only'));
                      }
                    }}
                    trackColor={{ false: Colors.primary.cardBorder, true: Colors.primary.accent }}
                    thumbColor={(siri?.isSiriEnabled ?? false) ? Colors.primary.text : Colors.primary.textSecondary}
                  />
                </View>
              </View>
            ) : (
              section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <AnimatedSettingItem
                    key={itemIndex}
                    onPress={() => {
                      if (!item.hasSwitch) {
                        void sound.play('click');
                        handleAction(item.action, item.value);
                      }
                    }}
                    testID={`settingItem-${item.action}`}
                  >
                    <View style={styles.settingContent}>
                      <Icon size={20} color={Colors.primary.accent} />
                      <Text style={styles.settingText}>{item.label}</Text>
                    </View>
                    <View style={styles.settingRight}>
                      {item.hasSwitch ? (
                        <Switch
                          value={item.value as boolean}
                          onValueChange={() => { void sound.play('click'); handleAction(item.action); }}
                          trackColor={{ false: Colors.primary.cardBorder, true: Colors.primary.accent }}
                          thumbColor={item.value ? Colors.primary.text : Colors.primary.textSecondary}
                        />
                      ) : item.value ? (
                        <Text style={styles.settingValue}>{item.value}</Text>
                      ) : (
                        <ChevronRight size={20} color={Colors.primary.textSecondary} />
                      )}
                    </View>
                  </AnimatedSettingItem>
                );
              })
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  voiceCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    padding: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.primary.cardBorder,
    marginVertical: 10,
    opacity: 0.8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.secondary.bg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: Colors.primary.text,
    flex: 1,
    fontWeight: '500' as const,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.cardBorder,
  },
  languageItemActive: {
    backgroundColor: 'rgba(108, 212, 255, 0.1)',
  },
  languageText: {
    fontSize: 16,
    color: Colors.primary.text,
  },
  languageTextActive: {
    color: Colors.primary.accent,
    fontWeight: '600' as const,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  closeIcon: {
    transform: [{ rotate: '90deg' }],
  },
});