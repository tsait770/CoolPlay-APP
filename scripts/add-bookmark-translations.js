const fs = require('fs');
const path = require('path');
const __dirname = path.dirname(require.main.filename);

// Bookmark folder translations for all languages
const bookmarkTranslations = {
  'en': {
    "ai": "AI",
    "work": "Work",
    "study": "Study",
    "entertainment": "Entertainment",
    "social": "Social",
    "news": "News"
  },
  'zh-TW': {
    "ai": "AI",
    "work": "工作",
    "study": "學習",
    "entertainment": "娛樂",
    "social": "社交",
    "news": "新聞"
  },
  'zh-CN': {
    "ai": "AI",
    "work": "工作",
    "study": "学习",
    "entertainment": "娱乐",
    "social": "社交",
    "news": "新闻"
  },
  'es': {
    "ai": "IA",
    "work": "Trabajo",
    "study": "Estudio",
    "entertainment": "Entretenimiento",
    "social": "Social",
    "news": "Noticias"
  },
  'pt-BR': {
    "ai": "IA",
    "work": "Trabalho",
    "study": "Estudo",
    "entertainment": "Entretenimento",
    "social": "Social",
    "news": "Notícias"
  },
  'pt': {
    "ai": "IA",
    "work": "Trabalho",
    "study": "Estudo",
    "entertainment": "Entretenimento",
    "social": "Social",
    "news": "Notícias"
  },
  'de': {
    "ai": "KI",
    "work": "Arbeit",
    "study": "Studium",
    "entertainment": "Unterhaltung",
    "social": "Sozial",
    "news": "Nachrichten"
  },
  'fr': {
    "ai": "IA",
    "work": "Travail",
    "study": "Étude",
    "entertainment": "Divertissement",
    "social": "Social",
    "news": "Actualités"
  },
  'ru': {
    "ai": "ИИ",
    "work": "Работа",
    "study": "Учеба",
    "entertainment": "Развлечения",
    "social": "Социальное",
    "news": "Новости"
  },
  'ar': {
    "ai": "الذكاء الاصطناعي",
    "work": "العمل",
    "study": "الدراسة",
    "entertainment": "الترفيه",
    "social": "اجتماعي",
    "news": "الأخبار"
  },
  'ja': {
    "ai": "AI",
    "work": "仕事",
    "study": "学習",
    "entertainment": "エンターテイメント",
    "social": "ソーシャル",
    "news": "ニュース"
  },
  'ko': {
    "ai": "AI",
    "work": "업무",
    "study": "학습",
    "entertainment": "엔터테인먼트",
    "social": "소셜",
    "news": "뉴스"
  }
};

// Process each language file
Object.keys(bookmarkTranslations).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'l10n', `${lang}.json`);
  
  try {
    // Read existing file
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    // Add bookmark translations
    const updates = bookmarkTranslations[lang];
    let hasChanges = false;
    
    Object.keys(updates).forEach(key => {
      if (!translations[key] || translations[key] !== updates[key]) {
        translations[key] = updates[key];
        hasChanges = true;
        console.log(`Added/Updated ${key} in ${lang}.json: ${updates[key]}`);
      }
    });
    
    // Write back if there were changes
    if (hasChanges) {
      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf8');
      console.log(`✅ Updated ${lang}.json`);
    } else {
      console.log(`✓ ${lang}.json already has all bookmark translations`);
    }
  } catch (error) {
    console.error(`Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n✅ Bookmark translations update complete!');