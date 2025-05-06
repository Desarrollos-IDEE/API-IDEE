function calculateDistance(latA, lonA, latB, lonB) {
    const pi = Math.PI;
    const f = 1/298.257223563; // WGS84 flattening
    const a = 6378137; // WGS84 semi-major axis
    const b = 6356752.314245; // WGS84 semi-minor axis

    // Convert degrees to radians
    let lata = parseFloat(latA) * pi / 180;
    let lona = parseFloat(lonA) * pi / 180;
    let latb = parseFloat(latB) * pi / 180;
    let lonb = parseFloat(lonB) * pi / 180;

    const minValue = 1e-15;

    // Validate input values
    if (Math.abs(lata) > (pi / 2) || !latA) {
        lata = minValue;
    }
    if (Math.abs(lona) > (2 * pi) || !lonA) {
        lona = minValue;
    }
    if (Math.abs(latb) > (pi / 2) || !latB) {
        latb = minValue;
    }
    if (Math.abs(lonb) > (2 * pi) || !lonB) {
        lonb = minValue;
    }

    // Calculate distance
    const u1 = Math.atan((1 - f) * Math.tan(lata));
    const u2 = Math.atan((1 - f) * Math.tan(latb));
    let lambda = lonb - lona;
    const Lmay = lonb - lona;

    let sigma, alfa, cos2sigmam, Cmay;
    for (let n = 1; n <= 10; n++) {
        const senosigma = Math.sqrt(
            Math.pow(Math.cos(u2) * Math.sin(lambda), 2) + 
            Math.pow(Math.cos(u1) * Math.sin(u2) - Math.sin(u1) * Math.cos(u2) * Math.cos(lambda), 2)
        );
        const cosenosigma = Math.sin(u1) * Math.sin(u2) + Math.cos(u1) * Math.cos(u2) * Math.cos(lambda);
        sigma = Math.atan2(senosigma, cosenosigma);
        const senoalfa = Math.cos(u1) * Math.cos(u2) * Math.sin(lambda) / senosigma;
        alfa = Math.atan2(senoalfa, Math.sqrt(1 - Math.pow(senoalfa, 2)));
        cos2sigmam = cosenosigma - 2 * Math.sin(u1) * Math.sin(u2) / Math.pow(Math.cos(alfa), 2);
        Cmay = f / 16 * Math.pow(Math.cos(alfa), 2) * (4 + f * (4 - 3 * Math.pow(Math.cos(alfa), 2)));
        lambda = Lmay + (1 - Cmay) * f * Math.sin(alfa) * (sigma + Cmay * Math.sin(sigma) * (cos2sigmam + Cmay * Math.cos(sigma) * (-1 + 2 * Math.pow(cos2sigmam, 2))));
    }

    const ucu = Math.pow(Math.cos(alfa), 2) * (Math.pow(a, 2) - Math.pow(b, 2)) / Math.pow(b, 2);
    const Amay = 1 + ucu / 16384 * (4096 + ucu * (-768 + ucu * (320 - 175 * ucu)));
    const Bmay = ucu / 1024 * (256 + ucu * (-128 + ucu * (74 - 47 * ucu)));
    const incsigma = Bmay * Math.sin(sigma) * (cos2sigmam + 0.25 * Bmay * (Math.cos(sigma) * (-1 + 2 * Math.pow(cos2sigmam, 2)) - 1 / 6 * Bmay * cos2sigmam * (-3 + 4 * Math.pow(Math.sin(sigma), 2)) * (-3 + 4 * Math.pow(cos2sigmam, 2))));
    const s = b * Amay * (sigma - incsigma);

    return s; // Return distance in meters as a number
}

module.exports = calculateDistance;
