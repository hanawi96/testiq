-- Demo Articles Data for IQ Test Website
-- This script creates comprehensive demo data for testing the article management functionality

-- First, let's create some demo categories if they don't exist
-- Note: These will be referenced by articles

INSERT INTO public.categories (id, name, slug, description, meta_title, meta_description, color, sort_order, is_active, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Hướng dẫn IQ', 'huong-dan-iq', 'Các bài viết hướng dẫn về test IQ và cách cải thiện trí tuệ', 'Hướng dẫn Test IQ - Tips và Chiến lược', 'Tìm hiểu cách làm bài test IQ hiệu quả với các hướng dẫn chi tiết từ chuyên gia', '#10B981', 1, true, '2024-01-01T10:00:00+00:00', '2024-01-01T10:00:00+00:00'),
('550e8400-e29b-41d4-a716-446655440002', 'Kiến thức IQ', 'kien-thuc-iq', 'Kiến thức cơ bản và nâng cao về trí tuệ nhân tạo và IQ', 'Kiến thức về IQ - Tìm hiểu về Trí tuệ', 'Khám phá những kiến thức thú vị về IQ, trí tuệ con người và cách phát triển tư duy', '#3B82F6', 2, true, '2024-01-01T11:00:00+00:00', '2024-01-01T11:00:00+00:00'),
('550e8400-e29b-41d4-a716-446655440003', 'Tâm lý học', 'tam-ly-hoc', 'Các bài viết về tâm lý học và phát triển bản thân', 'Tâm lý học - Phát triển Bản thân', 'Tìm hiểu về tâm lý học, cách phát triển bản thân và cải thiện khả năng tư duy', '#8B5CF6', 3, true, '2024-01-01T12:00:00+00:00', '2024-01-01T12:00:00+00:00'),
('550e8400-e29b-41d4-a716-446655440004', 'Nghiên cứu khoa học', 'nghien-cuu-khoa-hoc', 'Các nghiên cứu khoa học về trí tuệ và nhận thức', 'Nghiên cứu Khoa học về IQ', 'Cập nhật những nghiên cứu khoa học mới nhất về trí tuệ, IQ và khả năng nhận thức', '#F59E0B', 4, true, '2024-01-01T13:00:00+00:00', '2024-01-01T13:00:00+00:00'),
('550e8400-e29b-41d4-a716-446655440005', 'Tin tức', 'tin-tuc', 'Tin tức và cập nhật mới nhất về test IQ', 'Tin tức Test IQ - Cập nhật mới nhất', 'Theo dõi tin tức và cập nhật mới nhất về test IQ, nghiên cứu trí tuệ', '#EF4444', 5, true, '2024-01-01T14:00:00+00:00', '2024-01-01T14:00:00+00:00')
ON CONFLICT (id) DO NOTHING;

-- Now create demo articles with comprehensive data
INSERT INTO public.articles (
  id, title, slug, content, excerpt, lang, article_type, status, featured, 
  category_id, meta_title, meta_description, focus_keyword, keywords,
  og_title, og_description, og_type, twitter_title, twitter_description, twitter_card_type,
  cover_image, cover_image_alt, schema_type, word_count, character_count, reading_time,
  paragraph_count, content_score, readability_score, keyword_density,
  robots_directive, sitemap_include, sitemap_priority, sitemap_changefreq,
  view_count, unique_views, published_at, created_at, updated_at
) VALUES

-- Article 1: IQ Test Guide
('650e8400-e29b-41d4-a716-446655440001', 
'Hướng dẫn làm bài test IQ hiệu quả - 10 tips từ chuyên gia', 
'huong-dan-lam-bai-test-iq-hieu-qua',
'<h2>Giới thiệu về Test IQ</h2>
<p>Test IQ (Intelligence Quotient) là một công cụ đánh giá khả năng trí tuệ của con người thông qua các bài kiểm tra chuẩn hóa. Để đạt được kết quả tốt nhất, bạn cần có chiến lược và kỹ thuật phù hợp.</p>

<h2>10 Tips làm bài test IQ hiệu quả</h2>
<h3>1. Đọc kỹ đề bài</h3>
<p>Trước khi trả lời, hãy đọc kỹ đề bài để hiểu rõ yêu cầu. Nhiều câu hỏi có thể có "bẫy" trong cách diễn đạt.</p>

<h3>2. Quản lý thời gian hợp lý</h3>
<p>Phân bổ thời gian đều cho các câu hỏi. Không nên dành quá nhiều thời gian cho một câu khó.</p>

<h3>3. Bắt đầu với câu dễ</h3>
<p>Làm những câu dễ trước để tạo động lực và tiết kiệm thời gian cho những câu khó hơn.</p>

<h3>4. Sử dụng phương pháp loại trừ</h3>
<p>Với câu hỏi trắc nghiệm, hãy loại bỏ những đáp án rõ ràng sai để tăng xác suất chọn đúng.</p>

<h3>5. Tập trung và giữ bình tĩnh</h3>
<p>Stress có thể ảnh hưởng tiêu cực đến khả năng tư duy. Hãy thở sâu và giữ tinh thần thoải mái.</p>

<p>Áp dụng những tips này sẽ giúp bạn cải thiện đáng kể kết quả test IQ của mình.</p>',
'Khám phá 10 tips hiệu quả từ chuyên gia để đạt điểm cao trong bài test IQ. Hướng dẫn chi tiết cách làm bài, quản lý thời gian và tối ưu hóa kết quả.',
'vi', 'article', 'published', true,
'550e8400-e29b-41d4-a716-446655440001',
'Hướng dẫn làm bài test IQ hiệu quả - 10 tips từ chuyên gia | IQ Test Free',
'Khám phá 10 tips hiệu quả từ chuyên gia để đạt điểm cao trong bài test IQ. Hướng dẫn chi tiết cách làm bài, quản lý thời gian và tối ưa hóa kết quả test IQ.',
'test iq hiệu quả',
'{"test iq", "hướng dẫn iq", "tips test iq", "làm bài iq", "cải thiện iq"}',
'Hướng dẫn làm bài test IQ hiệu quả - 10 tips từ chuyên gia',
'Khám phá 10 tips hiệu quả từ chuyên gia để đạt điểm cao trong bài test IQ. Hướng dẫn chi tiết cách làm bài và tối ưu hóa kết quả.',
'article',
'Hướng dẫn làm bài test IQ hiệu quả - 10 tips từ chuyên gia',
'Khám phá 10 tips hiệu quả từ chuyên gia để đạt điểm cao trong bài test IQ.',
'summary_large_image',
'/images/articles/iq-test-guide.jpg',
'Hướng dẫn làm bài test IQ hiệu quả với 10 tips từ chuyên gia',
'BlogPosting',
850, 4200, 4, 12, 85, 75.5, 2.8,
'index,follow', true, 0.9, 'weekly',
1250, 980, '2024-01-15T10:30:00+00:00', '2024-01-15T10:30:00+00:00', '2024-01-16T14:20:00+00:00'),

-- Article 2: IQ Knowledge
('650e8400-e29b-41d4-a716-446655440002',
'IQ là gì? Tìm hiểu về chỉ số thông minh và cách đo lường',
'iq-la-gi-chi-so-thong-minh',
'<h2>IQ là gì?</h2>
<p>IQ (Intelligence Quotient) hay chỉ số thông minh là một con số được sử dụng để đo lường khả năng trí tuệ của con người. Khái niệm này được phát triển từ đầu thế kỷ 20 và đã trở thành một tiêu chuẩn quan trọng trong việc đánh giá năng lực nhận thức.</p>

<h2>Lịch sử phát triển của IQ</h2>
<p>Khái niệm IQ được Alfred Binet đề xuất lần đầu vào năm 1905 tại Pháp. Sau đó, Lewis Terman tại Đại học Stanford đã cải tiến và tạo ra thang đo Stanford-Binet, được sử dụng rộng rãi cho đến ngày nay.</p>

<h2>Cách tính IQ</h2>
<p>IQ được tính theo công thức: IQ = (Tuổi trí tuệ / Tuổi thực) × 100</p>
<p>Tuy nhiên, với các test hiện đại, IQ được tính dựa trên phân phối chuẩn với trung bình là 100 và độ lệch chuẩn là 15.</p>

<h2>Các mức độ IQ</h2>
<ul>
<li>130+: Rất cao (Gifted)</li>
<li>115-129: Cao hơn trung bình</li>
<li>85-114: Trung bình</li>
<li>70-84: Thấp hơn trung bình</li>
<li>Dưới 70: Thấp</li>
</ul>

<h2>Ý nghĩa của IQ trong cuộc sống</h2>
<p>IQ có thể dự đoán một phần thành công trong học tập và công việc, nhưng không phải là yếu tố duy nhất. EQ (trí tuệ cảm xúc), động lực và môi trường cũng đóng vai trò quan trọng.</p>',
'Tìm hiểu IQ là gì, lịch sử phát triển, cách tính toán và ý nghĩa của chỉ số thông minh trong cuộc sống. Hướng dẫn đầy đủ về IQ từ cơ bản đến nâng cao.',
'vi', 'article', 'published', false,
'550e8400-e29b-41d4-a716-446655440002',
'IQ là gì? Tìm hiểu về chỉ số thông minh và cách đo lường | IQ Test Free',
'Tìm hiểu IQ là gì, lịch sử phát triển, cách tính toán và ý nghĩa của chỉ số thông minh trong cuộc sống. Hướng dẫn đầy đủ về IQ từ cơ bản đến nâng cao.',
'iq là gì',
'{"iq", "chỉ số thông minh", "intelligence quotient", "đo lường iq", "kiến thức iq"}',
'IQ là gì? Tìm hiểu về chỉ số thông minh và cách đo lường',
'Tìm hiểu IQ là gì, lịch sử phát triển, cách tính toán và ý nghĩa của chỉ số thông minh trong cuộc sống.',
'article',
'IQ là gì? Tìm hiểu về chỉ số thông minh và cách đo lường',
'Tìm hiểu IQ là gì, lịch sử phát triển, cách tính toán và ý nghĩa của chỉ số thông minh.',
'summary_large_image',
'/images/articles/what-is-iq.jpg',
'Minh họa về chỉ số IQ và cách đo lường trí tuệ con người',
'Article',
720, 3600, 3, 10, 80, 72.0, 3.2,
'index,follow', true, 0.8, 'weekly',
890, 720, '2024-01-12T09:15:00+00:00', '2024-01-12T09:15:00+00:00', '2024-01-13T11:30:00+00:00'),

-- Article 3: Psychology Article
('650e8400-e29b-41d4-a716-446655440003',
'7 cách cải thiện trí nhớ và tăng cường khả năng tư duy',
'cach-cai-thien-tri-nho-tang-cuong-tu-duy',
'<h2>Tại sao trí nhớ quan trọng?</h2>
<p>Trí nhớ là nền tảng của mọi hoạt động tư duy. Một trí nhớ tốt không chỉ giúp bạn ghi nhớ thông tin mà còn cải thiện khả năng phân tích, suy luận và giải quyết vấn đề.</p>

<h2>7 phương pháp cải thiện trí nhớ hiệu quả</h2>

<h3>1. Tập thể dục thường xuyên</h3>
<p>Nghiên cứu cho thấy việc tập thể dục đều đặn có thể tăng kích thước hippocampus - vùng não chịu trách nhiệm về trí nhớ và học tập.</p>

<h3>2. Ngủ đủ giấc</h3>
<p>Giấc ngủ đóng vai trò quan trọng trong việc củng cố trí nhớ. Nên ngủ 7-9 tiếng mỗi đêm để não bộ có thể xử lý và lưu trữ thông tin hiệu quả.</p>

<h3>3. Thực hành thiền định</h3>
<p>Thiền định giúp tăng cường khả năng tập trung và giảm stress, từ đó cải thiện khả năng ghi nhớ và xử lý thông tin.</p>

<h3>4. Ăn uống lành mạnh</h3>
<p>Chế độ ăn giàu omega-3, chất chống oxi hóa và vitamin B có thể hỗ trợ sức khỏe não bộ và cải thiện trí nhớ.</p>

<h3>5. Học kỹ năng mới</h3>
<p>Việc học những kỹ năng mới như chơi nhạc cụ, học ngoại ngữ hay chơi cờ vua có thể kích thích não bộ và tăng cường khả năng nhận thức.</p>

<h3>6. Sử dụng kỹ thuật ghi nhớ</h3>
<p>Các kỹ thuật như tạo liên kết, sử dụng từ viết tắt, hoặc phương pháp cung điện trí nhớ có thể giúp ghi nhớ thông tin hiệu quả hơn.</p>

<h3>7. Tương tác xã hội</h3>
<p>Duy trì các mối quan hệ xã hội tích cực có thể giúp kích thích não bộ và bảo vệ khỏi suy giảm nhận thức.</p>

<h2>Kết luận</h2>
<p>Cải thiện trí nhớ là một quá trình dài hạn đòi hỏi sự kiên trì. Hãy áp dụng những phương pháp trên một cách đều đặn để đạt được kết quả tốt nhất.</p>',
'Khám phá 7 phương pháp khoa học để cải thiện trí nhớ và tăng cường khả năng tư duy. Hướng dẫn thực hành từ chuyên gia tâm lý học.',
'vi', 'article', 'published', true,
'550e8400-e29b-41d4-a716-446655440003',
'7 cách cải thiện trí nhớ và tăng cường khả năng tư duy | IQ Test Free',
'Khám phá 7 phương pháp khoa học để cải thiện trí nhớ và tăng cường khả năng tư duy. Hướng dẫn thực hành từ chuyên gia tâm lý học.',
'cải thiện trí nhớ',
'{"trí nhớ", "cải thiện trí nhớ", "tăng cường tư duy", "tâm lý học", "não bộ"}',
'7 cách cải thiện trí nhớ và tăng cường khả năng tư duy',
'Khám phá 7 phương pháp khoa học để cải thiện trí nhớ và tăng cường khả năng tư duy.',
'article',
'7 cách cải thiện trí nhớ và tăng cường khả năng tư duy',
'Khám phá 7 phương pháp khoa học để cải thiện trí nhớ và tăng cường khả năng tư duy.',
'summary_large_image',
'/images/articles/improve-memory.jpg',
'Minh họa về các phương pháp cải thiện trí nhớ và tư duy',
'BlogPosting',
950, 4750, 5, 14, 88, 78.2, 2.5,
'index,follow', true, 0.8, 'weekly',
1420, 1150, '2024-01-18T14:45:00+00:00', '2024-01-18T14:45:00+00:00', '2024-01-19T16:20:00+00:00'),

-- Article 4: Scientific Research
('650e8400-e29b-41d4-a716-446655440004',
'Nghiên cứu mới: IQ có thể thay đổi theo thời gian không?',
'nghien-cuu-iq-co-the-thay-doi-theo-thoi-gian',
'<h2>Quan điểm truyền thống về IQ</h2>
<p>Trong nhiều thập kỷ, IQ được coi là một chỉ số cố định, không thay đổi theo thời gian. Tuy nhiên, các nghiên cứu gần đây đã thách thức quan điểm này.</p>

<h2>Nghiên cứu đột phá từ Đại học London</h2>
<p>Một nghiên cứu được công bố trên tạp chí Nature năm 2011 bởi nhóm nghiên cứu tại Đại học London đã theo dõi 33 thanh thiếu niên trong 4 năm. Kết quả cho thấy IQ của họ có thể thay đổi lên đến 20 điểm.</p>

<h3>Phương pháp nghiên cứu</h3>
<p>Các nhà nghiên cứu đã sử dụng:</p>
<ul>
<li>Test IQ chuẩn hóa</li>
<li>Chụp MRI não bộ</li>
<li>Theo dõi dài hạn trong 4 năm</li>
</ul>

<h3>Kết quả đáng chú ý</h3>
<p>Nghiên cứu phát hiện ra rằng:</p>
<ul>
<li>IQ có thể tăng hoặc giảm đáng kể theo thời gian</li>
<li>Những thay đổi này tương ứng với thay đổi trong cấu trúc não bộ</li>
<li>Vùng não liên quan đến ngôn ngữ và toán học có thể phát triển khác nhau</li>
</ul>

<h2>Ý nghĩa của nghiên cứu</h2>
<p>Phát hiện này có ý nghĩa quan trọng:</p>
<ul>
<li>Thách thức quan niệm IQ cố định</li>
<li>Mở ra khả năng cải thiện trí tuệ thông qua luyện tập</li>
<li>Thay đổi cách tiếp cận giáo dục</li>
</ul>

<h2>Các yếu tố ảnh hưởng đến sự thay đổi IQ</h2>
<h3>1. Giáo dục và học tập</h3>
<p>Việc tiếp tục học tập và thử thách bản thân với những kiến thức mới có thể kích thích sự phát triển của não bộ.</p>

<h3>2. Môi trường sống</h3>
<p>Môi trường giàu kích thích trí tuệ có thể thúc đẩy sự phát triển nhận thức.</p>

<h3>3. Lối sống</h3>
<p>Chế độ ăn uống, tập thể dục và giấc ngủ đều có thể ảnh hưởng đến khả năng nhận thức.</p>

<h2>Kết luận</h2>
<p>Nghiên cứu này mở ra một chương mới trong hiểu biết về trí tuệ con người, cho thấy rằng chúng ta có thể tích cực cải thiện khả năng nhận thức của mình thông qua nỗ lực và phương pháp phù hợp.</p>',
'Tìm hiểu nghiên cứu đột phá về khả năng thay đổi IQ theo thời gian. Phân tích các yếu tố ảnh hưởng và ý nghĩa của phát hiện khoa học mới.',
'vi', 'article', 'published', false,
'550e8400-e29b-41d4-a716-446655440004',
'Nghiên cứu mới: IQ có thể thay đổi theo thời gian không? | IQ Test Free',
'Tìm hiểu nghiên cứu đột phá về khả năng thay đổi IQ theo thời gian. Phân tích các yếu tố ảnh hưởng và ý nghĩa của phát hiện khoa học mới.',
'iq thay đổi theo thời gian',
'{"nghiên cứu iq", "iq thay đổi", "khoa học", "não bộ", "trí tuệ"}',
'Nghiên cứu mới: IQ có thể thay đổi theo thời gian không?',
'Tìm hiểu nghiên cứu đột phá về khả năng thay đổi IQ theo thời gian và ý nghĩa của phát hiện này.',
'article',
'Nghiên cứu mới: IQ có thể thay đổi theo thời gian không?',
'Tìm hiểu nghiên cứu đột phá về khả năng thay đổi IQ theo thời gian.',
'summary_large_image',
'/images/articles/iq-research.jpg',
'Minh họa nghiên cứu khoa học về sự thay đổi IQ theo thời gian',
'Article',
1100, 5500, 5, 16, 82, 74.8, 3.0,
'index,follow', true, 0.7, 'monthly',
650, 520, '2024-01-20T11:30:00+00:00', '2024-01-20T11:30:00+00:00', '2024-01-21T09:45:00+00:00'),

-- Article 5: News Article
('650e8400-e29b-41d4-a716-446655440005',
'Xu hướng test IQ online năm 2024: Những thay đổi đáng chú ý',
'xu-huong-test-iq-online-2024',
'<h2>Sự phát triển của test IQ online</h2>
<p>Năm 2024 đánh dấu một bước ngoặt quan trọng trong lĩnh vực test IQ online với nhiều cải tiến về công nghệ và phương pháp đánh giá.</p>

<h2>Những xu hướng nổi bật</h2>

<h3>1. Tích hợp AI và Machine Learning</h3>
<p>Các platform test IQ hiện đại đang sử dụng AI để:</p>
<ul>
<li>Cá nhân hóa câu hỏi theo khả năng của từng người</li>
<li>Phân tích pattern trả lời để đưa ra đánh giá chính xác hơn</li>
<li>Cung cấp feedback chi tiết về điểm mạnh và điểm yếu</li>
</ul>

<h3>2. Test đa chiều và toàn diện</h3>
<p>Thay vì chỉ đo lường IQ tổng quát, các test mới tập trung vào:</p>
<ul>
<li>Trí tuệ logic-toán học</li>
<li>Trí tuệ ngôn ngữ</li>
<li>Trí tuệ không gian</li>
<li>Trí tuệ cảm xúc (EQ)</li>
<li>Trí tuệ sáng tạo</li>
</ul>

<h3>3. Giao diện tương tác và gamification</h3>
<p>Các test IQ 2024 có xu hướng:</p>
<ul>
<li>Thiết kế giao diện thân thiện, hấp dẫn</li>
<li>Tích hợp yếu tố game để tăng hứng thú</li>
<li>Sử dụng đồ họa và animation sinh động</li>
</ul>

<h2>Công nghệ adaptive testing</h2>
<p>Một trong những đột phá lớn nhất là việc áp dụng adaptive testing - hệ thống tự động điều chỉnh độ khó của câu hỏi dựa trên khả năng của người làm bài.</p>

<h3>Ưu điểm của adaptive testing:</h3>
<ul>
<li>Tiết kiệm thời gian làm bài</li>
<li>Tăng độ chính xác của kết quả</li>
<li>Giảm stress cho người tham gia</li>
<li>Cung cấp trải nghiệm cá nhân hóa</li>
</ul>

<h2>Xu hướng mobile-first</h2>
<p>Với sự phổ biến của smartphone, các test IQ 2024 được thiết kế ưu tiên cho mobile:</p>
<ul>
<li>Giao diện responsive hoàn hảo</li>
<li>Tối ưu hóa cho màn hình cảm ứng</li>
<li>Hỗ trợ làm bài offline</li>
<li>Đồng bộ dữ liệu đa thiết bị</li>
</ul>

<h2>Bảo mật và quyền riêng tư</h2>
<p>Năm 2024 cũng chứng kiến sự chú trọng cao hơn đến:</p>
<ul>
<li>Bảo vệ dữ liệu cá nhân</li>
<li>Mã hóa kết quả test</li>
<li>Tuân thủ các quy định GDPR</li>
<li>Minh bạch trong việc sử dụng dữ liệu</li>
</ul>

<h2>Kết luận</h2>
<p>Những xu hướng này đang định hình lại cách chúng ta tiếp cận và thực hiện test IQ, mang lại trải nghiệm tốt hơn và kết quả chính xác hơn cho người dùng.</p>',
'Khám phá những xu hướng mới nhất trong test IQ online năm 2024. Tìm hiểu về công nghệ AI, adaptive testing và các cải tiến đáng chú ý.',
'vi', 'article', 'published', true,
'550e8400-e29b-41d4-a716-446655440005',
'Xu hướng test IQ online năm 2024: Những thay đổi đáng chú ý | IQ Test Free',
'Khám phá những xu hướng mới nhất trong test IQ online năm 2024. Tìm hiểu về công nghệ AI, adaptive testing và các cải tiến đáng chú ý.',
'test iq online 2024',
'{"test iq online", "xu hướng 2024", "ai test iq", "adaptive testing", "công nghệ"}',
'Xu hướng test IQ online năm 2024: Những thay đổi đáng chú ý',
'Khám phá những xu hướng mới nhất trong test IQ online năm 2024 với công nghệ AI và adaptive testing.',
'article',
'Xu hướng test IQ online năm 2024: Những thay đổi đáng chú ý',
'Khám phá những xu hướng mới nhất trong test IQ online năm 2024.',
'summary_large_image',
'/images/articles/iq-trends-2024.jpg',
'Minh họa xu hướng test IQ online năm 2024 với công nghệ hiện đại',
'BlogPosting',
800, 4000, 4, 13, 85, 76.5, 2.9,
'index,follow', true, 0.8, 'weekly',
980, 780, '2024-01-22T08:20:00+00:00', '2024-01-22T08:20:00+00:00', '2024-01-23T10:15:00+00:00'),

-- Article 6: Draft Article
('650e8400-e29b-41d4-a716-446655440006',
'Phân tích chi tiết các loại câu hỏi trong test IQ',
'phan-tich-cac-loai-cau-hoi-test-iq',
'<h2>Giới thiệu về các loại câu hỏi IQ</h2>
<p>Test IQ thường bao gồm nhiều loại câu hỏi khác nhau, mỗi loại đánh giá một khía cạnh khác nhau của trí tuệ. Hiểu rõ các loại câu hỏi này sẽ giúp bạn chuẩn bị tốt hơn.</p>

<h2>1. Câu hỏi logic và suy luận</h2>
<p>Đây là loại câu hỏi phổ biến nhất trong test IQ, đánh giá khả năng suy luận logic của bạn.</p>

<h3>Ví dụ:</h3>
<p>Nếu A > B và B > C, thì:</p>
<ul>
<li>A > C</li>
<li>A = C</li>
<li>A < C</li>
<li>Không thể xác định</li>
</ul>

<h2>2. Câu hỏi nhận dạng mẫu</h2>
<p>Loại câu hỏi này kiểm tra khả năng nhận biết quy luật trong chuỗi số, hình ảnh hoặc ký tự.</p>

<h2>3. Câu hỏi toán học</h2>
<p>Đánh giá khả năng tính toán và suy luận số học cơ bản.</p>

<h2>4. Câu hỏi không gian</h2>
<p>Kiểm tra khả năng tưởng tượng và xử lý thông tin không gian 3D.</p>

<h2>5. Câu hỏi từ vựng và ngôn ngữ</h2>
<p>Đánh giá vốn từ vựng và khả năng hiểu mối quan hệ giữa các từ.</p>

<p><em>Bài viết đang được hoàn thiện...</em></p>',
'Phân tích chi tiết các loại câu hỏi thường gặp trong test IQ. Hướng dẫn cách nhận biết và giải quyết từng loại câu hỏi hiệu quả.',
'vi', 'article', 'draft', false,
'550e8400-e29b-41d4-a716-446655440001',
'Phân tích chi tiết các loại câu hỏi trong test IQ | IQ Test Free',
'Phân tích chi tiết các loại câu hỏi thường gặp trong test IQ. Hướng dẫn cách nhận biết và giải quyết từng loại câu hỏi hiệu quả.',
'loại câu hỏi iq',
'{"câu hỏi iq", "loại câu hỏi", "test iq", "phân tích", "hướng dẫn"}',
'Phân tích chi tiết các loại câu hỏi trong test IQ',
'Phân tích chi tiết các loại câu hỏi thường gặp trong test IQ và cách giải quyết hiệu quả.',
'article',
'Phân tích chi tiết các loại câu hỏi trong test IQ',
'Phân tích chi tiết các loại câu hỏi thường gặp trong test IQ.',
'summary_large_image',
'/images/articles/iq-question-types.jpg',
'Minh họa các loại câu hỏi khác nhau trong test IQ',
'Article',
450, 2250, 2, 8, 70, 68.5, 3.5,
'noindex,nofollow', false, 0.5, 'monthly',
0, 0, NULL, '2024-01-25T15:30:00+00:00', '2024-01-26T09:20:00+00:00'),

-- Article 7: EQ vs IQ
('650e8400-e29b-41d4-a716-446655440007',
'EQ vs IQ: Loại trí tuệ nào quan trọng hơn trong thành công?',
'eq-vs-iq-loai-tri-tue-quan-trong-hon',
'<h2>Cuộc tranh luận EQ vs IQ</h2>
<p>Trong nhiều thập kỷ, IQ được coi là yếu tố quyết định thành công. Tuy nhiên, khái niệm EQ (Emotional Quotient - Trí tuệ cảm xúc) đã thách thức quan điểm này.</p>

<h2>IQ - Trí tuệ nhận thức</h2>
<h3>Định nghĩa</h3>
<p>IQ đo lường khả năng nhận thức, bao gồm:</p>
<ul>
<li>Tư duy logic</li>
<li>Giải quyết vấn đề</li>
<li>Trí nhớ</li>
<li>Khả năng học tập</li>
<li>Xử lý thông tin</li>
</ul>

<h3>Ưu điểm của IQ cao</h3>
<ul>
<li>Thành công trong học tập</li>
<li>Khả năng phân tích tốt</li>
<li>Giải quyết vấn đề phức tạp</li>
<li>Tư duy chiến lược</li>
</ul>

<h2>EQ - Trí tuệ cảm xúc</h2>
<h3>Định nghĩa</h3>
<p>EQ đo lường khả năng hiểu và quản lý cảm xúc:</p>
<ul>
<li>Nhận biết cảm xúc bản thân</li>
<li>Quản lý cảm xúc</li>
<li>Đồng cảm với người khác</li>
<li>Kỹ năng xã hội</li>
<li>Động lực nội tại</li>
</ul>

<h3>Ưu điểm của EQ cao</h3>
<ul>
<li>Lãnh đạo hiệu quả</li>
<li>Quan hệ interpersonal tốt</li>
<li>Quản lý stress</li>
<li>Thích ứng với thay đổi</li>
</ul>

<h2>Nghiên cứu về vai trò của EQ và IQ</h2>
<h3>Nghiên cứu của Daniel Goleman</h3>
<p>Tác giả cuốn "Emotional Intelligence" cho rằng EQ có thể quan trọng hơn IQ trong việc dự đoán thành công, đặc biệt trong lĩnh vực lãnh đạo và quản lý.</p>

<h3>Kết quả nghiên cứu</h3>
<ul>
<li>IQ chỉ giải thích 20% thành công trong cuộc sống</li>
<li>EQ có thể dự đoán 58% hiệu suất công việc</li>
<li>90% top performers có EQ cao</li>
</ul>

<h2>Sự kết hợp hoàn hảo</h2>
<p>Thực tế, thành công thường đến từ sự kết hợp của cả IQ và EQ:</p>

<h3>Trong công việc</h3>
<ul>
<li>IQ giúp giải quyết vấn đề kỹ thuật</li>
<li>EQ giúp làm việc nhóm hiệu quả</li>
</ul>

<h3>Trong lãnh đạo</h3>
<ul>
<li>IQ giúp đưa ra quyết định đúng đắn</li>
<li>EQ giúp truyền cảm hứng và động viên</li>
</ul>

<h2>Cách phát triển cả IQ và EQ</h2>
<h3>Phát triển IQ</h3>
<ul>
<li>Đọc sách và học tập liên tục</li>
<li>Giải các bài toán logic</li>
<li>Chơi cờ vua, sudoku</li>
<li>Học ngôn ngữ mới</li>
</ul>

<h3>Phát triển EQ</h3>
<ul>
<li>Thực hành mindfulness</li>
<li>Lắng nghe tích cực</li>
<li>Phản ánh về cảm xúc</li>
<li>Tham gia hoạt động nhóm</li>
</ul>

<h2>Kết luận</h2>
<p>Thay vì tranh luận EQ hay IQ quan trọng hơn, chúng ta nên tập trung phát triển cả hai. Sự kết hợp giữa trí tuệ nhận thức và trí tuệ cảm xúc sẽ mang lại thành công toàn diện nhất.</p>',
'So sánh EQ và IQ: Loại trí tuệ nào quan trọng hơn? Phân tích vai trò của trí tuệ cảm xúc và trí tuệ nhận thức trong thành công.',
'vi', 'article', 'published', true,
'550e8400-e29b-41d4-a716-446655440003',
'EQ vs IQ: Loại trí tuệ nào quan trọng hơn trong thành công? | IQ Test Free',
'So sánh EQ và IQ: Loại trí tuệ nào quan trọng hơn? Phân tích vai trò của trí tuệ cảm xúc và trí tuệ nhận thức trong thành công.',
'eq vs iq',
'{"eq", "iq", "trí tuệ cảm xúc", "trí tuệ nhận thức", "thành công"}',
'EQ vs IQ: Loại trí tuệ nào quan trọng hơn trong thành công?',
'So sánh EQ và IQ để hiểu loại trí tuệ nào quan trọng hơn trong thành công và cuộc sống.',
'article',
'EQ vs IQ: Loại trí tuệ nào quan trọng hơn trong thành công?',
'So sánh EQ và IQ để hiểu loại trí tuệ nào quan trọng hơn trong thành công.',
'summary_large_image',
'/images/articles/eq-vs-iq.jpg',
'So sánh giữa EQ và IQ - hai loại trí tuệ quan trọng',
'BlogPosting',
1200, 6000, 6, 18, 90, 79.5, 2.7,
'index,follow', true, 0.9, 'weekly',
1680, 1320, '2024-01-28T13:15:00+00:00', '2024-01-28T13:15:00+00:00', '2024-01-29T11:40:00+00:00'),

-- Article 8: FAQ Article
('650e8400-e29b-41d4-a716-446655440008',
'Câu hỏi thường gặp về test IQ - FAQ chi tiết',
'cau-hoi-thuong-gap-ve-test-iq-faq',
'<h2>Câu hỏi thường gặp về Test IQ</h2>
<p>Dưới đây là những câu hỏi phổ biến nhất mà người dùng thường hỏi về test IQ và câu trả lời chi tiết từ chuyên gia.</p>

<h2>1. Test IQ có chính xác không?</h2>
<p><strong>Trả lời:</strong> Test IQ được thiết kế dựa trên các nghiên cứu khoa học và có độ tin cậy cao khi được thực hiện đúng cách. Tuy nhiên, kết quả có thể bị ảnh hưởng bởi nhiều yếu tố như tâm trạng, sức khỏe, và môi trường làm bài.</p>

<h2>2. Tôi có thể cải thiện điểm IQ không?</h2>
<p><strong>Trả lời:</strong> Có, IQ có thể được cải thiện thông qua luyện tập và học tập. Các hoạt động như đọc sách, giải đố, học ngôn ngữ mới, và tập thể dục đều có thể giúp tăng cường khả năng nhận thức.</p>

<h2>3. Bao lâu thì nên làm test IQ một lần?</h2>
<p><strong>Trả lời:</strong> Không nên làm test IQ quá thường xuyên vì hiệu ứng học thuộc có thể ảnh hưởng đến kết quả. Nên cách nhau ít nhất 6 tháng giữa các lần test.</p>

<h2>4. Test IQ online có đáng tin cậy không?</h2>
<p><strong>Trả lời:</strong> Test IQ online có thể cung cấp ước tính sơ bộ về IQ, nhưng không thể thay thế hoàn toàn test IQ chuyên nghiệp được thực hiện bởi chuyên gia tâm lý.</p>

<h2>5. IQ bao nhiêu được coi là cao?</h2>
<p><strong>Trả lời:</strong> Thang điểm IQ chuẩn:</p>
<ul>
<li>130+: Rất cao (Gifted)</li>
<li>115-129: Cao hơn trung bình</li>
<li>85-114: Trung bình</li>
<li>70-84: Thấp hơn trung bình</li>
</ul>

<h2>6. Tuổi tác có ảnh hưởng đến kết quả test IQ không?</h2>
<p><strong>Trả lời:</strong> Test IQ được chuẩn hóa theo độ tuổi, vì vậy kết quả đã được điều chỉnh phù hợp với từng nhóm tuổi. Tuy nhiên, một số khả năng nhận thức có thể thay đổi theo tuổi tác.</p>

<h2>7. Có nên chuẩn bị trước khi làm test IQ không?</h2>
<p><strong>Trả lời:</strong> Bạn có thể làm quen với format câu hỏi, nhưng không nên học thuộc đáp án. Quan trọng nhất là đảm bảo sức khỏe tốt và tinh thần thoải mái khi làm bài.</p>

<h2>8. Test IQ có thể dự đoán thành công trong cuộc sống không?</h2>
<p><strong>Trả lời:</strong> IQ chỉ là một trong nhiều yếu tố ảnh hưởng đến thành công. EQ, động lực, tính kiên trì, và môi trường cũng đóng vai trò quan trọng không kém.</p>

<h2>9. Tại sao kết quả test IQ của tôi khác nhau ở các lần làm?</h2>
<p><strong>Trả lời:</strong> Sự khác biệt nhỏ (5-10 điểm) là bình thường do các yếu tố như tâm trạng, mệt mỏi, hoặc sai số đo lường. Sự khác biệt lớn có thể do test không chuẩn hoặc điều kiện làm bài khác nhau.</p>

<h2>10. Có cần lo lắng nếu IQ thấp không?</h2>
<p><strong>Trả lời:</strong> Không cần lo lắng quá mức. IQ chỉ đo lường một khía cạnh của trí tuệ. Mỗi người đều có những điểm mạnh riêng và có thể thành công trong nhiều lĩnh vực khác nhau.</p>',
'Tổng hợp câu hỏi thường gặp về test IQ với câu trả lời chi tiết từ chuyên gia. Giải đáp mọi thắc mắc về IQ, cách test và ý nghĩa kết quả.',
'vi', 'article', 'published', false,
'550e8400-e29b-41d4-a716-446655440002',
'Câu hỏi thường gặp về test IQ - FAQ chi tiết | IQ Test Free',
'Tổng hợp câu hỏi thường gặp về test IQ với câu trả lời chi tiết từ chuyên gia. Giải đáp mọi thắc mắc về IQ, cách test và ý nghĩa kết quả.',
'faq test iq',
'{"faq iq", "câu hỏi iq", "test iq", "hỏi đáp", "thắc mắc"}',
'Câu hỏi thường gặp về test IQ - FAQ chi tiết',
'Tổng hợp câu hỏi thường gặp về test IQ với câu trả lời chi tiết từ chuyên gia.',
'article',
'Câu hỏi thường gặp về test IQ - FAQ chi tiết',
'Tổng hợp câu hỏi thường gặp về test IQ với câu trả lời chi tiết.',
'summary_large_image',
'/images/articles/iq-faq.jpg',
'FAQ - Câu hỏi thường gặp về test IQ và trí tuệ',
'FAQ',
1000, 5000, 5, 15, 88, 77.0, 3.1,
'index,follow', true, 0.8, 'monthly',
1150, 920, '2024-01-30T16:45:00+00:00', '2024-01-30T16:45:00+00:00', '2024-01-31T12:30:00+00:00'),

-- Article 9: Archived Article
('650e8400-e29b-41d4-a716-446655440009',
'Lịch sử phát triển của test IQ từ 1905 đến nay',
'lich-su-phat-trien-test-iq-1905-den-nay',
'<h2>Khởi nguồn của Test IQ (1905)</h2>
<p>Test IQ có nguồn gốc từ năm 1905 khi nhà tâm lý học người Pháp Alfred Binet được chính phủ Pháp yêu cầu phát triển một phương pháp để xác định những học sinh cần hỗ trợ đặc biệt trong giáo dục.</p>

<h2>Thang đo Binet-Simon</h2>
<p>Binet cùng với Theodore Simon đã tạo ra thang đo đầu tiên, bao gồm 30 bài test được sắp xếp theo độ khó tăng dần. Đây là nền tảng cho tất cả các test IQ hiện đại.</p>

<h2>Sự phát triển tại Mỹ (1916)</h2>
<p>Lewis Terman tại Đại học Stanford đã điều chỉnh và chuẩn hóa test Binet cho người Mỹ, tạo ra Stanford-Binet Intelligence Scale. Ông cũng là người đầu tiên sử dụng thuật ngữ "Intelligence Quotient" (IQ).</p>

<h2>Thời kỳ Thế chiến thứ nhất</h2>
<p>Quân đội Mỹ đã sử dụng test IQ để phân loại binh lính, đánh dấu việc ứng dụng rộng rãi đầu tiên của test IQ trong thực tế.</p>

<h2>Phát triển hiện đại</h2>
<p>Từ những năm 1950, test IQ đã được cải tiến liên tục với các phiên bản như WAIS (Wechsler Adult Intelligence Scale) và WISC (Wechsler Intelligence Scale for Children).</p>

<p><em>Bài viết này đã được lưu trữ và không còn được cập nhật.</em></p>',
'Tìm hiểu lịch sử phát triển của test IQ từ năm 1905 đến nay. Từ Alfred Binet đến các test IQ hiện đại.',
'vi', 'article', 'archived', false,
'550e8400-e29b-41d4-a716-446655440002',
'Lịch sử phát triển của test IQ từ 1905 đến nay | IQ Test Free',
'Tìm hiểu lịch sử phát triển của test IQ từ năm 1905 đến nay. Từ Alfred Binet đến các test IQ hiện đại.',
'lịch sử test iq',
'{"lịch sử iq", "alfred binet", "stanford binet", "phát triển iq", "test iq cổ điển"}',
'Lịch sử phát triển của test IQ từ 1905 đến nay',
'Tìm hiểu lịch sử phát triển của test IQ từ năm 1905 đến nay, từ Alfred Binet đến hiện đại.',
'article',
'Lịch sử phát triển của test IQ từ 1905 đến nay',
'Tìm hiểu lịch sử phát triển của test IQ từ năm 1905 đến nay.',
'summary_large_image',
'/images/articles/iq-history.jpg',
'Lịch sử phát triển của test IQ qua các thời kỳ',
'Article',
600, 3000, 3, 9, 75, 70.5, 2.8,
'noindex,follow', false, 0.3, 'yearly',
450, 380, '2024-01-05T14:20:00+00:00', '2024-01-05T14:20:00+00:00', '2024-01-06T16:45:00+00:00'),

-- Article 10: Course Article
('650e8400-e29b-41d4-a716-446655440010',
'Khóa học cải thiện IQ: 30 ngày nâng cao trí tuệ',
'khoa-hoc-cai-thien-iq-30-ngay',
'<h2>Giới thiệu khóa học</h2>
<p>Khóa học "30 ngày nâng cao trí tuệ" được thiết kế dựa trên các nghiên cứu khoa học mới nhất về neuroplasticity và cognitive training. Chương trình giúp bạn cải thiện các khía cạnh khác nhau của trí tuệ một cách có hệ thống.</p>

<h2>Cấu trúc khóa học</h2>

<h3>Tuần 1: Nền tảng cơ bản</h3>
<ul>
<li>Ngày 1-2: Đánh giá trình độ hiện tại</li>
<li>Ngày 3-4: Hiểu về não bộ và trí nhớ</li>
<li>Ngày 5-7: Kỹ thuật tập trung và mindfulness</li>
</ul>

<h3>Tuần 2: Tư duy logic</h3>
<ul>
<li>Ngày 8-10: Luyện tập suy luận logic</li>
<li>Ngày 11-12: Giải quyết vấn đề sáng tạo</li>
<li>Ngày 13-14: Pattern recognition</li>
</ul>

<h3>Tuần 3: Trí nhớ và xử lý thông tin</h3>
<ul>
<li>Ngày 15-17: Kỹ thuật ghi nhớ nâng cao</li>
<li>Ngày 18-19: Tốc độ xử lý thông tin</li>
<li>Ngày 20-21: Working memory training</li>
</ul>

<h3>Tuần 4: Tích hợp và đánh giá</h3>
<ul>
<li>Ngày 22-24: Tư duy không gian và toán học</li>
<li>Ngày 25-27: Kỹ năng ngôn ngữ và từ vựng</li>
<li>Ngày 28-30: Đánh giá cuối khóa và lập kế hoạch dài hạn</li>
</ul>

<h2>Phương pháp học tập</h2>
<h3>Dual N-Back Training</h3>
<p>Một trong những bài tập được chứng minh khoa học có thể cải thiện working memory và fluid intelligence.</p>

<h3>Cognitive Behavioral Training</h3>
<p>Các bài tập nhận thức hành vi giúp thay đổi cách tư duy và tiếp cận vấn đề.</p>

<h3>Brain Games</h3>
<p>Các trò chơi trí tuệ được thiết kế đặc biệt để kích thích các vùng não khác nhau.</p>

<h2>Kết quả mong đợi</h2>
<p>Sau 30 ngày, học viên có thể:</p>
<ul>
<li>Cải thiện điểm IQ 10-15 điểm</li>
<li>Tăng khả năng tập trung 40%</li>
<li>Cải thiện trí nhớ làm việc 25%</li>
<li>Nâng cao tốc độ xử lý thông tin 30%</li>
</ul>

<h2>Đăng ký khóa học</h2>
<p>Khóa học hoàn toàn miễn phí và có thể tham gia bất cứ lúc nào. Chỉ cần đăng ký tài khoản và bắt đầu hành trình nâng cao trí tuệ của bạn.</p>

<h2>Lời khuyên từ chuyên gia</h2>
<p>"Trí tuệ không phải là cố định. Với phương pháp đúng đắn và sự kiên trì, mọi người đều có thể cải thiện khả năng nhận thức của mình." - Dr. Nguyễn Văn A, Tiến sĩ Tâm lý học</p>',
'Tham gia khóa học 30 ngày cải thiện IQ miễn phí. Chương trình khoa học giúp nâng cao trí tuệ, trí nhớ và khả năng tư duy logic.',
'vi', 'article', 'published', true,
'550e8400-e29b-41d4-a716-446655440001',
'Khóa học cải thiện IQ: 30 ngày nâng cao trí tuệ | IQ Test Free',
'Tham gia khóa học 30 ngày cải thiện IQ miễn phí. Chương trình khoa học giúp nâng cao trí tuệ, trí nhớ và khả năng tư duy logic.',
'khóa học cải thiện iq',
'{"khóa học iq", "cải thiện iq", "nâng cao trí tuệ", "30 ngày", "brain training"}',
'Khóa học cải thiện IQ: 30 ngày nâng cao trí tuệ',
'Tham gia khóa học 30 ngày cải thiện IQ miễn phí với chương trình khoa học và hiệu quả.',
'article',
'Khóa học cải thiện IQ: 30 ngày nâng cao trí tuệ',
'Tham gia khóa học 30 ngày cải thiện IQ miễn phí.',
'summary_large_image',
'/images/articles/iq-course.jpg',
'Khóa học 30 ngày cải thiện IQ và nâng cao trí tuệ',
'Article',
1300, 6500, 6, 20, 92, 80.5, 2.6,
'index,follow', true, 1.0, 'weekly',
2150, 1680, '2024-02-01T10:00:00+00:00', '2024-02-01T10:00:00+00:00', '2024-02-02T14:30:00+00:00');

-- Update article metrics and search index
-- This would normally be handled by triggers, but we'll add a note
-- Note: The trigger 'update_article_metrics' should automatically calculate:
-- - word_count, character_count, reading_time, paragraph_count
-- - search_index for full-text search
-- - content_score and readability_score

-- End of demo articles data
