"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUserSchema = exports.createUserSchema = void 0;
// src/validation/user.schema.ts
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.loginUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(6),
});
