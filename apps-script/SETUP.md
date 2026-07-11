# SETUP – TNA ESG TCIT v3 (đấu nối FE ↔ Google Sheet)

3 file của bản v3:
- `tna-survey3.html` – form (mở trực tiếp / deploy).
- `Code-tna-survey3.gs` – dán vào Apps Script.
- `header-row-raw-tna-survey3.txt` – dán vào dòng 1 tab Raw (các cột cách nhau bằng Tab, dán 1 phát ăn cả hàng).

Sheet đích: ID `1jefHIO8hfWoN5l_3OhMSS525_AOgRukuVpVfw7xdTc4`. Apps Script v3 là **bound script** – phải mở từ chính Sheet này (không dùng openById).

## Các bước (làm theo thứ tự)

1. Mở Google Sheet đích (theo SHEET_ID trên). Đổi tên tab đầu thành `Raw` (hoặc tạo tab mới tên `Raw`).
2. Mở `header-row-raw-tna-survey3.txt`, copy cả dòng, click ô **A1** của tab Raw, dán. 50 cột tự rải ra A1:AX1.
3. Trong **chính Sheet đó**: **Extensions → Apps Script** (BẮT BUỘC mở từ đây – bound script – để quyền chỉ giới hạn đúng Sheet này). Xóa code mẫu, dán toàn bộ `Code-tna-survey3.gs`.
4. Sửa trong `Code-tna-survey3.gs`:
   - `SECRET` = đặt 1 chuỗi bí mật bất kỳ (vd `tna-tcit-v3-x7k2`).
   - (Không còn SHEET_ID – bound script tự ghi vào Sheet chứa nó.)
5. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy, **Authorize**. Copy **Web app URL**.
6. Mở `tna-survey3.html`, tìm khối `CONFIG` (đầu thẻ `<script>`), điền:
   ```js
   const CONFIG = {
     SCRIPT_URL: "<dán Web app URL bước 5>",
     TOKEN: "<chuỗi SECRET bước 4, khớp y hệt>",
     DRAFT_KEY: "tna_esg_tcit_v3_draft"
   };
   ```
7. Mở lại `tna-survey3.html` → điền thử → Gửi → xem tab Raw có 1 dòng mới đúng cột.

## Lưu ý

- Sửa `Code-tna-survey3.gs` về sau: **Deploy → Manage deployments → Edit** (giữ nguyên URL). Đừng tạo New deployment kẻo đổi URL.
- Khi `SCRIPT_URL` còn rỗng → form chạy ở **chế độ demo**: bấm Gửi vẫn ra màn cảm ơn, payload in ra Console (F12), KHÔNG ghi đi đâu.
- Bound script (`getActiveSpreadsheet`) chỉ xin quyền hẹp (spreadsheets.currentonly) đúng Sheet này khi Authorize – không phải tất cả Google Sheets. Muốn giữ quyền hẹp thì Apps Script phải mở từ trong đúng Sheet đích (bước 3).
- Test ghi thật lên Sheet: hỏi Shiba trước khi chạy.

## Khác biệt schema so với bản 1/7 (index.html)

| Điểm | Bản 1/7 | Bản v3 |
|---|---|---|
| Danh tính | `r_hoten` (bắt buộc) + `respondent_code` | `nickname` (không bắt buộc, kiêm vai định danh gửi lại) |
| Phòng ban | `r_phongban` text tự do | `org_unit` droplist 7 mục (5 phòng + BLĐ + Khác) + `org_unit_other` |
| Định danh dòng | không có | `submission_id` (server sinh UUID) |
| Matrix "Khác" | không có | mỗi ma trận (2.2, 3.1) tối đa 3 dòng tự nhập: `*_other_1..3_text` + `*_other_1..3_score` |
| Câu text bắt buộc | chỉ multi/matrix + info | thêm 1.1, 1.2, 2.1, 3.2, 4.1, 4.3 bắt buộc; chỉ 4.4 không bắt buộc |
| Cột tổng | 37 | 50 |

## FE-CONTRACT (shape request/response)

FE gửi `POST <SCRIPT_URL>`, `Content-Type: text/plain;charset=utf-8` (cố ý né CORS preflight), body JSON:
```
{
  "action": "submit",
  "token":  "<SECRET>",
  "sessionId": "<uuid FE sinh, dùng rate-limit>",
  "website": "",                                (honeypot, phải rỗng)
  "payload": {
    "nickname": "...",                           (không bắt buộc)
    "job_title": "...",                          (bắt buộc)
    "org_unit": "dhsx|hcns|tckt|kythuat|kinhdoanh|bld|other",
    "org_unit_other": "...",                     (bắt buộc nếu org_unit = other)
    "years_at_company": "duoi_1|1|2|3|4|5|6|7|8|9|10_15|tren_15",
    "attended_intro_0904": "Có" | "Không",
    "a1_muctieu": "...", "a2_esg_giup": "...",    (bắt buộc)
    "a3_uutien": "a3_giam_chiphi,...",           (CSV ≤3)  "a3_uutien_khac": "...",
    "b1_kynang_can": "...",                       (bắt buộc)
    "b2_quydinh": 1..5, ... "b2_dichesg": 1..5,   (9 dòng)
    "b2_other_1_text": "...", "b2_other_1_score": 1..5,   (tới _3, đều optional; có text thì phải có score)
    "c1_esg_la_gi": 1..5, ... "c1_vithe": 1..5,   (8 dòng)
    "c1_other_1_text": "...", "c1_other_1_score": 1..5,   (tới _3, optional)
    "c2_dang_lam": "...",                         (bắt buộc)
    "c3_raocan": "...", "c3_raocan_khac": "...",  (CSV ≤3)
    "d1_diem_yeu": "...",                         (bắt buộc)
    "d2_hotro": "...", "d2_hotro_khac": "...",    (CSV không giới hạn)
    "d3_kyvong": "...",                           (bắt buộc)
    "d4_chia_se": "..."                           (KHÔNG bắt buộc)
  }
}
```
Server trả: `{ "ok": true }` hoặc `{ "ok": false, "error": "<mã lỗi>" }`.
Mã lỗi: `unauthorized` · `rejected` · `rate_limited` · `missing_*` / `bad_*` / `too_long_*` · `bad_request` · `server_error`.
