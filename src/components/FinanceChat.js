import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

function FinanceChat({ user, onLogout }) {
  const API_BASE = "http://localhost:8081";
  const userId = user.id;
  const chatEndRef = useRef(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    category: "",
    amount: "",
    description: "",
    date: ""
  });

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [savingsGoal, setSavingsGoal] = useState(10000);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const quickPrompts = [
    "Summarize my spending",
    "Where am I overspending?",
    "How can I save more this month?",
    "Give me 3 money tips"
  ];

  const colors = ["#8b5cf6", "#22c55e", "#f59e0b", "#3b82f6", "#ef4444", "#14b8a6"];

  useEffect(() => {
    loadEverything();
  }, []);

  useEffect(() => {
    if (transcript) setMessage(transcript);
  }, [transcript]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadEverything = async () => {
    await Promise.allSettled([
      loadHistory(),
      loadDashboard(),
      loadExpenses(),
      loadSavingsGoal()
    ]);
  };

  const loadHistory = async () => {
    const res = await axios.get(`${API_BASE}/api/chat/history/${userId}`);
    setMessages(
      res.data.map((m) => ({
        sender: m.sender,
        text: m.message
      }))
    );
  };

  const loadDashboard = async () => {
    const res = await axios.get(`${API_BASE}/api/dashboard/${userId}`);
    setDashboard(res.data);
  };

  const loadExpenses = async () => {
    const res = await axios.get(`${API_BASE}/api/expenses/user/${userId}`);
    setExpenses(res.data);
  };

  const loadSavingsGoal = async () => {
    const res = await axios.get(`${API_BASE}/api/savings-goals/user/${userId}`);
    setSavingsGoal(Number(res.data.targetAmount || 10000));
  };

  const saveSavingsGoal = async (newGoal) => {
    await axios.post(`${API_BASE}/api/savings-goals`, {
      userId,
      targetAmount: Number(newGoal)
    });
  };

  const sendMessage = async (customMessage) => {
    const finalMessage = (customMessage ?? message).trim();
    if (!finalMessage) return;

    const userMsg = { sender: "user", text: finalMessage };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);
    resetTranscript();

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        userId,
        message: finalMessage
      });

      const botMsg = { sender: "bot", text: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            error?.response?.data?.message ||
            "Something went wrong while contacting the AI assistant."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    await axios.delete(`${API_BASE}/api/chat/history/${userId}`);
    setMessages([]);
  };

  const handleExpenseChange = (e) => {
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      category: "",
      amount: "",
      description: "",
      date: ""
    });
    setEditingExpenseId(null);
  };

  const saveExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.date) {
      alert("Please fill category, amount, and date.");
      return;
    }

    const payload = {
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      description: expenseForm.description,
      date: expenseForm.date,
      userId
    };

    if (editingExpenseId) {
      await axios.put(`${API_BASE}/api/expenses/${editingExpenseId}`, payload);
    } else {
      await axios.post(`${API_BASE}/api/expenses`, payload);
    }

    resetExpenseForm();
    await Promise.allSettled([loadDashboard(), loadExpenses()]);
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      category: expense.category || "",
      amount: expense.amount || "",
      description: expense.description || "",
      date: expense.date || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteExpense = async (id) => {
    const ok = window.confirm("Delete this expense?");
    if (!ok) return;
    await axios.delete(`${API_BASE}/api/expenses/${id}`);
    await Promise.allSettled([loadDashboard(), loadExpenses()]);
  };

  const categoryData = useMemo(() => {
    if (!dashboard?.expensesByCategory) return [];
    return Object.entries(dashboard.expensesByCategory).map(([name, value]) => ({
      name,
      value
    }));
  }, [dashboard]);

  const monthlyIncome = Number(user.monthlyIncome || 0);
  const monthlyExpenses = Number(dashboard?.monthlyExpenses || 0);
  const currentSavings = Math.max(monthlyIncome - monthlyExpenses, 0);
  const goalProgress =
    savingsGoal > 0 ? Math.min((currentSavings / savingsGoal) * 100, 100).toFixed(1) : 0;

  const topCategory = categoryData.length
    ? categoryData.reduce((max, item) => (item.value > max.value ? item : max), categoryData[0])
    : null;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.sidebar}>
          <div style={styles.brandWrap}>
            <div style={styles.logoBubble}>💸</div>
            <div>
              <div style={styles.brandTitle}>AI Money Coach</div>
              <div style={styles.brandSub}>chat-first finance</div>
            </div>
          </div>

          <div style={styles.profileCard}>
            <div style={styles.avatar}>{user.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <div style={styles.profileName}>{user.name}</div>
              <div style={styles.profileEmail}>{user.email}</div>
            </div>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sideLabel}>Monthly income</div>
            <div style={styles.sideValue}>₹{monthlyIncome}</div>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sideLabel}>This month spent</div>
            <div style={styles.sideValue}>₹{monthlyExpenses}</div>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sideLabel}>Current savings</div>
            <div style={styles.sideValue}>₹{currentSavings}</div>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sideLabel}>Savings goal</div>
            <input
              type="number"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(Number(e.target.value || 0))}
              onBlur={() => saveSavingsGoal(savingsGoal)}
              style={styles.goalInput}
            />
            <div style={styles.goalBarOuter}>
              <div style={{ ...styles.goalBarInner, width: `${goalProgress}%` }} />
            </div>
            <div style={styles.goalText}>{goalProgress}% progress</div>
          </div>

          <div style={styles.sidebarButtons}>
            <button style={styles.sideButton} onClick={clearChat}>Clear chat</button>
            <button style={styles.logoutButton} onClick={onLogout}>Logout</button>
          </div>
        </div>

        <div style={styles.main}>
          <div style={styles.hero}>
            <div>
              <div style={styles.heroBadge}>Smart, chatty, money-aware</div>
              <h1 style={styles.heroTitle}>Money talks. Your AI talks back.</h1>
              <p style={styles.heroText}>
                Ask about spending, savings, overspending, or budgeting — and get direct answers.
              </p>
            </div>
          </div>

          <div style={styles.summaryRow}>
            <motion.div layout style={styles.glassCard}>
              <div style={styles.cardKicker}>Top category</div>
              <div style={styles.cardBig}>
                {topCategory ? `${topCategory.name} · ₹${topCategory.value}` : "No data yet"}
              </div>
            </motion.div>

            <motion.div layout style={styles.glassCard}>
              <div style={styles.cardKicker}>AI insight</div>
              <div style={styles.cardBigSmall}>
                {topCategory
                  ? `You spend the most on ${topCategory.name}. Reducing it a little could improve savings.`
                  : "Add a few expenses and I’ll start spotting patterns."}
              </div>
            </motion.div>
          </div>

          <div style={styles.quickPromptWrap}>
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                style={styles.promptButton}
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
            {browserSupportsSpeechRecognition && (
              <button
                style={{
                  ...styles.promptButton,
                  background: listening ? "#4f46e5" : "#1f2937",
                  color: "#fff"
                }}
                onClick={() =>
                  listening
                    ? SpeechRecognition.stopListening()
                    : SpeechRecognition.startListening({ continuous: false })
                }
              >
                {listening ? "🎤 Listening..." : "🎤 Voice"}
              </button>
            )}
          </div>

          <div style={styles.chatPanel}>
            <div style={styles.chatHeader}>
              <span>Chat</span>
              <span style={styles.chatHeaderSub}>friendly money coach mode</span>
            </div>

            <div style={styles.chatBox}>
              {messages.length === 0 && !loading && (
                <div style={styles.emptyState}>Start with “Summarize my spending”.</div>
              )}

              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={`${msg.sender}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      ...styles.messageRow,
                      justifyContent: msg.sender === "user" ? "flex-end" : "flex-start"
                    }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,
                        ...(msg.sender === "user" ? styles.userBubble : styles.botBubble)
                      }}
                    >
                      <div>{msg.text}</div>
                      {msg.sender === "bot" && <div style={styles.emojiTag}>🤖💸</div>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={styles.typing}
                >
                  AI is typing...
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={styles.inputArea}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about savings, spending, or budgets..."
                style={styles.textarea}
              />
              <button onClick={() => sendMessage()} style={styles.sendButton} disabled={loading}>
                Send
              </button>
            </div>
          </div>

          <div style={styles.bottomGrid}>
            <div style={styles.panelCard}>
              <div style={styles.panelTitle}>Category split</div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={85} label>
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.panelCard}>
              <div style={styles.panelTitle}>Category comparison</div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={styles.panelCard}>
            <div style={styles.panelTitle}>
              {editingExpenseId ? "Edit expense" : "Add expense"}
            </div>
            <div style={styles.formGrid}>
              <input
                name="category"
                placeholder="Category"
                value={expenseForm.category}
                onChange={handleExpenseChange}
                style={styles.input}
              />
              <input
                name="amount"
                placeholder="Amount"
                value={expenseForm.amount}
                onChange={handleExpenseChange}
                style={styles.input}
              />
              <input
                name="description"
                placeholder="Description"
                value={expenseForm.description}
                onChange={handleExpenseChange}
                style={styles.input}
              />
              <input
                name="date"
                type="date"
                value={expenseForm.date}
                onChange={handleExpenseChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formActions}>
              <button style={styles.sendButton} onClick={saveExpense}>
                {editingExpenseId ? "Update expense" : "Add expense"}
              </button>
              {editingExpenseId && (
                <button style={styles.sideButton} onClick={resetExpenseForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div style={styles.panelCard}>
            <div style={styles.panelTitle}>Expense list</div>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td style={styles.td}>{exp.date}</td>
                        <td style={styles.td}>{exp.category}</td>
                        <td style={styles.td}>{exp.description}</td>
                        <td style={styles.td}>₹{exp.amount}</td>
                        <td style={styles.td}>
                          <div style={styles.tableActions}>
                            <button style={styles.editButton} onClick={() => handleEditExpense(exp)}>
                              Edit
                            </button>
                            <button
                              style={styles.deleteButton}
                              onClick={() => handleDeleteExpense(exp.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={styles.td} colSpan="5">No expenses yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0b1020 0%, #111827 100%)",
    color: "#fff",
    padding: "20px",
    fontFamily: "Arial, sans-serif"
  },
  shell: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "20px"
  },
  sidebar: {
    background: "rgba(17,24,39,0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "20px",
    backdropFilter: "blur(12px)",
    alignSelf: "start",
    position: "sticky",
    top: "20px"
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px"
  },
  logoBubble: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    fontSize: "22px"
  },
  brandTitle: {
    fontWeight: "800",
    fontSize: "18px"
  },
  brandSub: {
    color: "#94a3b8",
    fontSize: "13px"
  },
  profileCard: {
    background: "#111827",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "16px"
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#8b5cf6",
    fontWeight: "800"
  },
  profileName: {
    fontWeight: "700"
  },
  profileEmail: {
    color: "#94a3b8",
    fontSize: "13px",
    marginTop: "4px"
  },
  sideCard: {
    background: "#111827",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "12px"
  },
  sideLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "8px"
  },
  sideValue: {
    fontSize: "24px",
    fontWeight: "800"
  },
  goalInput: {
    width: "100%",
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "10px",
    boxSizing: "border-box"
  },
  goalBarOuter: {
    width: "100%",
    height: "10px",
    background: "#1f2937",
    borderRadius: "999px",
    overflow: "hidden"
  },
  goalBarInner: {
    height: "100%",
    background: "linear-gradient(90deg, #22c55e, #8b5cf6)"
  },
  goalText: {
    marginTop: "8px",
    color: "#cbd5e1",
    fontSize: "13px"
  },
  sidebarButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "16px"
  },
  main: {
    minWidth: 0
  },
  hero: {
    background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
    borderRadius: "28px",
    padding: "28px",
    marginBottom: "20px",
    boxShadow: "0 18px 40px rgba(59,130,246,0.2)"
  },
  heroBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.18)",
    marginBottom: "14px",
    fontSize: "13px"
  },
  heroTitle: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.1
  },
  heroText: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#e0e7ff",
    fontSize: "17px"
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "18px"
  },
  glassCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    padding: "20px",
    backdropFilter: "blur(10px)"
  },
  cardKicker: {
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "8px"
  },
  cardBig: {
    fontSize: "28px",
    fontWeight: "800"
  },
  cardBigSmall: {
    fontSize: "17px",
    lineHeight: 1.6
  },
  quickPromptWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "18px"
  },
  promptButton: {
    background: "#1f2937",
    color: "#fff",
    border: "1px solid #374151",
    borderRadius: "999px",
    padding: "10px 14px",
    cursor: "pointer"
  },
  chatPanel: {
    background: "#0f172a",
    border: "1px solid #1f2937",
    borderRadius: "24px",
    padding: "18px",
    marginBottom: "20px"
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    fontWeight: "700"
  },
  chatHeaderSub: {
    color: "#94a3b8",
    fontWeight: "400",
    fontSize: "13px"
  },
  chatBox: {
    height: "420px",
    overflowY: "auto",
    borderRadius: "18px",
    background: "#111827",
    padding: "14px",
    marginBottom: "14px"
  },
  emptyState: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: "20px"
  },
  messageRow: {
    display: "flex",
    marginBottom: "12px"
  },
  messageBubble: {
    maxWidth: "72%",
    padding: "12px 14px",
    borderRadius: "18px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap"
  },
  userBubble: {
    background: "#8b5cf6",
    color: "#fff",
    borderBottomRightRadius: "6px"
  },
  botBubble: {
    background: "#1f2937",
    color: "#fff",
    borderBottomLeftRadius: "6px"
  },
  emojiTag: {
    marginTop: "8px",
    fontSize: "13px",
    opacity: 0.8
  },
  typing: {
    color: "#94a3b8",
    fontStyle: "italic",
    padding: "8px 2px"
  },
  inputArea: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end"
  },
  textarea: {
    flex: 1,
    minHeight: "70px",
    background: "#0b1220",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "14px",
    boxSizing: "border-box"
  },
  sendButton: {
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    padding: "14px 20px",
    cursor: "pointer",
    fontWeight: "700"
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },
  panelCard: {
    background: "#0f172a",
    border: "1px solid #1f2937",
    borderRadius: "24px",
    padding: "20px",
    marginBottom: "20px"
  },
  panelTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "14px"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "14px"
  },
  input: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "12px"
  },
  formActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  sideButton: {
    background: "#1f2937",
    color: "#fff",
    border: "1px solid #374151",
    borderRadius: "14px",
    padding: "12px 16px",
    cursor: "pointer"
  },
  logoutButton: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    cursor: "pointer"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #334155",
    color: "#cbd5e1"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #1f2937",
    color: "#e5e7eb"
  },
  tableActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  editButton: {
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    cursor: "pointer"
  },
  deleteButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    cursor: "pointer"
  }
};

export default FinanceChat;