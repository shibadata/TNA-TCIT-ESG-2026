# HANDOFF — context cho session làm việc trên repo này

File này để một session mới (Claude Code web hoặc người) đọc là nắm đủ context làm tiếp, không cần hội thoại gốc. Cập nhật khi trạng thái đổi.

Cập nhật: 2026-07-12

## Đây là gì

Form khảo sát nhu cầu đào tạo ESG (Training Needs Analysis) cho dự án tư vấn ESG tại **TCIT** (Tân Cảng – Cái Mép International Terminal). Trang tĩnh một file `index.html`, chạy trên GitHub Pages; dữ liệu gửi về Google Sheet qua Google Apps Script.

- Form live: https://shibadata.github.io/TNA-TCIT-ESG-2026/
- Repo: https://github.com/shibadata/TNA-TCIT-ESG-2026 (public)
- Sheet đích: ID `1jefHIO8hfWoN5l_3OhMSS525_AOgRukuVpVfw7xdTc4`, tab `Raw`, 50 cột.

## Đối tượng trả lời (định hình toàn bộ giọng văn — đừng phá)

Cán bộ TCIT: **formal, nghiêm túc, sợ trả lời sai, ngại bị đánh giá kém, tôn ti tổ chức khá chặt**. Vì vậy wording toàn form theo hướng:
- Đồng kiến tạo, không phải "kiểm tra": form được thiết kế dựa trên chia sẻ của họ, không theo khuôn mẫu áp xuống.
- An toàn tâm lý: nhấn mạnh "không đánh giá cá nhân/đơn vị", "không có mức đáng lẽ phải biết", "việc đang làm tốt cũng đáng ghi nhận", "kể cả điều chưa tiện nói trong cuộc họp đông người".
- Trang trọng nhưng gọn: hạn chế lặp "anh/chị"; dùng "đơn vị" thay "bộ phận của anh/chị" ở phần lớn câu.
- Thang đánh giá matrix giữ NGUYÊN bản gốc TNA chính thức (không tự làm mềm).

## Cấu trúc file

| Đường dẫn | Vai trò |
|---|---|
| `index.html` | Toàn bộ form (HTML + CSS + JS trong một file). Sửa ở đây. |
| `apps-script/Code.gs` | Web App Apps Script: nhận POST, validate, ghi 1 dòng vào tab `Raw`. |
| `apps-script/header-row-raw.txt` | Dòng tiêu đề 50 cột (tab-separated), dán vào ô A1 tab `Raw`. |
| `apps-script/SETUP.md` | Hướng dẫn deploy + đấu nối + FE-contract (shape request/response, mã lỗi). |
| `README.md` | Mô tả ngắn + link. |

## Thiết kế form (đã chốt với chủ dự án)

Cấu trúc tab: Thông tin · A Điều cần đạt · B Điều cần biết · C Hiện trạng · D Đồng thiết kế · Xem & Gửi.

- **Thông tin:** biệt danh (KHÔNG bắt buộc; kiêm vai định danh khi gửi lại bản cập nhật — không có mã cá nhân); chức danh; đơn vị (droplist); số năm làm việc (droplist); đã dự buổi 09/04 chưa.
- **Đơn vị (droplist):** 5 đơn vị theo org chart TCIT — Trung tâm ĐHSX · Phòng HCNS · Phòng TCKT · Phòng Kỹ thuật (kể cả IT) · Phòng Kinh doanh — cộng Ban Lãnh đạo và "Khác" (chọn Khác thì bắt buộc ghi rõ). Bám đúng org chart, KHÔNG tách Đội Cơ giới CHE.
- **Số năm (droplist):** Dưới 1 năm · 1..9 (từng năm) · 10–15 năm · Trên 15 năm. Lưu code (`duoi_1`, `1`..`9`, `10_15`, `tren_15`).
- **Câu bắt buộc:** tất cả bắt buộc TRỪ câu 4.4 (chia sẻ thêm — optional).
- **Multi-choice:** 1.3 và 3.3 chọn tối đa 3; 4.2 không giới hạn. Mục "Khác" trong 3 câu này phải ghi rõ nếu chọn.
- **Matrix likert (2.2 và 3.1):** các dòng cố định bắt buộc chấm đủ. Mỗi matrix có dòng "Khác" tự nhập: gõ nội dung + chấm điểm xong một dòng thì tự mọc dòng kế (tạo động bằng DOM), tối đa 3 dòng. Dòng Khác optional; nhưng nếu có text thì phải có điểm và ngược lại (validate hai đầu FE + Apps Script).
- **Mỗi phần A/B/C/D** có một khối mô tả mục tiêu phần đó gắn với người trả lời (`.partaim`). Nhiều câu text có ví dụ minh họa ngay dưới ô nhập (`.eg`), ví dụ neo vào bối cảnh TCIT thật.
- **Hero + khối mốc dự án + callout NDA** chỉ hiện ở tab đầu; ẩn khi sang tab khác (`#intro.intro-hidden`). Callout bảo mật KHÔNG sticky.
- Autosave nháp vào localStorage; khôi phục khi mở lại. Honeypot chống bot. Rate-limit theo session ở Apps Script.

## Trạng thái hiện tại

- Form + Apps Script + Pages: XONG, đã push, Pages sống.
- **CHƯA nối dữ liệu thật.** `CONFIG.SCRIPT_URL` trong `index.html` đang rỗng ⇒ form chạy **chế độ demo**: bấm Gửi ra màn cảm ơn, payload in ra Console (F12), KHÔNG ghi vào Sheet.

## Việc còn phải làm (cần chủ dự án, không tự động được)

Nối form vào Sheet — làm theo `apps-script/SETUP.md`:
1. Mở Sheet đích, tab `Raw`, dán `header-row-raw.txt` vào A1.
2. Trong chính Sheet đó: Extensions → Apps Script (bound script), dán `Code.gs`, đổi `SECRET`.
3. Deploy → Web app (Execute as: Me · Access: Anyone) → copy Web App URL.
4. Trong `index.html` khối `CONFIG`: điền `SCRIPT_URL` = URL vừa copy, `TOKEN` = đúng `SECRET`. Commit → Pages tự cập nhật.
5. Điền thử một bản, kiểm tab `Raw` có dòng mới đúng cột.

## Cách sửa và triển khai

`index.html` là trang tĩnh thuần. Sửa file → commit lên `main` → GitHub Pages tự build lại (~1–2 phút), cùng URL. Nếu đổi schema (thêm/bớt câu) phải đồng bộ cả 3: `index.html` (collect + validate + review), `apps-script/Code.gs` (COLS + validate), `apps-script/header-row-raw.txt` (dán lại A1). Thứ tự cột trong ba nơi phải khớp nhau.
