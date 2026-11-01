import express, { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { auth, requiredScopes } from "express-oauth2-jwt-bearer";
import QRCode from "qrcode";
import { getPass, createPass } from "../db.js";

const router = Router(); // nova prazna grupa ruta za api
const baseURL = process.env.BASE_URL ?? "http://localhost:3000"; // adresa aplikacije za QR i Location

// provjera M2M tokena 
router.use(auth({
    audience: process.env.AUTH0_AUDIENCE ?? "", // token mora biti za bp-web2-passes
    issuerBaseURL: process.env.AUTH0_DOMAIN ?? "", // token mora izdat naš Auth0
}));

// vraća podatke o propusnici 
router.get("/:id", requiredScopes("read:passes"), async (req, res) => { // token mora imati scope read:passes
    const pass = await getPass(String(req.params.id)); // dohvat propusnice po id iz URL
    if (!pass) {
        res.sendStatus(404); // propusnica ne postoji
        return;
    }
    res.json({ // odgovor kao json
        id: pass.id,
        name: pass.name,
        document: pass.document,
        issuedAt: pass.issued_at.toISOString().slice(0, 19) + "Z",
        status: pass.status,
    });
});

// izdavanje nove propusnice, vraća QR kod
router.post("/", requiredScopes("create:passes"), express.json(), async (req, res) => { // treba scope create:passes
    const name = String(req.body?.name ?? "").trim(); // ime iz json tijela
    const document = String(req.body?.document ?? "").trim(); // dokument iz json tijela
    if (!name || !document) {
        res.sendStatus(400); // prazno ime ili dokument
        return;
    }

    const pass = await createPass(name, document); // spremanje u bazu
    const qr = await QRCode.toBuffer(`${baseURL}/info/${pass.id}`); // QR s adresom javne stranice

    // slanje odgovora
    res.status(201) 
        .location(`${baseURL}/passes/${pass.id}`) // adresa GET /passes/:id iz koje automat uzima id
        .type("png")
        .send(qr);
});

// hvata greške (401 za token, 403 za scope, 500 ostalo)
router.use((err: { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    res.sendStatus(err.status ?? 500);
});

export default router;