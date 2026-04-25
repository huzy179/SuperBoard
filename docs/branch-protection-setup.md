# Branch Protection Setup

Hướng dẫn cấu hình branch protection rules cho repository SuperBoard để đảm bảo mọi PR phải pass quality gate trước khi merge.

---

## Required Status Checks

Các checks sau phải pass trước khi merge vào `main`:

| Check name  | Workflow file  | Mô tả                           |
| ----------- | -------------- | ------------------------------- |
| `Lint`      | `pr-check.yml` | ESLint cho tất cả affected apps |
| `Typecheck` | `pr-check.yml` | TypeScript type checking        |
| `Test`      | `pr-check.yml` | Unit tests cho affected apps    |

---

## Cấu hình trên GitHub

### Bước 1: Vào Settings

1. Mở repository trên GitHub
2. Chọn **Settings** → **Branches**
3. Click **Add branch ruleset** (hoặc **Add rule** nếu dùng classic branch protection)

### Bước 2: Cấu hình Branch Ruleset (Recommended)

Nếu dùng **Rulesets** (GitHub UI mới):

1. **Ruleset name**: `main-protection`
2. **Enforcement status**: `Active`
3. **Target branches**: `main`
4. Bật các options sau:
   - ✅ **Restrict deletions**
   - ✅ **Require a pull request before merging**
     - Required approvals: `1`
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ **Require status checks to pass**
     - ✅ Require branches to be up to date before merging
     - Thêm status checks:
       - `Lint`
       - `Typecheck`
       - `Test`
   - ✅ **Block force pushes**

5. Click **Create**

### Bước 3: Cấu hình Classic Branch Protection (Alternative)

Nếu dùng **Branch protection rules** (UI cũ):

1. **Branch name pattern**: `main`
2. Bật:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: `1`
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Search và thêm: `Lint`, `Typecheck`, `Test`
   - ✅ **Do not allow bypassing the above settings**
3. Click **Save changes**

---

## Cấu hình qua GitHub CLI

```bash
# Cài GitHub CLI nếu chưa có: https://cli.github.com/

# Tạo ruleset cho branch main
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/{owner}/{repo}/rulesets \
  --input - <<EOF
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "Lint" },
          { "context": "Typecheck" },
          { "context": "Test" }
        ]
      }
    }
  ]
}
EOF
```

---

## Lưu ý

- Status check names (`Lint`, `Typecheck`, `Test`) phải khớp chính xác với `name:` field trong `.github/workflows/pr-check.yml`
- Checks chỉ xuất hiện trong dropdown sau khi workflow đã chạy ít nhất một lần trên repository
- Nếu workflow chưa chạy, nhập tên check thủ công vào ô search
- Admin có thể bypass rules — cân nhắc bật **Do not allow bypassing** để enforce nghiêm ngặt hơn

---

## Kiểm tra hoạt động

Sau khi cấu hình, tạo một PR test:

```bash
git checkout -b test/branch-protection
git commit --allow-empty -m "test: verify branch protection"
git push origin test/branch-protection
# Mở PR → kiểm tra status checks xuất hiện và required
```
