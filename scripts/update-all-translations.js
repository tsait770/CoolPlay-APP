/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

// Common missing translations for all languages
const commonMissingKeys = {
  "subtitle": {
    "en": "Your Smart Bookmark Manager",
    "zh-TW": "您的智能書籤管理器",
    "zh-CN": "您的智能书签管理器",
    "es": "Tu Gestor Inteligente de Marcadores",
    "pt-BR": "Seu Gerenciador Inteligente de Favoritos",
    "pt": "O Seu Gestor Inteligente de Marcadores",
    "de": "Ihr Intelligenter Lesezeichen-Manager",
    "fr": "Votre Gestionnaire Intelligent de Favoris",
    "ru": "Ваш Умный Менеджер Закладок",
    "ar": "مدير الإشارات المرجعية الذكي",
    "ja": "スマートブックマークマネージャー",
    "ko": "스마트 북마크 매니저"
  },
  "all_bookmarks": {
    "en": "All Bookmarks",
    "zh-TW": "所有書籤",
    "zh-CN": "所有书签",
    "es": "Todos los Marcadores",
    "pt-BR": "Todos os Favoritos",
    "pt": "Todos os Marcadores",
    "de": "Alle Lesezeichen",
    "fr": "Tous les Favoris",
    "ru": "Все Закладки",
    "ar": "جميع الإشارات المرجعية",
    "ja": "すべてのブックマーク",
    "ko": "모든 북마크"
  },
  "all_bookmarks_folder": {
    "en": "All Bookmarks",
    "zh-TW": "所有書籤",
    "zh-CN": "所有书签",
    "es": "Todos los Marcadores",
    "pt-BR": "Todos os Favoritos",
    "pt": "Todos os Marcadores",
    "de": "Alle Lesezeichen",
    "fr": "Tous les Favoris",
    "ru": "Все Закладки",
    "ar": "جميع الإشارات المرجعية",
    "ja": "すべてのブックマーク",
    "ko": "모든 북마크"
  },
  "favorites_folder": {
    "en": "Favorites",
    "zh-TW": "收藏夾",
    "zh-CN": "收藏夹",
    "es": "Favoritos",
    "pt-BR": "Favoritos",
    "pt": "Favoritos",
    "de": "Favoriten",
    "fr": "Favoris",
    "ru": "Избранное",
    "ar": "المفضلة",
    "ja": "お気に入り",
    "ko": "즐겨찾기"
  },
  "total_bookmarks": {
    "en": "Total Bookmarks",
    "zh-TW": "書籤總數",
    "zh-CN": "书签总数",
    "es": "Total de Marcadores",
    "pt-BR": "Total de Favoritos",
    "pt": "Total de Marcadores",
    "de": "Lesezeichen Gesamt",
    "fr": "Total des Favoris",
    "ru": "Всего Закладок",
    "ar": "إجمالي الإشارات المرجعية",
    "ja": "ブックマーク総数",
    "ko": "총 북마크"
  },
  "total_folders": {
    "en": "Total Folders",
    "zh-TW": "文件夾總數",
    "zh-CN": "文件夹总数",
    "es": "Total de Carpetas",
    "pt-BR": "Total de Pastas",
    "pt": "Total de Pastas",
    "de": "Ordner Gesamt",
    "fr": "Total des Dossiers",
    "ru": "Всего Папок",
    "ar": "إجمالي المجلدات",
    "ja": "フォルダー総数",
    "ko": "총 폴더"
  },
  "voice_commands": {
    "en": "Voice Commands",
    "zh-TW": "語音指令",
    "zh-CN": "语音指令",
    "es": "Comandos de Voz",
    "pt-BR": "Comandos de Voz",
    "pt": "Comandos de Voz",
    "de": "Sprachbefehle",
    "fr": "Commandes Vocales",
    "ru": "Голосовые Команды",
    "ar": "الأوامر الصوتية",
    "ja": "音声コマンド",
    "ko": "음성 명령"
  },
  "feature_import": {
    "en": "Import Bookmarks",
    "zh-TW": "導入書籤",
    "zh-CN": "导入书签",
    "es": "Importar Marcadores",
    "pt-BR": "Importar Favoritos",
    "pt": "Importar Marcadores",
    "de": "Lesezeichen Importieren",
    "fr": "Importer des Favoris",
    "ru": "Импорт Закладок",
    "ar": "استيراد الإشارات المرجعية",
    "ja": "ブックマークをインポート",
    "ko": "북마크 가져오기"
  },
  "feature_import_desc": {
    "en": "Import bookmarks from browser",
    "zh-TW": "從瀏覽器導入書籤",
    "zh-CN": "从浏览器导入书签",
    "es": "Importar marcadores del navegador",
    "pt-BR": "Importar favoritos do navegador",
    "pt": "Importar marcadores do navegador",
    "de": "Lesezeichen aus Browser importieren",
    "fr": "Importer des favoris du navigateur",
    "ru": "Импорт закладок из браузера",
    "ar": "استيراد الإشارات المرجعية من المتصفح",
    "ja": "ブラウザからブックマークをインポート",
    "ko": "브라우저에서 북마크 가져오기"
  },
  "feature_smart_category": {
    "en": "Smart Category",
    "zh-TW": "智能分類",
    "zh-CN": "智能分类",
    "es": "Categoría Inteligente",
    "pt-BR": "Categoria Inteligente",
    "pt": "Categoria Inteligente",
    "de": "Intelligente Kategorisierung",
    "fr": "Catégorie Intelligente",
    "ru": "Умная Категоризация",
    "ar": "التصنيف الذكي",
    "ja": "スマート分類",
    "ko": "스마트 분류"
  },
  "feature_smart_category_desc": {
    "en": "Auto-organize your bookmarks",
    "zh-TW": "自動整理您的書籤",
    "zh-CN": "自动整理您的书签",
    "es": "Organiza automáticamente tus marcadores",
    "pt-BR": "Organize automaticamente seus favoritos",
    "pt": "Organize automaticamente os seus marcadores",
    "de": "Automatisch Ihre Lesezeichen organisieren",
    "fr": "Organisez automatiquement vos favoris",
    "ru": "Автоматическая организация закладок",
    "ar": "تنظيم الإشارات المرجعية تلقائيًا",
    "ja": "ブックマークを自動整理",
    "ko": "북마크 자동 정리"
  }
};

