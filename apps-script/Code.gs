/**
 * TNA ESG TCIT v3 – Apps Script Web App (ghi vào Google Sheet)
 * Khớp tna-survey3.html. Không có endpoint đọc dữ liệu (không dashboard).
 *
 * SETUP tóm tắt (chi tiết: SETUP-tna-survey3.md):
 *  1. Mở Google Sheet đích, đổi tên tab đầu thành "Raw".
 *  2. Dán header-row-raw-tna-survey3.txt vào ô A1 của tab Raw.
 *  3. NGAY TRONG Sheet đó: Extensions -> Apps Script (BẮT BUỘC mở từ đây để là
 *     bound script -> quyền chỉ giới hạn đúng Sheet này). Dán file này.
 *  4. Đổi SECRET (khớp CONFIG.TOKEN trong tna-survey3.html).
 *  5. Deploy -> New deployment -> Web app (Execute as: Me · Access: Anyone).
 *     Copy Web App URL -> dán vào CONFIG.SCRIPT_URL trong tna-survey3.html.
 *  6. Sửa code về sau: Deploy -> Manage deployments -> Edit (giữ nguyên URL).
 *
 * LƯU Ý: bound script (getActiveSpreadsheet) chỉ xin quyền hẹp
 * (spreadsheets.currentonly) đúng Sheet này, không phải tất cả Google Sheets.
 * Vì thế KHÔNG dùng openById. Script phải bound trong đúng Sheet đích.
 */

const SECRET   = 'shiba-tna-tcit-2026-form';   // phải khớp CONFIG.TOKEN trong HTML
const TAB_NAME = 'Raw';

const TEXT_MAX  = 2000;   // textbox dài
const SHORT_MAX = 200;    // text ngắn
const NICK_MAX  = 200;
const MAX_BODY  = 64 * 1024;   // nới theo TEXT_MAX 2000 (tiếng Việt UTF-8 nhiều byte/ký tự)

const B2_ROWS = ['b2_quydinh','b2_ghg','b2_nangluong','b2_data','b2_hsse','b2_cangxanh','b2_kpi','b2_phoihop','b2_dichesg'];
const C1_ROWS = ['c1_esg_la_gi','c1_scope12','c1_euets','c1_cangxanh','c1_nangluong','c1_materiality','c1_esms','c1_vithe'];
const ORG_UNITS = ['dhsx','hcns','tckt','kythuat','kinhdoanh','bld','other'];
const YEAR_VALID = ['duoi_1','1','2','3','4','5','6','7','8','9','10_15','tren_15'];
const A3_VALID = ['a3_giam_chiphi','a3_tang_nangsuat','a3_dap_ung_hangtau','a3_he_thong_data','a3_attld_minhbach','a3_cang_xanh_chungnhan','a3_toiuu_noibo','a3_khac'];
const C3_VALID = ['c3_chua_hieu_esg','c3_thieu_congcu','c3_khong_ro_trachnhiem','c3_qua_ban','c3_chua_co_kpi','c3_thieu_phoihop','c3_chua_thay_loiich','c3_khac'];
const D2_VALID = ['d2_daotao_coban','d2_huongdan_thu_data','d2_xaydung_kpi','d2_congcu_bieumau','d2_raci','d2_workshop_casestudy','d2_cam_ket_lanhdao','d2_khac'];

// Thứ tự cột = thứ tự ghi = khớp header-row-raw-tna-survey3.txt
const COLS = [
  'timestamp','submission_id','nickname','job_title','org_unit','org_unit_other','years_at_company','attended_intro_0904',
  'a1_muctieu','a2_esg_giup','a3_uutien','a3_uutien_khac','b1_kynang_can',
  ...B2_ROWS,'b2_other_1_text','b2_other_1_score','b2_other_2_text','b2_other_2_score','b2_other_3_text','b2_other_3_score',
  ...C1_ROWS,'c1_other_1_text','c1_other_1_score','c1_other_2_text','c1_other_2_score','c1_other_3_text','c1_other_3_score',
  'c2_dang_lam','c3_raocan','c3_raocan_khac','d1_diem_yeu','d2_hotro','d2_hotro_khac','d3_kyvong','d4_chia_se'
];

function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > MAX_BODY) return out(false, 'bad_request');
    const data = JSON.parse(e.postData.contents);
    if (data.action !== 'submit') return out(false, 'bad_action');
    if (data.token !== SECRET)    return out(false, 'unauthorized');
    if (data.website)             return out(false, 'rejected');            // honeypot
    const sid = str(data.sessionId).slice(0, 64);
    if (sid && isRateLimited(sid)) return out(false, 'rate_limited');
    const p = data.payload || {};
    const err = validate(p);
    if (err) return out(false, err);
    writeRow(p);
    return out(true);
  } catch (_) {
    return out(false, 'server_error');
  }
}

