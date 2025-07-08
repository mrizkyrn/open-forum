export type AppConfig = {
  environment: string;
  port: number;
  apiPrefix: string;
  clientUrl: string;
  cors: {
    origin: string;
    credentials: boolean;
  };
};
