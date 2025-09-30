import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useCategories } from "@/providers/CategoryProvider";

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  favorite: boolean;
  folderId?: string;
  addedOn: string;
  lastOpened?: string;
  description?: string;
  color?: string;
  category?: string;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  bookmarks: Bookmark[];
  categoryId?: string;
  createdAt?: number;
}

const STORAGE_KEYS = {
  BOOKMARKS: "@coolplay_bookmarks",
  FOLDERS: "@coolplay_folders",
  ORIGINAL_BOOKMARKS: "@coolplay_original_bookmarks",
};

const defaultFolders: BookmarkFolder[] = [
  { id: "all", name: "all_bookmarks", icon: "bookmark", builtIn: true, bookmarks: [] },
  { id: "favorites", name: "favorites", icon: "star", builtIn: true, bookmarks: [] },
  { id: "ai", name: "ai", icon: "sparkles", builtIn: true, bookmarks: [] },
  { id: "work", name: "work", icon: "briefcase", builtIn: true, bookmarks: [] },
  { id: "study", name: "study", icon: "book-open", builtIn: true, bookmarks: [] },
  { id: "entertainment", name: "entertainment", icon: "gamepad-2", builtIn: true, bookmarks: [] },
  { id: "social", name: "social", icon: "users", builtIn: true, bookmarks: [] },
  { id: "news", name: "news", icon: "newspaper", builtIn: true, bookmarks: [] },
];

const categoryKeywords = {
  ai: ["ai", "artificial intelligence", "machine learning", "deep learning", "neural network", "chatgpt", "gpt", "openai", "claude", "bard", "llm"],
  work: ["work", "office", "business", "job", "career", "professional", "meeting", "project", "team", "slack", "teams", "zoom"],
  study: ["study", "learn", "education", "course", "tutorial", "school", "university", "college", "research", "paper", "academic"],
  entertainment: ["entertainment", "video", "movie", "film", "music", "game", "gaming", "stream", "youtube", "netflix", "spotify"],
  social: ["social", "facebook", "twitter", "instagram", "tiktok", "whatsapp", "telegram", "messenger", "community", "forum"],
  news: ["news", "headline", "update", "breaking", "report", "media", "journal", "blog", "article", "press"],
};

