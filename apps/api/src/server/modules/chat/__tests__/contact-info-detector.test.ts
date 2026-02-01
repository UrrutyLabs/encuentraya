import { describe, it, expect } from "vitest";
import { containsContactInfo } from "../contact-info-detector";

describe("containsContactInfo", () => {
  describe("returns false for safe messages", () => {
    it("empty or whitespace", () => {
      expect(containsContactInfo("")).toBe(false);
      expect(containsContactInfo("   ")).toBe(false);
      expect(containsContactInfo("\n\t")).toBe(false);
    });

    it("normal chat without contact info", () => {
      expect(containsContactInfo("Hola.")).toBe(false);
      expect(containsContactInfo("Gracias, quedamos el martes.")).toBe(false);
      expect(containsContactInfo("El trabajo es cambiar la canilla.")).toBe(
        false
      );
      expect(containsContactInfo("Necesito revisar la instalación.")).toBe(
        false
      );
    });
  });

  describe("detects Uruguayan mobile numbers", () => {
    it("09X XXX XX XX format", () => {
      expect(containsContactInfo("Llamame al 091 234 56 78")).toBe(true);
      expect(containsContactInfo("Mi número es 099 123 45 67")).toBe(true);
      expect(containsContactInfo("0991234567")).toBe(true);
    });

    it("with dots or dashes", () => {
      expect(containsContactInfo("091.234.56.78")).toBe(true);
      expect(containsContactInfo("099-123-45-67")).toBe(true);
    });
  });

  describe("detects international phone patterns", () => {
    it("+598 ...", () => {
      expect(containsContactInfo("+598 99 123 4567")).toBe(true);
      expect(containsContactInfo("+59899123456")).toBe(true);
    });

    it("other country codes", () => {
      expect(containsContactInfo("+54 9 11 1234-5678")).toBe(true);
      expect(containsContactInfo("+1 555 123 4567")).toBe(true);
    });
  });

  describe("detects email", () => {
    it("standard email", () => {
      expect(containsContactInfo("Escribime a juan@gmail.com")).toBe(true);
      expect(containsContactInfo("Mi mail es foo@bar.com.uy")).toBe(true);
      expect(containsContactInfo("contacto@empresa.co")).toBe(true);
    });
  });

  describe("detects contact phrases", () => {
    it("suggestive phrases", () => {
      expect(containsContactInfo("Mi número es el de siempre")).toBe(true);
      expect(containsContactInfo("escríbime al celular")).toBe(true);
      expect(containsContactInfo("Hablame por whatsapp")).toBe(true);
      expect(containsContactInfo("Te dejo mi mail: algo")).toBe(true);
      expect(containsContactInfo("mi mail es interno")).toBe(true);
    });

    it("@ provider hints", () => {
      expect(containsContactInfo("Agregame en gmail, soy juan@gmail.com")).toBe(
        true
      );
      expect(containsContactInfo("Buscanos en @gmail")).toBe(true);
    });
  });

  describe("normalizes input", () => {
    it("trims and collapses spaces", () => {
      expect(containsContactInfo("  091 234 56 78  ")).toBe(true);
      expect(containsContactInfo("mi   número   es")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("non-string input returns false", () => {
      expect(containsContactInfo(null as unknown as string)).toBe(false);
      expect(containsContactInfo(undefined as unknown as string)).toBe(false);
    });

    it("numbers in non-phone context (e.g. address)", () => {
      expect(containsContactInfo("Av. 18 de Julio 1234")).toBe(false);
    });

    it("known false positive: word 'teléfono' in non-contact context", () => {
      // Blocklist includes "teléfono"; phrase triggers even when not sharing contact.
      expect(containsContactInfo("Mi teléfono se rompió ayer.")).toBe(true);
    });
  });
});
