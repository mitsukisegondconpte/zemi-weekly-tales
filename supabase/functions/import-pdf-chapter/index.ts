// Edge function: import-pdf-chapter
// Receives a PDF, renders each page to an image, uploads images to storage,
// then asks Lovable AI (Gemini 2.5 Pro vision) to convert the pages into rich HTML
// that references the uploaded images inline.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-ignore - pdfjs types
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379/legacy/build/pdf.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Render a PDF page to PNG bytes using pdfjs + a polyfilled canvas.
// We use @napi-rs/canvas via esm.sh for Deno compatibility.
// To keep things light we use the "skia-canvas" alternative: OffscreenCanvas isn't
// available in Deno edge runtime, so we pull a wasm canvas.
// Simpler approach: use pdfjs's getOperatorList + render to an image via the
// page.render() with a node-canvas factory.
//
// NOTE: rendering full PDF pages to PNG in edge runtime is heavy. We instead
// extract embedded images directly + extract text, then send the *text* + image
// list to Gemini for HTML reconstruction. This is faster, cheaper, and works
// reliably in Deno.

interface ExtractedPage {
  pageNumber: number;
  text: string;
  imageUrls: string[]; // public URLs of images on this page in reading order
}

async function extractPdf(
  pdfBytes: Uint8Array,
  supabase: ReturnType<typeof createClient>,
  uploadPrefix: string,
): Promise<ExtractedPage[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    disableFontFace: true,
    useSystemFonts: false,
  });
  const pdf = await loadingTask.promise;
  const pages: ExtractedPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    // --- TEXT ---
    const textContent = await page.getTextContent();
    let pageText = "";
    let lastY: number | null = null;
    for (const item of textContent.items as any[]) {
      const y = item.transform?.[5];
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) {
        pageText += "\n";
      }
      pageText += item.str + (item.hasEOL ? "\n" : " ");
      if (y !== undefined) lastY = y;
    }
    pageText = pageText.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

    // --- IMAGES ---
    const imageUrls: string[] = [];
    try {
      const ops = await page.getOperatorList();
      const fnArray = ops.fnArray as number[];
      const argsArray = ops.argsArray as any[];
      const PAINT_IMAGE = pdfjsLib.OPS?.paintImageXObject ?? 85;

      for (let i = 0; i < fnArray.length; i++) {
        if (fnArray[i] !== PAINT_IMAGE) continue;
        const imgName = argsArray[i]?.[0];
        if (!imgName) continue;

        let imgObj: any;
        try {
          imgObj = await new Promise((resolve, reject) => {
            try {
              page.objs.get(imgName, (obj: any) => resolve(obj));
            } catch (e) {
              reject(e);
            }
          });
        } catch {
          continue;
        }
        if (!imgObj?.data || !imgObj.width || !imgObj.height) continue;

        // imgObj.data is RGBA or RGB raw pixels. Convert to PNG via a minimal encoder.
        const png = rawToPng(
          imgObj.data,
          imgObj.width,
          imgObj.height,
          imgObj.kind, // 1=GRAYSCALE_1BPP, 2=RGB_24BPP, 3=RGBA_32BPP
        );
        if (!png) continue;

        const path = `${uploadPrefix}/p${pageNum}_${i}.png`;
        const { error: upErr } = await supabase.storage
          .from("chapter-images")
          .upload(path, png, { contentType: "image/png", upsert: true });
        if (upErr) {
          console.warn("img upload failed", upErr.message);
          continue;
        }
        const { data: pub } = supabase.storage.from("chapter-images").getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }
    } catch (e) {
      console.warn("image extraction failed for page", pageNum, e);
    }

    pages.push({ pageNumber: pageNum, text: pageText, imageUrls });
  }

  return pages;
}

// Minimal PNG encoder for RGBA/RGB raw pixel buffers from pdf.js.
// kind: 1 = grayscale 1bpp (packed), 2 = RGB 24bpp, 3 = RGBA 32bpp
function rawToPng(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  kind: number,
): Uint8Array | null {
  // Convert to RGBA first
  let rgba: Uint8Array;
  if (kind === 3 || data.length === width * height * 4) {
    rgba = data instanceof Uint8Array ? data : new Uint8Array(data.buffer);
  } else if (kind === 2 || data.length === width * height * 3) {
    rgba = new Uint8Array(width * height * 4);
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i + 1];
      rgba[j + 2] = data[i + 2];
      rgba[j + 3] = 255;
    }
  } else {
    // Unsupported (e.g. 1bpp packed) — skip
    return null;
  }

  return encodePng(rgba, width, height);
}

