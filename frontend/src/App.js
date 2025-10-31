import React, { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
  fetch("http://localhost:8000/")
    .then(res => {
      console.log("Response status:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("Data:", data);
      setMessage(data.message);
    })
    .catch(err => console.error("Error:", err));
}, []);


  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>React ↔ FastAPI Test</h1>
      <p>Message from backend: {message}</p>
    </div>
  );
}

export default App;