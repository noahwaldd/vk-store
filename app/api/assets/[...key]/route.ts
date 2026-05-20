import { getImageObjectFromS3, isManagedImageKey } from "@/lib/storage/s3";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    key?: string[];
  }>;
};

function getStatusCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const metadata = "$metadata" in error ? error.$metadata : null;

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const statusCode =
    "httpStatusCode" in metadata ? metadata.httpStatusCode : null;

  return typeof statusCode === "number" ? statusCode : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { key: keySegments = [] } = await context.params;
  const key = keySegments.join("/");

  if (!key || !isManagedImageKey(key)) {
    return new Response("Imagem nao encontrada.", { status: 404 });
  }

  try {
    const object = await getImageObjectFromS3(key);

    if (!object?.Body) {
      return new Response("Imagem nao encontrada.", { status: 404 });
    }

    const body = await object.Body.transformToByteArray();
    const arrayBuffer = body.buffer.slice(
      body.byteOffset,
      body.byteOffset + body.byteLength,
    ) as ArrayBuffer;
    const headers = new Headers({
      "Cache-Control": object.CacheControl ?? "public, max-age=31536000, immutable",
      "Content-Type": object.ContentType ?? "application/octet-stream",
    });

    if (object.ETag) {
      headers.set("ETag", object.ETag);
    }

    return new Response(arrayBuffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    const statusCode = getStatusCode(error);

    if (statusCode === 403 || statusCode === 404) {
      return new Response("Imagem nao encontrada.", { status: 404 });
    }

    return new Response("Nao foi possivel carregar a imagem.", { status: 500 });
  }
}
