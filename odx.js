import Odoo from 'odoo-await'; // Import the Odoo client class

const odooClient = new Odoo({
    baseUrl: "http://zenix.id",
    port: 8069,
    db: 'PDD-001',
    username: '__PDD__',
    password: '__PDD__',
});

(async () => {
    const startTime = new Date(); // Catat waktu mulai eksekusi
    try {
        const uhuy = await odooClient.connect();
        console.log(uhuy);

        const records = await odooClient.searchRead(
            'res.partner',
            [['country_id', '=', 'United States']],
            ['name', 'city'],
            {
                limit: 5,
                offset: 10,
                order: 'name',
                context: { lang: 'en_US' },
            }
        );
        console.log(records); // [ { id: 5, name: 'Kool Keith', city: 'Los Angeles' }, ... ]
    } catch (error) {
        console.error('Error:', error);
    } finally {
        const endTime = new Date(); // Catat waktu selesai eksekusi
        const executionTime = endTime - startTime; // Hitung selisih waktu
        console.log(`Total waktu eksekusi: ${executionTime} ms`);
    }
})();
