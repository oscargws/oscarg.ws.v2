import fs from "fs";
import path from "path";
import sharp from "sharp";

const COVERS_DIR = path.join(process.cwd(), "public", "records", "covers");
const CACHE_FILE = path.join(process.cwd(), "src", "app", "records", "lib", "discogs-cache.json");

interface Record {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  localCover: string;
  isLabelImage?: boolean;
  genre?: string;
}

async function isVinylLabelImage(filepath: string): Promise<boolean> {
  try {
    const image = sharp(filepath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) return false;

    const sampleSize = 5;
    const corners = [
      { left: 0, top: 0 },
      { left: width - sampleSize, top: 0 },
      { left: 0, top: height - sampleSize },
      { left: width - sampleSize, top: height - sampleSize },
    ];

    const cornerColors: { r: number; g: number; b: number }[] = [];

    for (const corner of corners) {
      const region = await image
        .clone()
        .extract({ left: corner.left, top: corner.top, width: sampleSize, height: sampleSize })
        .raw()
        .toBuffer();

      let r = 0, g = 0, b = 0;
      const pixelCount = sampleSize * sampleSize;
      const channels = region.length / pixelCount;

      for (let i = 0; i < pixelCount; i++) {
        r += region[i * channels];
        g += region[i * channels + 1];
        b += region[i * channels + 2];
      }

      cornerColors.push({
        r: Math.round(r / pixelCount),
        g: Math.round(g / pixelCount),
        b: Math.round(b / pixelCount),
      });
    }

    const tolerance = 20;
    const baseColor = cornerColors[0];

    for (let i = 1; i < cornerColors.length; i++) {
      const diff = Math.abs(cornerColors[i].r - baseColor.r) +
                   Math.abs(cornerColors[i].g - baseColor.g) +
                   Math.abs(cornerColors[i].b - baseColor.b);

      if (diff > tolerance * 3) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.warn(`Error analyzing image ${filepath}:`, error);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(CACHE_FILE)) {
    console.error("Cache file not found. Run the build first.");
    process.exit(1);
  }

  const records: Record[] = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  let labelCount = 0;

  console.log(`Analyzing ${records.length} cover images...`);

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const filename = `${record.id}.jpg`;
    const filepath = path.join(COVERS_DIR, filename);

    if (fs.existsSync(filepath)) {
      const isLabel = await isVinylLabelImage(filepath);
      record.isLabelImage = isLabel;

      if (isLabel) {
        labelCount++;
        console.log(`  [LABEL] ${record.title} - ${record.artist}`);
      }
    } else {
      record.isLabelImage = false;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  Processed ${i + 1}/${records.length}`);
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(records, null, 2));
  console.log(`\nDone! Found ${labelCount} vinyl label images out of ${records.length} total.`);
}

main();
