// ==========================================
// SERVICE WORKER - BƯỚC 2: CACHE APP SHELL
// ==========================================

// Nhập thư viện IndexedDB để SW có thể giao tiếp với DB
importScripts('./db.js');

// Đặt tên cho kho Cache (thêm v1 để sau này dễ nâng cấp phiên bản)
const CACHE_NAME = 'vku-survey-cache-v5';

// Mảng chứa các đường dẫn file tĩnh cần đưa vào App Shell
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './db.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// 1. Sự kiện INSTALL: Xảy ra khi trình duyệt tải SW lần đầu tiên. Dùng để lưu App Shell.
self.addEventListener('install', event => {
    console.log('[Service Worker] Install Event: Đang cài đặt và cache App Shell...');
    
    // event.waitUntil() yêu cầu trình duyệt phải chờ cho đến khi tiến trình bên trong chạy xong
    event.waitUntil(
        // Mở kho lưu trữ Cache có tên là CACHE_NAME
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Đang pre-caching các file App Shell...');
                // Đổ toàn bộ mảng APP_SHELL vào kho Cache này
                return cache.addAll(APP_SHELL);
            })
            .then(() => {
                // Sau khi cache xong, ép SW active ngay lập tức
                self.skipWaiting();
            })
    );
});

// 2. Sự kiện ACTIVATE: Dọn dẹp các kho Cache cũ (không còn dùng nữa)
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate Event: Đang kích hoạt và dọn dẹp cache cũ...');

    event.waitUntil(
        // Lấy danh sách TẤT CẢ các kho Cache hiện có trong trình duyệt
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    // Lọc ra những kho CŨ — tức là không phải CACHE_NAME hiện tại
                    .filter(name => name !== CACHE_NAME)
                    // Xóa từng kho cũ đó đi
                    .map(oldCache => {
                        console.log('[SW] Đang xóa cache cũ:', oldCache);
                        return caches.delete(oldCache);
                    })
            );
        }).then(() => {
            // Nắm quyền kiểm soát trang ngay lập tức
            return self.clients.claim();
        })
    );
});

// 3. Sự kiện FETCH — Chiến lược Cache-First
// Mỗi khi trang web yêu cầu 1 file bất kỳ (HTML, CSS, JS, ảnh...),
// SW sẽ đứng ra kiểm tra: "File này có trong Cache chưa?"
self.addEventListener('fetch', event => {
    event.respondWith(
        // Bước 1: Tìm trong Cache trước
        caches.match(event.request)
            .then(cachedResponse => {
                // Nếu TÌM THẤY trong Cache → trả ngay, không cần mạng
                if (cachedResponse) {
                    console.log('[SW] Cache-First: Trả từ Cache ->', event.request.url);
                    return cachedResponse;
                }

                // Nếu KHÔNG TÌM THẤY → ra ngoài mạng tải về bình thường
                console.log('[SW] Cache-First: Không có Cache, tải từ mạng ->', event.request.url);
                return fetch(event.request);
            })
    );
});

// ==========================================
// 4. Sự kiện SYNC: Lắng nghe Background Sync
// Chạy ngầm khi có kết nối mạng (dù user không mở trang)
// ==========================================
self.addEventListener('sync', event => {
    console.log('[Service Worker] Sync Event: Bắt được tín hiệu đồng bộ ->', event.tag);

    if (event.tag === 'sync-surveys') {
        const MOCK_API = 'https://jsonplaceholder.typicode.com/posts';

        // Hàm xử lý đồng bộ thực sự
        const syncSurveys = async () => {
            const pendingList = await getAllPendingSurveys();
            if (pendingList.length === 0) return;

            console.log(`[SW-Sync] Đang gửi ${pendingList.length} khảo sát lên server ngầm...`);

            for (const survey of pendingList) {
                try {
                    const response = await fetch(MOCK_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(survey)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('[SW-Sync] ✅ Đã gửi thành công, ID:', result.id);
                        await deletePendingSurvey(survey.id); // Xóa khỏi hàng đợi
                    }
                } catch (error) {
                    console.warn('[SW-Sync] ❌ Lỗi kết nối, sẽ thử lại sau:', error);
                    // Có lỗi -> ném lỗi để SW tự động lên lịch chạy lại sau
                    throw error; 
                }
            }
        };

        // event.waitUntil() đảm bảo SW chạy ngầm cho đến khi syncSurveys() hoàn tất
        event.waitUntil(syncSurveys());
    }
});
