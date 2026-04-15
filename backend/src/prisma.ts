import dotenv from "dotenv";
dotenv.config(); // Doit être avant tout le reste

//! Affects build and run : import de modules ESNext dans un projet TypeScript configuré pour ESNext avec module resolution "bundler" peut causer des problèmes de compatibilité. Assurez-vous que tous les imports sont compatibles avec votre configuration TypeScript et que les modules externes sont correctement exportés en tant que modules ESNext.

import prismaPkg from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = prismaPkg as any;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export default prisma;