function validate(p) {
  // required text/single (nickname KHÔNG bắt buộc; d4_chia_se KHÔNG bắt buộc)
  for (const k of ['job_title','a1_muctieu','a2_esg_giup','b1_kynang_can','c2_dang_lam','d1_diem_yeu','d3_kyvong']) {
    if (!nonEmpty(p[k])) return 'missing_' + k;
  }
  if (!ORG_UNITS.includes(p.org_unit)) return 'bad_org_unit';
  if (p.org_unit === 'other' && !nonEmpty(p.org_unit_other)) return 'missing_org_unit_other';
  if (!YEAR_VALID.includes(p.years_at_company)) return 'bad_years_at_company';
  if (p.attended_intro_0904 !== 'Có' && p.attended_intro_0904 !== 'Không') return 'bad_attended_intro_0904';

  // matrix cố định: mỗi dòng ∈ 1..5
  for (const c of B2_ROWS.concat(C1_ROWS)) if (!inRange(p[c])) return 'bad_matrix_' + c;

  // dòng "Khác" matrix (tối đa 3 mỗi ma trận): có text thì phải có score và ngược lại
  for (const prefix of ['b2','c1']) {
    for (let i = 1; i <= 3; i++) {
      const text  = str(p[prefix + '_other_' + i + '_text']).trim();
      const score = p[prefix + '_other_' + i + '_score'];
      const hasScore = score !== '' && score != null;
      if (text && !inRange(score)) return 'bad_' + prefix + '_other_' + i;
      if (!text && hasScore)       return 'bad_' + prefix + '_other_' + i;
      if (text.length > SHORT_MAX) return 'too_long_' + prefix + '_other_' + i;
    }
  }

  // multi: a3 ≤3, c3 ≤3, d2 không giới hạn; tất cả ≥1 và mã hợp lệ
  if (!validMulti(p.a3_uutien, A3_VALID, 3)) return 'bad_a3';
  if (!validMulti(p.c3_raocan, C3_VALID, 3)) return 'bad_c3';
  if (!validMulti(p.d2_hotro,  D2_VALID, 0)) return 'bad_d2';
  if (csv(p.a3_uutien).includes('a3_khac') && !nonEmpty(p.a3_uutien_khac)) return 'missing_a3_uutien_khac';
  if (csv(p.c3_raocan).includes('c3_khac') && !nonEmpty(p.c3_raocan_khac)) return 'missing_c3_raocan_khac';
  if (csv(p.d2_hotro).includes('d2_khac')  && !nonEmpty(p.d2_hotro_khac))  return 'missing_d2_hotro_khac';

  // trần ký tự
  for (const k of ['a1_muctieu','a2_esg_giup','b1_kynang_can','c2_dang_lam','d1_diem_yeu','d3_kyvong','d4_chia_se'])
    if (str(p[k]).length > TEXT_MAX) return 'too_long_' + k;
  if (str(p.nickname).length > NICK_MAX) return 'too_long_nickname';
  for (const k of ['job_title','org_unit_other','a3_uutien_khac','c3_raocan_khac','d2_hotro_khac'])
    if (str(p[k]).length > SHORT_MAX) return 'too_long_' + k;

  return null;
}

function writeRow(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_NAME);
    if (!sheet) throw new Error('missing_raw_tab');
    const sid = Utilities.getUuid();
    sheet.appendRow(COLS.map(c => {
      if (c === 'timestamp') return new Date();
      if (c === 'submission_id') return sid;
      return p[c] == null ? '' : String(p[c]);
    }));
  } finally { lock.releaseLock(); }
}

function isRateLimited(sid) { const c = CacheService.getScriptCache(), k = 'tna_v3_' + sid, n = +c.get(k) || 0; if (n >= 5) return true; c.put(k, String(n + 1), 600); return false; }
function nonEmpty(v) { return str(v).trim().length > 0; }
function str(v) { return v == null ? '' : String(v); }
function inRange(v) { const n = +v; return Number.isInteger(n) && n >= 1 && n <= 5; }
function csv(v) { return str(v).split(',').map(x => x.trim()).filter(Boolean); }
function validMulti(v, valid, max) { const a = csv(v); return a.length > 0 && (!max || a.length <= max) && a.every(x => valid.indexOf(x) !== -1); }
function out(ok, error) { return ContentService.createTextOutput(JSON.stringify(error ? { ok: ok, error: error } : { ok: ok })).setMimeType(ContentService.MimeType.JSON); }
