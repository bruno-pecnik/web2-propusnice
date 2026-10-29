import { Router } from "express";
import { getTotalCount, getActiveCount } from "../db.js";

const router = Router(); // nova prazna grupa ruta

// početna javno dostupna stranica
router.get("/", async (req, res) => {
    const total = await getTotalCount();
    const active = await getActiveCount();
    // ako je korisnik prijavljen, u email spremi njegov email iz Auth0,ako nije, spremi null
    const email = req.oidc.isAuthenticated() ? req.oidc.user?.email : null;
    res.render("index", { total, active, email });
});

export default router;
