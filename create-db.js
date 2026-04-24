const { Client } = require('pg');

async function createDatabase() {
    // Connect to the default PostgreSQL database first, using the default user/password
    const client = new Client({
        user: 'postgres',
        password: 'password', // Trying the assumed default
        host: 'localhost',
        port: 5432,
        database: 'postgres' // Connect to default database
    });

    try {
        await client.connect();
        console.log('Connected to local PostgreSQL server successfully!');

        // Check if our portal database already exists
        const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = 'aspiration_portal'`);

        if (res.rowCount === 0) {
            console.log('Database aspiration_portal does not exist. Creating it now...');
            await client.query(`CREATE DATABASE aspiration_portal`);
            console.log('✅ Success: aspiration_portal created!');
        } else {
            console.log('✅ Database aspiration_portal already exists!');
        }

    } catch (err) {
        console.error('❌ Connection failed. Your PostgreSQL password is not "password" or the server is off.');
        console.error(err.message);
    } finally {
        await client.end();
    }
}

createDatabase();
