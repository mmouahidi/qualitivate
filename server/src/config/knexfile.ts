import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const migrationsDirectory = path.resolve(__dirname, '../../../database/migrations');
const seedsDirectory = path.resolve(__dirname, '../../../database/seeds');
const migrationsDistDirectory = path.resolve(__dirname, '../../../database/dist/migrations');
const seedsDistDirectory = path.resolve(__dirname, '../../../database/dist/seeds');

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'qualitivate',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: migrationsDirectory
    },
    seeds: {
      directory: seedsDirectory
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL
      ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }
      : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'qualitivate',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: migrationsDistDirectory
    },
    seeds: {
      directory: seedsDistDirectory
    }
  }
};

export default config;
