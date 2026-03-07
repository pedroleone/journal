import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getR2Bucket() {
  return getEnv("R2_BUCKET");
}

export function getR2Client() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: getEnv("R2_ENDPOINT"),
      forcePathStyle: process.env.R2_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: getEnv("R2_ACCESS_KEY"),
        secretAccessKey: getEnv("R2_SECRET_KEY"),
      },
    });
  }

  return client;
}

export async function putEncryptedObject(input: {
  key: string;
  body: Uint8Array;
  iv: string;
  contentType?: string;
}) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType ?? "application/octet-stream",
      Metadata: {
        iv: input.iv,
      },
    }),
  );
}

async function readBody(body: unknown): Promise<Uint8Array> {
  if (!body) return new Uint8Array();

  if (
    typeof body === "object" &&
    body !== null &&
    "transformToByteArray" in body &&
    typeof body.transformToByteArray === "function"
  ) {
    return new Uint8Array(await body.transformToByteArray());
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "arrayBuffer" in body &&
    typeof body.arrayBuffer === "function"
  ) {
    return new Uint8Array(await body.arrayBuffer());
  }

  throw new Error("Unsupported R2 response body");
}

export async function getEncryptedObject(key: string) {
  const result = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    }),
  );

  return {
    body: await readBody(result.Body),
    iv: result.Metadata?.iv ?? "",
    contentType: result.ContentType ?? "application/octet-stream",
  };
}

export async function deleteEncryptedObject(key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    }),
  );
}
