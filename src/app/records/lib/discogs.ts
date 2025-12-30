import fs from "fs";
import path from "path";
import sharp from "sharp";

export interface Record {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  localCover: string;
  isLabelImage?: boolean;
  genre?: string;
}

interface DiscogsRelease {
  id: number;
  instance_id: number;
  basic_information: {
    id: number;
    title: string;
    year: number;
    thumb: string;
    cover_image: string;
    artists: Array<{ name: string }>;
    genres: string[];
    styles: string[];
  };
}

interface DiscogsResponse {
  pagination: {
    pages: number;
    page: number;
    per_page: number;
    items: number;
  };
  releases: DiscogsRelease[];
}

const DISCOGS_USERNAME = "oggadog";
const DISCOGS_API_BASE = "https://api.discogs.com";
const COVERS_DIR = path.join(process.cwd(), "public", "records", "covers");
const CACHE_FILE = path.join(process.cwd(), "src", "app", "records", "lib", "discogs-cache.json");

async function downloadImage(url: string, filename: string): Promise<boolean> {
  try {
    const filepath = path.join(COVERS_DIR, filename);

    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
      return true;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "OscarGWS/1.0",
      },
    });

    if (!response.ok) {
      console.warn(`Failed to download image: ${url}`);
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    return true;
  } catch (error) {
    console.warn(`Error downloading image ${url}:`, error);
    return false;
  }
}

// Analyze image to detect if it's a vinyl label photo (circular label on black background)
// Returns true if all 4 corners have similar colors (indicating vinyl label image)
async function isVinylLabelImage(filepath: string): Promise<boolean> {
  try {
    const image = sharp(filepath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) return false;

    // Sample 5x5 pixel areas at each corner
    const sampleSize = 5;
    const corners = [
      { left: 0, top: 0 }, // Top-left
      { left: width - sampleSize, top: 0 }, // Top-right
      { left: 0, top: height - sampleSize }, // Bottom-left
      { left: width - sampleSize, top: height - sampleSize }, // Bottom-right
    ];

    const cornerColors: { r: number; g: number; b: number }[] = [];

    for (const corner of corners) {
      // Extract a small region and get its average color
      const region = await image
        .clone()
        .extract({ left: corner.left, top: corner.top, width: sampleSize, height: sampleSize })
        .raw()
        .toBuffer();

      // Calculate average RGB of the 5x5 sample
      let r = 0, g = 0, b = 0;
      const pixelCount = sampleSize * sampleSize;
      const channels = region.length / pixelCount; // 3 for RGB, 4 for RGBA

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

    // Check if all corners are within tolerance of each other
    const tolerance = 20;
    const baseColor = cornerColors[0];

    for (let i = 1; i < cornerColors.length; i++) {
      const diff = Math.abs(cornerColors[i].r - baseColor.r) +
                   Math.abs(cornerColors[i].g - baseColor.g) +
                   Math.abs(cornerColors[i].b - baseColor.b);

      if (diff > tolerance * 3) {
        return false; // Corners are too different
      }
    }

    // All corners are similar - likely a vinyl label image
    return true;
  } catch (error) {
    console.warn(`Error analyzing image ${filepath}:`, error);
    return false;
  }
}

export async function fetchDiscogsCollection(forceRefresh = false): Promise<Record[]> {
  // Check for cached data first (useful for dev to avoid rate limiting)
  // Skip cache if DISCOGS_LIVE=true env var is set or forceRefresh is true
  const useLive = process.env.DISCOGS_LIVE === "true" || forceRefresh;

  if (!useLive && fs.existsSync(CACHE_FILE)) {
    console.log("Using cached Discogs data");
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as Record[];
    return cached;
  }

  if (useLive) {
    console.log("Fetching live data from Discogs API...");
  }

  const token = process.env.DISCOGS_TOKEN;

  if (!token) {
    console.warn("DISCOGS_TOKEN not set, using mock data");
    return getMockRecords();
  }

  // Ensure covers directory exists
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }

  const allRecords: Record[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${DISCOGS_API_BASE}/users/${DISCOGS_USERNAME}/collection/folders/0/releases?page=${page}&per_page=100&sort=added&sort_order=desc`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Discogs token=${token}`,
        "User-Agent": "OscarGWS/1.0",
      },
    });

    if (!response.ok) {
      console.error(`Discogs API error: ${response.status} - possibly rate limited`);
      // Return what we have so far, or mock data if nothing
      if (allRecords.length > 0) {
        return allRecords;
      }
      return getMockRecords();
    }

    const data: DiscogsResponse = await response.json();
    totalPages = data.pagination.pages;

    for (const release of data.releases) {
      const info = release.basic_information;
      const filename = `${release.instance_id}.jpg`;
      const filepath = path.join(COVERS_DIR, filename);

      // Download cover image
      const imageUrl = info.cover_image || info.thumb;
      await downloadImage(imageUrl, filename);

      // Analyze if this is a vinyl label image
      const isLabel = await isVinylLabelImage(filepath);

      allRecords.push({
        id: release.instance_id,
        title: info.title,
        artist: info.artists.map((a) => a.name).join(", "),
        year: info.year,
        coverUrl: info.cover_image,
        localCover: `/records/covers/${filename}`,
        isLabelImage: isLabel,
        genre: info.genres?.[0] || info.styles?.[0] || "Unknown",
      });
    }

    page++;
    console.log(`Fetched page ${page - 1} of ${totalPages}`);

    // Rate limiting - Discogs allows 60 requests/minute
    if (page <= totalPages) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Cache the results for development
  fs.writeFileSync(CACHE_FILE, JSON.stringify(allRecords, null, 2));
  console.log(`Downloaded and cached ${allRecords.length} records`);

  return allRecords;
}

// Mock data for development without API token
function getMockRecords(): Record[] {
  const mockAlbums = [
    { title: "Random Access Memories", artist: "Daft Punk", year: 2013 },
    { title: "In Rainbows", artist: "Radiohead", year: 2007 },
    { title: "Currents", artist: "Tame Impala", year: 2015 },
    { title: "Channel Orange", artist: "Frank Ocean", year: 2012 },
    { title: "To Pimp a Butterfly", artist: "Kendrick Lamar", year: 2015 },
    { title: "Blonde", artist: "Frank Ocean", year: 2016 },
    { title: "OK Computer", artist: "Radiohead", year: 1997 },
    { title: "Discovery", artist: "Daft Punk", year: 2001 },
    { title: "The Dark Side of the Moon", artist: "Pink Floyd", year: 1973 },
    { title: "Abbey Road", artist: "The Beatles", year: 1969 },
    { title: "Rumours", artist: "Fleetwood Mac", year: 1977 },
    { title: "Born to Run", artist: "Bruce Springsteen", year: 1975 },
  ];

  return mockAlbums.map((album, index) => ({
    id: index + 1,
    title: album.title,
    artist: album.artist,
    year: album.year,
    coverUrl: `https://placehold.co/600x600/1a1a1a/ffffff?text=${encodeURIComponent(album.title.slice(0, 10))}`,
    localCover: `https://placehold.co/600x600/1a1a1a/ffffff?text=${encodeURIComponent(album.title.slice(0, 10))}`,
    isLabelImage: false,
    genre: "Electronic",
  }));
}
