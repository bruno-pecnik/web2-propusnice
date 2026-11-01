import "dotenv/config";
import express from "express";
import oidc from "express-openid-connect";
import { createTable } from "./db.js"; 
import webRouter from "./routes/web.js"; // rute za web stranice
import apiRouter from "./routes/api.js"; // rute za API 

const { auth } = oidc; // funkcija za Auth0 prijavu iz biblioteke

const app = express();
const port = Number(process.env.PORT) || 3000;

// adresa aplikacije iz .env, ako je nema koristi localhost
const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`; 

app.set("view engine", "ejs"); // express koristi EJS za prikaz starnice

// prijava preko Auth0
app.use(auth({
    authRequired: false, // nisu sve stranice zaštićene jer je početna javna
    idpLogout: true, // pri odjavi odjavi i Auth0
    secret: process.env.SESSION_SECRET ?? "",
    baseURL, 
    clientID: process.env.AUTH0_CLIENT_ID ?? "",
    clientSecret: process.env.AUTH0_CLIENT_SECRET ?? "",
    issuerBaseURL: process.env.AUTH0_DOMAIN ?? "", 
    authorizationParams: {
        response_type: "code", 
    },
    routes: {
        logout: false, // imamo vlastitu rutu za odjavu
    },
}));

// ruta za odjavu
app.post("/logout", (_req, res) => {
    res.oidc.logout({ returnTo: baseURL }); // nakon odjave povratak na početnu stranicu
});

app.use("/passes", apiRouter); // API rute pod /passes
app.use(webRouter); // uključuje rute za stanicu iz web.ts

await createTable(); // funkcija za stvaranje tablice iz db.ts

app.listen(port, "0.0.0.0", () => { // localhost 127.0.0.1 ne radi na Renderu
    console.log(`Propusnice app listening on http://localhost:${port}`);
});
