# Dokumentasi Teknis Sistem & Skema Database

Dokumen ini memuat spesifikasi arsitektur reverse proxy dan skema basis data terdistribusi (*polyglot persistence*) untuk laboratorium sistem backend terintegrasi.

---

## 1. Arsitektur Nginx Reverse Proxy & Jaringan Container

```mermaid
graph TD
    Client["Klien / Peramban Web"]

    subgraph Host_Gateway ["Gerbang Utama Host"]
        Port8080["Port Masuk Host : 8080"]
    end

    subgraph Docker_Platform ["Platform Docker"]
        NginxProxy["Nginx Reverse Proxy Container<br/>(Port Internal : 80)<br/>Pemeriksa Hostname & Header Forwarding"]

        subgraph Network_Laravel ["Jaringan Terisolasi: laravel-proxy"]
            AppLaravel["Container: app-laravel<br/>(PHP 8.4 + Laravel)<br/>Port : 8001"]
            DBMySQL[("Database: MySQL 8.0<br/>Port : 3306")]
        end

        subgraph Network_Node ["Jaringan Terisolasi: node-proxy"]
            AppNode["Container: app-node<br/>(Node.js 20 + Express)<br/>Port : 8002"]
            DBMongo[("Database: MongoDB 7.0<br/>Port : 27017")]
        end

        subgraph Network_Go ["Jaringan Terisolasi: go-proxy"]
            AppGo["Container: app-go<br/>(Golang 1.22 Runtime)<br/>Port : 8003"]
            DBPostgres[("Database: PostgreSQL 16<br/>Port : 5432")]
        end
    end

    Client -->|HTTP Request| Port8080
    Port8080 --> NginxProxy

    NginxProxy -->|"Host: laravel.wac.web.id"| AppLaravel
    NginxProxy -->|"Host: node.wac.web.id"| AppNode
    NginxProxy -->|"Host: go.wac.web.id"| AppGo

    AppLaravel --- DBMySQL
    AppNode --- DBMongo
    AppGo --- DBPostgres
```

---

## 2. Skema Basis Data (Entity Relationship Diagram)

```mermaid
erDiagram
    MYSQL_USERS {
        bigint id PK
        string name "Nama pengguna"
        string email UK "Email resmi"
        string password "Hash bcrypt"
        string role "Administrator / Operator"
        timestamp created_at
        timestamp updated_at
    }

    MYSQL_USER_PROFILES {
        bigint id PK
        bigint user_id FK "Relasi ke users"
        string phone_number
        string avatar_url
        text address
        timestamp created_at
    }

    MYSQL_ACTIVITY_LOGS {
        bigint id PK
        bigint user_id FK
        string action_name
        string ip_address
        text user_agent
        timestamp created_at
    }

    MYSQL_USERS ||--o| MYSQL_USER_PROFILES : "memiliki"
    MYSQL_USERS ||--o{ MYSQL_ACTIVITY_LOGS : "mencatat"

    PG_ITEMS {
        serial id PK
        varchar_255 title "Nama produk/barang"
        text description "Keterangan detail"
        timestamp created_at
    }

    PG_TRANSACTIONS {
        bigint id PK
        string transaction_code UK
        decimal total_amount
        string payment_status
        timestamp created_at
    }

    PG_TRANSACTION_DETAILS {
        bigint id PK
        bigint transaction_id FK
        int item_id FK
        int quantity
        decimal unit_price
    }

    PG_TRANSACTIONS ||--|{ PG_TRANSACTION_DETAILS : "memiliki"
    PG_ITEMS ||--o{ PG_TRANSACTION_DETAILS : "tercantum"

    MONGO_ITEMS_COLLECTION {
        objectId _id PK
        string title
        string description
        array tags
        date createdAt
    }

    MONGO_ANALYTICS_EVENTS {
        objectId _id PK
        string event_type
        string client_ip
        document request_headers
        date timestamp
    }
```

---

## 3. Spesifikasi Layanan & Protokol Jaringan

| Layanan | Teknologi & Runtime | Database | Port Internal | Virtual Host / Server Name |
|---|---|---|---|---|
| **Layanan Utama** | PHP 8.4 + Laravel 11 | MySQL 8.0 | `8001` | `laravel.wac.web.id` |
| **Layanan Dokumen & API** | Node.js 20 + Express | MongoDB 7.0 | `8002` | `node.wac.web.id` |
| **Layanan Komputasi & Transaksi** | Golang 1.22 Runtime | PostgreSQL 16 | `8003` | `go.wac.web.id` |
| **Reverse Proxy Gateway** | Nginx 1.27 Alpine | - | `80` (Host: `8080`) | `*.wac.web.id` |

