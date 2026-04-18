/*
import dotenv from "dotenv";
dotenv.config(); // Doit être avant tout le reste
import { PrismaClient } from "@prisma/client";

// Ensure that the generated Prisma client is compatible with ESNext imports
//import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export default prisma;
*/
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client"; //
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export default prisma;
