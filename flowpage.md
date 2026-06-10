# APILens — UI Flow

## Tổng quan luồng

```
Landing Page
    ↓ Continue with GitHub
GitHub OAuth (redirect)
    ↓ callback
Repository & Branch Picker
    ↓ Analyze
Loading / Analyzing Screen
    ↓ done
Result Dashboard
```

---

## 1. Landing Page

**Route:** `/`

**Mục đích:** Giới thiệu sản phẩm, đưa user đến nút login.

**Sections:**
- Navbar: logo trái, CTA phải
- Hero: tagline + subtext + nút "Continue with GitHub"
- How it works: 3 bước dạng `01 — 02 — 03`
- Live demo card: mock report (score, radar chart, smell tags)
- Supported inputs: OpenAPI · Postman · Express.js
- Footer

**Actions:**
- Click "Continue with GitHub" → redirect sang GitHub OAuth

---

## 2. GitHub OAuth

**Route:** `/auth/github` → redirect → `/auth/github/callback`

**Mục đích:** Xác thực user qua GitHub, lấy access token.

**Flow:**
1. Backend redirect sang `github.com/login/oauth/authorize`
2. User approve trên GitHub
3. GitHub callback về backend với `code`
4. Backend exchange lấy `access_token`, tạo JWT
5. Redirect về `/app?token=JWT`

**Không có UI riêng** — đây là redirect flow thuần.

---

## 3. Repository & Branch Picker

**Route:** `/app`

**Mục đích:** User chọn repo, branch, confirm file để analyze.

**Layout:** Single page, max-width 560px, centered.

**Step indicator:** `01 — Repository  02 — Branch  03 — Analyze` (inline, không phải 3 màn riêng)

**Interaction flow:**

```
Hiển thị search input + danh sách repo
    ↓ user chọn 1 repo
Row expand inline:
  - Branch dropdown (default: main/master)
  - File list hiện ra bên dưới:
      ☑ src/routes/user.js     Express
      ☑ src/routes/order.js    Express
      ☑ openapi.yaml           OpenAPI
  - Nút "Analyze →"
    ↓ user bấm Analyze
```

**Edge cases:**
- Không tìm thấy file nào → empty state: *"No analyzable files found. APILens supports Express .js, OpenAPI .yaml/.json, Postman .json."*
- Repo quá lớn (>1000 files) → warning banner phía trên file list

**API calls:**
- `GET /api/v1/repos` — load danh sách repo
- `GET /api/v1/repos/:owner/:repo/branches` — load branches khi chọn repo
- `GET /api/v1/repos/:owner/:repo/tree?branch=` — scan file tree, hiển thị file list

---

## 4. Loading / Analyzing Screen

**Route:** `/app/analyzing/:analysisId`

**Mục đích:** Hiển thị tiến trình trong khi backend xử lý (15–20 giây).

**Layout:** Centered, max-width 480px.

**Content:**
- Context: `username/repo-name · branch`
- Label: "Analyzing your API"
- Subtext: "This usually takes 15–20 seconds"

**Progress steps (vertical list):**

| State | Icon | Label |
|---|---|---|
| Done | ✓ | Fetching file from GitHub |
| Done | ✓ | Parsing routes — 9 endpoints found |
| Active | ⟳ | Running rule engine... |
| Waiting | – | Generating AI suggestions |

**Polling logic:**
- Frontend poll `GET /api/v1/analyses/:id` mỗi 2 giây
- Khi `status === 'done'` → redirect sang Result Dashboard
- Khi `status === 'failed'` → redirect sang error state với `errorMessage`

---

## 5. Result Dashboard

**Route:** `/app/analyses/:analysisId`

**Mục đích:** Hiển thị kết quả phân tích đầy đủ.

**Layout:** 2 cột, max-width 1100px.

### Left column (35%)

- **Score:** số lớn trong circle ring, label "Quality Score"
- **Stats:**
  - Số endpoint analyzed
  - Số smells detected
  - `owner/repo · branch`
- **Radar chart:** 5 axes — Naming · HTTP Design · Documentation · Security · Response
- **Smell list:** danh sách issues, mỗi row có:
  - 2px left border theo severity (Critical / Medium / Low)
  - Smell name + endpoint path
  - Click row → update right panel

### Right column (65%)

Detail panel của smell đang được chọn:
- Smell name + severity
- Affected endpoints (monospace, có line number)
- Description
- AI Suggestion (background nhẹ hơn, left border)

**Score color states:**

| Range | Color |
|---|---|
| 0–49 | Red |
| 50–79 | Amber |
| 80–100 | Green |

**Severity border colors:**

| Severity | Color |
|---|---|
| Critical | Red |
| Medium | Amber |
| Low | Gray |

---

## Edge Cases & Empty States

| Tình huống | Xử lý |
|---|---|
| Không tìm thấy file trong repo | Empty state với hướng dẫn |
| Repo > 1000 files | Warning banner, vẫn cho analyze |
| Parse thất bại | Error state với lý do cụ thể |
| AI call thất bại | Vẫn show kết quả, suggestion dùng fallback template |
| Analysis timeout | Redirect về error page, cho phép retry |

---

## Navigation Summary

| Từ | Đến | Trigger |
|---|---|---|
| Landing | GitHub OAuth | Click "Continue with GitHub" |
| GitHub OAuth | Repo Picker | OAuth callback thành công |
| Repo Picker | Loading Screen | Click "Analyze" |
| Loading Screen | Result Dashboard | `status === 'done'` |
| Result Dashboard | Repo Picker | Click "Analyze another repo" |
| Bất kỳ trang nào | Landing | Click logo |