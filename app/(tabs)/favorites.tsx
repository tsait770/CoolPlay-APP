import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useBookmarks } from '@/providers/BookmarkProvider';
import { useCategories } from '@/providers/CategoryProvider';
import CategoryManagement from '@/components/CategoryManagement';
import { Folder, ChevronRight, Trash2, FolderPlus, Edit2, Heart, BookOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { bookmarks, addFolder, deleteFolder, editFolder, deleteAllFolders, getFoldersByCategory, getBookmarksByFolder } = useBookmarks();
  const { categories, getVisibleCategories } = useCategories();
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [addFolderCategory, setAddFolderCategory] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  const handleFolderPress = (folderId: string) => {
    setSelectedFolder(folderId);
    console.log(`Selected folder: ${folderId}`);
  };
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  const visibleCategories = useMemo(() => getVisibleCategories(), [getVisibleCategories]);

  // Calculate folder counts for each category
  const categoryFolderData = useMemo(() => {
    return visibleCategories.map(category => {
      const categoryFolders = getFoldersByCategory(category.id);
      const bookmarkCount = categoryFolders.reduce((total: number, folder: any) => {
        return total + getBookmarksByFolder(folder.id).length;
      }, 0);
      
      return {
        ...category,
        folders: categoryFolders,
        folderCount: categoryFolders.length,
        bookmarkCount,
      };
    });
  }, [visibleCategories, getFoldersByCategory, getBookmarksByFolder]);



  const handleAddFolder = () => {
    if (!newFolderName.trim() || !addFolderCategory) {
      Alert.alert(t('error'), t('folder_name_required'));
      return;
    }

    const category = categories.find(c => c.id === addFolderCategory);
    if (!category) return;

    const result = addFolder(addFolderCategory, newFolderName);
    if (result) {
      setNewFolderName('');
      setShowAddFolderModal(false);
      setAddFolderCategory(null);
    }
  };

  const handleEditFolder = () => {
    if (!editingFolderName.trim() || !editingFolderId) {
      Alert.alert(t('error'), t('folder_name_required'));
      return;
    }

    editFolder(editingFolderId, editingFolderName);
    setEditingFolderName('');
    setEditingFolderId(null);
    setShowEditFolderModal(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    Alert.alert(
      t('confirm_delete'),
      t('confirm_delete_folder_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => deleteFolder(folderId)
        }
      ]
    );
  };

  const handleDeleteAllFolders = () => {
    Alert.alert(
      t('confirm_delete_all'),
      t('confirm_delete_all_folders_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete_all'), 
          style: 'destructive',
          onPress: () => deleteAllFolders()
        }
      ]
    );
  };

  const openEditModal = (folderId: string, folderName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(folderName);
    setShowEditFolderModal(true);
  };

  const handleExportFolder = async (folderId: string, folderName: string, format: 'html' | 'json') => {
    console.log(`Export folder ${folderId} as ${format}`);
    Alert.alert(t('info'), `Export ${folderName} as ${format} - Feature coming soon!`);
  };

  const showFolderOptions = (folder: any) => {
    Alert.alert(
      t('folder_options'),
      '',
      [
        { text: t('edit'), onPress: () => openEditModal(folder.id, folder.name) },
        { text: 'Export HTML', onPress: () => handleExportFolder(folder.id, folder.name, 'html') },
        { text: 'Export JSON', onPress: () => handleExportFolder(folder.id, folder.name, 'json') },
        { text: t('delete'), style: 'destructive', onPress: () => handleDeleteFolder(folder.id) },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bookmark Folders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>{t('bookmark_folders')}</Text>
            <TouchableOpacity 
              style={styles.deleteAllButton}
              onPress={handleDeleteAllFolders}
            >
              <Trash2 size={16} color={Colors.danger} />
              <Text style={styles.deleteAllText}>{t('delete_all')}</Text>
            </TouchableOpacity>
          </View>
          
          {categoryFolderData.map(category => (
            <View key={category.id} style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <BookOpen size={18} color={Colors.primary.accent} />
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <Text style={styles.categoryBadge}>{category.folderCount}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setAddFolderCategory(category.id);
                    setShowAddFolderModal(true);
                  }}
                >
                  <FolderPlus size={18} color={Colors.primary.accent} />
                </TouchableOpacity>
              </View>
              
              {category.folders.length > 0 ? (
                category.folders.map((folder: any) => {
                  const bookmarkCount = getBookmarksByFolder(folder.id).length;
                  return (
                    <TouchableOpacity
                      key={folder.id}
                      style={styles.folderItem}
                      onPress={() => handleFolderPress(folder.id)}
                      onLongPress={() => showFolderOptions(folder)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.folderContent}>
                        <Folder size={20} color={Colors.primary.accent} />
                        <Text style={styles.folderName}>{folder.name}</Text>
                      </View>
                      <View style={styles.folderRight}>
                        <Text style={styles.folderCount}>{bookmarkCount}</Text>
                        <ChevronRight size={20} color={Colors.primary.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('no_folders_yet')}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Favorite Bookmarks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('favorite_bookmarks')}</Text>
          {bookmarks.filter(b => b.favorite).length > 0 ? (
            bookmarks.filter(b => b.favorite).map(bookmark => (
              <TouchableOpacity key={bookmark.id} style={styles.bookmarkItem}>
                <View style={styles.bookmarkContent}>
                  <Heart size={20} color={Colors.danger} fill={Colors.danger} />
                  <View style={styles.bookmarkInfo}>
                    <Text style={styles.bookmarkTitle}>{bookmark.title}</Text>
                    <Text style={styles.bookmarkUrl} numberOfLines={1}>{bookmark.url}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.primary.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('no_favorites')}</Text>
            </View>
          )}
        </View>

        {/* Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('management')}</Text>
          <TouchableOpacity
            style={styles.managementItem}
            onPress={() => setShowCategoryManagement(true)}
          >
            <View style={styles.managementContent}>
              <Edit2 size={20} color={Colors.primary.accent} />
              <Text style={styles.managementText}>{t('manage_categories')}</Text>
            </View>
            <ChevronRight size={20} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Folder Modal */}
      <Modal
        visible={showAddFolderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddFolderModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
            <Text style={styles.modalTitle}>{t('add_new_folder')}</Text>
            
            <TextInput
              style={styles.input}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder={t('folder_name')}
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleAddFolder}
              >
                <Text style={styles.modalButtonText}>{t('add')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowAddFolderModal(false);
                  setNewFolderName('');
                  setAddFolderCategory(null);
                }}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal
        visible={showEditFolderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditFolderModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
            <Text style={styles.modalTitle}>{t('edit_folder')}</Text>
            
            <TextInput
              style={styles.input}
              value={editingFolderName}
              onChangeText={setEditingFolderName}
              placeholder={t('folder_name')}
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleEditFolder}
              >
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowEditFolderModal(false);
                  setEditingFolderName('');
                  setEditingFolderId(null);
                }}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Management Modal */}
      <CategoryManagement
        visible={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
      />
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
    fontWeight: '600' as const,
    color: Colors.primary.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 6,
  },
  deleteAllText: {
    color: Colors.danger,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.secondary.bg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.primary.accent,
    color: Colors.primary.bg,
    fontSize: 12,
    fontWeight: '600' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center' as const,
  },
  addButton: {
    padding: 4,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary.bg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  folderName: {
    fontSize: 15,
    color: Colors.primary.text,
    flex: 1,
  },
  folderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderCount: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    backgroundColor: 'rgba(108, 212, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    textAlign: 'center' as const,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary.bg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  bookmarkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    color: Colors.primary.text,
    fontSize: 15,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  bookmarkUrl: {
    color: Colors.primary.textSecondary,
    fontSize: 13,
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary.bg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  managementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  managementText: {
    fontSize: 15,
    color: Colors.primary.text,
    flex: 1,
  },
  emptyContainer: {
    backgroundColor: Colors.secondary.bg,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
    fontStyle: 'italic' as const,
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
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
  },
  modalContentTablet: {
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  input: {
    backgroundColor: Colors.primary.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.primary.text,
    borderWidth: 1,
    borderColor: Colors.primary.cardBorder,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  modalButtonText: {
    color: Colors.primary.bg,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  modalCancelButton: {
    backgroundColor: Colors.primary.cardBorder,
  },
  modalCancelText: {
    color: Colors.primary.text,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});