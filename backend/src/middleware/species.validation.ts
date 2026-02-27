import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateSpeciesId = [
  param("id")
    .exists()
    .withMessage("ID requerido")
    .isInt({ gt: 0 })
    .withMessage("ID debe ser entero positivo")
    .toInt(),
];

export const validateCreateSpecies = [
  body("scientificName").isString().isLength({ min: 3, max: 150 }),

  body("commonName").optional().isString().isLength({ min: 3, max: 150 }),

  body("iucnStatus").isIn([
    "EX",
    "EW",
    "CR",
    "EN",
    "VU",
    "NT",
    "LC",
    "DD",
    "NE",
  ]),

  body("taxonomyId")
    .isInt({ gt: 0 })
    .withMessage("taxonomyId must be a positive integer"),

  body("description").optional().isString(),

  body("habitat").optional().isString(),

  body("regionIds")
    .isArray({ min: 1 })
    .withMessage("Debe enviarse al menos una región")
    .custom((value) => {
      if (!value.every((id: any) => Number.isInteger(id))) {
        throw new Error("Las regiones deben ser IDs numéricos");
      }
      return true;
    }),

  body("population").optional().isInt({ gt: 0 }),
  body("censusDate").optional().isISO8601(),
  body("sourceId").optional().isInt({ gt: 0 }),
  body("notes").optional().isString(),
];

export const validateUpdateSpecies = [
  body("scientificName").optional().isString().isLength({ min: 3, max: 150 }),

  body("commonName").optional().isString().isLength({ min: 3, max: 150 }),

  body("iucnStatus")
    .optional()
    .isIn(["EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD", "NE"]),

  body("taxonomyId").optional().isInt({ gt: 0 }),

  body("description").optional().isString(),

  body("habitat").optional().isString(),

  body("regionIds")
    .optional()
    .isArray()
    .custom((value) => {
      if (!value.every((id: any) => Number.isInteger(id))) {
        throw new Error("Las regiones deben ser IDs numéricos");
      }
      return true;
    }),

  body("population").optional().isInt({ gt: 0 }),
  body("censusDate").optional().isISO8601(),
  body("sourceId").optional().isInt({ gt: 0 }),
  body("notes").optional().isString(),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
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
