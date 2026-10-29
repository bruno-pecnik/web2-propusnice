import pg from "pg";

// adresu baze iz .env spremamo u connectionString
const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({ // spremnik otvorenih veza prema bazi
    connectionString,
    // šifrirana veza samo kad se spajamo izvana, ta adresa sadrži render.com
    // interno spajanje nema render.com u adresi pa je SSL isključen
    ssl: connectionString?.includes("render.com") ? { rejectUnauthorized: false } : false,
});

// jedna propusnica iz baze
export type Pass = {
    id: string;
    name: string;
    document: string; // dokument osobe
    issued_at: Date;
    status: "ACTIVE" | "CANCELLED";
};

// stvara tablicu ako još ne postoji 
export async function createTable(): Promise<void> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS propusnice (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            document TEXT NOT NULL,
            issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'CANCELLED'))
        )
    `);
}

// broj svih propusnica u bazi
export async function getTotalCount(): Promise<number> {
    const result = await pool.query("SELECT COUNT(*) FROM propusnice");
    return Number(result.rows[0].count); // COUNT dolazi kao string, pretvaramo ga u Number
}

// broj propusnica sa statusom ACTIVE
export async function getActiveCount(): Promise<number> {
    const result = await pool.query("SELECT COUNT(*) FROM propusnice WHERE status = 'ACTIVE'"); // samo WHERE status = 'ACTIVE'
    return Number(result.rows[0].count); 
}

// sve propusnice, najnovije prve
export async function getAllPasses(): Promise<Pass[]> {
    const result = await pool.query<Pass>("SELECT * FROM propusnice ORDER BY issued_at DESC");
    return result.rows;
}

// poništavanje propusnice, status u CANCELLED
export async function cancelPass(id: string): Promise<void> {
    await pool.query("UPDATE propusnice SET status = 'CANCELLED' WHERE id = $1", [id]);
}

// brisanje propusnice iz baze
export async function deletePass(id: string): Promise<void> {
    await pool.query("DELETE FROM propusnice WHERE id = $1", [id]);
}
