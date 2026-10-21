import { useEffect, useMemo, useState } from "react";
import "./App.css";
import AIAssistant from "./AIAssistant";

const API_URL = "http://127.0.0.1:8000/api/prices";
const PAGE_SIZE = 10;

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "pricing", label: "Pricing Records", icon: "▤" },
  { id: "upload", label: "CSV Upload", icon: "⇧" },
  { id: "reports", label: "Reports", icon: "▥" },
  { id: "ai", label: "AI Assistant", icon: "✦" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

const currencyByCountry = {
  India: "INR",
  Singapore: "SGD",
  UAE: "AED",
  UK: "GBP",
  USA: "USD",
  Australia: "AUD",
  Malaysia: "MYR",
  Germany: "EUR",
  "Saudi Arabia": "SAR",
  Canada: "CAD",
};

function formatPrice(price, country = "India") {
  const currency = currencyByCountry[country] || "INR";
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).format(amount);
}

function mapPrice(record) {
  return {
    id: record.id,
    storeId: record.store_id ?? record.storeId ?? "",
    sku: record.sku ?? "",
    productName: record.product_name ?? record.productName ?? "",
    country: record.country ?? "India",
    price: Number(record.price),
    date: String(record.price_date ?? record.date ?? "").slice(0, 10),
  };
}



