import fs from 'fs';
import path from 'path';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  year: string;
  formattedDate: string;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const blogsDirectory = path.join(process.cwd(), 'src/app/(blogs)');
  const blogFolders = fs.readdirSync(blogsDirectory).filter((item) => {
    const itemPath = path.join(blogsDirectory, item);
    return fs.statSync(itemPath).isDirectory() && item !== 'writing';
  });

  const posts: BlogPost[] = [];

  for (const folder of blogFolders) {
    const mdxPath = path.join(blogsDirectory, folder, 'page.mdx');
    
    if (fs.existsSync(mdxPath)) {
      const source = fs.readFileSync(mdxPath, 'utf8');
      
      // Extract metadata using regex
      const metadataMatch = source.match(/export\s+const\s+metadata\s*=\s*{([^}]+)}/s);
      
      if (metadataMatch) {
        const metadataString = metadataMatch[1];
        
        // Extract title
        const titleMatch = metadataString.match(/title:\s*["'`]([^"'`]+)["'`]/);
        const title = titleMatch ? titleMatch[1] : folder;
        
        // Extract description
        const descMatch = metadataString.match(/description:\s*["'`]([^"'`]+)["'`]/);
        const description = descMatch ? descMatch[1] : '';
        
        // Extract date
        const dateMatch = metadataString.match(/date:\s*["'`]([^"'`]+)["'`]/);
        const date = dateMatch ? dateMatch[1] : '2020-01-01';
        
        // Parse date
        const dateObj = new Date(date);
        const year = dateObj.getFullYear().toString();
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const formattedDate = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate().toString().padStart(2, '0')}`;
        
        posts.push({
          slug: folder,
          title,
          description,
          date,
          year,
          formattedDate,
        });
      }
    }
  }

  // Sort posts by date (newest first)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function groupPostsByYear(posts: BlogPost[]): { year: string; posts: BlogPost[] }[] {
  const grouped = posts.reduce((acc, post) => {
    if (!acc[post.year]) {
      acc[post.year] = [];
    }
    acc[post.year].push(post);
    return acc;
  }, {} as Record<string, BlogPost[]>);

  // Sort years (newest first) and convert to array format
  return Object.entries(grouped)
    .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
    .map(([year, posts]) => ({ year, posts }));
}