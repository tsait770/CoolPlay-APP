import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { Edit2, Eye, EyeOff, X, Plus, RotateCcw } from 'lucide-react-native';
import { useCategories } from '@/providers/CategoryProvider';
import Colors from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';

interface CategoryManagementProps {
  visible: boolean;
  onClose: () => void;
}

export default function CategoryManagement({ visible, onClose }: CategoryManagementProps) {
  const { t } = useTranslation();
  const {
    categories,
    updateCategory,
    toggleCategoryVisibility,
    addCategory,
    resetToDefaults,
  } = useCategories();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editKeywords, setEditKeywords] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryKeywords, setNewCategoryKeywords] = useState('');



  const handleEditCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
      setEditingCategory(categoryId);
      setEditKeywords(category.keywords?.join(', ') || '');
    }
  };

  const handleSaveEdit = () => {
    if (editingCategory) {
      const keywords = editKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      updateCategory(editingCategory, {
        keywords,
      });
      setEditingCategory(null);
      setEditKeywords('');
      console.log('Keywords updated successfully');
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const keywords = newCategoryKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    addCategory(newCategoryName.trim(), 'folder', keywords);
    
    setNewCategoryName('');
    setNewCategoryKeywords('');
    setShowAddForm(false);
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
  };





  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('category_rules')}</Text>
        </View>



        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Categories List */}
          <View style={styles.section}>


            <View style={styles.categoriesList}>
              {categories.map((category) => {
                const isEditing = editingCategory === category.id;
                const currentKeywords = isEditing ? editKeywords : (category.keywords?.join(', ') || '');
                
                return (
                  <View key={category.id} style={styles.categoryItem}>
                    <View style={styles.categoryRow}>
                      {/* Left side - Category name */}
                      <View style={styles.categoryNameSection}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <View style={styles.categoryActions}>
                          <TouchableOpacity
                            style={styles.visibilityButton}
                            onPress={() => toggleCategoryVisibility(category.id)}
                          >
                            {category.isVisible ? (
                              <Eye size={18} color={Colors.primary.accent} />
                            ) : (
                              <EyeOff size={18} color="#666" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Right side - Keywords content */}
                      <View style={styles.keywordsSection}>
                        <View style={styles.keywordsHeader}>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => {
                              if (isEditing) {
                                handleSaveEdit();
                              } else {
                                handleEditCategory(category.id);
                              }
                            }}
                          >
                            <Edit2 size={18} color={Colors.primary.accent} />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.keywordsContent}>
                          {isEditing ? (
                            <TextInput
                              style={styles.keywordsInput}
                              value={editKeywords}
                              onChangeText={setEditKeywords}
                              placeholder={t('keywords_comma_separated')}
                              placeholderTextColor="#666"
                              multiline
                              numberOfLines={6}
                            />
                          ) : (
                            <Text style={styles.keywordsText}>
                              {currentKeywords}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Add Category Form */}
          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.addFormTitle}>{t('add_category')}</Text>
              <TextInput
                style={styles.addInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder={t('category_name')}
                placeholderTextColor="#666"
              />
              <TextInput
                style={[styles.addInput, styles.addKeywordsInput]}
                value={newCategoryKeywords}
                onChangeText={setNewCategoryKeywords}
                placeholder={t('keywords_comma_separated')}
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
              <View style={styles.addFormActions}>
                <TouchableOpacity
                  style={styles.addFormButton}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.addFormButtonText}>{t('add')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addFormButton, styles.addFormCancelButton]}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewCategoryName('');
                    setNewCategoryKeywords('');
                  }}
                >
                  <Text style={styles.addFormButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={20} color={Colors.primary.accent} />
              <Text style={styles.actionButtonText}>{t('add_category')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.resetButton]}
              onPress={handleResetToDefaults}
            >
              <RotateCcw size={20} color="#ff6b6b" />
              <Text style={[styles.actionButtonText, styles.resetButtonText]}>{t('reset_to_defaults')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.closeButtonContainer}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <X size={20} color="#fff" />
              <Text style={styles.modalCloseText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a3441',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.secondary.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.accent.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary.bg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: Colors.accent.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },

  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.primary.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.primary.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  iconSelector: {
    maxHeight: 50,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  iconOptionSelected: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary + '20',
  },
  iconText: {
    fontSize: 20,
  },
  keywordsInput: {
    backgroundColor: '#2a3441',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryItemDesktop: {
    width: '48%',
  },
  categoryIconContainer: {
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryKeywords: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary.bg,
    borderWidth: 1,
    borderColor: Colors.card.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent.primary,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: '#3a4651',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    minHeight: 120,
  },
  categoryNameSection: {
    width: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  keywordsSection: {
    flex: 1,
    padding: 20,
  },
  keywordsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  keywordsContent: {
    flex: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center' as const,
    letterSpacing: 1,
  },
  categoryType: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 2,
  },
  categoryStatus: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  editForm: {
    gap: 12,
  },
  editHeader: {
    gap: 12,
  },
  editNameInput: {
    backgroundColor: Colors.primary.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.primary.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  editIconSelector: {
    maxHeight: 50,
  },
  editIconOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  editIconOptionSelected: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary + '20',
  },
  editIconText: {
    fontSize: 18,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editCancelButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary.bg,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  editSaveButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.accent.primary,
  },

  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  visibilityButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
  },
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
  },
  keywordsText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left' as const,
  },
  closeButtonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  modalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  addForm: {
    backgroundColor: '#3a4651',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  addFormTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 15,
  },
  addInput: {
    backgroundColor: '#2a3441',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  addKeywordsInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  addFormButton: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  addFormCancelButton: {
    backgroundColor: '#666',
  },
  addFormButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  actionButtonsContainer: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a4651',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary.accent,
    borderStyle: 'dashed',
  },
  resetButton: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  actionButtonText: {
    color: Colors.primary.accent,
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  resetButtonText: {
    color: '#ff6b6b',
  },
});