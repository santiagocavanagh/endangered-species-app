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
    .withMessage("scientificName es requerido")
    .isLength({ min: 3, max: 75 }),

  body("commonName").optional().trim().isString().isLength({ min: 3, max: 75 }),

  body("iucnStatus")
    .isIn(CONSERVATION_STATUSES)
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
    .bail()
    .custom((value: unknown) => {
      if (!Array.isArray(value)) {
        throw new Error("Regiones incompletas");
      }

      if (
        !value.every(
          (id) => typeof id === "number" && Number.isInteger(id) && id > 0,
        )
      ) {
        throw new Error("Respetar IDs numéricos positivos");
      }

      return true;
    })
    .customSanitizer((value: unknown) => {
      if (!Array.isArray(value)) return value;
      return value.map((id) => Number(id));
    }),

  body("population")
    .optional()
    .isInt({ gt: 0, lt: 1000000000000 })
    .withMessage("poblacion debe ser entero positivo razonable")
    .toInt(),

  body("censusDate").optional().isISO8601().toDate(),

  body().custom((body) => {
    if (body.population && !body.censusDate) {
      throw new Error("poblacion y fecha de censo obligatorios");
    }
    return true;
  }),

  body("sourceId").optional().isInt({ gt: 0 }).toInt(),
  body("notes").optional().isString(),
];

export const validateUpdateSpecies = [
  body("scientificName").optional().trim().isLength({ min: 3, max: 75 }),

  body("commonName").optional().trim().isString().isLength({ min: 3, max: 75 }),

  body("iucnStatus").optional().isIn(CONSERVATION_STATUSES),

  body("taxonomyId").optional().isInt({ gt: 0 }),

  body("description").optional().isString(),

  body("habitat").optional().isString(),

  body("regionIds")
    .optional()
    .isArray({ min: 1 })
    .withMessage("regionIds no puede ser vacío")
    .bail()
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

  body("population").optional().isInt({ gt: 0, lt: 1000000000000 }).toInt(),
  body("censusDate").optional().isISO8601().toDate(),
  body().custom((body) => {
    if (body.population && !body.censusDate) {
      throw new Error("Si se envía population, censusDate es obligatorio");
    }
    return true;
  }),
  body("sourceId").optional().isInt({ gt: 0 }).toInt(),
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
