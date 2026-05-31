import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.evaluation.findFirst({ where: { evaluated: true } }).then(res => { console.log(JSON.stringify(res, null, 2)); p.$disconnect(); });
