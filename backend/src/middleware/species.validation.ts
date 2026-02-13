import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { SPECIES_STATUS, SPECIES_CATEGORIES } from "../constants/species.constants";

export const validateSpeciesId = [
  param("id")
    .exists()
    .withMessage("ID requerido")
    .isInt({ gt: 0 })
    .withMessage("ID debe ser entero positivo")
    .toInt(),
];

export const validateCreateSpecies = [
  body("name").isString().isLength({ min: 3, max: 100 }),

  body("scientificName").isString().isLength({ min: 3, max: 150 }),

  body("status").isIn(SPECIES_STATUS),

  body("category").isIn(SPECIES_CATEGORIES),

  body("habitat").isString().isLength({ min: 3, max: 150 }),

  body("imageUrl").isURL(),

  body("populationValue").optional().isInt({ gt: 0 }),

  body("populationOperator")
    .optional()
    .isIn(["<", ">", "~"]),

  body("currentTrend")
    .optional()
    .isString(),

  body("region")
    .isArray({ min: 1 })
    .withMessage("Debe enviarse al menos una región")
    .custom((value) => {
      if (!value.every((id: any) => Number.isInteger(id))) {
        throw new Error("Las regiones deben ser IDs numéricos");
      }
      return true;
    }),
];

export const validateUpdateSpecies = [
  body("name").optional().isString().isLength({ min: 3, max: 100 }),

  body("scientificName").optional().isString(),

  body("status").optional().isIn(SPECIES_STATUS),

  body("category").optional().isIn(SPECIES_CATEGORIES),

  body("habitat").optional().isString(),

  body("imageUrl").optional().isURL(),

  body("populationValue").optional().isInt({ gt: 0 }),

  body("populationOperator").optional().isIn(["<", ">", "~"]),

  body("currentTrend").optional().isString(),

  body("region")
    .optional()
    .isArray()
    .custom((value) => {
      if (!value.every((id: any) => Number.isInteger(id))) {
        throw new Error("Las regiones deben ser IDs numéricos");
      }
      return true;
    }),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validación fallida",
      details: errors.array(),
    });
  }

  next();
};
