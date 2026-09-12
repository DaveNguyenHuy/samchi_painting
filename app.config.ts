import type { ConfigContext, ExpoConfig } from "expo/config";

// app.config.ts runs in Node during prebuild. Expo only transpiles THIS file,
// so it must stay self-contained (no relative imports) and only touch the one
// Node global we declare here.
declare const process: { env: Record<string, string | undefined> };

type Family = {
  /** shown under the app icon */
  name: string;
  /** iOS bundle id + Android package — must be unique per family so the builds
   *  can be installed side by side */
  bundleId: string;
  /** greeting on the Home screen */
  welcome: string;
  /** one image, 1024×1024, used for BOTH the app icon and the splash.
   *  Path is relative to the project root. */
  image: string;
  /** splash + icon background colour (default #FFF9F0) */
  background?: string;
};

// ── add a family here, then:  ./scripts/build-ipa.sh <key> ────────────────────
const FAMILIES: Record<string, Family> = {
  mo: {
    name: "Bé Mỡ painting",
    bundleId: "com.davenguyenhuy.paint.mo",
    welcome: "Chào Mỡ!",
    image: "./families/mo.png",
  },
  dau: {
    name: "Đậu&Voi painting",
    bundleId: "com.davenguyenhuy.paint.dau",
    welcome: "Chào Đậu và Voi!",
    image: "./families/dau.png",
  },
  han: {
    name: "Hân&Thiện painting",
    bundleId: "com.davenguyenhuy.paint.han",
    welcome: "Chào Hân và Thiện!",
    image: "./families/han.png",
  },
};

/** greeting for the base app (no family) */
const DEFAULT_WELCOME = "Chào Linh Chi & Linh Sam!";
const DEFAULT_BG = "#FFF9F0";

const key = (process.env.APP_FAMILY ?? "").trim().toLowerCase();
const family = key && key !== "default" ? FAMILIES[key] : undefined;

if (key && key !== "default" && !family) {
  const known =
    Object.keys(FAMILIES).join(", ") || "(none yet — add one to app.config.ts)";
  throw new Error(
    `APP_FAMILY="${key}" is not defined in app.config.ts. Known: ${known}`,
  );
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  const welcome = family?.welcome ?? DEFAULT_WELCOME;

  if (!family) {
    return { ...base, extra: { ...base.extra, family: "default", welcome } };
  }

  const { image } = family;
  const background = family.background ?? DEFAULT_BG;
  const suffix = key.replace(/[^a-z0-9]/g, "");

  const plugins = (base.plugins ?? []).map((plugin) =>
    Array.isArray(plugin) && plugin[0] === "expo-splash-screen"
      ? [
          "expo-splash-screen",
          {
            ...(plugin[1] as Record<string, unknown>),
            image,
            backgroundColor: background,
          },
        ]
      : plugin,
  ) as ExpoConfig["plugins"];

  return {
    ...base,
    name: family.name,
    scheme: `vecung${suffix}`,
    icon: image,
    plugins,
    ios: { ...base.ios, bundleIdentifier: family.bundleId },
    android: {
      ...base.android,
      package: family.bundleId,
      adaptiveIcon: {
        ...base.android?.adaptiveIcon,
        foregroundImage: image,
        backgroundColor: background,
      },
    },
    extra: { ...base.extra, family: key, welcome },
  };
};
