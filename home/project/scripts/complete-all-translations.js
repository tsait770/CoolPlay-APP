const fs = require('fs');
const path = require('path');
const __dirname = process.cwd();

// Complete translations for all languages
const completeTranslations = {
  "en": {
    "folder_total": "Folder Total",
    "ai_folder": "AI",
    "work_folder": "Work",
    "study_folder": "Study",
    "entertainment_folder": "Entertainment",
    "social_folder": "Social",
    "news_folder": "News"
  },
  "zh-TW": {
    "folder_total": "資料夾總數",
    "ai_folder": "AI",
    "work_folder": "工作",
    "study_folder": "學習",
    "entertainment_folder": "娛樂",
    "social_folder": "社交",
    "news_folder": "新聞"
  },
  "zh-CN": {
    "folder_total": "文件夹总数",
    "ai_folder": "AI",
    "work_folder": "工作",
    "study_folder": "学习",
    "entertainment_folder": "娱乐",
    "social_folder": "社交",
    "news_folder": "新闻"
  },
  "es": {
    "folder_total": "Total de Carpetas",
    "ai_folder": "IA",
    "work_folder": "Trabajo",
    "study_folder": "Estudio",
    "entertainment_folder": "Entretenimiento",
    "social_folder": "Social",
    "news_folder": "Noticias"
  },
  "pt-BR": {
    "folder_total": "Total de Pastas",
    "ai_folder": "IA",
    "work_folder": "Trabalho",
    "study_folder": "Estudo",
    "entertainment_folder": "Entretenimento",
    "social_folder": "Social",
    "news_folder": "Notícias"
  },
  "pt": {
    "folder_total": "Total de Pastas",
    "ai_folder": "IA",
    "work_folder": "Trabalho",
    "study_folder": "Estudo",
    "entertainment_folder": "Entretenimento",
    "social_folder": "Social",
    "news_folder": "Notícias"
  },
  "de": {
    "folder_total": "Ordner Gesamt",
    "ai_folder": "KI",
    "work_folder": "Arbeit",
    "study_folder": "Studium",
    "entertainment_folder": "Unterhaltung",
    "social_folder": "Soziales",
    "news_folder": "Nachrichten"
  },
  "fr": {
    "folder_total": "Total des Dossiers",
    "ai_folder": "IA",
    "work_folder": "Travail",
    "study_folder": "Étude",
    "entertainment_folder": "Divertissement",
    "social_folder": "Social",
    "news_folder": "Actualités"
  },
  "ru": {
    "folder_total": "Всего папок",
    "ai_folder": "ИИ",
    "work_folder": "Работа",
    "study_folder": "Учёба",
    "entertainment_folder": "Развлечения",
    "social_folder": "Социальное",
    "news_folder": "Новости"
  },
  "ar": {
    "folder_total": "إجمالي المجلدات",
    "ai_folder": "ذكاء اصطناعي",
    "work_folder": "عمل",
    "study_folder": "دراسة",
    "entertainment_folder": "ترفيه",
    "social_folder": "اجتماعي",
    "news_folder": "أخبار"
  },
  "ja": {
    "folder_total": "フォルダー総数",
    "ai_folder": "AI",
    "work_folder": "仕事",
    "study_folder": "学習",
    "entertainment_folder": "エンターテインメント",
    "social_folder": "ソーシャル",
    "news_folder": "ニュース"
  },
  "ko": {
    "folder_total": "폴더 총계",
    "ai_folder": "인공지능",
    "work_folder": "작업",
    "study_folder": "학습",
    "entertainment_folder": "엔터테인먼트",
    "social_folder": "소셜",
    "news_folder": "뉴스"
  }
};

// Update each language file
Object.keys(completeTranslations).forEach(lang => {
  const filePath = path.join(__dirname, 'l10n', `${lang}.json`);
  
  try {
    // Read existing file
    let translations = {};
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      translations = JSON.parse(content);
    }
    
    // Add missing translations
    Object.keys(completeTranslations[lang]).forEach(key => {
      if (!translations[key] || translations[key].includes('_folder')) {
        translations[key] = completeTranslations[lang][key];
        console.log(`Added/Updated ${lang}.${key}: ${completeTranslations[lang][key]}`);
      }
    });
    
    // Write back
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All translations updated successfully!');