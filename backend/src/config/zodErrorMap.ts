import { z, ZodIssueCode, type ZodParsedType } from "zod";

/**
 * Traduit en français les messages Zod par défaut (champs requis, longueurs min/max, formats
 * email/url, enums, clés inconnues...). Les messages explicites passés à `.min(n, "...")`,
 * `.refine(fn, { message: "..." })`, etc. restent inchangés — cette carte ne s'applique
 * qu'aux erreurs qui n'ont pas de message personnalisé.
 *
 * Doit être importé une seule fois, avant que la moindre validation ne s'exécute (voir app.ts).
 */
const TYPE_NAMES: Partial<Record<ZodParsedType, string>> = {
  string: "une chaîne de caractères",
  number: "un nombre",
  boolean: "un booléen",
  array: "une liste",
  object: "un objet",
  date: "une date",
};

export function installFrenchZodErrorMap(): void {
  z.setErrorMap((issue, ctx) => {
    switch (issue.code) {
      case ZodIssueCode.invalid_type: {
        if (issue.received === "undefined" || issue.received === "null") {
          return { message: "Ce champ est requis" };
        }
        const expected = TYPE_NAMES[issue.expected] ?? issue.expected;
        return { message: `Ce champ doit être ${expected}` };
      }

      case ZodIssueCode.too_small: {
        if (issue.type === "string") {
          return issue.minimum === 1
            ? { message: "Ce champ est requis" }
            : { message: `Doit contenir au moins ${issue.minimum} caractère(s)` };
        }
        if (issue.type === "array") {
          return { message: `Doit contenir au moins ${issue.minimum} élément(s)` };
        }
        if (issue.type === "number" || issue.type === "bigint") {
          return {
            message: issue.inclusive
              ? `Doit être supérieur ou égal à ${issue.minimum}`
              : `Doit être supérieur à ${issue.minimum}`,
          };
        }
        break;
      }

      case ZodIssueCode.too_big: {
        if (issue.type === "string") {
          return { message: `Ne doit pas dépasser ${issue.maximum} caractères` };
        }
        if (issue.type === "array") {
          return { message: `Ne doit pas contenir plus de ${issue.maximum} élément(s)` };
        }
        if (issue.type === "number" || issue.type === "bigint") {
          return {
            message: issue.inclusive
              ? `Doit être inférieur ou égal à ${issue.maximum}`
              : `Doit être inférieur à ${issue.maximum}`,
          };
        }
        break;
      }

      case ZodIssueCode.invalid_string: {
        if (issue.validation === "email") return { message: "Adresse email invalide" };
        if (issue.validation === "url") return { message: "URL invalide" };
        if (issue.validation === "uuid") return { message: "Identifiant invalide" };
        if (issue.validation === "regex") return { message: "Format invalide" };
        return { message: "Format invalide" };
      }

      case ZodIssueCode.invalid_enum_value:
        return { message: `Valeur invalide (attendu : ${issue.options.join(", ")})` };

      case ZodIssueCode.unrecognized_keys:
        return { message: `Champ(s) non reconnu(s) : ${issue.keys.join(", ")}` };

      case ZodIssueCode.invalid_date:
        return { message: "Date invalide" };

      case ZodIssueCode.invalid_union:
        return { message: "Valeur invalide" };
    }

    return { message: ctx.defaultError };
  });
}
