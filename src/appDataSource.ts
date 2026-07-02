// src/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load .env for the CLI context
dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  ssl: false,
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    idleTimeout: 60000,
  },
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
