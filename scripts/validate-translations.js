#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// All supported languages
const LANGUAGES = [
  'en',
  'zh-TW',
  'zh-CN', 
  'es',
  'pt-BR',
  'pt',
  'de',
  'fr',
  'ru',
  'ar',
  'ja',
  'ko'
];

const L10N_DIR = path.join(__dirname, '..', 'l10n');

// Load all translation files
function loadTranslations() {
  const translations = {};
  
  for (const lang of LANGUAGES) {
    const filePath = path.join(L10N_DIR, `${lang}.json`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      translations[lang] = JSON.parse(content);
      console.log(`✓ Loaded ${lang}.json (${Object.keys(translations[lang]).length} keys)`);
    } catch (error) {
      console.error(`✗ Failed to load ${lang}.json:`, error.message);
      translations[lang] = {};
    }
  }
  
  return translations;
}

// Get all unique keys from all translation files
function getAllKeys(translations) {
  const allKeys = new Set();
  
  for (const lang of LANGUAGES) {
    if (translations[lang]) {
      Object.keys(translations[lang]).forEach(key => allKeys.add(key));
    }
  }
  
  return Array.from(allKeys).sort();
}

// Find missing keys for each language
function findMissingKeys(translations, allKeys) {
  const missingKeys = {};
  
  for (const lang of LANGUAGES) {
    missingKeys[lang] = [];
    
    for (const key of allKeys) {
      if (!translations[lang] || !translations[lang][key]) {
        missingKeys[lang].push(key);
      }
    }
  }
  
  return missingKeys;
}

// Validate translation completeness
function validateTranslations() {
  console.log('🔍 Validating translation files...\n');
  
  const translations = loadTranslations();
  const allKeys = getAllKeys(translations);
  const missingKeys = findMissingKeys(translations, allKeys);
  
  console.log(`\n📊 Translation Statistics:`);
  console.log(`Total unique keys: ${allKeys.length}`);
  
  let hasErrors = false;
  
  for (const lang of LANGUAGES) {
    const missing = missingKeys[lang].length;
    const total = allKeys.length;
    const percentage = ((total - missing) / total * 100).toFixed(1);
    
    const status = missing === 0 ? '✅' : '⚠️';
    console.log(`${status} ${lang}: ${total - missing}/${total} (${percentage}%) - ${missing} missing`);
    
    if (missing > 0) {
      hasErrors = true;
      console.log(`   Missing keys: ${missingKeys[lang].slice(0, 5).join(', ')}${missing > 5 ? '...' : ''}`);
    }
  }
  
  if (hasErrors) {
    console.log('\n❌ Translation validation failed. Some languages are missing keys.');
    console.log('Run `node scripts/complete-translations.js` to auto-complete missing translations.');
    process.exit(1);
  } else {
    console.log('\n✅ All translations are complete!');
  }
}

// Check for duplicate or unused keys
function checkForIssues(translations) {
  console.log('\n🔍 Checking for translation issues...');
  
  // Check for empty values
  for (const lang of LANGUAGES) {
    if (!translations[lang]) continue;
    
    const emptyKeys = [];
    for (const [key, value] of Object.entries(translations[lang])) {
      if (!value || value.trim() === '') {
        emptyKeys.push(key);
      }
    }
    
    if (emptyKeys.length > 0) {
      console.log(`⚠️  ${lang} has ${emptyKeys.length} empty values: ${emptyKeys.slice(0, 3).join(', ')}${emptyKeys.length > 3 ? '...' : ''}`);
    }
  }
}

if (require.main === module) {
  validateTranslations();
  const translations = loadTranslations();
  checkForIssues(translations);
}