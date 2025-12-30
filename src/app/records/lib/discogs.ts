import fs from "fs";
import path from "path";

export interface Record {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  localCover: string;
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

export async function fetchDiscogsCollection(): Promise<Record[]> {
  // Check for cached data first (useful for dev to avoid rate limiting)
  if (fs.existsSync(CACHE_FILE)) {
    console.log("Using cached Discogs data");
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as Record[];
    return cached;
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

      // Download cover image
      const imageUrl = info.cover_image || info.thumb;
      await downloadImage(imageUrl, filename);

      allRecords.push({
        id: release.instance_id,
        title: info.title,
        artist: info.artists.map((a) => a.name).join(", "),
        year: info.year,
        coverUrl: info.cover_image,
        localCover: `/records/covers/${filename}`,
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
  }));
}
