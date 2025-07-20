import React from 'react';

interface ArticleEditorLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ArticleEditorLayout: React.FC<ArticleEditorLayoutProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`article-editor ${className}`}>
      {/* Main Content - Responsive 2 Column Layout */}
      <div className="w-full">
        <div className="article-editor-main">
          {children}
        </div>
      </div>
    </div>
  );
};

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  );
};

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`article-editor-sidebar ${className}`}>
      {children}
    </div>
  );
};
