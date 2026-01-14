import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = "tu_clave_secreta_super_segura"; // En producción va en .env

// REGISTRO
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = userRepository.create({
      email,
      password: hashedPassword,
      role: role || "user",
    });
    await userRepository.save(newUser);
    res.status(201).json({ message: "Usuario creado" });
  } catch (error) {
    res.status(400).json({ error: "El email ya existe" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOneBy({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  // Generamos el token con el ID y el ROL
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });
  res.json({ token, role: user.role, email: user.email });
});

export default router;
