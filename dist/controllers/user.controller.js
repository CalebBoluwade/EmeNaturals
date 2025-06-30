"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.loginUser = exports.registerUser = void 0;
const user_schema_1 = require("../validation/user.schema");
const db_1 = require("../db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = __importDefault(require("../logger"));
const registerUser = async (req, res) => {
    logger_1.default.info("Register user request received", { body: req.body });
    const parsed = user_schema_1.createUserSchema.safeParse(req.body);
    if (!parsed.success) {
        logger_1.default.warn("Validation failed for register user", { error: parsed.error });
        res.status(400).json(parsed.error);
        return;
    }
    try {
        const db = await (0, db_1.initDb)();
        const { firstName, lastName, email, password } = parsed.data;
        // Check if user already exists
        logger_1.default.debug("Checking if user already exists", { email });
        const existingUser = await db.get("SELECT id FROM users WHERE email = ?", email);
        if (existingUser) {
            logger_1.default.warn("Registration attempt with existing email", { email });
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        logger_1.default.info("Creating new user", { email, firstName });
        await db.run(`INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`, firstName, lastName, email, hashedPassword);
        logger_1.default.info("User registered successfully", { email });
        res.status(201).json({ message: "User registered successfully" });
    }
    catch (err) {
        logger_1.default.error("Error during user registration", {
            error: err.message,
            stack: err.stack,
        });
        if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
            logger_1.default.warn("Duplicate email registration attempt", {
                email: parsed.data.email,
            });
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        res.status(500).json({ error: "Server error", details: err });
        return;
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    logger_1.default.info('Login request received', { email: req.body.email });
    const parsed = user_schema_1.loginUserSchema.safeParse(req.body);
    if (!parsed.success) {
        logger_1.default.warn('Validation failed for login', { error: parsed.error });
        res.status(400).json(parsed.error);
        return;
    }
    try {
        const db = await (0, db_1.initDb)();
        const { email, password } = parsed.data;
        logger_1.default.debug('Looking up user for login', { email });
        const user = await db.get("SELECT * FROM users WHERE email = ?", email);
        if (!user) {
            logger_1.default.warn('Login attempt with non-existent email', { email });
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        logger_1.default.debug('Comparing passwords for login');
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            logger_1.default.warn('Invalid password attempt', { email });
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        logger_1.default.info('User logged in successfully', { userId: user.id, email });
        res.json({
            message: "Login successful",
            user: { id: user.id, email: user.email },
        });
    }
    catch (err) {
        logger_1.default.error('Error during user login', { error: err instanceof Error ? err.message : err });
        res.status(500).json({ error: "Server error", details: err });
    }
};
exports.loginUser = loginUser;
const getUsers = async (_, res) => {
    logger_1.default.info('Get all users request received');
    try {
        const db = await (0, db_1.initDb)();
        logger_1.default.debug('Fetching all users from database');
        const users = await db.all("SELECT id, firstName, lastName, email FROM users");
        logger_1.default.info('Successfully retrieved users', { count: users.length });
        res.json(users);
    }
    catch (err) {
        logger_1.default.error('Error fetching users', { error: err instanceof Error ? err.message : err });
        res.status(500).json({ error: "Server error", details: err });
    }
};
exports.getUsers = getUsers;
