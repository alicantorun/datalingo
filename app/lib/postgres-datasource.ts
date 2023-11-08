import { DataSource } from "typeorm";

// Define an interface for the configuration object
interface DataSourceConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * Creates and configures a new DataSource instance for connecting to a PostgreSQL database.
 *
 * @returns {DataSource} A DataSource instance configured for PostgreSQL.
 */
export const getPostgresDatasource = ({
  host,
  port,
  username,
  password,
  database,
}: DataSourceConfig) => {
  return new DataSource({
    // The type of database to connect to, "postgres" in this case.
    type: "postgres",

    // The hostname or IP address of the database server.
    host,

    // The port number where the database server is listening.
    port,

    // Username to log into the database. Replace with actual username.
    username,

    // Password for the database user. Replace with actual password.
    password,

    // The name of the database to connect to.
    database,

    // Indicates whether the database should be automatically updated to match the data model.
    // Should be 'false' in production to avoid accidental data loss.
    synchronize: false,

    // When set to 'true', detailed logs for each database query will be printed to the console.
    logging: true,

    // Configuration for SSL connections. Important for ensuring secure data transfer.
    ssl: {
      // If using a self-signed certificate or one not recognized by the server's CA,
      // set 'rejectUnauthorized' to 'false' to bypass certificate validation.
      // Note: This is a security risk and should not be used in production.
      rejectUnauthorized: false,
    },

    // An array of entity classes that this data source manages. Should be populated with your entities.
    entities: [],

    // An array of migration classes that this data source manages. Migrations are not used in this example.
    migrations: [],

    // An array of subscriber classes that this data source manages. Subscribers are not used in this example.
    subscribers: [],
  });
};
