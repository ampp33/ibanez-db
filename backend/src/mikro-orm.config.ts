import { defineConfig } from '@mikro-orm/postgresql';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { env } from './config/env';
import { Guitar } from './domain/entities/Guitar';
import { GuitarImage } from './domain/entities/GuitarImage';

export default defineConfig({
  clientUrl: env.databaseUrl,
  entities: [Guitar, GuitarImage],
  extensions: [Migrator],
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    glob: '!(*.d).{js,ts}',
  },
  debug: env.isDev,
  namingStrategy: UnderscoreNamingStrategy,
});
