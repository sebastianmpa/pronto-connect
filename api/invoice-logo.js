const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

function getSingleQueryValue(value) {
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

async function getDriveImage(fileId) {
  const id = encodeURIComponent(fileId);

  // Server-side requests are not subject to the browser CORS restriction that
  // blocks Google Drive from localhost/Vercel pages.
  const candidates = [
    `https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 ProntoConnect-InvoiceLogo/1.0",
        },
      });

      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("image/")) continue;

      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) continue;

      return { bytes, contentType };
    } catch {
      // Try the next Google Drive representation.
    }
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed." });
  }

  const id = getSingleQueryValue(req.query?.id).trim();

  // Accept only a Google Drive file id. This intentionally avoids turning the
  // endpoint into a generic URL proxy.
  if (!DRIVE_ID_PATTERN.test(id)) {
    return res.status(400).json({ message: "Invalid Google Drive file id." });
  }

  const image = await getDriveImage(id);

  if (!image) {
    return res.status(404).json({ message: "Store logo could not be loaded." });
  }

  res.setHeader("Content-Type", image.contentType);
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  return res.status(200).send(image.bytes);
}
