## Docs API/Web checklist (SuperBoard)

Mục tiêu: đảm bảo các action trong phần **Tài liệu** không bị lệch endpoint, không crash runtime, và có fallback rõ ràng khi API/WS lỗi.

### 1) Docs REST (API service, prefix: `/api/v1`)

- List docs (tree)
  - FE: `getWorkspaceDocs(workspaceId)`
  - URL: `GET /api/v1/docs?workspaceId=:workspaceId`
  - Auth: Bearer required
- Create doc
  - FE: `createDoc(workspaceId, { title, content?, parentDocId? })`
  - URL: `POST /api/v1/docs?workspaceId=:workspaceId`
  - Auth: Bearer required
- Get doc detail
  - FE: `getDocDetail(docId)`
  - URL: `GET /api/v1/docs/:docId`
  - Auth: Bearer required
- Update doc (autosave)
  - FE: `updateDoc(docId, { title?, content?, parentDocId? })`
  - URL: `PUT /api/v1/docs/:docId`
  - Auth: Bearer required
- Delete doc (soft delete)
  - FE: `deleteDoc(docId)`
  - URL: `DELETE /api/v1/docs/:docId`
  - Auth: Bearer required
- Versions
  - FE: `getDocVersions(docId)`
  - URL: `GET /api/v1/docs/:docId/versions`
  - Auth: Bearer required
  - FE: `createVersion(docId, content)` (chưa có UI)
  - URL: `POST /api/v1/docs/:docId/versions`
  - Auth: Bearer required
- Restore version
  - FE: `restoreVersion(docId, versionId)`
  - URL: `POST /api/v1/docs/:docId/restore/:versionId`
  - Auth: Bearer required

### 2) AI endpoints (API service, prefix: `/api/v1/ai`)

- Summarize doc
  - FE: `summarizeDoc(docId)`
  - URL: `POST /api/v1/ai/docs/:docId/summarize`
  - Auth: Bearer required
- Process selected text
  - FE: `processText(text, mode)`
  - URL: `POST /api/v1/ai/text/process`
  - Auth: Bearer required

### 3) Collaboration (WS)

- TipTap collab provider (Hocuspocus)
  - FE env: `NEXT_PUBLIC_COLLAB_WS_URL` (fallback default: `ws://localhost:1234`)
  - Yjs room name: `docId`
  - Token: `localStorage.access_token`
  - Yêu cầu: UI phải degrade gracefully nếu WS/provider chưa sẵn sàng (không crash)

### 4) Runtime “must-not-crash” guards

- `RichTextEditor`:
  - Không truy cập `provider.awareness` khi provider null
  - Không giả định editor/state/doc luôn tồn tại trong lifecycle transition
- Pages:
  - Khi query lỗi (401/404/500) phải render error state, không render editor với data undefined
