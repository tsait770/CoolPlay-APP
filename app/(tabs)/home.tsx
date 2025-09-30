import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  FlatList,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import {
  Bookmark,
  Search,
  Globe,
  Folder,
  Star,
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  MoreVertical,
  Edit2,
  FileInput,
  FileEdit,
  Sparkles,
  Trash,
  Check,
  X,
  ChevronRight,
  Clock,
  TrendingUp,
  Home as HomeIcon,
  Play,
  FolderPlus,
  Move,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { useBookmarks } from "@/providers/BookmarkProvider";
import { useReferral } from "@/providers/ReferralProvider";
import { useCategories } from "@/providers/CategoryProvider";
import ReferralCodeModal from "@/components/ReferralCodeModal";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { useStorage } from "@/providers/StorageProvider";


const { width: screenWidth } = Dimensions.get("window");

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userData } = useReferral();
  const { categories } = useCategories();
  const { getItem, setItem } = useStorage();
  const {
    bookmarks,
    folders,
    currentFolder,
    searchQuery,
    isLoading,
    setCurrentFolder,
    setSearchQuery,
    addBookmark,
    deleteBookmark,
    toggleFavorite,
    addFolder,
    deleteFolder,
    editFolder,
    moveBookmarkToFolder,
    smartCategorize,
    restoreOriginalBookmarks,
    cleanupBookmarks,
    importBookmarks,
    exportBookmarks,
    getFilteredBookmarks,
    getStats,
    originalBookmarks,
    exportFolderBookmarks,
  } = useBookmarks();

  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [hasCheckedReferralModal, setHasCheckedReferralModal] = useState(false);
  const [hasShownFirstTimeModal, setHasShownFirstTimeModal] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const stats = getStats();
  const filteredBookmarks = getFilteredBookmarks();

  useEffect(() => {
    // Splash screen animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if we should show referral modal on first login (only once per app install)
    const checkReferralModal = async () => {
      if (!hasCheckedReferralModal) {
        setHasCheckedReferralModal(true);
        
        // Check if we've already shown the first-time modal
        try {
          const hasShown = await getItem('@coolplay_first_time_modal_shown');
          if (!hasShown && !userData.hasUsedReferralCode) {
            const timer = setTimeout(() => {
              setShowReferralModal(true);
              setHasShownFirstTimeModal(true);
              // Mark as shown so it won't appear again
              setItem('@coolplay_first_time_modal_shown', 'true');
            }, 2000); // Show after 2 seconds
            return () => clearTimeout(timer);
          }
        } catch (error) {
          console.error('Error checking first-time modal status:', error);
        }
      }
    };
    
    checkReferralModal();
  }, [userData.hasUsedReferralCode, hasCheckedReferralModal]);

  const handleImportBookmarks = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/html", "application/json"],
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const content = await FileSystem.readAsStringAsync(file.uri);
        
        let newBookmarks = [];
        if (file.mimeType === "application/json") {
          newBookmarks = JSON.parse(content);
        } else {
          // Parse HTML bookmarks
          const regex = /<A[^>]*HREF="([^"]*)"[^>]*>([^<]*)<\/A>/gi;
          let match;
          while ((match = regex.exec(content)) !== null) {
            newBookmarks.push({
              id: Date.now().toString() + Math.random(),
              title: match[2] || "Untitled",
              url: match[1],
              favorite: false,
              addedOn: new Date().toISOString(),
            });
          }
        }

        if (newBookmarks.length > 0) {
          importBookmarks(newBookmarks);
          Alert.alert(t("success"), t("import_success").replace("{count}", newBookmarks.length.toString()));
        } else {
          Alert.alert(t("error"), t("import_failed"));
        }
      }
    } catch (error) {
      Alert.alert(t("error"), t("import_failed"));
    }
  };

  const handleExportBookmarks = async () => {
    try {
      const html = exportBookmarks("html");
      const fileUri = FileSystem.documentDirectory + "bookmarks.html";
      await FileSystem.writeAsStringAsync(fileUri, html);
      
      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(t("success"), t("export_bookmarks"));
      }
    } catch (error) {
      Alert.alert(t("error"), "Failed to export bookmarks");
    }
  };

  const handleSmartCategorize = () => {
    Alert.alert(
      t("smart_category"),
      t("feature_smart_category_desc"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("confirm"),
          onPress: () => {
            smartCategorize();
            Alert.alert(t("success"), t("smart_category_success"));
          },
        },
      ]
    );
  };

  const handleCleanupBookmarks = () => {
    const duplicatesCount = stats.duplicates;
    if (duplicatesCount === 0) {
      Alert.alert(t("info"), t("no_duplicates"));
      return;
    }

    Alert.alert(
      t("cleanup_bookmarks"),
      t("duplicates_found").replace("{count}", duplicatesCount.toString()),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("cleanup_now"),
          onPress: () => {
            const removed = cleanupBookmarks();
            Alert.alert(t("success"), t("cleanup_success").replace("{count}", removed.toString()));
          },
        },
      ]
    );
  };

  const handleAddFolder = () => {
    if (newFolderName.trim().length < 2 || newFolderName.trim().length > 20) {
      Alert.alert(t("error"), t("folder_name_required"));
      return;
    }

    const exists = folders.some(
      (f) => f.name.toLowerCase() === newFolderName.trim().toLowerCase()
    );
    if (exists) {
      Alert.alert(t("error"), t("folder_exists"));
      return;
    }

    addFolder('general', newFolderName.trim());
    setNewFolderName("");
    setShowAddFolderModal(false);
  };

  const handleEditFolder = () => {
    if (!editingFolder) return;

    if (newFolderName.trim().length < 2 || newFolderName.trim().length > 20) {
      Alert.alert(t("error"), t("folder_name_required"));
      return;
    }

    editFolder(editingFolder.id, newFolderName.trim());
    setNewFolderName("");
    setEditingFolder(null);
    setShowEditFolderModal(false);
  };

  const handleDeleteFolder = (folder: any) => {
    Alert.alert(
      t("delete_folder"),
      `${t("delete_folder")} "${folder.name}"?`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => deleteFolder(folder.id),
        },
      ]
    );
  };

  const handleCopyUrl = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert(t("success"), t("copy"));
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url);
  };

  const renderBookmarkCard = ({ item }: { item: any }) => {
    const isSelected = selectedBookmarks.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.bookmarkCard, isSelected && styles.bookmarkCardSelected]}
        onPress={() => {
          if (isSelectionMode) {
            const newSelection = new Set(selectedBookmarks);
            if (isSelected) {
              newSelection.delete(item.id);
            } else {
              newSelection.add(item.id);
            }
            setSelectedBookmarks(newSelection);
          } else {
            handleOpenUrl(item.url);
          }
        }}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedBookmarks(new Set([item.id]));
          }
        }}
      >
        <View style={styles.bookmarkContent}>
          <View style={styles.bookmarkIcon}>
            <Globe size={24} color={Colors.primary.accent} />
          </View>
          <View style={styles.bookmarkInfo}>
            <Text style={styles.bookmarkTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.bookmarkUrl} numberOfLines={1}>
              {item.url}
            </Text>
          </View>
        </View>
        <View style={styles.bookmarkActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCopyUrl(item.url)}
          >
            <Copy size={16} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Star
              size={16}
              color={item.favorite ? Colors.primary.accent : Colors.primary.textSecondary}
              fill={item.favorite ? Colors.primary.accent : "transparent"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteBookmark(item.id)}
          >
            <Trash2 size={16} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFolder = ({ item }: { item: any }) => {
    const bookmarkCount = item.id === "all" 
      ? bookmarks.length 
      : item.id === "favorites"
      ? bookmarks.filter(b => b.favorite).length
      : item.bookmarks.length;

    // Check if this folder should be visible based on category settings
    let categoryVisible = true;
    const targetCategoryId = item.builtIn ? item.id : (item.categoryId ?? "");
    if (targetCategoryId && targetCategoryId !== "all" && targetCategoryId !== "favorites") {
      const cat = categories.find(c => c.id === targetCategoryId);
      if (cat && cat.isVisible === false) {
        categoryVisible = false;
      }
    }

    if (!categoryVisible) {
      return null;
    }

    return (
      <TouchableOpacity
        style={[
          styles.folderItem,
          currentFolder === item.id && styles.folderItemActive,
        ]}
        onPress={() => setCurrentFolder(item.id)}
        onLongPress={async () => {
          try {
            const html = exportFolderBookmarks(item.id, 'html');
            const json = exportFolderBookmarks(item.id, 'json');
            const dir = FileSystem.documentDirectory ?? '';
            const htmlUri = dir + `bookmarks_${item.id}.html`;
            const jsonUri = dir + `bookmarks_${item.id}.json`;
            await FileSystem.writeAsStringAsync(htmlUri, html);
            await FileSystem.writeAsStringAsync(jsonUri, json);
            if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
              await Sharing.shareAsync(htmlUri);
            } else {
              Alert.alert(t('success'), t('export_bookmarks'));
            }
          } catch (e) {
            Alert.alert(t('error'), t('import_failed'));
          }
        }}
        delayLongPress={300}
        testID={`folderItem-${item.id}`}
      >
        <View style={styles.folderContent}>
          <Folder size={20} color={
            currentFolder === item.id ? Colors.primary.accent : Colors.primary.textSecondary
          } />
          <Text style={[
            styles.folderName,
            currentFolder === item.id && styles.folderNameActive,
          ]}>
            {item.builtIn ? t(item.name + "_folder") : item.name}
          </Text>
          <Text style={styles.folderCount}>{bookmarkCount}</Text>
        </View>
        {!item.builtIn && (
          <TouchableOpacity
            style={styles.folderMenu}
            onPress={() => {
              setEditingFolder(item);
              setNewFolderName(item.name);
              setShowEditFolderModal(true);
            }}
          >
            <MoreVertical size={16} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Referral Code Modal */}
      <ReferralCodeModal
        visible={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        isFirstTime={true}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.accent}
          />
        }
      >
        {/* Welcome Section with Animation */}
        <Animated.View
          style={[
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <HomeIcon size={40} color={Colors.primary.accent} />
          <Text style={styles.welcomeTitle}>{t("app_name")}</Text>
          <Text style={styles.welcomeSubtitle}>{t("subtitle")}</Text>
        </Animated.View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.primary.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("search_placeholder")}
            placeholderTextColor={Colors.primary.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Bookmark size={24} color={Colors.primary.accent} />
            <Text style={styles.statNumber}>{stats.totalBookmarks}</Text>
            <Text style={styles.statLabel}>{t("total_bookmarks")}</Text>
          </View>
          <View style={styles.statCard}>
            <Folder size={24} color={Colors.primary.accent} />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>{t("total_folders")}</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={24} color={Colors.primary.accent} />
            <Text style={styles.statNumber}>{stats.totalFavorites}</Text>
            <Text style={styles.statLabel}>{t("favorites")}</Text>
          </View>
          <View style={styles.statCard}>
            <Sparkles size={24} color={Colors.primary.accent} />
            <Text style={styles.statNumber}>{userData.voiceCredits}</Text>
            <Text style={styles.statLabel}>{t("voice_commands")}</Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.featureContainer}>
          <TouchableOpacity style={styles.featureCard} onPress={handleImportBookmarks}>
            <FileInput size={24} color={Colors.primary.accent} />
            <Text style={styles.featureTitle}>{t("feature_import")}</Text>
            <Text style={styles.featureDesc}>{t("feature_import_desc")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={handleSmartCategorize}>
            <Sparkles size={24} color={Colors.primary.accent} />
            <Text style={styles.featureTitle}>{t("feature_smart_category")}</Text>
            <Text style={styles.featureDesc}>{t("feature_smart_category_desc")}</Text>
            {originalBookmarks.length > 0 && (
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={() => {
                  restoreOriginalBookmarks();
                  Alert.alert(t("success"), t("restore_success"));
                }}
              >
                <RefreshCw size={16} color={Colors.primary.accent} />
                <Text style={styles.restoreText}>{t("restore_original")}</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={handleCleanupBookmarks}>
            <Trash size={24} color={Colors.primary.accent} />
            <Text style={styles.featureTitle}>{t("feature_cleanup")}</Text>
            <Text style={styles.featureDesc}>{t("feature_cleanup_desc")}</Text>
            {stats.duplicates > 0 && (
              <View style={styles.cleanupSuggestion}>
                <AlertCircle size={16} color={Colors.primary.accent} />
                <Text style={styles.cleanupText}>
                  {t("duplicates_found").replace("{count}", stats.duplicates.toString())}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={handleExportBookmarks}>
            <FileEdit size={24} color={Colors.primary.accent} />
            <Text style={styles.featureTitle}>{t("feature_export")}</Text>
            <Text style={styles.featureDesc}>{t("feature_export_desc")}</Text>
          </TouchableOpacity>
        </View>

        {/* Folders Sidebar */}
        <View style={styles.foldersSection}>
          <Text style={styles.sectionTitle}>{t("total_folders")}</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={folders}
            renderItem={renderFolder}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addFolderButton}
                onPress={() => setShowAddFolderModal(true)}
              >
                <FolderPlus size={20} color={Colors.primary.accent} />
                <Text style={styles.addFolderText}>{t("add_folder")}</Text>
              </TouchableOpacity>
            }
          />
        </View>

        {/* Bookmarks List */}
        <View style={styles.bookmarksSection}>
          <View style={styles.bookmarksHeader}>
            <Text style={styles.sectionTitle}>
              {currentFolder === "all"
                ? t("all_bookmarks")
                : currentFolder === "favorites"
                ? t("favorites")
                : folders.find((f) => f.id === currentFolder)?.name || t("all_bookmarks")}
            </Text>
            {isSelectionMode && (
              <TouchableOpacity
                style={styles.cancelSelectionButton}
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedBookmarks(new Set());
                }}
              >
                <X size={20} color={Colors.primary.accent} />
                <Text style={styles.cancelSelectionText}>{t("cancel")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredBookmarks.length === 0 ? (
            <View style={styles.emptyState}>
              <Bookmark size={48} color={Colors.primary.textSecondary} />
              <Text style={styles.emptyTitle}>{t("no_bookmarks")}</Text>
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportBookmarks}
              >
                <FileInput size={20} color={Colors.primary.accent} />
                <Text style={styles.importButtonText}>{t("import_bookmarks")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredBookmarks}
              renderItem={renderBookmarkCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Folder Modal */}
      <Modal
        visible={showAddFolderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddFolderModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("add_folder")}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t("folder_name_placeholder")}
              placeholderTextColor={Colors.primary.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              maxLength={20}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setNewFolderName("");
                  setShowAddFolderModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddFolder}
              >
                <Text style={styles.modalButtonText}>{t("confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal
        visible={showEditFolderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditFolderModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("edit_folder")}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t("folder_name_placeholder")}
              placeholderTextColor={Colors.primary.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              maxLength={20}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={() => {
                  if (editingFolder) {
                    handleDeleteFolder(editingFolder);
                    setShowEditFolderModal(false);
                    setEditingFolder(null);
                    setNewFolderName("");
                  }
                }}
              >
                <Text style={styles.modalButtonText}>{t("delete")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setNewFolderName("");
                  setEditingFolder(null);
                  setShowEditFolderModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleEditFolder}
              >
                <Text style={styles.modalButtonText}>{t("confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary.bg,
  },
  welcomeSection: {
    alignItems: "center",
    padding: 30,
    backgroundColor: Colors.secondary.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.cardBorder,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginTop: 10,
    fontFamily: "Montserrat",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginTop: 5,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: Colors.primary.text,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary.accent,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.primary.textSecondary,
    marginTop: 4,
  },
  featureContainer: {
    padding: 20,
  },
  featureCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginTop: 10,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginTop: 5,
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    backgroundColor: Colors.primary.cardBg,
    borderRadius: 8,
  },
  restoreText: {
    color: Colors.primary.accent,
    marginLeft: 5,
    fontSize: 14,
  },
  cleanupSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    backgroundColor: Colors.primary.cardBg,
    borderRadius: 8,
  },
  cleanupText: {
    color: Colors.primary.accent,
    marginLeft: 5,
    fontSize: 14,
  },
  foldersSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 15,
  },
  folderItem: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    minWidth: 120,
  },
  folderItemActive: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.primary.cardBg,
  },
  folderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  folderName: {
    color: Colors.primary.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  folderNameActive: {
    color: Colors.primary.accent,
  },
  folderCount: {
    color: Colors.primary.textSecondary,
    fontSize: 12,
    marginLeft: 5,
  },
  folderMenu: {
    position: "absolute",
    top: 5,
    right: 5,
    padding: 5,
  },
  addFolderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    borderStyle: "dashed",
  },
  addFolderText: {
    color: Colors.primary.accent,
    fontSize: 14,
    marginLeft: 8,
  },
  bookmarksSection: {
    padding: 20,
  },
  bookmarksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cancelSelectionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 8,
  },
  cancelSelectionText: {
    color: Colors.primary.accent,
    marginLeft: 5,
    fontSize: 14,
  },
  bookmarkCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  bookmarkCardSelected: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.primary.cardBg,
  },
  bookmarkContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookmarkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  bookmarkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.primary.text,
  },
  bookmarkUrl: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 2,
  },
  bookmarkActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    marginRight: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    marginTop: 10,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  importButtonText: {
    color: Colors.primary.text,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 20,
    width: screenWidth - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: Colors.primary.cardBg,
    borderRadius: 8,
    padding: 12,
    color: Colors.primary.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: Colors.primary.cardBg,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary.accent,
  },
  modalButtonDelete: {
    backgroundColor: "#ef4444",
  },
  modalButtonText: {
    color: Colors.primary.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
});