import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { CONSERVATION_STATUSES } from "../constants/species.constants";

export const validateSpeciesId = [
  param("id")
    .exists()
    .withMessage("ID requerido")
    .isInt({ gt: 0 })
    .withMessage("ID debe ser mayor a 0")
    .toInt(),
];

export const validateCreateSpecies = [
  body("scientificName")
    .trim()
    .notEmpty()
    .isString()
    .isLength({ min: 3, max: 75 }),

  body("commonName").optional().trim().isString().isLength({ min: 3, max: 75 }),

  body("iucnStatus")
    .isIn([CONSERVATION_STATUSES])
    .withMessage("Estado de conservación inválido"),

  body("taxonomyId")
    .isInt({ gt: 0 })
    .toInt()
    .withMessage("taxonomyId debe ser numero mayor a 0"),

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

  body("regionIds")
    .isArray({ min: 1 })
    .withMessage("Debe enviarse al menos una región")
    .custom((value) => {
      if (
        !value.every(
          (id: any) => Number.isInteger(Number(id)) && Number(id) > 0,
        )
      ) {
        throw new Error("Las regiones deben ser IDs numéricos positivos");
      }
      return true;
    })
    .customSanitizer((value) => value.map((id: any) => Number(id))),

  body("population").optional().isInt({ gt: 0 }).toInt(),
  body("censusDate").optional().isISO8601().toDate(),
  body("sourceId").optional().isInt({ gt: 0 }).toInt(),
  body("notes").optional().isString(),
];

export const validateUpdateSpecies = [
  body("scientificName").optional().isString().isLength({ min: 3, max: 150 }),

  body("commonName").optional().isString().isLength({ min: 3, max: 150 }),

  body("iucnStatus").optional().isIn([CONSERVATION_STATUSES]),

  body("taxonomyId").optional().isInt({ gt: 0 }),

  body("description").optional().isString(),

  body("habitat").optional().isString(),

  body("regionIds")
    .optional()
    .isArray({ min: 1 })
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
  const errors = validationResult(req).formatWith((error) => {
    if ("path" in error) {
      return {
        field: error.path,
        message: error.msg,
      };
    }

    return {
      field: "unknown",
      message: error.msg,
    };
  });

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      fields: errors.array(),
    });
  }
  next();
};
