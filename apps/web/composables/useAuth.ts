type OAuthProvider = "google" | "github";
type UserType = "tourist" | "guide" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  user_type: UserType;
  name: string;
  phone: string | null;
}

export interface GuideProfile {
  id: string;
  user_id: string;
  name: string;
  city: string;
  contact_email: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
}

type SignupOptions = {
  email: string;
  password: string;
  name: string;
  userType?: "tourist" | "guide";
  redirectTo?: string;
};

type GuideOnboardingInput = {
  name: string;
  city: string;
  contact_email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
};

function cleanText(value: string | null | undefined) {
  return value?.trim() || "";
}

function normaliseEmail(value: string) {
  return cleanText(value).toLowerCase();
}

function mapUser(row: Record<string, any>): AuthUser {
  return {
    id: row.id,
    email: row.email,
    user_type: row.user_type,
    name: row.name,
    phone: row.phone,
  };
}

function mapGuide(row: Record<string, any>): GuideProfile {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    city: row.city,
    contact_email: row.contact_email,
    phone: row.phone,
    bio: row.bio,
    avatar_url: row.avatar_url,
  };
}

export function useAuth() {
  const user = useState<AuthUser | null>("auth-user", () => null);
  const guideProfile = useState<GuideProfile | null>("guide-profile", () => null);
  const loading = useState("auth-loading", () => false);
  const initialized = useState("auth-initialized", () => false);

  function getSupabase() {
    const client = useSupabase();
    if (!client) {
      throw new Error("supabase client not available");
    }
    return client;
  }

  async function refreshProfile(authUserId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, user_type, name, phone")
      .eq("id", authUserId)
      .single();

    if (error) {
      throw new Error("failed to load account profile");
    }

    user.value = mapUser(data);
    return user.value;
  }

  async function fetchGuideProfile() {
    if (!user.value) {
      guideProfile.value = null;
      return null;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("guides")
      .select("id, user_id, name, city, contact_email, phone, bio, avatar_url")
      .eq("user_id", user.value.id)
      .maybeSingle();

    if (error) {
      throw new Error("failed to load guide profile");
    }

    guideProfile.value = data ? mapGuide(data) : null;

    if (user.value && guideProfile.value && user.value.user_type !== "guide") {
      user.value = { ...user.value, user_type: "guide" };
    }

    return guideProfile.value;
  }

  async function fetchUser() {
    const supabase = getSupabase();
    loading.value = true;

    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (!authUser) {
        user.value = null;
        guideProfile.value = null;
        return null;
      }

      const profile = await refreshProfile(authUser.id);
      await fetchGuideProfile();

      return profile;
    } catch (error) {
      console.error("[auth] fetch user failed", error);
      user.value = null;
      guideProfile.value = null;
      return null;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function signin(email: string, password: string) {
    const supabase = getSupabase();
    const safeEmail = normaliseEmail(email);

    if (!safeEmail) throw new Error("email is required");
    if (!password) throw new Error("password is required");

    const { error } = await supabase.auth.signInWithPassword({
      email: safeEmail,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("invalid login")) {
        throw new Error("invalid email or password");
      }
      throw new Error(error.message);
    }

    const profile = await fetchUser();
    if (!profile) {
      throw new Error("failed to load account profile");
    }

    return profile;
  }

  async function signup(options: SignupOptions) {
    const supabase = getSupabase();
    const email = normaliseEmail(options.email);
    const name = cleanText(options.name);
    const password = options.password;
    const userType = options.userType || "tourist";

    if (!email) throw new Error("email is required");
    if (!name || name.length < 2) throw new Error("name must be at least 2 characters");
    if (!password || password.length < 8) {
      throw new Error("password must be at least 8 characters");
    }

    const redirectTarget = userType === "guide" ? "/guides/onboarding" : "/app/dashboard";
    const next = resolveSafeRedirect(options.redirectTo, redirectTarget);
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          user_type: userType,
        },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        throw new Error("this email is already registered. please log in instead.");
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("signup failed");
    }

    if (!data.session) {
      return {
        id: data.user.id,
        email: data.user.email || email,
        user_type: userType,
        name,
        phone: null,
      } satisfies AuthUser;
    }

    const profile = await fetchUser();
    if (!profile) {
      throw new Error("failed to load account profile");
    }

    return profile;
  }

  async function signout() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    user.value = null;
    guideProfile.value = null;
  }

  async function requestPasswordReset(email: string, redirectTo?: string) {
    const supabase = getSupabase();
    const safeEmail = normaliseEmail(email);

    if (!safeEmail) throw new Error("email is required");

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("mode", "reset");
    callbackUrl.searchParams.set("next", resolveSafeRedirect(redirectTo, "/app/dashboard"));

    const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
      redirectTo: callbackUrl.toString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async function updatePassword(newPassword: string) {
    const supabase = getSupabase();

    if (!newPassword || newPassword.length < 8) {
      throw new Error("password must be at least 8 characters");
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      throw new Error(error.message);
    }
  }

  async function updateProfile(updates: { name?: string; phone?: string }) {
    if (!user.value) {
      throw new Error("not authenticated");
    }

    const supabase = getSupabase();
    const { error } = await supabase.rpc("update_account_profile", {
      next_name: cleanText(updates.name || user.value.name),
      next_phone: updates.phone !== undefined ? cleanText(updates.phone) || null : user.value.phone,
    });

    if (error) {
      throw new Error(error.message);
    }

    await fetchUser();
  }

  async function completeGuideOnboarding(input: GuideOnboardingInput) {
    if (!user.value) {
      throw new Error("not authenticated");
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("become_guide", {
      guide_name: cleanText(input.name),
      guide_city: cleanText(input.city),
      guide_contact_email: normaliseEmail(input.contact_email),
      guide_phone: cleanText(input.phone) || null,
      guide_bio: cleanText(input.bio) || null,
      guide_avatar_url: cleanText(input.avatar_url) || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    guideProfile.value = mapGuide(data);
    user.value = { ...user.value, user_type: "guide", name: guideProfile.value.name };

    return guideProfile.value;
  }

  async function checkIsGuide() {
    if (!user.value) {
      return false;
    }

    if (guideProfile.value) {
      return true;
    }

    return !!(await fetchGuideProfile());
  }

  async function signinWithOAuth(provider: OAuthProvider, redirectTo?: string, userType?: "tourist" | "guide") {
    const supabase = getSupabase();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set(
      "next",
      resolveSafeRedirect(
        redirectTo,
        userType === "guide" ? "/guides/onboarding" : "/app/dashboard",
      ),
    );

    if (userType) {
      callbackUrl.searchParams.set("intent", userType);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const isAuthenticated = computed(() => !!user.value);
  const isGuide = computed(() => !!guideProfile.value);
  const isTourist = computed(() => !!user.value && !guideProfile.value);
  const isAdmin = computed(() => user.value?.user_type === "admin");

  return {
    user,
    guideProfile,
    loading,
    initialized,
    fetchUser,
    fetchGuideProfile,
    signin,
    signup,
    signout,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    completeGuideOnboarding,
    checkIsGuide,
    signinWithOAuth,
    isAuthenticated,
    isGuide,
    isTourist,
    isAdmin,
  };
}
