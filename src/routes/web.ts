import { Router } from "express";
import { getTotalCount, getActiveCount } from "../db.js";

const router = Router(); // nova prazna grupa ruta

// početna javno dostupna stranica
router.get("/", async (_req, res) => {
    const total = await getTotalCount();
    const active = await getActiveCount();
    res.render("index", { total, active });
});

export default router;