// Additional missing keys for specific languages
const additionalMissingKeys = {
  "search_placeholder": {
    "en": "Search bookmarks...",
    "zh-TW": "搜尋書籤...",
    "zh-CN": "搜索书签...",
    "es": "Buscar marcadores...",
    "pt-BR": "Pesquisar favoritos...",
    "pt": "Pesquisar marcadores...",
    "de": "Lesezeichen suchen...",
    "fr": "Rechercher des favoris...",
    "ru": "Поиск закладок...",
    "ar": "البحث في الإشارات المرجعية...",
    "ja": "ブックマークを検索...",
    "ko": "북마크 검색..."
  },
  "no_bookmarks": {
    "en": "No bookmarks",
    "zh-TW": "暫無書籤",
    "zh-CN": "暂无书签",
    "es": "Sin marcadores",
    "pt-BR": "Sem favoritos",
    "pt": "Sem marcadores",
    "de": "Keine Lesezeichen",
    "fr": "Aucun favori",
    "ru": "Нет закладок",
    "ar": "لا توجد إشارات مرجعية",
    "ja": "ブックマークがありません",
    "ko": "북마크 없음"
  },
  "import_bookmarks": {
    "en": "Import Bookmarks",
    "zh-TW": "導入書籤",
    "zh-CN": "导入书签",
    "es": "Importar Marcadores",
    "pt-BR": "Importar Favoritos",
    "pt": "Importar Marcadores",
    "de": "Lesezeichen Importieren",
    "fr": "Importer des Favoris",
    "ru": "Импорт Закладок",
    "ar": "استيراد الإشارات المرجعية",
    "ja": "ブックマークをインポート",
    "ko": "북마크 가져오기"
  },
  "home": {
    "en": "Home",
    "zh-TW": "首頁",
    "zh-CN": "首页",
    "es": "Inicio",
    "pt-BR": "Início",
    "pt": "Início",
    "de": "Startseite",
    "fr": "Accueil",
    "ru": "Главная",
    "ar": "الرئيسية",
    "ja": "ホーム",
    "ko": "홈"
  },
  "favorites": {
    "en": "Favorites",
    "zh-TW": "收藏",
    "zh-CN": "收藏",
    "es": "Favoritos",
    "pt-BR": "Favoritos",
    "pt": "Favoritos",
    "de": "Favoriten",
    "fr": "Favoris",
    "ru": "Избранное",
    "ar": "المفضلة",
    "ja": "お気に入り",
    "ko": "즐겨찾기"
  }
};

// Process each language file
const languages = ['en', 'zh-TW', 'zh-CN', 'es', 'pt-BR', 'pt', 'de', 'fr', 'ru', 'ar', 'ja', 'ko'];

languages.forEach(lang => {
  const filePath = path.join(__dirname, '..', 'l10n', `${lang}.json`);
  
  try {
    let data = {};
    
    // Read existing file if it exists
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(fileContent);
    }
    
    // Add common missing keys
    Object.entries(commonMissingKeys).forEach(([key, translations]) => {
      if (!data[key] && translations[lang]) {
        data[key] = translations[lang];
        console.log(`Added ${key} to ${lang}.json`);
      }
    });
    
    // Add additional missing keys
    Object.entries(additionalMissingKeys).forEach(([key, translations]) => {
      if (!data[key] && translations[lang]) {
        data[key] = translations[lang];
        console.log(`Added ${key} to ${lang}.json`);
      }
    });
    
    // Sort keys alphabetically for consistency
    const sortedData = {};
    Object.keys(data).sort().forEach(key => {
      sortedData[key] = data[key];
    });
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n✨ Translation update complete!');