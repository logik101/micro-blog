
import React from 'react';
import { BlogPost, Language } from '../types';
import { Icons, TRANSLATIONS } from '../constants';

interface BlogCardProps {
  post: BlogPost;
  language: Language;
  onClick?: () => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, language, onClick }) => {
  const t = TRANSLATIONS[language];

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={onClick}
    >
      {/* Image Header */}
      <div className="h-56 w-full overflow-hidden">
        <img 
          src={post.imageUrl} 
          alt={post.title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Content Body */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="text-[#1a3a8a] text-[11px] font-bold uppercase tracking-wider mb-3">
          {post.category}
        </div>
        <h3 className="text-[#111827] text-xl font-bold leading-tight mb-4 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Footer info */}
        <div className="mt-auto flex justify-between items-center text-gray-400 text-xs font-medium">
          <span>{post.date}</span>
          <span>{post.readingTime}</span>
        </div>

        {/* Share Section */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{t.share}</span>
          <div className="flex space-x-3">
            <Icons.Facebook />
            <Icons.Twitter />
            <Icons.LinkedIn />
            <Icons.WhatsApp />
            <Icons.Link />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
