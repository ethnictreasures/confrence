import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

type Database = NeonHttpDatabase;

let database: Database | undefined;

function getDatabase(): Database {
	if (database) return database;

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL must be configured before accessing the database.');
	}

	database = drizzle(neon(databaseUrl));
	return database;
}

export const db: Database = new Proxy({} as Database, {
	get(_target, property) {
		const client = getDatabase();
		const value = Reflect.get(client, property, client);
		return typeof value === 'function' ? value.bind(client) : value;
	},
});
