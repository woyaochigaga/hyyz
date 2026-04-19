export type HomeDefaultRoute =
  | "/home"
  | "/home/community"
  | "/home/forum"
  | "/home/exhibition"
  | "/home/ai-chat"
  | "/home/post";

export type HomeThemePreference = "system" | "light" | "dark";
export type HomeEnterBehavior = "send" | "newline";

export type HomePreferences = {
  defaultRoute: HomeDefaultRoute;
  theme: HomeThemePreference;
  aiDefaultDeepThinking: boolean;
  aiAutoExpandReasoning: boolean;
  aiShowFollowups: boolean;
  enterBehavior: HomeEnterBehavior;
  syncHistoryToCloud: boolean;
};

export const HOME_PREFERENCES_STORAGE_KEY = "home:preferences";

export const DEFAULT_HOME_PREFERENCES: HomePreferences = {
  defaultRoute: "/home",
  theme: "system",
  aiDefaultDeepThinking: false,
  aiAutoExpandReasoning: false,
  aiShowFollowups: true,
  enterBehavior: "send",
  syncHistoryToCloud: true,
};

export function normalizeHomePreferences(input: unknown): HomePreferences {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return DEFAULT_HOME_PREFERENCES;
  }

  const value = input as Record<string, unknown>;
  const defaultRoute = String(value.defaultRoute || "").trim();
  const theme = String(value.theme || "").trim();
  const enterBehavior = String(value.enterBehavior || "").trim();

  return {
    defaultRoute:
      defaultRoute === "/home/community" ||
      defaultRoute === "/home/forum" ||
      defaultRoute === "/home/exhibition" ||
      defaultRoute === "/home/ai-chat" ||
      defaultRoute === "/home/post"
        ? (defaultRoute as HomeDefaultRoute)
        : DEFAULT_HOME_PREFERENCES.defaultRoute,
    theme:
      theme === "light" || theme === "dark" || theme === "system"
        ? (theme as HomeThemePreference)
        : DEFAULT_HOME_PREFERENCES.theme,
    aiDefaultDeepThinking:
      typeof value.aiDefaultDeepThinking === "boolean"
        ? value.aiDefaultDeepThinking
        : DEFAULT_HOME_PREFERENCES.aiDefaultDeepThinking,
    aiAutoExpandReasoning:
      typeof value.aiAutoExpandReasoning === "boolean"
        ? value.aiAutoExpandReasoning
        : DEFAULT_HOME_PREFERENCES.aiAutoExpandReasoning,
    aiShowFollowups:
      typeof value.aiShowFollowups === "boolean"
        ? value.aiShowFollowups
        : DEFAULT_HOME_PREFERENCES.aiShowFollowups,
    enterBehavior:
      enterBehavior === "newline"
        ? "newline"
        : DEFAULT_HOME_PREFERENCES.enterBehavior,
    syncHistoryToCloud:
      typeof value.syncHistoryToCloud === "boolean"
        ? value.syncHistoryToCloud
        : DEFAULT_HOME_PREFERENCES.syncHistoryToCloud,
  };
}

export function loadHomePreferences(): HomePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_HOME_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(HOME_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_HOME_PREFERENCES;
    return normalizeHomePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_HOME_PREFERENCES;
  }
}

export function saveHomePreferences(value: HomePreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HOME_PREFERENCES_STORAGE_KEY, JSON.stringify(value));
}
