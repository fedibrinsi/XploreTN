import dotenv from "dotenv";
dotenv.config(); // Doit être avant tout le reste

// Ensure that the generated Prisma client is compatible with ESNext imports
import prismaPkg from "../generated/prisma/index.js";
import type { PrismaClient as PrismaClientType } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// Improving type safety in Prisma
// because "strict" is set to "true" in tsconfig.json )(for better type checking).
const PrismaClientCtor = (prismaPkg as unknown as { PrismaClient: new (opts?: any) => PrismaClientType }).PrismaClient;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClientCtor({ adapter });

export default prisma;
