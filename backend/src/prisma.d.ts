declare module "@prisma/client" {
  export class PrismaClient {
    constructor(options?: any): any;
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
  }
  export type Prisma = any;
  export type User = any;
  export type Role = any;
  export type ActivityCategory = any;
  export type ActivityStatus = any;
  export type PlaceCategory = any;
  export type HousingType = any;
  export namespace PrismaClientKnownRequestError {
    type KnownRequestError = any;
  }
}
