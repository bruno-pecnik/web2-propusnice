import { Router } from "express";
import oidc from "express-openid-connect";
import { getTotalCount, getActiveCount, getAllPasses, getPass, cancelPass, deletePass } from "../db.js";

const { requiresAuth } = oidc; // iz biblioteke izvuče requiresAuth

const router = Router(); // nova prazna grupa ruta

// početna javno dostupna stranica
router.get("/", async (req, res) => {
    const total = await getTotalCount();
    const active = await getActiveCount();
    // ako je korisnik prijavljen, u email spremi njegov email iz Auth0,ako nije, spremi null
    const email = req.oidc.isAuthenticated() ? req.oidc.user?.email : null;
    const passes = email ? await getAllPasses() : []; // popis propusnica samo za prijavljene (koji imaju email)  
    res.render("index", { total, active, email, passes });
});

// poništavanje propusnice, samo za prijavljene
router.post("/admin/:id/cancel", requiresAuth(), async (req, res) => { 
    await cancelPass(String(req.params.id));
    res.redirect("/"); // povratak na početnu stranicu
});

// brisanje propusnice, samo za prijavljene
router.post("/admin/:id/delete", requiresAuth(), async (req, res) => {
    await deletePass(String(req.params.id));
    res.redirect("/");
});

// javna stranica propusnice, na nju vodi QR kod
router.get("/info/:id", async (req, res) => {
    const pass = await getPass(String(req.params.id)); // dohvat propusnice po id-u iz URL-a
    if (!pass) { // ako propusnica ne postoji
        res.status(404).send("Propusnica ne postoji.");
        return;
    }
    res.render("info", { pass });
});

export default router;
