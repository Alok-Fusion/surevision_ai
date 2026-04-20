import { AppError } from "../middleware/error";
import { User, type IUser } from "../models/User";
import { decryptSecret, encryptSecret } from "../utils/secrets";

type SettingsUser = IUser & {
  geminiApiKeyCiphertext?: string | null;
};

async function getSettingsUser(userId: string) {
  const user = await User.findById(userId).select("+geminiApiKeyCiphertext");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user as SettingsUser;
}

export async function getUserSettings(userId: string) {
  const user = await getSettingsUser(userId);

  return {
    profile: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      notificationsEnabled: user.notificationsEnabled,
      companyName: user.companyName ?? "",
      phone: user.phone ?? "",
      socials: user.socials ?? "",
      createdAt: user.createdAt,
      hasPersonalGeminiKey: Boolean(user.geminiApiKeyCiphertext),
      geminiKeyLast4: user.geminiApiKeyLast4 ?? null,
      geminiKeyUpdatedAt: user.geminiApiKeyUpdatedAt ?? null
    }
  };
}

export async function getUserGeminiApiKey(userId: string) {
  const user = await getSettingsUser(userId);
  if (!user.geminiApiKeyCiphertext) {
    return undefined;
  }

  try {
    return decryptSecret(user.geminiApiKeyCiphertext);
  } catch {
    throw new AppError("Stored Gemini API key could not be decrypted", 500);
  }
}

export async function storeUserGeminiApiKey(userId: string, apiKey: string) {
  const user = await getSettingsUser(userId);
  user.geminiApiKeyCiphertext = encryptSecret(apiKey);
  user.geminiApiKeyLast4 = apiKey.slice(-4);
  user.geminiApiKeyUpdatedAt = new Date();
  await user.save();

  return getUserSettings(userId);
}

export async function removeUserGeminiApiKey(userId: string) {
  const user = await getSettingsUser(userId);
  user.geminiApiKeyCiphertext = null;
  user.geminiApiKeyLast4 = null;
  user.geminiApiKeyUpdatedAt = null;
  await user.save();

  return getUserSettings(userId);
}