export const [BookmarkProvider, useBookmarks] = createContextHook(() => {
  console.log('BookmarkProvider initialized');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>(defaultFolders);
  const [originalBookmarks, setOriginalBookmarks] = useState<Bookmark[]>([]);
  const [currentFolder, setCurrentFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  // Sync folders with categories (add/remove/link)
  const { categories } = useCategories();
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    setFolders(prev => {
      const map = new Map(prev.map(f => [f.id, f] as const));
      // Ensure default/built-in folders exist in the specified order
      defaultFolders.forEach(df => {
        if (!map.has(df.id)) {
          map.set(df.id, { ...df, bookmarks: [] });
        }
      });
      // For custom categories, ensure a folder exists per category id
      categories.forEach(cat => {
        if (cat.id !== 'ai' && cat.id !== 'work' && cat.id !== 'study' && cat.id !== 'entertainment' && cat.id !== 'social' && cat.id !== 'news') {
          const existing = Array.from(map.values()).find(f => f.categoryId === cat.id);
          if (!existing) {
            const newFolder: BookmarkFolder = {
              id: `cat_${cat.id}`,
              name: cat.name,
              icon: 'folder',
              builtIn: false,
              bookmarks: [],
              categoryId: cat.id,
              createdAt: Date.now(),
            };
            map.set(newFolder.id, newFolder);
          }
        }
      });
      // Remove folders for categories that no longer exist (custom only)
      const validCategoryIds = new Set(categories.map(c => c.id));
      const kept: BookmarkFolder[] = [];
      map.forEach(f => {
        if (f.categoryId && !validCategoryIds.has(f.categoryId)) {
          // skip removing built-in
          return;
        }
        kept.push(f);
      });
      const sorted = sortFolders(kept);
      saveData(bookmarks, sorted).catch(() => {});
      return sorted;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(categories)]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [storedBookmarks, storedFolders, storedOriginal] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS),
        AsyncStorage.getItem(STORAGE_KEYS.FOLDERS),
        AsyncStorage.getItem(STORAGE_KEYS.ORIGINAL_BOOKMARKS),
      ]);

      if (storedBookmarks && typeof storedBookmarks === 'string' && storedBookmarks.length > 0) {
        try {
          const cleanedData = storedBookmarks
            .trim()
            .replace(/^\uFEFF/, '') // Remove BOM
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
          
          if (cleanedData.startsWith('[') && cleanedData.endsWith(']')) {
            const parsed = JSON.parse(cleanedData);
            if (Array.isArray(parsed)) {
              setBookmarks(parsed);
            }
          } else {
            console.log('Invalid bookmarks format, clearing');
            await AsyncStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
          }
        } catch (parseError) {
          console.error('Error parsing bookmarks:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
        }
      }
      
      if (storedFolders && typeof storedFolders === 'string' && storedFolders.length > 0) {
        try {
          const cleanedData = storedFolders
            .trim()
            .replace(/^\uFEFF/, '') // Remove BOM
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
          
          if (cleanedData.startsWith('[') && cleanedData.endsWith(']')) {
            const parsed = JSON.parse(cleanedData);
            if (Array.isArray(parsed)) {
              setFolders(parsed);
            }
          } else {
            console.log('Invalid folders format, clearing');
            await AsyncStorage.removeItem(STORAGE_KEYS.FOLDERS);
          }
        } catch (parseError) {
          console.error('Error parsing folders:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.FOLDERS);
        }
      }
      
      if (storedOriginal && typeof storedOriginal === 'string' && storedOriginal.length > 0) {
        try {
          const cleanedData = storedOriginal
            .trim()
            .replace(/^\uFEFF/, '') // Remove BOM
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
          
          if (cleanedData.startsWith('[') && cleanedData.endsWith(']')) {
            const parsed = JSON.parse(cleanedData);
            if (Array.isArray(parsed)) {
              setOriginalBookmarks(parsed);
            }
          } else {
            console.log('Invalid original bookmarks format, clearing');
            await AsyncStorage.removeItem(STORAGE_KEYS.ORIGINAL_BOOKMARKS);
          }
        } catch (parseError) {
          console.error('Error parsing original bookmarks:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.ORIGINAL_BOOKMARKS);
        }
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newBookmarks: Bookmark[], newFolders: BookmarkFolder[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newBookmarks)),
        AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(newFolders)),
      ]);
    } catch (error) {
      console.error("Error saving bookmarks:", error);
    }
  };

  const addBookmark = useCallback((bookmark: Omit<Bookmark, "id" | "addedOn">) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
      addedOn: new Date().toISOString(),
    };
    const updatedBookmarks = [...bookmarks, newBookmark];
    // Auto-categorize on add
    const updatedFolders = folders.map((f) => {
      if (f.id === "all" || f.id === "favorites") return f;
      return { ...f, bookmarks: [...f.bookmarks] };
    });
    const categoriesForBookmark = categorizeBookmark(newBookmark);
    categoriesForBookmark.forEach((category) => {
      const folder = updatedFolders.find((f) => f.id === category);
      if (folder && !folder.bookmarks.find((b) => b.id === newBookmark.id)) {
        folder.bookmarks.push(newBookmark);
      }
    });

    setBookmarks(updatedBookmarks);
    setFolders(updatedFolders);
    saveData(updatedBookmarks, updatedFolders);
    return newBookmark;
  }, [bookmarks, folders]);

  const deleteBookmark = useCallback((bookmarkId: string) => {
    const updatedBookmarks = bookmarks.filter((b) => b.id !== bookmarkId);
    const updatedFolders = folders.map((folder) => ({
      ...folder,
      bookmarks: folder.bookmarks.filter((b) => b.id !== bookmarkId),
    }));
    setBookmarks(updatedBookmarks);
    setFolders(updatedFolders);
    saveData(updatedBookmarks, updatedFolders);
  }, [bookmarks, folders]);

  const toggleFavorite = useCallback((bookmarkId: string) => {
    setBookmarks(prevBookmarks => {
      const updatedBookmarks = prevBookmarks.map((b) =>
        b.id === bookmarkId ? { ...b, favorite: !b.favorite } : b
      );
      requestAnimationFrame(() => {
        saveData(updatedBookmarks, folders).catch(console.error);
      });
      return updatedBookmarks;
    });
  }, [folders]);

  const addFolder = useCallback((categoryId: string, name: string, maxFolders: number = 5) => {
    // Check if category has reached max folders
    const categoryFolders = folders.filter(f => f.categoryId === categoryId);
    if (categoryFolders.length >= maxFolders) {
      console.warn('Maximum number of folders reached for category:', categoryId);
      return null;
    }
    
    const newFolder: BookmarkFolder = {
      id: `folder_${Date.now()}`,
      name,
      icon: "folder",
      builtIn: false,
      bookmarks: [],
      categoryId,
      createdAt: Date.now(),
    };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    saveData(bookmarks, updatedFolders);
    
    console.log('Added new folder:', newFolder.name, 'for category:', categoryId);
    return newFolder.id;
  }, [bookmarks, folders]);

  const deleteFolder = useCallback((folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder || folder.builtIn) return;

    // Remove bookmarks that were in this folder
    const updatedBookmarks = bookmarks.filter(b => b.folderId !== folderId);
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    setBookmarks(updatedBookmarks);
    setFolders(updatedFolders);
    saveData(updatedBookmarks, updatedFolders);
  }, [bookmarks, folders]);

  const editFolder = useCallback((folderId: string, newName: string) => {
    const updatedFolders = folders.map((f) =>
      f.id === folderId && !f.builtIn ? { ...f, name: newName } : f
    );
    setFolders(updatedFolders);
    saveData(bookmarks, updatedFolders);
  }, [bookmarks, folders]);

  const moveBookmarkToFolder = useCallback((bookmarkId: string, folderId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;

    const updatedFolders = folders.map((folder) => {
      if (folder.id === "all") return folder;
      
      const filteredBookmarks = folder.bookmarks.filter((b) => b.id !== bookmarkId);
      if (folder.id === folderId) {
        return { ...folder, bookmarks: [...filteredBookmarks, bookmark] };
      }
      return { ...folder, bookmarks: filteredBookmarks };
    });

    setFolders(updatedFolders);
    saveData(bookmarks, updatedFolders);
  }, [bookmarks, folders]);

  const smartCategorize = useCallback((categoryKeywordsMap?: Record<string, string[]>) => {
    setOriginalBookmarks([...bookmarks]);
    AsyncStorage.setItem(STORAGE_KEYS.ORIGINAL_BOOKMARKS, JSON.stringify(bookmarks));

    const updatedFolders = folders.map((folder) => {
      if (folder.id === "all" || folder.id === "favorites") return folder;
      return { ...folder, bookmarks: [] };
    });

    bookmarks.forEach((bookmark) => {
      const categories = categorizeBookmark(bookmark, categoryKeywordsMap);
      categories.forEach((category) => {
        const folder = updatedFolders.find((f) => f.id === category);
        if (folder && !folder.bookmarks.find((b) => b.id === bookmark.id)) {
          folder.bookmarks.push(bookmark);
        }
      });
    });

    setFolders(updatedFolders);
    saveData(bookmarks, updatedFolders);
  }, [bookmarks, folders]);

  const categorizeBookmark = (bookmark: Bookmark, categoryKeywordsMap?: Record<string, string[]>): string[] => {
    const title = bookmark.title.toLowerCase();
    const url = bookmark.url.toLowerCase();
    const description = (bookmark.description || "").toLowerCase();
    const categories: string[] = [];
    
    const keywordsToUse = categoryKeywordsMap || categoryKeywords;

    Object.entries(keywordsToUse).forEach(([category, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        let points = 0;
        if (title.includes(keyword.toLowerCase())) points += 3;
        if (url.includes(keyword.toLowerCase())) points += 2;
        if (description.includes(keyword.toLowerCase())) points += 1;
        return acc + points;
      }, 0);

      if (score > 2) {
        categories.push(category);
      }
    });

    return categories.length > 0 ? categories : [];
  };

  const restoreOriginalBookmarks = useCallback(() => {
    if (originalBookmarks.length === 0) return;

    setBookmarks([...originalBookmarks]);
    const updatedFolders = folders.map((folder) => {
      if (folder.id === "all") return folder;
      return { ...folder, bookmarks: [] };
    });
    setFolders(updatedFolders);
    saveData(originalBookmarks, updatedFolders);
    setOriginalBookmarks([]);
    AsyncStorage.removeItem(STORAGE_KEYS.ORIGINAL_BOOKMARKS);
  }, [originalBookmarks, folders]);

  const findDuplicates = useCallback((): Bookmark[] => {
    const seen = new Set<string>();
    const duplicates: Bookmark[] = [];

    bookmarks.forEach((bookmark) => {
      const key = bookmark.url.toLowerCase();
      if (seen.has(key)) {
        duplicates.push(bookmark);
      } else {
        seen.add(key);
      }
    });

    return duplicates;
  }, [bookmarks]);

  const cleanupBookmarks = useCallback(() => {
    const duplicates = findDuplicates();
    const duplicateIds = new Set(duplicates.map((d) => d.id));

    const updatedBookmarks = bookmarks.filter((b) => !duplicateIds.has(b.id));
    const updatedFolders = folders.map((folder) => ({
      ...folder,
      bookmarks: folder.bookmarks.filter((b) => !duplicateIds.has(b.id)),
    }));

    setBookmarks(updatedBookmarks);
    setFolders(updatedFolders);
    saveData(updatedBookmarks, updatedFolders);

    return duplicates.length;
  }, [bookmarks, folders, findDuplicates]);

  const importBookmarks = useCallback((newBookmarks: Bookmark[]) => {
    setOriginalBookmarks([...bookmarks]);
    AsyncStorage.setItem(STORAGE_KEYS.ORIGINAL_BOOKMARKS, JSON.stringify(bookmarks));

    const updatedBookmarks = [...bookmarks, ...newBookmarks];
    setBookmarks(updatedBookmarks);
    saveData(updatedBookmarks, folders);
  }, [bookmarks, folders]);

  const exportBookmarks = useCallback((format: "html" | "json" = "html"): string => {
    if (format === "json") {
      return JSON.stringify(bookmarks, null, 2);
    }

    let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
    html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
    html += '<TITLE>Bookmarks</TITLE>\n';
    html += '<H1>Bookmarks</H1>\n';
    html += '<DL><p>\n';

    bookmarks.forEach((bookmark) => {
      html += `<DT><A HREF="${bookmark.url}" ADD_DATE="${Date.now()}">${bookmark.title}</A>\n`;
    });

    html += '</DL><p>\n';
    return html;
  }, [bookmarks]);

  const getFilteredBookmarks = useCallback((): Bookmark[] => {
    let displayBookmarks: Bookmark[] = [];

    if (currentFolder === "all") {
      displayBookmarks = bookmarks;
    } else if (currentFolder === "favorites") {
      displayBookmarks = bookmarks.filter((b) => b.favorite);
    } else {
      const folder = folders.find((f) => f.id === currentFolder);
      displayBookmarks = folder ? folder.bookmarks : [];
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      displayBookmarks = displayBookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query) ||
          (b.description && b.description.toLowerCase().includes(query))
      );
    }

    return displayBookmarks;
  }, [bookmarks, folders, currentFolder, searchQuery]);

  const getStats = useCallback(() => {
    // Count all folders including built-in ones (except "all" which is not really a folder)
    // The correct count should be 8: all, favorites, ai, work, study, entertainment, social, news
    const folderCount = folders.length;
    return {
      totalBookmarks: bookmarks.length,
      totalFolders: folderCount,
      totalFavorites: bookmarks.filter((b) => b.favorite).length,
      duplicates: findDuplicates().length,
    };
  }, [bookmarks, folders, findDuplicates]);

  // Delete all folders for a category
  const deleteFoldersByCategory = useCallback((categoryId: string) => {
    const folderIds = folders.filter(f => f.categoryId === categoryId).map(f => f.id);
    
    // Remove folders
    const updatedFolders = folders.filter(f => f.categoryId !== categoryId);
    
    // Remove all bookmarks in these folders
    const updatedBookmarks = bookmarks.filter(b => !folderIds.includes(b.folderId || ''));
    
    setBookmarks(updatedBookmarks);
    setFolders(updatedFolders);
    saveData(updatedBookmarks, updatedFolders);
  }, [bookmarks, folders]);

  // Delete all folders
  const deleteAllFolders = useCallback(() => {
    const updatedFolders = folders.filter(f => f.builtIn);
    // Remove all bookmarks that were in folders
    const updatedBookmarks = bookmarks.filter(b => !b.folderId || folders.find(f => f.id === b.folderId && f.builtIn));
    
    setFolders(updatedFolders);
    setBookmarks(updatedBookmarks);
    saveData(updatedBookmarks, updatedFolders);
  }, [bookmarks, folders]);

  // Get folders for a specific category
  const getFoldersByCategory = useCallback((categoryId: string): BookmarkFolder[] => {
    return folders.filter(f => f.categoryId === categoryId);
  }, [folders]);

  // Get bookmarks for a specific folder
  const getBookmarksByFolder = useCallback((folderId: string): Bookmark[] => {
    return bookmarks.filter(b => b.folderId === folderId);
  }, [bookmarks]);

  // Export specific folder bookmarks
  const exportFolderBookmarks = useCallback((folderId: string, format: "html" | "json" = "html"): string => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return "";
    const list = folderId === "all" ? bookmarks : folderId === "favorites" ? bookmarks.filter(b => b.favorite) : folder.bookmarks;
    if (format === "json") {
      return JSON.stringify(list, null, 2);
    }
    let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
    html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
    html += `<TITLE>Bookmarks - ${folder.name}</TITLE>\n`;
    html += `<H1>Bookmarks - ${folder.name}</H1>\n`;
    html += '<DL><p>\n';
    list.forEach((bookmark) => {
      html += `<DT><A HREF="${bookmark.url}" ADD_DATE="${Date.now()}">${bookmark.title}</A>\n`;
    });
    html += '</DL><p>\n';
    return html;
  }, [folders, bookmarks]);

  // Keep folders in a stable default order
  const ORDER: Record<string, number> = {
    all: 1,
    favorites: 2,
    ai: 3,
    work: 4,
    study: 5,
    entertainment: 6,
    social: 7,
    news: 8,
  };

  const sortFolders = useCallback((arr: BookmarkFolder[]) => {
    return [...arr].sort((a, b) => (ORDER[a.id] ?? 9999) - (ORDER[b.id] ?? 9999));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFolders(prev => sortFolders(prev));
    }, 0);
    return () => clearTimeout(timer);
  }, [sortFolders]);

  return useMemo(() => ({
    bookmarks,
    folders,
    originalBookmarks,
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
    exportFolderBookmarks,
    getFilteredBookmarks,
    getStats,
    findDuplicates,
    deleteFoldersByCategory,
    deleteAllFolders,
    getFoldersByCategory,
    getBookmarksByFolder,
  }), [bookmarks, folders, originalBookmarks, currentFolder, searchQuery, isLoading, setCurrentFolder, setSearchQuery, addBookmark, deleteBookmark, toggleFavorite, addFolder, deleteFolder, editFolder, moveBookmarkToFolder, smartCategorize, restoreOriginalBookmarks, cleanupBookmarks, importBookmarks, exportBookmarks, exportFolderBookmarks, getFilteredBookmarks, getStats, findDuplicates, deleteFoldersByCategory, deleteAllFolders, getFoldersByCategory, getBookmarksByFolder]);
});