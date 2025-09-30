const fs = require('fs');
const path = require('path');

// Complete translations for all missing keys
const updates = {
  "es": {
    "all_bookmarks": "Todos los marcadores",
    "all_bookmarks_folder": "Todos los marcadores",
    "ai": "IA",
    "work": "Trabajo",
    "study": "Estudio",
    "entertainment": "Entretenimiento",
    "social": "Social",
    "news": "Noticias",
    "ai_folder": "IA",
    "work_folder": "Trabajo",
    "study_folder": "Estudio",
    "entertainment_folder": "Entretenimiento",
    "social_folder": "Social",
    "news_folder": "Noticias",
    "ai_folder_desc": "Herramientas y recursos de IA",
    "work_folder_desc": "Marcadores relacionados con el trabajo",
    "study_folder_desc": "Materiales educativos y recursos de aprendizaje",
    "entertainment_folder_desc": "Películas, juegos y contenido de entretenimiento",
    "social_folder_desc": "Redes sociales y plataformas de networking",
    "news_folder_desc": "Fuentes de noticias y actualidad"
  },
  "pt-BR": {
    "all_bookmarks": "Todos os favoritos",
    "all_bookmarks_folder": "Todos os favoritos",
    "ai": "IA",
    "work": "Trabalho",
    "study": "Estudo",
    "entertainment": "Entretenimento",
    "social": "Social",
    "news": "Notícias",
    "ai_folder": "IA",
    "work_folder": "Trabalho",
    "study_folder": "Estudo",
    "entertainment_folder": "Entretenimento",
    "social_folder": "Social",
    "news_folder": "Notícias",
    "ai_folder_desc": "Ferramentas e recursos de IA",
    "work_folder_desc": "Favoritos relacionados ao trabalho",
    "study_folder_desc": "Materiais educacionais e recursos de aprendizagem",
    "entertainment_folder_desc": "Filmes, jogos e conteúdo de entretenimento",
    "social_folder_desc": "Mídias sociais e plataformas de rede",
    "news_folder_desc": "Fontes de notícias e atualidades"
  },
  "pt": {
    "all_bookmarks": "Todos os favoritos",
    "all_bookmarks_folder": "Todos os favoritos",
    "ai": "IA",
    "work": "Trabalho",
    "study": "Estudo",
    "entertainment": "Entretenimento",
    "social": "Social",
    "news": "Notícias",
    "ai_folder": "IA",
    "work_folder": "Trabalho",
    "study_folder": "Estudo",
    "entertainment_folder": "Entretenimento",
    "social_folder": "Social",
    "news_folder": "Notícias",
    "ai_folder_desc": "Ferramentas e recursos de IA",
    "work_folder_desc": "Favoritos relacionados com o trabalho",
    "study_folder_desc": "Materiais educacionais e recursos de aprendizagem",
    "entertainment_folder_desc": "Filmes, jogos e conteúdo de entretenimento",
    "social_folder_desc": "Redes sociais e plataformas de rede",
    "news_folder_desc": "Fontes de notícias e atualidades"
  },
  "de": {
    "all_bookmarks": "Alle Lesezeichen",
    "all_bookmarks_folder": "Alle Lesezeichen",
    "ai": "KI",
    "work": "Arbeit",
    "study": "Studium",
    "entertainment": "Unterhaltung",
    "social": "Soziales",
    "news": "Nachrichten",
    "ai_folder": "KI",
    "work_folder": "Arbeit",
    "study_folder": "Studium",
    "entertainment_folder": "Unterhaltung",
    "social_folder": "Soziales",
    "news_folder": "Nachrichten",
    "ai_folder_desc": "KI-Tools und Ressourcen",
    "work_folder_desc": "Arbeitsbezogene Lesezeichen",
    "study_folder_desc": "Bildungsmaterialien und Lernressourcen",
    "entertainment_folder_desc": "Filme, Spiele und Unterhaltungsinhalte",
    "social_folder_desc": "Soziale Medien und Netzwerkplattformen",
    "news_folder_desc": "Nachrichtenquellen und aktuelle Ereignisse"
  },
  "fr": {
    "all_bookmarks": "Tous les favoris",
    "all_bookmarks_folder": "Tous les favoris",
    "ai": "IA",
    "work": "Travail",
    "study": "Étude",
    "entertainment": "Divertissement",
    "social": "Social",
    "news": "Actualités",
    "ai_folder": "IA",
    "work_folder": "Travail",
    "study_folder": "Étude",
    "entertainment_folder": "Divertissement",
    "social_folder": "Social",
    "news_folder": "Actualités",
    "ai_folder_desc": "Outils et ressources IA",
    "work_folder_desc": "Favoris liés au travail",
    "study_folder_desc": "Matériel éducatif et ressources d'apprentissage",
    "entertainment_folder_desc": "Films, jeux et contenu de divertissement",
    "social_folder_desc": "Médias sociaux et plateformes de réseau",
    "news_folder_desc": "Sources d'actualités et événements actuels"
  },
  "ru": {
    "all_bookmarks": "Все закладки",
    "all_bookmarks_folder": "Все закладки",
    "ai": "ИИ",
    "work": "Работа",
    "study": "Учёба",
    "entertainment": "Развлечения",
    "social": "Социальное",
    "news": "Новости",
    "ai_folder": "ИИ",
    "work_folder": "Работа",
    "study_folder": "Учёба",
    "entertainment_folder": "Развлечения",
    "social_folder": "Социальное",
    "news_folder": "Новости",
    "ai_folder_desc": "Инструменты и ресурсы ИИ",
    "work_folder_desc": "Закладки, связанные с работой",
    "study_folder_desc": "Образовательные материалы и учебные ресурсы",
    "entertainment_folder_desc": "Фильмы, игры и развлекательный контент",
    "social_folder_desc": "Социальные сети и сетевые платформы",
    "news_folder_desc": "Источники новостей и текущие события"
  },
  "ar": {
    "all_bookmarks": "كل الإشارات المرجعية",
    "all_bookmarks_folder": "كل الإشارات المرجعية",
    "ai": "ذكاء اصطناعي",
    "work": "عمل",
    "study": "دراسة",
    "entertainment": "ترفيه",
    "social": "اجتماعي",
    "news": "أخبار",
    "ai_folder": "ذكاء اصطناعي",
    "work_folder": "عمل",
    "study_folder": "دراسة",
    "entertainment_folder": "ترفيه",
    "social_folder": "اجتماعي",
    "news_folder": "أخبار",
    "ai_folder_desc": "أدوات وموارد الذكاء الاصطناعي",
    "work_folder_desc": "الإشارات المرجعية المتعلقة بالعمل",
    "study_folder_desc": "المواد التعليمية وموارد التعلم",
    "entertainment_folder_desc": "الأفلام والألعاب ومحتوى الترفيه",
    "social_folder_desc": "وسائل التواصل الاجتماعي ومنصات الشبكات",
    "news_folder_desc": "مصادر الأخبار والأحداث الجارية"
  },
  "ko": {
    "all_bookmarks": "모든 북마크",
    "all_bookmarks_folder": "모든 북마크",
    "ai": "인공지능",
    "work": "작업",
    "study": "학습",
    "entertainment": "엔터테인먼트",
    "social": "소셜",
    "news": "뉴스",
    "ai_folder": "인공지능",
    "work_folder": "작업",
    "study_folder": "학습",
    "entertainment_folder": "엔터테인먼트",
    "social_folder": "소셜",
    "news_folder": "뉴스",
    "ai_folder_desc": "AI 도구 및 리소스",
    "work_folder_desc": "업무 관련 북마크",
    "study_folder_desc": "교육 자료 및 학습 리소스",
    "entertainment_folder_desc": "영화, 게임 및 엔터테인먼트 콘텐츠",
    "social_folder_desc": "소셜 미디어 및 네트워크 플랫폼",
    "news_folder_desc": "뉴스 소스 및 시사"
  }
};

// Update each language file
Object.keys(updates).forEach(lang => {
  const filePath = path.join(process.cwd(), 'l10n', `${lang}.json`);
  
  try {
    // Read existing file
    let translations = {};
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      translations = JSON.parse(content);
    }
    
    // Merge translations
    translations = { ...translations, ...updates[lang] };
    
    // Write back
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All language files have been updated!');