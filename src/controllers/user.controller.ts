// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { createUserSchema, loginUserSchema } from "../validation/user.schema";
import { initDb } from "../db";
import bcrypt from "bcryptjs";
import logger from "../logger";

export const registerUser = async (req: Request, res: Response) => {
  logger.info("Register user request received", { body: req.body });
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    logger.warn("Validation failed for register user", { error: parsed.error });
    res.status(400).json(parsed.error);
    return;
  }

  try {
    const db = await initDb();
    const { firstName, lastName, email, password } = parsed.data;

    // Check if user already exists
    logger.debug("Checking if user already exists", { email });
    const existingUser = await db.get(
      "SELECT id FROM users WHERE email = ?",
      email
    );
    if (existingUser) {
      logger.warn("Registration attempt with existing email", { email });
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    logger.info("Creating new user", { email, firstName });
    await db.run(
      `INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`,
      firstName,
      lastName,
      email,
      hashedPassword
    );

    logger.info("User registered successfully", { email });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err: any) {
    logger.error("Error during user registration", {
      error: err.message,
      stack: err.stack,
    });

    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      logger.warn("Duplicate email registration attempt", {
        email: parsed.data.email,
      });
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    res.status(500).json({ error: "Server error", details: err });
    return;
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const parsed = loginUserSchema.safeParse(req.body);
  logger.info('Login request received', { email: req.body.email });
  
  if (!parsed.success) {
    logger.warn('Validation failed for login', { error: parsed.error });
    res.status(400).json(parsed.error);
    return;
  }

  try {
    const db = await initDb();
    const { email, password } = parsed.data;

    logger.debug('Looking up user for login', { email });
    const user = await db.get("SELECT * FROM users WHERE email = ?", email);

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    logger.debug('Comparing passwords for login');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn('Invalid password attempt', { email });
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    logger.info('User logged in successfully', { userId: user.id, email });
    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    logger.error('Error during user login', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: "Server error", details: err });
  }
};

export const getUsers = async (_: Request, res: Response) => {
  logger.info('Get all users request received');
  try {
    const db = await initDb();
    logger.debug('Fetching all users from database');
    const users = await db.all(
      "SELECT id, firstName, lastName, email FROM users"
    );
    
    logger.info('Successfully retrieved users', { count: users.length });
    res.json(users);
  } catch (err) {
    logger.error('Error fetching users', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: "Server error", details: err });
  }
};
