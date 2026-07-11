# TNA – Khảo sát Nhu cầu Đào tạo ESG · TCIT (2026)

Biểu mẫu khảo sát nhu cầu đào tạo (Training Needs Analysis) cho dự án tư vấn ESG tại TCIT. Trang tĩnh, chạy trực tiếp trên GitHub Pages; dữ liệu gửi về Google Sheet qua Apps Script.

## Link công khai

- Form: https://shibadata.github.io/TNA-TCIT-ESG-2026/

## Cấu trúc

| Đường dẫn | Là gì |
|---|---|
| `index.html` | Form khảo sát (bản v3). Mở trực tiếp hoặc qua GitHub Pages. |
| `apps-script/Code.gs` | Web App Apps Script – nhận submit, ghi vào tab `Raw` của Google Sheet. |
| `apps-script/header-row-raw.txt` | Dòng tiêu đề 50 cột, dán vào ô A1 tab `Raw`. |
| `apps-script/SETUP.md` | Hướng dẫn đấu nối form ↔ Google Sheet (deploy, quyền, FE-contract). |

## Đấu nối dữ liệu (tóm tắt)

Chi tiết đầy đủ ở `apps-script/SETUP.md`. Bốn bước chính:

1. Google Sheet đích: tab `Raw`, dán `header-row-raw.txt` vào A1.
2. Trong chính Sheet đó: Extensions → Apps Script (bound script), dán `Code.gs`, đổi `SECRET`.
3. Deploy → Web app (Execute as: Me · Access: Anyone), copy Web App URL.
4. Trong `index.html`, khối `CONFIG`: điền `SCRIPT_URL` và `TOKEN` (khớp `SECRET`).

Khi `SCRIPT_URL` còn rỗng, form chạy ở chế độ demo (không ghi đi đâu, payload in ra Console).

## Sửa về sau

Trang tĩnh thuần HTML/CSS/JS trong một file `index.html` – sửa trực tiếp rồi commit là GitHub Pages tự cập nhật.