function App() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [page, setPage] = useState("dashboard");

  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [skuFilter, setSkuFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const [compactTable, setCompactTable] = useState(
    () => localStorage.getItem("kulfi-compact-table") === "true",
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("kulfi-dark-mode") === "true",
  );

  async function loadPrices(showLoading = true) {
    if (showLoading) setLoading(true);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Unable to load records (HTTP ${response.status}).`);
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : data.records;

      if (!Array.isArray(records)) {
        throw new Error("Unexpected pricing API response.");
      }

      setPrices(records.map(mapPrice));
      return true;
    } catch (error) {
      console.error("Load pricing records failed:", error);
      setMessage(error.message || "Unable to load pricing records.");
      setMessageType("error");
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const records = Array.isArray(data) ? data : data.records;

        if (!Array.isArray(records)) {
          throw new Error("Unexpected pricing API response.");
        }

        if (!cancelled) setPrices(records.map(mapPrice));
      } catch (error) {
        console.error("Initial pricing load failed:", error);
        if (!cancelled) {
          setMessage("Unable to load records. Check that FastAPI is running.");
          setMessageType("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  const stores = useMemo(
    () =>
      [...new Set(prices.map((item) => item.storeId))].filter(Boolean).sort(),
    [prices],
  );

  const skus = useMemo(
    () => [...new Set(prices.map((item) => item.sku))].filter(Boolean).sort(),
    [prices],
  );

  const filteredPrices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return prices.filter((item) => {
      const matchesSearch = [
        item.storeId,
        item.sku,
        item.productName,
        item.country,
        item.date,
      ].some((value) => String(value).toLowerCase().includes(query));

      return (
        matchesSearch &&
        (!storeFilter || item.storeId === storeFilter) &&
        (!skuFilter || item.sku === skuFilter) &&
        (!dateFilter || item.date === dateFilter)
      );
    });
  }, [prices, search, storeFilter, skuFilter, dateFilter]);


const totalPages = Math.ceil(filteredPrices.length / pageSize);
const safePage = Math.min(currentPage, Math.max(1, totalPages));

const paginatedPrices = filteredPrices.slice(
  (safePage - 1) * pageSize,
  safePage * pageSize
);

const visiblePageNumbers = useMemo(() => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (safePage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }

  if (safePage >= totalPages - 2) {
    return [
      1, 2, "...",
      totalPages - 2, totalPages - 1, totalPages
    ];
  }

  return [
    1, 2, "...", safePage, "...",
    totalPages - 1, totalPages
  ];
}, [totalPages, safePage]);


  const latestPrice = useMemo(
    () =>
      prices.reduce(
        (latest, item) => (item.date > latest.date ? item : latest),
        { date: "", price: 0, country: "India" },
      ),
    [prices],
  );

  const storeReports = useMemo(() => {
  const groups = new Map();

  prices.forEach((item) => {
    const storeId = item.storeId;
    const country = item.country || "India";

    // Group by both store and country.
    const key = `${storeId}::${country}`;

    if (!groups.has(key)) {
      groups.set(key, {
        storeId,
        country,
        records: 0,
        total: 0,
      });
    }

    const group = groups.get(key);
    group.records += 1;
    group.total += Number(item.price) || 0;
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      average: group.records
        ? group.total / group.records
        : 0,
    }))
    .sort(
      (a, b) =>
        a.storeId.localeCompare(b.storeId) ||
        a.country.localeCompare(b.country)
    );
}, [prices]);

  const productReports = useMemo(() => {
    const groups = new Map();

    prices.forEach((item) => {
      const reportKey = `${item.sku}::${item.country}`;
      if (!groups.has(reportKey)) {
        groups.set(reportKey, {
          sku: item.sku,
          country: item.country,
          productName: item.productName,
          records: 0,
          total: 0,
          lowest: Number.POSITIVE_INFINITY,
          highest: Number.NEGATIVE_INFINITY,
        });
      }

      const group = groups.get(reportKey);
      const price = Number(item.price) || 0;
      group.records += 1;
      group.total += price;
      group.lowest = Math.min(group.lowest, price);
      group.highest = Math.max(group.highest, price);
    });

    return [...groups.values()]
      .map((group) => ({
        ...group,
        average: group.records ? group.total / group.records : 0,
      }))
      .sort((a, b) => a.sku.localeCompare(b.sku) || a.country.localeCompare(b.country));
  }, [prices]);

  function showNotice(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setMessage("");

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }

  function updateFilter(setter, value) {
    setter(value);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStoreFilter("");
    setSkuFilter("");
    setDateFilter("");
    setCurrentPage(1);
  }

  async function uploadCsv(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const file = form.elements.csvFile.files?.[0];

    if (!file || !file.name.toLowerCase().endsWith(".csv")) {
      setUploadResult({ error: "Please select a valid CSV file." });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setUploadResult(null);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail
              .map((item) =>
                typeof item === "string" ? item : JSON.stringify(item),
              )
              .join("; ")
          : data.detail || data.message || "CSV upload failed.";

        setUploadResult({ error: String(detail) });
        return;
      }

      setUploadResult(data);
      const refreshed = await loadPrices(false);

      if (!refreshed) {
        showNotice(
          "Upload processed, but refreshing the records failed.",
          "error",
        );
      } else {
        showNotice("CSV processed successfully.");
      }

      setCurrentPage(1);
      form.reset();
    } catch (error) {
      console.error("CSV upload failed:", error);
      setUploadResult({
        error: "Cannot connect to FastAPI. Check that the backend is running.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function savePrice(event) {
    event.preventDefault();
    if (!editing) return;

    const price = Number(editing.price);

    if (!Number.isFinite(price) || price < 0) {
      showNotice("Enter a valid non-negative price.", "error");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: editing.storeId,
          sku: editing.sku,
          productName: editing.productName,
          price,
          date: editing.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update the pricing record.");
      }

      const refreshed = await loadPrices(false);
      if (!refreshed) {
        throw new Error("The record was saved, but refreshing failed.");
      }

      setEditing(null);
      showNotice(data.message || "Pricing record updated successfully.");
    } catch (error) {
      console.error("Save pricing error:", error);
      showNotice(error.message || "Unable to save pricing changes.", "error");
    } finally {
      setSaving(false);
    }
  }

  function updatePreference(key, value, setter) {
    setter(value);
    localStorage.setItem(key, String(value));
  }

  function downloadReportCsv() {
    const rows = [
      ["Store ID", "SKU", "Product Name", "Country", "Currency", "Price", "Price Date"],
      ...filteredPrices.map((item) => [
        item.storeId,
        item.sku,
        item.productName,
        item.country,
        currencyByCountry[item.country] || "INR",
        Number(item.price).toFixed(2),
        item.date,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kulfi-time-pricing-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderTable(records, showEdit = true) {
    return (
      <div className="table-wrapper">
        <table className={compactTable ? "compact-table" : ""}>
          <thead>
            <tr>
              <th>Store ID</th>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Country</th>
              <th>Price</th>
              <th>Price Date</th>
              {showEdit && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="store-badge">{item.storeId}</span>
                </td>
                <td>
                  <strong className="sku-text">{item.sku}</strong>
                </td>
                <td>{item.productName}</td>
                <td>{item.country}</td>
                <td className="price-cell">{formatPrice(item.price, item.country)}</td>
                <td>{item.date}</td>
                {showEdit && (
                  <td>
                    <button
                      type="button"
                      className="button button-edit"
                      onClick={() => {
                        setEditing({ ...item });
                        setMessage("");
                      }}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={showEdit ? 7 : 6} className="empty">
                  No pricing records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function renderDashboard() {
    const recentPrices = [...prices]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return (
      <>
        <section className="summary-grid">
          <article className="stat-card blue">
            <div className="stat-icon">▤</div>
            <div>
              <p>Total Records</p>
              <h2>{prices.length}</h2>
              <small>Pricing records in database</small>
            </div>
          </article>
          <article className="stat-card green">
            <div className="stat-icon">▣</div>
            <div>
              <p>Total Stores</p>
              <h2>{stores.length}</h2>
              <small>Stores represented</small>
            </div>
          </article>
          <article className="stat-card orange">
            <div className="stat-icon">◇</div>
            <div>
              <p>Total Products</p>
              <h2>{skus.length}</h2>
              <small>Unique SKUs represented</small>
            </div>
          </article>
          <article className="stat-card purple">
            <div className="stat-icon">₹</div>
            <div>
              <p>Latest Price</p>
              <h2 className="latest-price">
                {latestPrice.date ? formatPrice(latestPrice.price, latestPrice.country) : "—"}
              </h2>
              <small>{latestPrice.date || "No pricing data"}</small>
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Pricing Records</h2>
              <p>Latest dated records available in the database.</p>
            </div>
            <button
              className="button button-primary"
              type="button"
              onClick={() => changePage("pricing")}
            >
              View all records →
            </button>
          </div>
          <div className="dashboard-filterbar">
            <input
              aria-label="Search pricing records"
              placeholder="⌕ Search by store, SKU, product name or date…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              aria-label="Filter by store"
              value={storeFilter}
              onChange={(event) => setStoreFilter(event.target.value)}
            >
              <option value="">All Stores</option>
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by SKU"
              value={skuFilter}
              onChange={(event) => setSkuFilter(event.target.value)}
            >
              <option value="">All SKUs</option>
              {skus.map((sku) => (
                <option key={sku} value={sku}>
                  {sku}
                </option>
              ))}
            </select>
            <input
              aria-label="Filter by date"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
            <button
              type="button"
              className="dashboard-search-button"
              onClick={() => changePage("pricing")}
            >
              Search
            </button>
          </div>
          {loading ? (
            <p className="empty">Loading pricing data…</p>
          ) : (
            renderTable(
              recentPrices.filter((item) => {
                const q = search.trim().toLowerCase();
                return (
                  (!q ||
                    [item.storeId, item.sku, item.productName, item.country, item.date].some(
                      (value) => String(value).toLowerCase().includes(q),
                    )) &&
                  (!storeFilter || item.storeId === storeFilter) &&
                  (!skuFilter || item.sku === skuFilter) &&
                  (!dateFilter || item.date === dateFilter)
                );
              }),
              true,
            )
          )}
        </section>

        <section className="dashboard-actions">
          <button
            className="action-card"
            type="button"
            onClick={() => changePage("pricing")}
          >
            <span>▤</span>
            <strong>Manage pricing</strong>
            <small>Search and edit pricing records</small>
          </button>
          <button
            className="action-card"
            type="button"
            onClick={() => changePage("upload")}
          >
            <span>⇧</span>
            <strong>Upload a CSV</strong>
            <small>Import a new pricing feed</small>
          </button>
          <button
            className="action-card"
            type="button"
            onClick={() => changePage("reports")}
          >
            <span>▥</span>
            <strong>View reports</strong>
            <small>Review store and product summaries</small>
          </button>
        </section>
      </>
    );
  }

  function renderPricing() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Pricing Records</h2>
            <p>Search, filter, and update store-wise pricing.</p>
          </div>
          <button
            type="button"
            className="button button-light"
            onClick={() => loadPrices()}
            disabled={loading}
          >
            ↻ {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div className="toolbar">
          <input
            aria-label="Search pricing records"
            placeholder="Search store, SKU, product, or date…"
            value={search}
            onChange={(event) => updateFilter(setSearch, event.target.value)}
          />
          <select
            aria-label="Filter by store"
            value={storeFilter}
            onChange={(event) =>
              updateFilter(setStoreFilter, event.target.value)
            }
          >
            <option value="">All stores</option>
            {stores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by SKU"
            value={skuFilter}
            onChange={(event) => updateFilter(setSkuFilter, event.target.value)}
          >
            <option value="">All SKUs</option>
            {skus.map((sku) => (
              <option key={sku} value={sku}>
                {sku}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="Filter by price date"
            value={dateFilter}
            onChange={(event) =>
              updateFilter(setDateFilter, event.target.value)
            }
          />
          <button
            type="button"
            className="button button-light"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>

        {loading ? (
          <p className="empty">Loading pricing records…</p>
        ) : (
          renderTable(paginatedPrices)
        )}

        <div className="pagination">
          <span>
            Showing{" "}
            {filteredPrices.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredPrices.length)}
            {" of "}
            {filteredPrices.length} records
          </span>
          <label className="page-size-control">
            Records per page{" "}
            <select
              aria-label="Records per page"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div className="pagination-buttons">
            <button
              type="button"
              className="button button-light"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
            >
              ‹ Previous
            </button>
{visiblePageNumbers.map((number, index) =>
  number === "..." ? (
    <span key={`ellipsis-${index}`} className="pagination-ellipsis">
      …
    </span>
  ) : (
    <button
      key={number}
      type="button"
      className={`page-button ${
        number === safePage ? "active" : ""
      }`}
      aria-current={number === safePage ? "page" : undefined}
      onClick={() => setCurrentPage(number)}
    >
      {number}
    </button>
  )
)}
            
<button
  type="button"
  className="button button-light"
  disabled={totalPages === 0 || safePage >= totalPages}
  onClick={() =>
    setCurrentPage((page) => Math.min(totalPages, page + 1))
  }
>
  Next ›
</button>

          </div>
        </div>
      </section>
    );
  }

  function renderUpload() {
    return (
      <section className="upload-layout">
        <section className="panel">
          <h2>Upload Pricing CSV</h2>
          <p className="panel-description">
            Select a pricing feed. The backend validates the file before saving
            records.
          </p>

          <form onSubmit={uploadCsv}>
            <label className="upload-dropzone">
              <span className="file-icon">⇧</span>
              <strong>Choose a CSV file</strong>
              <span>
                Required columns: Store ID, SKU, Product Name, Price, Date, Country
              </span>
              <input
                type="file"
                name="csvFile"
                accept=".csv,text/csv"
                aria-label="Choose pricing CSV file"
                required
              />
            </label>
            <button
              type="submit"
              className="button button-primary upload-submit"
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload pricing feed"}
            </button>
          </form>

          {uploadResult && (
            <div
              className={`upload-result ${uploadResult.error ? "has-error" : ""}`}
              role="status"
            >
              {uploadResult.error ? (
                <p>{uploadResult.error}</p>
              ) : (
                <>
                  <strong>{uploadResult.message || "Upload processed"}</strong>
                  <p>Total rows: {uploadResult.total_rows ?? "—"}</p>
                  <p>Valid rows: {uploadResult.valid_rows ?? "—"}</p>
                  <p>Invalid rows: {uploadResult.invalid_rows ?? "—"}</p>
                  <p>Inserted rows: {uploadResult.inserted_rows ?? "—"}</p>
                  <p>
                    Duplicates skipped: {uploadResult.skipped_duplicates ?? "—"}
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Upload Guidelines</h2>
          <ul className="guidelines">
            <li>Upload a CSV file with the required column headers.</li>
            <li>Prices must be valid, non-negative numbers.</li>
            <li>Dates must use a supported date format.</li>
            <li>Duplicate Store ID + SKU + Date combinations are skipped.</li>
            <li>Invalid data should be corrected before uploading again.</li>
          </ul>
          <div className="info-banner">
            <strong>Database protection</strong>
            <p>Records are refreshed from the API after a successful upload.</p>
          </div>
        </section>
      </section>
    );
  }

  function renderReports() {
    return (
      <div className="report-stack">
        <section className="summary-grid report-summary">
          <article className="stat-card blue">
            <div>
              <p>Pricing records</p>
              <h2>{prices.length}</h2>
            </div>
          </article>
          <article className="stat-card green">
            <div>
              <p>Stores covered</p>
              <h2>{stores.length}</h2>
            </div>
          </article>
          <article className="stat-card orange">
            <div>
              <p>Products covered</p>
              <h2>{skus.length}</h2>
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Store-wise Pricing Summary</h2>
              <p>Record count and average price for each store.</p>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={downloadReportCsv}
            >
              ↓ Export pricing CSV
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Store ID</th>
                  <th>Country</th>
                  <th>Record Count</th>
                  <th>Average Price</th>
                </tr>
              </thead>
              <tbody>
                {storeReports.map((item) => (
                  <tr key={item.storeId}>
                    <td>{item.storeId}</td>
                    <td>{item.country}</td>
                    <td>{item.records}</td>
                    <td>{formatPrice(item.average, item.country)}</td>
                  </tr>
                ))}
                {storeReports.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty">
                      No store data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Product-wise Pricing Summary</h2>
              <p>Average, minimum, and maximum prices by SKU.</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Country</th>
                  <th>Records</th>
                  <th>Average</th>
                  <th>Minimum</th>
                  <th>Maximum</th>
                </tr>
              </thead>
              <tbody>
                {productReports.map((item) => (
                  <tr key={`${item.sku}-${item.country}`}>
                    <td>
                      <strong>{item.sku}</strong>
                    </td>
                    <td>{item.productName}</td>
                    <td>{item.country}</td>
                    <td>{item.records}</td>
                    <td>{formatPrice(item.average, item.country)}</td>
                    <td>{formatPrice(item.lowest, item.country)}</td>
                    <td>{formatPrice(item.highest, item.country)}</td>
                  </tr>
                ))}
                {productReports.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty">
                      No product data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="settings-layout">
        <section className="panel">
          <h2>Display Preferences</h2>
          <p className="panel-description">
            These preferences apply to this browser on this device.
          </p>

          <div className="setting-row">
            <div>
              <strong>Compact pricing table</strong>
              <p>Show table rows with less vertical spacing.</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={compactTable}
                onChange={(event) =>
                  updatePreference(
                    "kulfi-compact-table",
                    event.target.checked,
                    setCompactTable,
                  )
                }
              />
              <span className="switch-track" />
            </label>
          </div>

          <div className="setting-row">
            <div>
              <strong>Dark theme</strong>
              <p>Use a dark background for the application.</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(event) =>
                  updatePreference(
                    "kulfi-dark-mode",
                    event.target.checked,
                    setDarkMode,
                  )
                }
              />
              <span className="switch-track" />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Application Information</h2>
          <div className="settings-info">
            <div>
              <span>Application</span>
              <strong>Kulfi Time Retail Pricing</strong>
            </div>
            <div>
              <span>Frontend</span>
              <strong>React</strong>
            </div>
            <div>
              <span>Backend API</span>
              <strong>FastAPI</strong>
            </div>
            <div>
              <span>Database</span>
              <strong>PostgreSQL</strong>
            </div>
            <div>
              <span>Display currency</span>
              <strong>Country-based currency</strong>
            </div>
          </div>
          <div className="info-banner">
            <strong>Currency handling</strong>
            <p>
Prices are displayed using the currency assigned to each record's country. This formats the display only; it does not convert stored prices into other currencies.
            </p>
          </div>
        </section>
      </div>
    );
  }


  return (
    <div
      className={`app-shell ${darkMode ? "dark-mode" : ""}`}
    >
      <aside className="sidebar">
        <div className="sidebar-brand-image">
          <img
            src="/images/sidebar-top.png"
            alt="Kulfi Time — A Scoop of Happiness"
          />
        </div>

        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${page === item.id ? "active" : ""}`}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => changePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom-image" aria-hidden="true">
          <img src="/images/sidebar-bottom.png" alt="" />
        </div>
      </aside>

      <main className="main-area">
        {/* Shared main banner: shown on every page */}
        <section
          className="global-banner"
          aria-label="Kulfi Time banner"
        >
          <div className="hero-right">
            <button
              type="button"
              className="hero-theme-toggle"
              aria-label="Toggle dark mode"
              onClick={() =>
                setDarkMode((current) => {
                  const next = !current;
                  localStorage.setItem("kulfi-dark-mode", String(next));
                  return next;
                })
              }
            >
              {darkMode ? "☾" : "☀"}
              <span>{darkMode ? "Dark" : "Light"}</span>
            </button>
          </div>
        </section>

        {message && (
          <div className={`notice ${messageType}`} role="status">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {loading && page !== "dashboard" && (
          <div className="loading-strip">
            Connecting to the pricing database…
          </div>
        )}

        {page === "dashboard" && renderDashboard()}
        {page === "pricing" && renderPricing()}
        {page === "upload" && renderUpload()}
        {page === "reports" && renderReports()}
        {page === "ai" && <AIAssistant />}
        {page === "settings" && renderSettings()}

        <footer className="app-footer">
          Kulfi Time Retail Pricing Management <span>·</span> React + FastAPI +
          PostgreSQL
        </footer>

        {editing && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving)
                setEditing(null);
            }}
          >
            <section
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-heading"
            >
              <div className="panel-heading">
                <div>
                  <h2 id="edit-heading">Edit Pricing Record</h2>
                  <p>Changes will be saved to PostgreSQL.</p>
                </div>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                  aria-label="Close edit dialog"
                >
                  ×
                </button>
              </div>

              <form onSubmit={savePrice}>
                <label>
                  Store ID
                  <input
                    value={editing.storeId}
                    onChange={(event) =>
                      setEditing({ ...editing, storeId: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  SKU
                  <input
                    value={editing.sku}
                    onChange={(event) =>
                      setEditing({ ...editing, sku: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Product Name
                  <input
                    value={editing.productName}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        productName: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Price ( {currencyByCountry[editing.country] || "INR"})
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.price}
                    onChange={(event) =>
                      setEditing({ ...editing, price: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Price Date
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(event) =>
                      setEditing({ ...editing, date: event.target.value })
                    }
                    required
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button button-light"
                    onClick={() => setEditing(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
