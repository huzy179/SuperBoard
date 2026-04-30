# SuperBoard Docker Infrastructure

Cấu trúc hạ tầng Docker chuyên nghiệp cho SuperBoard Monorepo.

## 📂 Thư mục Layout

```text
docker/
├── compose/                # Docker Compose files (Orchestration)
│   ├── docker-compose.yml        # Hạ tầng tối thiểu (Postgres, Redis, Collab)
│   ├── docker-compose.full.yml   # Toàn bộ hệ thống (Keycloak, AI, ELK, etc.)
│   └── docker-compose.monitoring.yml # Giám sát (Prometheus, Grafana)
├── config/                 # Service-specific configurations
│   ├── postgres/           # Scripts khởi tạo DB
│   ├── prometheus/         # Cấu hình quét metric
│   └── grafana/            # Provisioning dashboards & datasources
└── README.md               # Tài liệu hướng dẫn
```

## 🚀 Hướng dẫn sử dụng nhanh

Lưu ý: Mọi lệnh nên được chạy từ **thư mục gốc (root)** của dự án.

### 0. Chạy app trong Docker + tự cập nhật khi sửa code (Hot reload)

Mặc định, profile `app` đang chạy theo chế độ **production** (build một lần). Nếu bạn muốn sửa code trên máy và container cập nhật ngay, hãy chạy kèm file override dev:

```bash
docker compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.dev.yml --profile app up
```

Hoặc dùng script:

```bash
npm run dev:docker:hot
```

### 1. Chạy hệ thống tối thiểu (Cho dev core)

```bash
docker compose -f docker/compose/docker-compose.yml up -d
```

### 2. Chạy toàn bộ hệ sinh thái (Kèm AI & Infra)

```bash
docker compose -f docker/compose/docker-compose.full.yml up -d
```

### 3. Chạy hệ thống giám sát (Monitoring)

```bash
docker compose -f docker/compose/docker-compose.monitoring.yml up -d
```

## 📊 Monitoring Stack

Chúng tôi sử dụng bộ đôi Prometheus & Grafana để giám sát sức khỏe hệ thống:

- **Prometheus**: Thu thập metric từ API và AI-service.
- **Grafana**: Hiển thị biểu đồ trực quan (Truy cập tại http://localhost:3001, pass: `admin`).
- **Datasource**: Đã được cấu hình tự động (Provisioned) kết nối tới Prometheus.

## 🛠 Cấu trúc Dockerfile

Các Dockerfile được đặt trực tiếp trong thư mục của ứng dụng để đảm bảo tính đóng gói:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `apps/ai-service/Dockerfile`
- `apps/collab-service/Dockerfile`

## ⚠️ Lưu ý quan trọng

- **Build Context**: Luôn là thư mục gốc của dự án để đảm bảo `npm` có thể truy cập `packages/` và `package-lock.json`.
- **.dockerignore**: Đã được đưa ra thư mục gốc để tối ưu hóa tốc độ build và loại bỏ `node_modules` thừa.
