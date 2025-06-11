import React from 'react';
import { getBlogPosts, groupPostsByYear } from '../utils/getBlogPosts';

export default async function WritingSection() {
  const posts = await getBlogPosts();
  const groupedPosts = groupPostsByYear(posts);

  return (
    <div className="max-w-xl w-full px-4 my-16">
      {groupedPosts.map((yearGroup) => (
        <div key={yearGroup.year} className="mb-8">
          <p className="text-sm text-zinc-500 mb-4 font-mono">{yearGroup.year}</p>
          <div className="space-y-0 flex flex-col">
            {yearGroup.posts.map((post) => (
              <a
                key={post.slug}
                href={`/${post.slug}`}
                className="inline-block py-2 group hover:bg-zinc-50 -mx-3 px-3 rounded transition-colors"
              >
                <p className="text-md text-zinc-600 group-hover:text-zinc-900 font-sans">
                  {post.title}
                </p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}