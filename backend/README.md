# Backend - IQ Test Admin System

## 📁 Cấu trúc Backend

```
backend/
├── config/           # Cấu hình hệ thống
│   └── supabase.ts   # Supabase client & config
├── auth/             # Xác thực
│   └── service.ts    # AuthService class
├── admin/            # Quản trị viên
│   └── service.ts    # AdminService class
├── database/         # Database
│   └── setup.sql     # SQL setup script
├── types/            # TypeScript types
│   └── index.ts      # Centralized types
├── utils/            # Tiện ích (future)
├── index.ts          # Main export file
└── README.md         # Documentation
```

## 🔧 Services

### AuthService
Xử lý tất cả các thao tác xác thực:

```typescript
// Đăng nhập
const { user, error } = await AuthService.signIn({ email, password });

// Đăng xuất
await AuthService.signOut();

// Lấy user hiện tại
const { user, error } = await AuthService.getCurrentUser();

// Lấy profile user
const { profile, error } = await AuthService.getUserProfile(userId);

// Kiểm tra admin
const isAdmin = await AuthService.isAdmin(userId);

// Xác thực admin (all-in-one)
const { isAdmin, user, profile, error } = await AuthService.verifyAdminAccess();
```

### AdminService
Xử lý các chức năng admin:

```typescript
// Lấy thống kê dashboard
const { stats, error } = await AdminService.getStats();

// Lấy quick actions
const actions = AdminService.getQuickActions();

// Lấy tất cả dữ liệu dashboard
const dashboardData = await AdminService.getDashboardData();

// Tạo admin user
const { success, error } = await AdminService.createAdminUser(userId, email);
```

## 🎯 Types

Tất cả types được centralized trong `types/index.ts`:

- `UserProfile` - Thông tin profile user
- `AuthUser` - User từ Supabase Auth
- `SignInCredentials` - Thông tin đăng nhập
- `AuthResponse` - Response từ auth operations
- `ProfileResponse` - Response từ profile operations
- `AdminStats` - Thống kê admin dashboard
- `AdminAction` - Quick action items

## 🔗 Import Usage

```typescript
// Import từ backend root
import { AuthService, AdminService, supabase } from '../../backend';
import type { UserProfile, AdminStats } from '../../backend';
```

## 🛡️ Bảo mật

1. **Row Level Security (RLS)** enabled trên tất cả tables
2. **Role-based access control** - chỉ admin mới truy cập được
3. **Type safety** với TypeScript
4. **Error handling** đầy đủ với console.log debug
5. **Input validation** và sanitization

## 📊 Database Schema

Xem file `database/setup.sql` để biết chi tiết:

- `profiles` - User profiles với role
- `test_results` - Kết quả test IQ
- `questions` - Câu hỏi test (future)
- Triggers & Functions tự động
- Indexes cho performance

## 🚀 Setup Instructions

1. **Tạo Supabase project**
2. **Chạy SQL script** từ `database/setup.sql`
3. **Cấu hình .env** với Supabase credentials
4. **Import backend services** vào React components
5. **Tạo admin user đầu tiên**

## 🔄 Future Enhancements

- [ ] Real-time subscriptions
- [ ] File upload service
- [ ] Email service
- [ ] Analytics service
- [ ] Backup/restore utilities
- [ ] API rate limiting
- [ ] Caching layer

## 🐛 Debug

Tất cả services có console.log debug. Mở DevTools để xem:

```
AuthService: Attempting sign in for: admin@example.com
AuthService: Sign in successful
AdminService: Getting dashboard data
AdminService: Dashboard data retrieved successfully
```

## 📝 Notes

- Backend được tổ chức theo **service pattern**
- **Separation of concerns** rõ ràng
- **Scalable architecture** cho future growth
- **Type-safe** với TypeScript
- **Error-first approach** cho reliability 