// Tiny PNG encoder (uncompressed via deflate stored blocks)
function encodePng(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Build raw scanlines with filter byte 0
  const rowSize = width * 4 + 1;
  const raw = new Uint8Array(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * rowSize + 1);
  }

  const compressed = deflateStore(raw);

  // IDAT
  // CRC
  const crcTable = makeCrcTable();

  function chunk(type: string, data: Uint8Array): Uint8Array {
    const len = data.length;
    const out = new Uint8Array(8 + len + 4);
    const v = new DataView(out.buffer);
    v.setUint32(0, len);
    out[4] = type.charCodeAt(0);
    out[5] = type.charCodeAt(1);
    out[6] = type.charCodeAt(2);
    out[7] = type.charCodeAt(3);
    out.set(data, 8);
    const crc = crc32(out.subarray(4, 8 + len), crcTable);
    v.setUint32(8 + len, crc >>> 0);
    return out;
  }

  const ihdrChunk = chunk("IHDR", ihdr);
  const idatChunk = chunk("IDAT", compressed);
  const iendChunk = chunk("IEND", new Uint8Array(0));

  const out = new Uint8Array(sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length);
  let off = 0;
  out.set(sig, off); off += sig.length;
  out.set(ihdrChunk, off); off += ihdrChunk.length;
  out.set(idatChunk, off); off += idatChunk.length;
  out.set(iendChunk, off);
  return out;
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}
function crc32(buf: Uint8Array, table: Uint32Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// zlib stream containing only stored (uncompressed) deflate blocks
function deflateStore(data: Uint8Array): Uint8Array {
  const MAX = 65535;
  const numBlocks = Math.max(1, Math.ceil(data.length / MAX));
  const out = new Uint8Array(2 + numBlocks * 5 + data.length + 4);
  let p = 0;
  out[p++] = 0x78; // CMF
  out[p++] = 0x01; // FLG
  for (let i = 0; i < data.length; i += MAX) {
    const len = Math.min(MAX, data.length - i);
    const last = (i + len) >= data.length ? 1 : 0;
    out[p++] = last;
    out[p++] = len & 0xff;
    out[p++] = (len >>> 8) & 0xff;
    out[p++] = (~len) & 0xff;
    out[p++] = ((~len) >>> 8) & 0xff;
    out.set(data.subarray(i, i + len), p);
    p += len;
  }
  // Adler-32
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = ((b << 16) | a) >>> 0;
  const dv = new DataView(out.buffer);
  dv.setUint32(p, adler);
  p += 4;
  return out.subarray(0, p);
}

async function callAiForHtml(pages: ExtractedPage[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Build a structured input the model can transform into HTML
  const pageBlocks = pages.map((p) => {
    const imgs = p.imageUrls.length
      ? "\nIMAJ KI SOU PAJ SA A (mete yo nan bon plas nan tèks la):\n" +
        p.imageUrls.map((u, i) => `[IMG_${p.pageNumber}_${i}] ${u}`).join("\n")
      : "";
    return `--- PAJ ${p.pageNumber} ---\n${p.text || "(pa gen tèks)"}${imgs}`;
  }).join("\n\n");

  const systemPrompt = `Ou se yon asistan ki konvèti kontni PDF an HTML rich pou yon platfòm lekti woman.
Règ yo:
- Itilize sèlman tag sa yo: <h1>, <h2>, <h3>, <p>, <strong>, <em>, <u>, <ul>, <ol>, <li>, <blockquote>, <br>, <img>.
- Detekte tit chapit (mete <h1>) ak soutit (<h2>, <h3>).
- Chak paragraf nan yon <p>. Pa kole tout ansanm.
- Kenbe gra/italik si w wè endikasyon (eg MAJUSKILE, *etwal*, e.t.l.) men pa egzajere.
- Lè ou wè yon referans tankou [IMG_X_Y], ranplase l ak <p><img src="URL" alt="Imaj" /></p> kote URL la se URL ki vini apre referans la nan lis la.
- Mete imaj yo nan plas ki gen sans nan istwa a (toupre tèks ki dekri sèn nan).
- Pa enkli tag <html>, <body>, <head>, <style>, ni <script>.
- Pa enkli kòmantè, eksplikasyon, oswa markdown. Sèlman HTML.
- Korije OCR/extraksyon erè evidan (mo kase, espas an plis) san chanje sans la.
- Si tèks la vid, sèvi sèlman ak imaj yo.
Repons ou: SÈLMAN HTML lan, anyen ankò.`;

  const userPrompt = `Men kontni PDF la ekstrè paj pa paj. Konvèti l an HTML pwòp pou yon chapit woman:\n\n${pageBlocks}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Twòp demann. Tann yon ti moman epi reseye.");
    if (resp.status === 402) throw new Error("Kredi AI fini. Ajoute kredi nan workspace ou.");
    const t = await resp.text();
    throw new Error(`AI gateway erè ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  let html: string = data?.choices?.[0]?.message?.content ?? "";
  // Strip code fences if model wrapped them
  html = html.trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return html;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json(405, { error: "Method not allowed" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Authn user
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "Pa otantifye" });

    // Authz: must be admin
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return json(403, { error: "Sèlman admin ka enpòte PDF" });

    // Parse body { fileBase64, fileName }
    const body = await req.json().catch(() => null);
    if (!body?.fileBase64 || typeof body.fileBase64 !== "string") {
      return json(400, { error: "fileBase64 obligatwa" });
    }

    // Decode base64
    const base64 = body.fileBase64.replace(/^data:application\/pdf;base64,/, "");
    const bin = atob(base64);
    const pdfBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) pdfBytes[i] = bin.charCodeAt(i);

    if (pdfBytes.length > 20 * 1024 * 1024) {
      return json(400, { error: "PDF twò gwo (max 20MB)" });
    }

    // Service-role client for storage uploads
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

    const uploadPrefix = `pdf-imports/${userData.user.id}/${Date.now()}`;
    const pages = await extractPdf(pdfBytes, adminClient, uploadPrefix);

    if (pages.length === 0) {
      return json(400, { error: "PDF la pa gen okenn paj lizib" });
    }

    const totalImages = pages.reduce((s, p) => s + p.imageUrls.length, 0);
    const totalChars = pages.reduce((s, p) => s + p.text.length, 0);

    const html = await callAiForHtml(pages);

    return json(200, {
      html,
      stats: {
        pages: pages.length,
        images: totalImages,
        characters: totalChars,
      },
    });
  } catch (e) {
    console.error("import-pdf-chapter error:", e);
    const msg = e instanceof Error ? e.message : "Erè enkoni";
    return json(500, { error: msg });
  }
});
