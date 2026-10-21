
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api/prices";
const PAGE_SIZE = 10;

function mapPrice(record) {
  return {
    id: record.id,
    storeId: record.store_id ?? record.storeId ?? "",
    sku: record.sku ?? "",
    productName: record.product_name ?? record.productName ?? "",
    price: Number(record.price),
    date: String(record.price_date ?? record.date ?? "").slice(0, 10),
  };
}

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [skuFilter, setSkuFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch records from FastAPI. The API returns { total, records }.
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
        throw new Error("Unexpected response from the pricing API.");
      }

      setPrices(records.map(mapPrice));
      setMessage("");
      return true;
    } catch (error) {
      console.error("Failed to load pricing records:", error);
      setMessage("Unable to load records. Check the FastAPI backend.");
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  // Load records when the component first mounts.
  useEffect(() => {
    let cancelled = false;

    async function fetchInitialPrices() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const records = Array.isArray(data) ? data : data.records;

        if (!Array.isArray(records)) {
          throw new Error("Unexpected pricing API response.");
        }

        if (!cancelled) {
          setPrices(records.map(mapPrice));
          setMessage("");
        }
      } catch (error) {
        console.error("Failed to load pricing records:", error);

        if (!cancelled) {
          setMessage(
            "Unable to load records. Check that FastAPI is running."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInitialPrices();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPrices = prices.filter((item) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      item.storeId,
      item.sku,
      item.productName,
      item.date,
    ].some((value) => String(value).toLowerCase().includes(query));

    const matchesStore = !storeFilter || item.storeId === storeFilter;
    const matchesSku = !skuFilter || item.sku === skuFilter;
    const matchesDate = !dateFilter || item.date === dateFilter;

    return matchesSearch && matchesStore && matchesSku && matchesDate;
  });

  const totalPages = Math.ceil(filteredPrices.length / PAGE_SIZE);

  // Clamp the displayed page without using a state-updating effect.
  const safePage = Math.min(
    currentPage,
    Math.max(1, totalPages)
  );

  const paginatedPrices = filteredPrices.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function updateFilter(setter, value) {
    setter(value);
    setCurrentPage(1);
  }

  async function uploadCsv(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const file = form.elements.csvFile.files?.[0];

    if (!file) {
      setUploadResult({ error: "Please select a CSV file." });
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadResult({ error: "Please select a CSV file." });
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
                typeof item === "string" ? item : JSON.stringify(item)
              )
              .join("; ")
          : typeof data.detail === "string"
            ? data.detail
            : data.message || "CSV upload failed.";

        setUploadResult({ error: detail });
        return;
      }

      setUploadResult(data);

      // Reload from the database; don't assign temporary IDs.
      const refreshed = await loadPrices(false);

      if (!refreshed) {
        setMessage(
          "Upload response received, but refreshing records failed."
        );
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

  // Temporary frontend-only edit. A backend update endpoint is still needed
  // to persist edits in PostgreSQL.
  
async function savePrice(event) {
  event.preventDefault();

  setMessage("");

  try {
    const response = await fetch(`${API_URL}/${editing.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storeId: editing.storeId,
        sku: editing.sku,
        productName: editing.productName,
        price: Number(editing.price),
        date: editing.date,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to update the pricing record."
      );
    }

    // Reload the saved records from PostgreSQL.
    const refreshed = await loadPrices(false);

    if (!refreshed) {
      throw new Error(
        "Record was saved, but refreshing the table failed."
      );
    }

    setEditing(null);
    setMessage(data.message || "Pricing record updated successfully.");
  } catch (error) {
    console.error("Save pricing error:", error);
    setMessage(error.message || "Unable to save pricing changes.");
  }
}


  function clearFilters() {
    setSearch("");
    setStoreFilter("");
    setSkuFilter("");
    setDateFilter("");
    setCurrentPage(1);
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">RETAIL OPERATIONS</p>
          <h1>Kulfi Time</h1>
          <p className="subtitle">Retail Pricing Management</p>
        </div>
        <span className="status">Development mode</span>
      </header>

      <section className="panel upload-panel">
        <h2>Upload pricing feed</h2>
        <p>Select a CSV file to validate and upload pricing records.</p>

        <form className="upload-form" onSubmit={uploadCsv}>
          <input
            type="file"
            name="csvFile"
            accept=".csv,text/csv"
            aria-label="Choose pricing CSV file"
            required
          />
          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
        </form>

        {uploadResult && (
          <div className="upload-result" role="status">
            {uploadResult.error ? (
              <p className="error-message">{uploadResult.error}</p>
            ) : (
              <>
                <p>{uploadResult.message}</p>
                {uploadResult.total_rows !== undefined && (
                  <p>
                    Total rows: {uploadResult.total_rows} | Valid:{" "}
                    {uploadResult.valid_rows} | Invalid:{" "}
                    {uploadResult.invalid_rows}
                  </p>
                )}
                {uploadResult.errors?.length > 0 && (
                  <ul>
                    {uploadResult.errors.map((error, index) => (
                      <li key={`${error.row}-${index}`}>
                        Row {error.row}:{" "}
                        {Array.isArray(error.issues)
                          ? error.issues.join(", ")
                          : String(error.issues ?? error)}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <section className="summary">
        <article className="summary-card">
          <p>Total pricing records</p>
          <h2>{prices.length}</h2>
        </article>
        <article className="summary-card">
          <p>Stores represented</p>
          <h2>{new Set(prices.map((item) => item.storeId)).size}</h2>
        </article>
        <article className="summary-card">
          <p>Products represented</p>
          <h2>{new Set(prices.map((item) => item.sku)).size}</h2>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Pricing records</h2>
            <p>Search records and edit their pricing details.</p>
          </div>
          <button
            type="button"
            className="cancel-button"
            onClick={() => loadPrices()}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh records"}
          </button>
        </div>

        <div className="toolbar">
          <input
            aria-label="Search pricing records"
            placeholder="Search store, SKU, product or date..."
            value={search}
            onChange={(event) =>
              updateFilter(setSearch, event.target.value)
            }
          />

          <select
            aria-label="Filter by store"
            value={storeFilter}
            onChange={(event) =>
              updateFilter(setStoreFilter, event.target.value)
            }
          >
            <option value="">All stores</option>
            {[...new Set(prices.map((item) => item.storeId))].map(
              (store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              )
            )}
          </select>

          <select
            aria-label="Filter by SKU"
            value={skuFilter}
            onChange={(event) =>
              updateFilter(setSkuFilter, event.target.value)
            }
          >
            <option value="">All SKUs</option>
            {[...new Set(prices.map((item) => item.sku))].map((sku) => (
              <option key={sku} value={sku}>
                {sku}
              </option>
            ))}
          </select>

          <input
            type="date"
            aria-label="Filter by date"
            value={dateFilter}
            onChange={(event) =>
              updateFilter(setDateFilter, event.target.value)
            }
          />

          <button
            type="button"
            className="cancel-button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>

        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}

        {loading ? (
          <p>Loading pricing records from the database...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Store ID</th>
                  <th>SKU</th>
                  <th>Product name</th>
                  <th>Price</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPrices.map((item) => (
                  <tr key={item.id}>
                    <td>{item.storeId}</td>
                    <td>{item.sku}</td>
                    <td>{item.productName}</td>
                    <td>
                      ₹
                      {Number.isFinite(item.price)
                        ? item.price.toFixed(2)
                        : "—"}
                    </td>
                    <td>{item.date}</td>
                    <td>
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => {
                          setEditing({ ...item });
                          setMessage("");
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPrices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty">
                      {prices.length === 0
                        ? "No pricing records are available."
                        : "No matching pricing records found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination">
          <span>
            Showing{" "}
            {filteredPrices.length === 0
              ? 0
              : (safePage - 1) * PAGE_SIZE + 1}
            {" - "}
            {Math.min(safePage * PAGE_SIZE, filteredPrices.length)}
            {" of "}
            {filteredPrices.length} records
          </span>

          <div className="pagination-buttons">
            <button
              type="button"
              className="cancel-button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  className={
                    page === safePage
                      ? "page-button active"
                      : "page-button"
                  }
                  aria-current={page === safePage ? "page" : undefined}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              className="cancel-button"
              disabled={totalPages === 0 || safePage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {editing && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-heading"
          >
            <h2 id="edit-heading">Edit pricing record</h2>

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
                Product name
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
                Price
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
                Date
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
                  className="cancel-button"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
