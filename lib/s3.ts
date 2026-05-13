import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
const endpoint = process.env.SUPABASE_S3_ENDPOINT;
const region = process.env.SUPABASE_S3_REGION ?? "sa-east-1";

export const isS3Configured = Boolean(accessKeyId && secretAccessKey && endpoint);

export const s3Client = isS3Configured
  ? new S3Client({
    forcePathStyle: true,
    region,
    endpoint: endpoint!,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  })
  : null;

export function requireS3Client() {
  if (!s3Client) {
    throw new Error(
      "Erro interno: as credenciais de armazenamento S3 não estão configuradas corretamente no servidor.",
    );
  }

  return s3Client;
}
