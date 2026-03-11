const DEFAULT_REDIRECTS = {
  tourist: "/app/dashboard",
  guide: "/guides/dashboard",
};

function isSafePath(path: string | null | undefined) {
  return !!path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/api/");
}

export function resolveSafeRedirect(
  candidate: string | null | undefined,
  fallback: string = "/tours",
) {
  if (!isSafePath(candidate)) {
    return fallback;
  }

  return candidate as string;
}

export function getDefaultRedirect(userType: "tourist" | "guide") {
  return DEFAULT_REDIRECTS[userType];
}
