import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const region = process.env.AWS_REGION ?? "us-east-1";
const bucket = process.env.AWS_S3_BUCKET;

const s3Client = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

function requireS3Bucket() {
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET não configurado.");
  }

  return bucket;
}

export function isManagedImageKey(key: string) {
  return (
    !key.includes("..") &&
    (key.startsWith("products/") ||
      key.startsWith("site/login/") ||
      key.startsWith("site/hero/") ||
      key.startsWith("site/categories/"))
  );
}

function getAssetUrl(key: string) {
  return `/api/assets/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function uploadImageToS3(file: File, folder = "products") {
  if (!file.size) {
    return null;
  }

  if (file.size > maxImageSize) {
    throw new Error("A imagem pode ter no máximo 5MB.");
  }

  const extension = allowedImageTypes.get(file.type);

  if (!extension) {
    throw new Error("Use imagens JPG, PNG, WebP ou AVIF.");
  }

  const key = `${folder}/${crypto.randomUUID()}.${extension}`;

  if (!isManagedImageKey(key)) {
    throw new Error("Pasta de imagem inválida.");
  }

  const body = Buffer.from(await file.arrayBuffer());

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: requireS3Bucket(),
        Key: key,
        Body: body,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch {
    throw new Error(
      "Não foi possível salvar a imagem. Verifique a configuração do armazenamento.",
    );
  }

  return {
    key,
    url: getAssetUrl(key),
  };
}

export async function getImageObjectFromS3(key: string) {
  if (!isManagedImageKey(key)) {
    return null;
  }

  return s3Client.send(
    new GetObjectCommand({
      Bucket: requireS3Bucket(),
      Key: key,
    }),
  );
}

export function uploadProductImageToS3(file: File) {
  return uploadImageToS3(file, "products");
}

export function uploadLoginImageToS3(file: File) {
  return uploadImageToS3(file, "site/login");
}

export function uploadHeroImageToS3(file: File) {
  return uploadImageToS3(file, "site/hero");
}

export function uploadCategoryImageToS3(file: File) {
  return uploadImageToS3(file, "site/categories");
}
