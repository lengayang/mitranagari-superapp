const res = await fetch("http://localhost:3000/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Halo AI Mitra Nagari" })
});

const data = await res.json();
console.log(data);
