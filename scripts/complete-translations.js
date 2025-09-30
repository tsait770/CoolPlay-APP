#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// All supported languages with their native names
const LANGUAGES = [
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
  { code: 'ko', name: '한국어' }
];

const L10N_DIR = path.resolve(__dirname, '..', 'l10n');

// Load translation file
function loadTranslation(langCode) {
  const filePath = path.join(L10N_DIR, `${langCode}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Warning: Could not load ${langCode}.json, creating new file`);
    return {};
  }
}

// Save translation file
function saveTranslation(langCode, translations) {
  const filePath = path.join(L10N_DIR, `${langCode}.json`);
  const sortedTranslations = {};
  
  // Sort keys alphabetically
  Object.keys(translations).sort().forEach(key => {
    sortedTranslations[key] = translations[key];
  });
  
  fs.writeFileSync(filePath, JSON.stringify(sortedTranslations, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${langCode}.json`);
}

// Get all unique keys from English (master) translation
function getMasterKeys() {
  const enTranslations = loadTranslation('en');
  return Object.keys(enTranslations).sort();
}

// Complete missing translations for all languages
function completeTranslations() {
  console.log('🔄 Completing missing translations...\n');
  
  const masterKeys = getMasterKeys();
  const enTranslations = loadTranslation('en');
  
  console.log(`📋 Found ${masterKeys.length} keys in master (English) translation\n`);
  
  for (const lang of LANGUAGES) {
    if (lang.code === 'en') continue; // Skip English as it's the master
    
    console.log(`🌐 Processing ${lang.name} (${lang.code})...`);
    
    const translations = loadTranslation(lang.code);
    let addedCount = 0;
    
    for (const key of masterKeys) {
      if (!translations[key]) {
        // Use English as fallback for missing translations
        translations[key] = enTranslations[key] || key;
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      saveTranslation(lang.code, translations);
      console.log(`   ➕ Added ${addedCount} missing translations`);
    } else {
      console.log(`   ✅ No missing translations`);
    }
  }
  
  console.log('\n🎉 Translation completion finished!');
}

// Validate that all files have the same keys
function validateCompleteness() {
  console.log('\n🔍 Validating translation completeness...');
  
  const masterKeys = getMasterKeys();
  let allComplete = true;
  
  for (const lang of LANGUAGES) {
    const translations = loadTranslation(lang.code);
    const currentKeys = Object.keys(translations);
    const missing = masterKeys.filter(key => !translations[key]);
    const extra = currentKeys.filter(key => !masterKeys.includes(key));
    
    if (missing.length > 0 || extra.length > 0) {
      allComplete = false;
      console.log(`❌ ${lang.code}: ${missing.length} missing, ${extra.length} extra keys`);
      if (missing.length > 0) {
        console.log(`   Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
      }
      if (extra.length > 0) {
        console.log(`   Extra: ${extra.slice(0, 3).join(', ')}${extra.length > 3 ? '...' : ''}`);
      }
    } else {
      console.log(`✅ ${lang.code}: Complete (${currentKeys.length} keys)`);
    }
  }
  
  if (allComplete) {
    console.log('\n🎉 All translations are complete and synchronized!');
  } else {
    console.log('\n⚠️  Some translations need attention. Run this script again to fix issues.');
  }
}

// Main execution
if (require.main === module) {
  try {
    // Ensure l10n directory exists
    if (!fs.existsSync(L10N_DIR)) {
      fs.mkdirSync(L10N_DIR, { recursive: true });
      console.log(`📁 Created l10n directory: ${L10N_DIR}`);
    }
    
    completeTranslations();
    validateCompleteness();
    
    console.log('\n📝 Translation system is ready!');
    console.log('💡 All UI text should use t("key") function for proper localization.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  completeTranslations,
  validateCompleteness,
  LANGUAGES
};