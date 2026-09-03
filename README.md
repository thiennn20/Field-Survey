# VKU Field Survey

Ứng dụng Progressive Web App (PWA) hỗ trợ khảo sát, theo dõi và quản lý tình trạng cơ sở vật chất tại Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn (VKU).

Ứng dụng được xây dựng bằng HTML, CSS và JavaScript thuần, không yêu cầu framework hoặc quy trình build riêng.

## Tính năng

- Tạo khảo sát cơ sở vật chất theo người khảo sát, khu vực và hạng mục.
- Đánh giá tình trạng và ghi nhận nội dung nhận xét chi tiết.
- Hiển thị thống kê tổng số, đã hoàn thành và chưa hoàn thành.
- Tìm kiếm theo tên, khu vực, hạng mục, đánh giá hoặc nhận xét.
- Lưu và xóa khảo sát bằng IndexedDB.
- Lưu dữ liệu chờ đồng bộ khi thiết bị mất kết nối.
- Hỗ trợ Background Sync trên các trình duyệt tương thích.
- Hoạt động ngoại tuyến nhờ Service Worker và Cache API.
- Có thể cài đặt lên máy tính hoặc điện thoại như một ứng dụng PWA.
- Giao diện responsive, phù hợp với desktop, tablet và mobile.

## Giao diện

Giao diện được thiết kế theo phong cách dashboard quản trị hiện đại:

- Thanh điều hướng gọn gàng theo nhận diện màu xanh VKU.
- Khu vực tổng quan với ba thẻ thống kê.
- Form tạo khảo sát và danh sách khảo sát bố trí hai cột trên desktop.
- Danh sách tự chuyển sang một cột trên màn hình nhỏ.
- Trạng thái rỗng và trạng thái không có kết quả tìm kiếm rõ ràng.
- Focus state, thông báo lỗi và nhãn hỗ trợ khả năng truy cập.

## Công nghệ sử dụng

- HTML5
- CSS3
- Vanilla JavaScript
- IndexedDB
- Service Worker
- Cache API
- Background Sync API
- Web App Manifest

## Cấu trúc dự án

```text
vku-field-survey/
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── db.js
├── index.html
├── main.js
├── manifest.json
├── README.md
├── style.css
└── sw.js
```

| Tệp | Chức năng |
| --- | --- |
| `index.html` | Cấu trúc giao diện dashboard, form và danh sách khảo sát |
| `style.css` | Design system, giao diện và responsive layout |
| `main.js` | Validation, submit form, thống kê, tìm kiếm và render dữ liệu |
| `db.js` | Khởi tạo và thao tác với IndexedDB |
| `sw.js` | Cache tài nguyên, hỗ trợ offline và Background Sync |
| `manifest.json` | Cấu hình cài đặt PWA |
| `icons/` | Icon sử dụng khi cài đặt ứng dụng |

## Chạy dự án trên VS Code

### Cách 1: Sử dụng Live Server

1. Mở thư mục `vku-field-survey` bằng VS Code.
2. Mở Extensions bằng tổ hợp phím `Ctrl + Shift + X`.
3. Tìm và cài extension **Live Server** của Ritwick Dey.
4. Mở tệp `index.html`.
5. Nhấp chuột phải và chọn **Open with Live Server**.

Ứng dụng sẽ được mở tại một địa chỉ tương tự:

```text
http://127.0.0.1:5500/index.html
```

### Cách 2: Sử dụng một HTTP server khác

Nếu máy đã cài Node.js, có thể dùng:

```bash
npx serve .
```

Sau đó mở địa chỉ localhost được hiển thị trong terminal.

> Không nên mở trực tiếp `index.html` bằng đường dẫn `file:///`. Service Worker và các tính năng PWA chỉ hoạt động trên `localhost` hoặc HTTPS.

## Cách sử dụng

1. Nhập đầy đủ họ tên, khu vực, hạng mục, mức đánh giá và nhận xét.
2. Chọn **Thêm khảo sát**.
3. Khảo sát được lưu vào IndexedDB và xuất hiện trong danh sách.
4. Dùng ô tìm kiếm để lọc các khảo sát đã lưu.
5. Chọn **Xóa khảo sát** nếu muốn xóa một bản ghi.

## Cơ chế lưu trữ và đồng bộ

Ứng dụng sử dụng hai object store trong IndexedDB:

- `surveys`: lưu các khảo sát đang hiển thị trong ứng dụng.
- `pendingSurveys`: lưu các khảo sát đang chờ đồng bộ.

Khi tạo khảo sát, dữ liệu được lưu cục bộ trước. Nếu trình duyệt hỗ trợ Background Sync, Service Worker sẽ xử lý hàng đợi khi có kết nối mạng. Nếu không hỗ trợ, ứng dụng sẽ thử đồng bộ trực tiếp.

Endpoint đồng bộ hiện tại là endpoint minh họa của JSONPlaceholder. Không nên sử dụng endpoint này làm nơi lưu trữ dữ liệu thật trong môi trường production.

## Xử lý cache khi phát triển

Service Worker sử dụng chiến lược cache-first. Nếu giao diện chưa cập nhật sau khi chỉnh sửa mã nguồn:

1. Nhấn `Ctrl + Shift + R` để tải lại không dùng cache.
2. Nếu vẫn còn giao diện cũ, mở Chrome DevTools.
3. Chọn **Application** → **Service Workers**.
4. Chọn **Unregister**, sau đó tải lại trang.

## Khả năng tương thích

Nên sử dụng phiên bản mới của Chrome, Microsoft Edge hoặc trình duyệt Chromium để có hỗ trợ tốt nhất cho Service Worker, cài đặt PWA và Background Sync.

## Thông tin đồ án

- **Đề tài:** Xây dựng PWA khảo sát cơ sở vật chất – VKU Field Survey
- **Đơn vị:** Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn
- **Môn học:** Phát triển ứng dụng đa nền tảng
