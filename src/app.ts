import "dotenv/config";
import express from "express";
import { createTable } from "./db.js"; 
import webRouter from "./routes/web.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.set("view engine", "ejs"); // express koristi EJS za prikaz starnice

app.use(webRouter); // uključuje rute za stanicu iz web.ts

await createTable(); // funkcija za stvaranje tablice iz db.ts

app.listen(port, "0.0.0.0", () => { // localhost 127.0.0.1 ne radi na Renderu
    console.log(`Propusnice app listening on http://localhost:${port}`);
});
