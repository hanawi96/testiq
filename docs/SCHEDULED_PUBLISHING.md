# 🚀 Scheduled Publishing - Hẹn lịch đăng bài

## 📋 Tổng quan

Chức năng **Scheduled Publishing** cho phép người dùng hẹn lịch đăng bài tự động vào thời gian cụ thể trong tương lai.

### ✨ Tính năng chính:
- ⏰ Hẹn lịch đăng bài vào thời gian cụ thể
- 🔄 Tự động xuất bản khi đến hạn
- 📊 Thống kê và monitoring
- 🛡️ Validation và error handling
- 🎯 Performance tối ưu

---

## 🏗️ Kiến trúc hệ thống

```
Frontend (UI) → Backend API → Database → Cron Job
     ↓              ↓           ↓          ↓
  ArticleEditor → Service → scheduled_at → Auto-publish
```

### 📁 Cấu trúc files:
```
backend/admin/articles/
├── scheduled-publishing.ts     # Core service
├── service.ts                  # Updated với scheduled support
└── types.ts                   # Updated với 'scheduled' status

src/pages/api/admin/
└── scheduled-publishing.ts     # API endpoints

scripts/
├── scheduled-publishing-cron.js # Cron job script
├── setup-cron.sh              # Setup automation
└── test-scheduled-publishing.js # Testing

docs/
└── SCHEDULED_PUBLISHING.md     # Documentation này
```

---

## 🚀 Setup và Installation

### 1. Database đã sẵn sàng ✅
```sql
-- Field scheduled_at đã có trong bảng articles
scheduled_at timestamp with time zone null
```

### 2. Setup Cron Job
```bash
# Tự động setup cron job
chmod +x scripts/setup-cron.sh
./scripts/setup-cron.sh
```

### 3. Configuration
```bash
# Set environment variables
export SCHEDULED_PUBLISHING_API_URL="http://localhost:4321/api/admin/scheduled-publishing"
export SCHEDULED_PUBLISHING_TOKEN="your-secret-token"
```

---

## 💻 Cách sử dụng

### 1. Trong Admin Interface:

1. **Tạo/Chỉnh sửa bài viết**
2. **Chọn "Hẹn ngày giờ đăng bài"** trong box Xuất bản
3. **Chọn thời gian trong tương lai**
4. **Lưu bài viết** → Status = "scheduled"

### 2. Workflow tự động:

```
User chọn thời gian → Status: "scheduled" → Cron job chạy mỗi phút → Auto-publish khi đến hạn
```

---

## 🔧 API Endpoints

### GET `/api/admin/scheduled-publishing`

**Stats:**
```bash
curl -H "Authorization: Bearer token" \
  "http://localhost:4321/api/admin/scheduled-publishing?action=stats"
```

**Upcoming articles:**
```bash
curl -H "Authorization: Bearer token" \
  "http://localhost:4321/api/admin/scheduled-publishing?action=upcoming&limit=10"
```

**Health check:**
```bash
curl -H "Authorization: Bearer token" \
  "http://localhost:4321/api/admin/scheduled-publishing?action=health"
```

### POST `/api/admin/scheduled-publishing`

**Manual trigger:**
```bash
curl -X POST \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"action":"process"}' \
  "http://localhost:4321/api/admin/scheduled-publishing"
```

---

## 🧪 Testing

### 1. Test toàn bộ hệ thống:
```bash
node scripts/test-scheduled-publishing.js
```

### 2. Test cron job:
```bash
node scripts/scheduled-publishing-cron.js
```

### 3. Test manual trong UI:
1. Tạo bài viết mới
2. Set scheduled time = 2 phút sau
3. Lưu bài viết
4. Chờ 2 phút và kiểm tra

---

## 📊 Monitoring

### 1. View logs:
```bash
tail -f /var/log/scheduled-publishing.log
```

### 2. Check cron status:
```bash
crontab -l | grep scheduled-publishing
```

### 3. Database queries:
```sql
-- Xem bài viết scheduled
SELECT id, title, scheduled_at, status 
FROM articles 
WHERE status = 'scheduled' 
ORDER BY scheduled_at;

-- Xem bài quá hạn
SELECT id, title, scheduled_at 
FROM articles 
WHERE status = 'scheduled' 
AND scheduled_at <= NOW();
```

---

## 🛠️ Troubleshooting

### ❌ Cron job không chạy:
```bash
# Check crontab
crontab -l

# Check logs
tail -f /var/log/scheduled-publishing.log

# Test manual
node scripts/scheduled-publishing-cron.js
```

### ❌ API errors:
```bash
# Check auth token
curl -H "Authorization: Bearer wrong-token" \
  "http://localhost:4321/api/admin/scheduled-publishing?action=health"

# Check server logs
```

### ❌ Database issues:
```sql
-- Check scheduled_at field exists
\d articles

-- Check enum values
SELECT unnest(enum_range(NULL::article_status));
```

---

## 🎯 Performance

### Tối ưu hóa:
- ✅ **Batch processing**: Xử lý tối đa 50 bài/lần
- ✅ **Indexed queries**: Index trên `scheduled_at`
- ✅ **Minimal API calls**: Chỉ 1 query để fetch + 1 query để update
- ✅ **Error handling**: Retry logic và graceful failures
- ✅ **Logging**: Chi tiết nhưng không spam

### Metrics:
- **Cron frequency**: Mỗi phút (có thể điều chỉnh)
- **Batch size**: 50 articles/run
- **Timeout**: 30 seconds
- **Retries**: 3 attempts

---

## 🔒 Security

- 🔐 **API Authentication**: Bearer token required
- 🛡️ **Input validation**: Scheduled time phải trong tương lai
- 📝 **Audit logging**: Tất cả actions được log
- 🚫 **Rate limiting**: Built-in batch limits

---

## 🚀 Deployment

### Production checklist:
- [ ] Set proper AUTH_TOKEN
- [ ] Configure log rotation
- [ ] Monitor cron job health
- [ ] Set up alerts for failures
- [ ] Test backup/recovery

### Environment variables:
```bash
SCHEDULED_PUBLISHING_API_URL=https://yourdomain.com/api/admin/scheduled-publishing
SCHEDULED_PUBLISHING_TOKEN=your-production-secret-token
```

---

## 📈 Future Enhancements

- 📧 Email notifications khi publish
- 📱 Slack/Discord webhooks
- 🔄 Bulk scheduling
- 📊 Advanced analytics
- 🌍 Timezone support
- ⏰ Recurring schedules

---

**🎉 Chúc mừng! Scheduled Publishing đã sẵn sàng hoạt động!**
