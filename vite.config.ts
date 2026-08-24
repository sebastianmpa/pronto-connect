// @ts-nocheck
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

async function fetchDriveLogo(
  fileId: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const id = encodeURIComponent(fileId);
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

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) continue;

      return { bytes, contentType };
    } catch {
      // Try the next Google Drive representation.
    }
  }

  return null;
}

function invoiceLogoDevProxy(): Plugin {
  return {
    name: "invoice-logo-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/invoice-logo", async (req, res) => {
        try {
          const requestUrl = new URL(req.url || "/", "http://localhost");
          const id = (requestUrl.searchParams.get("id") || "").trim();

          if (!DRIVE_ID_PATTERN.test(id)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Invalid Google Drive file id." }));
            return;
          }

          const image = await fetchDriveLogo(id);

          if (!image) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Store logo could not be loaded." }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", image.contentType);
          res.setHeader("Cache-Control", "no-store");
          res.end(image.bytes);
        } catch (error) {
          console.error("Invoice logo proxy error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Invoice logo proxy failed." }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    invoiceLogoDevProxy(),
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === "EVAL" &&
          warning.id?.includes("@react-jvectormap")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
