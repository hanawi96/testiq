-- Script đơn giản để test tags

-- Tạo bài viết test đơn giản
INSERT INTO articles (title, slug, content, status) VALUES 
('Test Article', 'test-article', 'Test content', 'published');

-- Tạo tags test
INSERT INTO tags (name, slug) VALUES 
('React', 'react'),
('Vue', 'vue'),
('Angular', 'angular')
ON CONFLICT (name) DO NOTHING;
