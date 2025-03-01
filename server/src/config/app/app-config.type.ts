export type AppConfig = {
  environment: string;
  port: number;
  apiPrefix: string;
  cors: {
    origin: string;
    credentials: boolean;
  };
};
