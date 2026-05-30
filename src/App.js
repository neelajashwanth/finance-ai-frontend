import React, { useState } from "react";
import FinanceChat from "./components/FinanceChat";
import LoginPage from "./components/LoginPage";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("financeUser");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("financeUser");
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <FinanceChat user={user} onLogout={handleLogout} />;
}

export default App;