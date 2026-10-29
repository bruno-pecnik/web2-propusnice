import "dotenv/config";
import express from "express";
import { createTable } from "./db.js"; 

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/", (_req, res) => {
    res.send("Server radi."); // privremeno
});

await createTable(); // funkcija za stvaranje tablice iz db.ts

app.listen(port, "0.0.0.0", () => { // localhost 127.0.0.1 ne radi na Renderu
    console.log(`Propusnice app listening on http://localhost:${port}`);
});
