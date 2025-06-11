import { readdir, readFile } from "fs/promises";
import { join } from "path";
import Link from "next/link";

export const metadata = {
  title: "Writing",
  description: "A collection of scribbles on various topics.",
};

async function getBlogPosts() {
  const blogsPath = join(process.cwd(), "src/app/(blogs)");
  const entries = await readdir(blogsPath, { withFileTypes: true });

  // Filter for directories that aren't 'writing' and don't start with '.'
  const blogDirs = entries.filter(
    (entry) =>
      entry.isDirectory() &&
      entry.name !== "writing" &&
      !entry.name.startsWith(".")
  );

  const posts = await Promise.all(
    blogDirs.map(async (dir) => {
      const pagePath = join(blogsPath, dir.name, "page.mdx");
      try {
        const content = await readFile(pagePath, "utf-8");
        // Extract metadata title using regex
        const titleMatch = content.match(
          /export\s+const\s+metadata\s*=\s*{[^}]*title:\s*["']([^"']+)["']/
        );
        const title = titleMatch ? titleMatch[1] : null;

        return {
          slug: dir.name,
          title:
            title ||
            dir.name
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
        };
      } catch (error) {
        // Fallback to directory name if page.mdx can't be read or parsed
        console.log(error);
        return {
          slug: dir.name,
          title: dir.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        };
      }
    })
  );

  return posts.sort((a, b) => a.title.localeCompare(b.title));
}

export default async function WritingPage() {
  const posts = await getBlogPosts();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/${post.slug}`}
              className="block hover:underline text-lg"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
