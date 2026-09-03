// ==========================================
// db.js — Quản lý IndexedDB cho VKU Field Survey
// ==========================================

const DB_NAME = 'VKUSurveyDB';
const DB_VERSION = 2;           // Tăng lên 2 để thêm Object Store mới
const STORE_NAME = 'surveys';
const PENDING_STORE = 'pendingSurveys'; // Hàng đợi chờ đồng bộ lên server

// Biến lưu trữ kết nối đến DB (để dùng lại, không mở nhiều lần)
let db = null;

/**
 * Mở kết nối đến IndexedDB.
 * Trả về một Promise: resolve(db) nếu thành công, reject(error) nếu thất bại.
 */
function openDB() {
    // Nếu đã mở kết nối rồi thì trả về luôn, không mở lại
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
        // Mở (hoặc tạo mới) database với tên và phiên bản đã định
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Sự kiện onupgradeneeded: Chạy khi DB được tạo lần đầu hoặc nâng phiên bản
        // Đây là nơi DUY NHẤT để tạo Object Store (tương đương tạo bảng trong SQL)
        request.onupgradeneeded = (event) => {
            console.log('[DB] Đang khởi tạo cấu trúc Database...');
            const database = event.target.result;

            // Tạo Object Store 'surveys' (lưu tất cả khảo sát để hiển thị)
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                console.log('[DB] Đã tạo Object Store "surveys" thành công!');
            }

            // Tạo Object Store 'pendingSurveys' (hàng đợi chờ đồng bộ lên server)
            if (!database.objectStoreNames.contains(PENDING_STORE)) {
                database.createObjectStore(PENDING_STORE, { keyPath: 'id' });
                console.log('[DB] Đã tạo Object Store "pendingSurveys" thành công!');
            }
        };

        // Sự kiện onsuccess: Kết nối thành công
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('[DB] Kết nối IndexedDB thành công!');
            resolve(db);
        };

        // Sự kiện onerror: Kết nối thất bại
        request.onerror = (event) => {
            console.error('[DB] Lỗi kết nối IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Thêm một bản ghi khảo sát mới vào DB.
 * @param {Object} survey - Object khảo sát cần lưu
 */
function addSurvey(survey) {
    return openDB().then(database => {
        return new Promise((resolve, reject) => {
            // Tạo một "transaction" (giao dịch) ghi vào store 'surveys'
            const transaction = database.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(survey);

            request.onsuccess = () => {
                console.log('[DB] Đã lưu khảo sát:', survey.id);
                resolve();
            };
            request.onerror = (event) => {
                console.error('[DB] Lỗi lưu khảo sát:', event.target.error);
                reject(event.target.error);
            };
        });
    });
}

/**
 * Lấy toàn bộ danh sách khảo sát từ DB.
 * Trả về mảng (Array) các object khảo sát.
 */
function getAllSurveys() {
    return openDB().then(database => {
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
}

/**
 * Xóa một bản ghi khảo sát theo ID.
 * @param {string} id - ID của khảo sát cần xóa
 */
function deleteSurveyFromDB(id) {
    return openDB().then(database => {
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('[DB] Đã xóa khảo sát:', id);
                resolve();
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
}

// ==========================================
// CÁC HÀM QUẢN LÝ HÀNG ĐỢI ĐỒNG BỘ (Background Sync)
// ==========================================

/**
 * Thêm khảo sát vào hàng đợi chờ đồng bộ lên server.
 * Gọi hàm này mỗi khi user submit form.
 */
function addPendingSurvey(survey) {
    return openDB().then(database => {
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([PENDING_STORE], 'readwrite');
            const store = transaction.objectStore(PENDING_STORE);
            const request = store.add(survey);
            request.onsuccess = () => {
                console.log('[DB] Đã thêm vào hàng đợi sync:', survey.id);
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    });
}

/**
 * Lấy toàn bộ danh sách khảo sát đang chờ đồng bộ.
 */
function getAllPendingSurveys() {
    return openDB().then(database => {
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([PENDING_STORE], 'readonly');
            const store = transaction.objectStore(PENDING_STORE);
            const request = store.getAll();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    });
}

/**
 * Xóa một khảo sát khỏi hàng đợi sau khi đã đồng bộ thành công.
 */
function deletePendingSurvey(id) {
    return openDB().then(database => {
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([PENDING_STORE], 'readwrite');
            const store = transaction.objectStore(PENDING_STORE);
            const request = store.delete(id);
            request.onsuccess = () => {
                console.log('[DB] Đã xóa khỏi hàng đợi sync:', id);
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    });
}

// Khởi động kết nối DB ngay khi file db.js được tải vào trang
openDB();
