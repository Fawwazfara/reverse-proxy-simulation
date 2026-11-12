package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type DBStatus struct {
	Connected bool   `json:"connected"`
	Host      string `json:"host"`
	Port      string `json:"port"`
	Database  string `json:"database"`
	Message   string `json:"message"`
}

type Item struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

var (
	db       *sql.DB
	dbStat   DBStatus
	memItems = []Item{
		{ID: 1, Title: "Item Sample Go 1", Description: "Data in-memory fallback", CreatedAt: time.Now()},
		{ID: 2, Title: "Item Sample Go 2", Description: "Siap disambungkan ke PostgreSQL", CreatedAt: time.Now()},
	}
	memMutex sync.Mutex
	tmpl     *template.Template
)

func initDB() {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "127.0.0.1"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "godb"
	}
	sslmode := os.Getenv("DB_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}

	dbStat = DBStatus{
		Connected: false,
		Host:      host,
		Port:      port,
		Database:  dbname,
		Message:   "Menghubungkan ke PostgreSQL...",
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s connect_timeout=2",
		host, port, user, password, dbname, sslmode)

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		dbStat.Connected = false
		dbStat.Message = fmt.Sprintf("Error inisialisasi: %v", err)
		return
	}

	if err = db.Ping(); err != nil {
		dbStat.Connected = false
		dbStat.Message = fmt.Sprintf("Gagal ping PostgreSQL: %v", err)
		return
	}

	dbStat.Connected = true
	dbStat.Message = fmt.Sprintf("Berhasil terhubung ke database %s (%s:%s)", dbname, host, port)

	// Buat tabel jika belum ada
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS items (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		description TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	_, _ = db.Exec(createTableQuery)
}

func getClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
		return xrip
	}
	return r.RemoteAddr
}

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}

	var err error
	tmpl, err = template.ParseFiles("templates/index.html")
	if err != nil {
		fmt.Printf("Gagal membaca template: %v\n", err)
	}

	go initDB()

	mux := http.NewServeMux()

	// Endpoint UI Dashboard
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		proxyHeaders := map[string]string{
			"Host":              r.Host,
			"X-Real-IP":         r.Header.Get("X-Real-IP"),
			"X-Forwarded-For":   r.Header.Get("X-Forwarded-For"),
			"X-Forwarded-Proto": r.Header.Get("X-Forwarded-Proto"),
			"X-Forwarded-Host":  r.Header.Get("X-Forwarded-Host"),
			"X-Forwarded-Port":  r.Header.Get("X-Forwarded-Port"),
		}

		data := struct {
			Port         string
			GoVersion    string
			ClientIP     string
			ProxyHeaders map[string]string
			DBStatus     DBStatus
		}{
			Port:         port,
			GoVersion:    runtime.Version(),
			ClientIP:     getClientIP(r),
			ProxyHeaders: proxyHeaders,
			DBStatus:     dbStat,
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := tmpl.Execute(w, data); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})

	// Endpoint Healthcheck
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		res := map[string]interface{}{
			"status":    "healthy",
			"service":   "Go + PostgreSQL",
			"port":      port,
			"timestamp": time.Now().Format(time.RFC3339),
			"client_ip": getClientIP(r),
			"database": map[string]interface{}{
				"type":      "postgres",
				"connected": dbStat.Connected,
				"host":      dbStat.Host,
				"port":      dbStat.Port,
				"database":  dbStat.Database,
			},
			"proxy_headers": map[string]interface{}{
				"x_real_ip":         r.Header.Get("X-Real-IP"),
				"x_forwarded_for":   r.Header.Get("X-Forwarded-For"),
				"x_forwarded_proto": r.Header.Get("X-Forwarded-Proto"),
				"host":              r.Host,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(res)
	})

	// Endpoint Items List
	mux.HandleFunc("GET /api/items", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if dbStat.Connected && db != nil {
			rows, err := db.Query("SELECT id, title, description, created_at FROM items ORDER BY id DESC")
			if err == nil {
				defer rows.Close()
				var items []Item
				for rows.Next() {
					var item Item
					if err := rows.Scan(&item.ID, &item.Title, &item.Description, &item.CreatedAt); err == nil {
						items = append(items, item)
					}
				}
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"source": "postgresql",
					"data":   items,
				})
				return
			}
		}

		memMutex.Lock()
		defer memMutex.Unlock()
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"source": "memory_fallback",
			"data":   memItems,
		})
	})

	// Endpoint Items Create
	mux.HandleFunc("POST /api/items", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var req struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Title == "" {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Title is required"})
			return
		}

		if dbStat.Connected && db != nil {
			var newItem Item
			err := db.QueryRow("INSERT INTO items(title, description) VALUES($1, $2) RETURNING id, title, description, created_at",
				req.Title, req.Description).Scan(&newItem.ID, &newItem.Title, &newItem.Description, &newItem.CreatedAt)
			if err == nil {
				w.WriteHeader(http.StatusCreated)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"source": "postgresql",
					"data":   newItem,
				})
				return
			}
		}

		memMutex.Lock()
		defer memMutex.Unlock()
		newItem := Item{
			ID:          len(memItems) + 1,
			Title:       req.Title,
			Description: req.Description,
			CreatedAt:   time.Now(),
		}
		memItems = append(memItems, newItem)
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"source": "memory_fallback",
			"data":   newItem,
		})
	})

	fmt.Printf("[Go] Server running on http://0.0.0.0:%s\n", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		fmt.Printf("Gagal menjalankan server: %v\n", err)
	}
}
