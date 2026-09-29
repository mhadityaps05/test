import { useEffect, useState } from "react"
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Hash,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  CirclePlus,
  X,
} from "lucide-react"

const API_URL = "https://foods.zetasolution.id/"
const SORT_FIELDS = [
  ["created_at", "Tanggal ditambahkan"],
  ["name", "Nama makanan"],
  ["id", "ID"],
  ["number", "Nomor"],
  ["contributorName", "Kontributor"],
]

function formatDate(date) {
  if (!date) return "Tanggal tidak tersedia"
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.status === "ERROR") {
    throw new Error(payload.message || `Permintaan gagal (${response.status})`)
  }
  return payload
}

function App() {
  const [filters, setFilters] = useState({
    search: "",
    name: "",
    contributorName: "",
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState("created_at")
  const [order, setOrder] = useState("desc")
  const [result, setResult] = useState({ items: [], totalData: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError("")
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        order,
      })
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim())
      })
      try {
        const response = await fetch(`${API_URL}?${params}`, {
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        })
        const payload = await readResponse(response)
        setResult({
          items: payload.items || [],
          totalData: payload.totalData || 0,
        })
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") setError(fetchError.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [filters, page, limit, sortBy, order, refreshKey])

  const pageCount = Math.max(1, Math.ceil(result.totalData / limit))
  const firstItem = result.totalData === 0 ? 0 : (page - 1) * limit + 1
  const lastItem = Math.min(page * limit, result.totalData)

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  async function addFood(event) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    setNotice("")
    const formData = new FormData(event.currentTarget)
    const body = {
      name: String(formData.get("name")).trim(),
      contributorName: String(formData.get("contributorName")).trim(),
      description: String(formData.get("description")).trim(),
      number: Number(formData.get("number") || 1),
    }
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      await readResponse(response)
      setFormOpen(false)
      setPage(1)
      setNotice(`${body.name} berhasil ditambahkan ke katalog.`)
      setRefreshKey((current) => current + 1)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Dapur Kita, beranda">
          <span className="brand-mark">
            <ChefHat size={19} />
          </span>
          <span>
            Dapur<span className="brand-light">Kita</span>
          </span>
        </a>
        <div className="header-meta">
          <span className="status-dot" /> Katalog komunitas
        </div>
      </header>
      <main id="top">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow">
              <Sparkles size={14} /> DARI DAPUR KE MEJA
            </p>
            <h1 id="page-title">
              Cerita lezat,
              <br />
              <em>dibagikan bersama.</em>
            </h1>
            <p className="intro-description">
              Temukan hidangan favorit dari komunitas, atau tambahkan resep yang
              selalu ingin kamu ceritakan.
            </p>
          </div>
          <div className="intro-art" aria-hidden="true">
            <div className="plate plate-back" />
            <div className="plate plate-front" />
            <span className="art-caption">
              made with
              <br />a little love
            </span>
          </div>
        </section>

        <section className="catalog" aria-labelledby="catalog-title">
          <div className="catalog-heading">
            <div>
              <p className="section-kicker">JELAJAHI KOLEKSI</p>
              <h2 id="catalog-title">
                Menu komunitas{" "}
                <span className="total-count">
                  {loading ? "..." : result.totalData}
                </span>
              </h2>
            </div>
            <button
              className="primary-button"
              onClick={() => {
                setError("")
                setFormOpen(true)
              }}
            >
              <CirclePlus size={18} /> Tambah makanan
            </button>
          </div>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                aria-label="Tutup pemberitahuan"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button onClick={() => setRefreshKey((current) => current + 1)}>
                Coba lagi
              </button>
            </div>
          )}

          <div className="filter-panel">
            <label className="search-field">
              <Search size={18} />
              <span className="sr-only">Cari nama atau deskripsi</span>
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Cari hidangan atau bahan..."
              />
              {filters.search && (
                <button
                  type="button"
                  className="clear-search"
                  aria-label="Hapus pencarian"
                  onClick={() => updateFilter("search", "")}
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <div className="filter-fields">
              <label className="filter-input">
                <span>Nama makanan</span>
                <input
                  value={filters.name}
                  onChange={(event) => updateFilter("name", event.target.value)}
                  placeholder="Semua nama"
                />
              </label>
              <label className="filter-input">
                <span>Kontributor</span>
                <input
                  value={filters.contributorName}
                  onChange={(event) =>
                    updateFilter("contributorName", event.target.value)
                  }
                  placeholder="Semua kontributor"
                />
              </label>
              <label className="select-input">
                <span>
                  <SlidersHorizontal size={13} /> Urutkan
                </span>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value)
                    setPage(1)
                  }}
                >
                  {SORT_FIELDS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="order-button"
                onClick={() => {
                  setOrder((current) => (current === "asc" ? "desc" : "asc"))
                  setPage(1)
                }}
                aria-label={`Urutan ${order === "asc" ? "menaik" : "menurun"}, klik untuk mengubah`}
                title={`Urutan ${order === "asc" ? "menaik" : "menurun"}`}
              >
                {order === "asc" ? (
                  <ArrowUpWideNarrow size={18} />
                ) : (
                  <ArrowDownWideNarrow size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="results-bar">
            <span>
              <Utensils size={15} />{" "}
              {loading
                ? "Memuat hidangan..."
                : `Menampilkan ${firstItem}–${lastItem} dari ${result.totalData} hidangan`}
            </span>
            <label className="page-size">
              Per halaman{" "}
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value))
                  setPage(1)
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>
          <div
            className={`food-grid${loading ? " is-loading" : ""}`}
            aria-live="polite"
          >
            {loading ? (
              <div className="state-panel">
                <LoaderCircle className="spinner" size={28} />
                <span>Mengumpulkan hidangan...</span>
              </div>
            ) : result.items.length > 0 ? (
              result.items.map((food, index) => (
                <article
                  className="food-card"
                  key={food.id}
                  style={{ "--card-index": index }}
                >
                  <div
                    className={`food-art food-art-${index % 5}`}
                    aria-hidden="true"
                  >
                    <span>
                      {food.name?.trim().charAt(0)?.toUpperCase() || "M"}
                    </span>
                    <i />
                    <b />
                  </div>
                  <div className="food-content">
                    <div className="food-meta">
                      <span>
                        <Clock3 size={13} /> {formatDate(food.created_at)}
                      </span>
                      <span className="food-number">
                        <Hash size={12} />
                        {food.number ?? 1}
                      </span>
                    </div>
                    <h3>{food.name}</h3>
                    <p className="food-description">
                      {food.description ||
                        "Belum ada deskripsi untuk hidangan ini."}
                    </p>
                    <div className="contributor">
                      <span className="contributor-avatar">
                        {food.contributorName
                          ?.trim()
                          .charAt(0)
                          ?.toUpperCase() || "?"}
                      </span>
                      <span>
                        Disumbangkan oleh{" "}
                        <strong>{food.contributorName || "Anonim"}</strong>
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="state-panel empty-state">
                <span className="empty-icon">
                  <Search size={23} />
                </span>
                <h3>Belum ada hidangan ditemukan</h3>
                <p>Coba ubah kata kunci atau filter pencarianmu.</p>
                <button
                  className="text-button"
                  onClick={() => {
                    setFilters({ search: "", name: "", contributorName: "" })
                    setPage(1)
                  }}
                >
                  Hapus semua filter
                </button>
              </div>
            )}
          </div>
          <footer className="pagination">
            <span className="page-summary">
              Halaman {page} dari {pageCount}
            </span>
            <div className="page-controls">
              <button
                aria-label="Halaman sebelumnya"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                {page}
                <i>/</i>
                {pageCount}
              </span>
              <button
                aria-label="Halaman berikutnya"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </footer>
        </section>
      </main>
      <footer className="site-footer">
        <span>
          <ChefHat size={15} /> DapurKita
        </span>
        <span>Diracik bersama komunitas.</span>
        <span className="api-label">
          <ArrowUpWideNarrow size={13} /> Terhubung ke Foods API
        </span>
      </footer>

      {formOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting)
              setFormOpen(false)
          }}
        >
          <section
            className="add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <p className="section-kicker">TAMBAHKAN KE KOLEKSI</p>
                <h2 id="modal-title">Punya cerita makanan?</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Tutup"
                disabled={submitting}
                onClick={() => setFormOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <p className="modal-description">
              Bagikan satu hidangan yang punya tempat spesial di mejamu.
            </p>
            <form className="food-form" onSubmit={addFood}>
              <label>
                Nama makanan <span>*</span>
                <input
                  autoFocus
                  name="name"
                  required
                  maxLength="120"
                  placeholder="Contoh: Soto Betawi"
                />
              </label>
              <label>
                Nama kontributor <span>*</span>
                <input
                  name="contributorName"
                  required
                  maxLength="80"
                  placeholder="Nama kamu"
                />
              </label>
              <label>
                Deskripsi <small>Opsional</small>
                <textarea
                  name="description"
                  rows="3"
                  maxLength="500"
                  placeholder="Apa yang membuatnya istimewa?"
                />
              </label>
              <label>
                Nomor <small>Opsional · default 1</small>
                <input
                  name="number"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="1"
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={submitting}
                  onClick={() => setFormOpen(false)}
                >
                  Batal
                </button>
                <button className="primary-button" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoaderCircle className="spinner" size={17} />{" "}
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CirclePlus size={17} /> Simpan hidangan
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
