/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

// 定義所有需要添加的翻譯
const bookmarkTranslations = {
  "zh-TW": {
    "all_bookmarks": "所有書籤",
    "ai_category": "AI",
    "work_category": "工作",
    "study_category": "學習",
    "entertainment_category": "娛樂",
    "social_category": "社交",
    "news_category": "新聞"
  },
  "zh-CN": {
    "all_bookmarks": "所有书签",
    "ai_category": "AI",
    "work_category": "工作",
    "study_category": "学习",
    "entertainment_category": "娱乐",
    "social_category": "社交",
    "news_category": "新闻"
  },
  "es": {
    "all_bookmarks": "Todos los marcadores",
    "ai_category": "IA",
    "work_category": "Trabajo",
    "study_category": "Estudio",
    "entertainment_category": "Entretenimiento",
    "social_category": "Social",
    "news_category": "Noticias"
  },
  "pt-BR": {
    "all_bookmarks": "Todos os favoritos",
    "ai_category": "IA",
    "work_category": "Trabalho",
    "study_category": "Estudo",
    "entertainment_category": "Entretenimento",
    "social_category": "Social",
    "news_category": "Notícias"
  },
  "pt": {
    "all_bookmarks": "Todos os favoritos",
    "ai_category": "IA",
    "work_category": "Trabalho",
    "study_category": "Estudo",
    "entertainment_category": "Entretenimento",
    "social_category": "Social",
    "news_category": "Notícias"
  },
  "de": {
    "all_bookmarks": "Alle Lesezeichen",
    "ai_category": "KI",
    "work_category": "Arbeit",
    "study_category": "Studium",
    "entertainment_category": "Unterhaltung",
    "social_category": "Soziales",
    "news_category": "Nachrichten"
  },
  "fr": {
    "all_bookmarks": "Tous les favoris",
    "ai_category": "IA",
    "work_category": "Travail",
    "study_category": "Étude",
    "entertainment_category": "Divertissement",
    "social_category": "Social",
    "news_category": "Actualités"
  },
  "ru": {
    "all_bookmarks": "Все закладки",
    "ai_category": "ИИ",
    "work_category": "Работа",
    "study_category": "Учёба",
    "entertainment_category": "Развлечения",
    "social_category": "Социальное",
    "news_category": "Новости"
  },
  "ar": {
    "all_bookmarks": "كل الإشارات المرجعية",
    "ai_category": "ذكاء اصطناعي",
    "work_category": "عمل",
    "study_category": "دراسة",
    "entertainment_category": "ترفيه",
    "social_category": "اجتماعي",
    "news_category": "أخبار"
  },
  "ja": {
    "all_bookmarks": "すべてのブックマーク",
    "ai_category": "AI",
    "work_category": "仕事",
    "study_category": "学習",
    "entertainment_category": "エンターテインメント",
    "social_category": "ソーシャル",
    "news_category": "ニュース"
  },
  "ko": {
    "all_bookmarks": "모든 북마크",
    "ai_category": "인공지능",
    "work_category": "작업",
    "study_category": "학습",
    "entertainment_category": "엔터테인먼트",
    "social_category": "소셜",
    "news_category": "뉴스"
  }
};

// 處理每個語言文件
Object.keys(bookmarkTranslations).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'l10n', `${lang}.json`);
  
  try {
    // 讀取現有文件
    let content = {};
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      content = JSON.parse(fileContent);
    }
    
    // 添加或更新翻譯
    Object.keys(bookmarkTranslations[lang]).forEach(key => {
      content[key] = bookmarkTranslations[lang][key];
    });
    
    // 寫回文件
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All language files have been updated with bookmark translations!');