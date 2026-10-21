
import { useState } from "react";
import "./AIAssistant.css";

const suggestions = [
  "Show the most expensive kulfi products",
  "Compare prices for SKU P1001 across stores",
  "Which stores have higher prices for the same product?",
  "Give me a summary of pricing changes this month",
];

function getSampleAnswer(question) {
  const q = question.toLowerCase();

  if (q.includes("expensive") || q.includes("highest")) {
    return {
      text: "This is an illustrative example. These sample prices are not live database results.",
      columns: ["Rank", "Product", "Price"],
      rows: [
        ["1", "Matka Kulfi", "₹75.00"],
        ["2", "Kesar Kulfi", "₹68.00"],
        ["3", "Pista Kulfi", "₹65.00"],
      ],
    };
  }

  if (q.includes("compare") || q.includes("across stores")) {
    return {
      text: "This preview shows how a SKU comparison will appear. Values are sample data.",
      columns: ["Store ID", "Product", "Price"],
      rows: [
        ["S001", "Kulfi Classic", "₹50.00"],
        ["S002", "Kulfi Classic", "₹55.00"],
        ["S003", "Kulfi Classic", "₹52.00"],
      ],
    };
  }

  if (q.includes("higher prices") || q.includes("same product")) {
    return {
      text: "This preview demonstrates a store price comparison. These are not live database results.",
      columns: ["Store ID", "Product", "Price"],
      rows: [
        ["S002", "Example product", "₹60.00"],
        ["S005", "Example product", "₹55.00"],
      ],
    };
  }

  return {
    text: "Once connected to the backend, the assistant can summarize actual pricing changes. This is currently a sample response.",
    columns: [],
    rows: [],
  };
}

export default function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  function askQuestion(value) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-user`,
        role: "user",
        text: trimmed,
      },
    ]);

    setQuestion("");
    setLoading(true);

    // Temporary UI preview. Later, this will call FastAPI.
    window.setTimeout(() => {
      const answer = getSampleAnswer(trimmed);

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: answer.text,
          columns: answer.columns,
          rows: answer.rows,
        },
      ]);

      setLoading(false);
    }, 350);
  }

  function startNewChat() {
    setMessages([]);
    setQuestion("");
    setLoading(false);
  }

  return (
    <main className="ai-page">
      <header className="ai-page-header">
        <div>
          <p className="ai-eyebrow">KULFI TIME · RETAIL PRICING</p>

          <h1>
            AI Pricing Assistant <span className="ai-beta">BETA</span>
          </h1>

          <p>Ask questions about your retail pricing data.</p>
        </div>

        <button
          className="ai-new-chat"
          type="button"
          onClick={startNewChat}
        >
          <span aria-hidden="true">＋</span> New Chat
        </button>
      </header>

      <section className="ai-chat-card">
        <div className="ai-welcome">
          <div className="ai-bot-icon" aria-hidden="true">
            ✦
          </div>

          <h2>Hello! I'm your AI Pricing Assistant.</h2>
          <p>Ask a question about Kulfi Time pricing.</p>
        </div>

        <div className="ai-suggestions">
          <div className="ai-suggestions-heading">
            <h3>Suggested questions</h3>

            {messages.length > 0 && (
              <button type="button" onClick={startNewChat}>
                Back to questions
              </button>
            )}
          </div>

          <div className="ai-suggestion-list">
            {suggestions.map((item) => (
              <button
                className="ai-suggestion"
                key={item}
                type="button"
                onClick={() => askQuestion(item)}
                disabled={loading}
              >
                <span>{item}</span>
                <span className="ai-suggestion-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="ai-messages" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message-row ${message.role}`}
            >
              {message.role === "assistant" && (
                <div className="ai-avatar" aria-hidden="true">
                  ✦
                </div>
              )}

              <div className="ai-message">
                <p>{message.text}</p>

                {message.rows?.length > 0 && (
                  <div className="ai-table-wrap">
                    <table className="ai-result-table">
                      <thead>
                        <tr>
                          {message.columns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {message.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-typing" role="status">
              Preparing sample response…
            </div>
          )}
        </div>

        <form
          className="ai-input-area"
          onSubmit={(event) => {
            event.preventDefault();
            askQuestion(question);
          }}
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about pricing data..."
            aria-label="Ask a pricing question"
            disabled={loading}
          />

          <button
            type="submit"
            aria-label="Send question"
            disabled={!question.trim() || loading}
          >
            ➤
          </button>
        </form>

        <p className="ai-disclaimer">
          Preview mode: answers use sample data, not live pricing records.
        </p>
      </section>
    </main>
  );
}
