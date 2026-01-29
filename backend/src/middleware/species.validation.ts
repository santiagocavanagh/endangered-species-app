import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const VALID_STATUS = ["CR", "EN", "VU", "NT", "LC", "EX"];
const VALID_CATEGORIES = ["animal", "planta", "hongo"];
const VALID_REGIONS = [
  "America",
  "Europa",
  "Asia",
  "Africa",
  "Oceania",
  "Global",
];

export const validateSpeciesId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const numericId = parseInt(id as string, 10);

  if (isNaN(numericId) || numericId <= 0) {
    return res.status(400).json({ error: "ID de especie inválido" });
  }

  next();
};

export const validateCreateSpecies = [
  body("name")
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isString()
    .isLength({ min: 3, max: 50 }),
  body("scientificName")
    .notEmpty()
    .withMessage("El nombre científico es requerido")
    .isString()
    .isLength({ min: 3, max: 100 }),
  body("status")
    .notEmpty()
    .withMessage("El estado de conservación es requerido")
    .isString()
    .isIn(VALID_STATUS)
    .withMessage("Estado de conservación inválido"),
  body("region")
    .notEmpty()
    .withMessage("La región es requerida")
    .isString()
    .isIn(VALID_REGIONS)
    .withMessage("Región inválida"),
  body("habitat")
    .notEmpty()
    .withMessage("El hábitat es requerido")
    .isString()
    .isLength({ min: 3, max: 100 }),
  body("population")
    .notEmpty()
    .withMessage("La población estimada es requerida")
    .isString()
    .isLength({ min: 1, max: 200 }),
  body("imageUrl")
    .notEmpty()
    .withMessage("La URL de la imagen es requerida")
    .isURL()
    .withMessage("La URL de la imagen no es válida"),
  body("category")
    .notEmpty()
    .withMessage("La categoría es requerida")
    .isString()
    .isIn(VALID_CATEGORIES)
    .withMessage("Categoría inválida"),
];

export const validateUpdateSpecies = [
  body("name").optional().isString().isLength({ min: 3, max: 50 }),
  body("scientificName").optional().isString().isLength({ min: 3, max: 100 }),
  body("status")
    .optional()
    .isString()
    .isIn(VALID_STATUS)
    .withMessage("Estado de conservación inválido"),
  body("region")
    .optional()
    .isString()
    .isIn(VALID_REGIONS)
    .withMessage("Región inválida"),
  body("habitat").optional().isString().isLength({ min: 3, max: 100 }),
  body("population").optional().isString().isLength({ min: 1, max: 200 }),
  body("imageUrl")
    .optional()
    .isURL()
    .withMessage("La URL de la imagen no es válida"),
  body("category")
    .optional()
    .isString()
    .isIn(VALID_CATEGORIES)
    .withMessage("Categoría inválida"),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.param,
      message: error.msg,
    }));

    return res.status(400).json({
      error: "Validación fallida",
      details: formattedErrors,
    });
  }
  next();
};
