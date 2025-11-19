declare module "connect-pg-simple" {
  import { RequestHandler, Request, Response, NextFunction } from "express";
  import { Pool, PoolClient } from "pg";

  interface ConnectPgSimpleOptions {
    pool?: Pool;
    tableName?: string;
    ttl?: number;
    reapInterval?: number;
    disableTouch?: boolean;
  }

  function connectPgSimple(sessionOptions: any): any;

  export default connectPgSimple;
}
