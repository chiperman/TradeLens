import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

/**
 * 获取加密密钥。在生产环境中必须通过环境变量提供 32 字节的十六进制字符串。
 */
function getMasterKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY must be set in production");
    }
    // 开发环境下使用固定密钥
    return Buffer.alloc(KEY_LENGTH, "development-secret-key-tradelens-32");
  }
  return Buffer.from(key, "hex");
}

/**
 * 加密字符串
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getMasterKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // 格式: iv:tag:encrypted (全部为 hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * 解密字符串
 */
export function decrypt(hash: string): string {
  const [ivHex, tagHex, encryptedHex] = hash.split(":");
  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("无效的加密格式");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = getMasterKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
