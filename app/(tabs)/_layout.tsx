import { Tabs } from "expo-router";
import { Home, Star, Mic, Share2, Settings } from "lucide-react-native";
import React, { useMemo } from "react";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";

export default function TabLayout() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  // Force re-render when language changes by using it as a dependency
  const tabOptions = useMemo(() => ({
    home: {
      title: t("home"),
      tabBarIcon: ({ color }: { color: string }) => <Home size={24} color={color} />,
    },
    favorites: {
      title: t("favorites"),
      tabBarIcon: ({ color }: { color: string }) => <Star size={24} color={color} />,
    },
    player: {
      title: t("voice_control"),
      tabBarIcon: ({ color }: { color: string }) => <Mic size={24} color={color} />,
    },
    community: {
      title: t("community_share"),
      tabBarIcon: ({ color }: { color: string }) => <Share2 size={24} color={color} />,
    },
    settings: {
      title: t("settings"),
      tabBarIcon: ({ color }: { color: string }) => <Settings size={24} color={color} />,
    },
  }), [t]);
  
  return (
    <Tabs
      key={language}
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.accent,
        tabBarInactiveTintColor: Colors.primary.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.secondary.bg,
          borderTopColor: Colors.primary.cardBorder,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: Colors.secondary.bg,
          borderBottomColor: Colors.primary.cardBorder,
          borderBottomWidth: 1,
        },
        headerTintColor: Colors.primary.text,
        headerTitleStyle: {
          fontWeight: "600" as const,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={tabOptions.home}
      />
      <Tabs.Screen
        name="favorites"
        options={tabOptions.favorites}
      />
      <Tabs.Screen
        name="player"
        options={tabOptions.player}
      />
      <Tabs.Screen
        name="community"
        options={tabOptions.community}
      />
      <Tabs.Screen
        name="settings"
        options={tabOptions.settings}
      />

    </Tabs>
  );
}