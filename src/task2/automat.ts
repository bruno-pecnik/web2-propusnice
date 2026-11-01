import { writeFile } from "node:fs/promises"; 

// pomoćna funkcija, provjerava HTTP odgovor i baca grešku 
function checkStatus(response: Response, expected: number, action: string): void {
    if (response.status !== expected) {
        throw new Error(`${action} failed: ${response.status} ${response.statusText}`);
    }
}

// zadani potpis (deklaracija) funkcije s zadanim parametrima
export async function getToken(
    authority: string, // adresa Auth0 servera
    audience: string, // identifikator API-a
    clientId: string, // id automata
    clientSecret: string, // lozinka automata
    scope: string // prava koje tražimo
): Promise<string> { // funkcija vraća Promise koji će dat tekst, tj. token

    const params = new URLSearchParams(); // prazan objekt za parametre
    
    // dodajemo koji tok koristimo, id automata, lozinku automata, za koji API taržimo token, koja prava tražimo
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("audience", audience);
    params.append("scope", scope);

    // slanje HTTP zahtjeva Auth0-u 
    const tokenResponse = await fetch(`${authority}/oauth/token`, { // adresa token endpointa na Auth0 serveru
        method: "POST",
        body: params,
    });

    // poziv pomoćne funkcije, ako status nije 200 (OK), baca pogrešku
    checkStatus(tokenResponse, 200, "Token request");

    // ako je sve u redu, izvlačimo token i vraćamo ga
    const { access_token } = await tokenResponse.json();
    return access_token;
}

// zadani potpis funkcije za izdavanje propusnice
export async function issuePass(
    url: string, // adresa endpointa za izdavanje
    token: string, // pristupni token iz getToken
    name: string, // ime i prezime osobe
    document: string // oznaka dokumenta osobe
): Promise<void> {
    // slanje HTTP zahtjeva za izdavanje propusnice
    const issueResponse = await fetch(url, {
        method: "POST", // stvaramo novu propusnicu
        headers: {
            Authorization: `Bearer ${token}`, // šalje token
            "Content-Type": "application/json", // tijelo zahtjeva je JSON
        },
        body: JSON.stringify({ name, document }), // pretvorba objekta u tekst
    });

    // poziv pomoćne funkcije, ako status nije 201 (Created), baca pogrešku
    checkStatus(issueResponse, 201, "Issuing pass");

    // čitanje QR slike iz odgovora kao binarnih podataka
    const image = Buffer.from(await issueResponse.arrayBuffer());

    // čitanje Location zaglavlja, greška ako ga nema
    const locationHeader = issueResponse.headers.get("Location");
    if (!locationHeader) {
        throw new Error("No Location header in response");
    }

    // rastav adrese iz Location po /, uzme zadnji dio (id propusnice)
    const id = locationHeader.split("/").pop();

    // spremanje QR slike kao <id>.png
    await writeFile(`${id}.png`, image);
}