import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 256;

type ParsedPasswordHash = {
  cost: number;
  blockSize: number;
  parallelization: number;
  keyLength: number;
  salt: string;
  digest: string;
};

export function isValidPasswordInput(password?: string | null) {
  return Boolean(
    password &&
      password.length >= MIN_PASSWORD_LENGTH &&
      password.length <= MAX_PASSWORD_LENGTH,
  );
}

export async function hashPassword(password: string) {
  if (!isValidPasswordInput(password)) {
    throw new Error("A senha deve ter entre 12 e 256 caracteres.");
  }

  const salt = randomBytes(24).toString("base64url");
  const digest = await derivePassword(password, salt, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
    keyLength: SCRYPT_KEY_LENGTH,
  });

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    SCRYPT_KEY_LENGTH,
    salt,
    digest.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const parsedHash = parsePasswordHash(storedHash);

  if (!parsedHash || !isValidPasswordInput(password)) {
    return false;
  }

  const digest = await derivePassword(password, parsedHash.salt, parsedHash);
  const storedDigest = Buffer.from(parsedHash.digest, "base64url");

  if (digest.length !== storedDigest.length) {
    return false;
  }

  return timingSafeEqual(digest, storedDigest);
}

function parsePasswordHash(storedHash: string): ParsedPasswordHash | null {
  const [algorithm, cost, blockSize, parallelization, keyLength, salt, digest] =
    storedHash.split("$");

  if (algorithm !== "scrypt" || !cost || !blockSize || !parallelization || !keyLength || !salt || !digest) {
    return null;
  }

  return {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
    keyLength: Number(keyLength),
    salt,
    digest,
  };
}

async function derivePassword(
  password: string,
  salt: string,
  options: Omit<ParsedPasswordHash, "salt" | "digest">,
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      options.keyLength,
      {
        N: options.cost,
        r: options.blockSize,
        p: options.parallelization,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}
