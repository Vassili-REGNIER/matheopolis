export type StudentsImportCsvValidationResult =
  | { valid: true; normalizedCsv: string }
  | { valid: false; message: string };

export function validateStudentsImportCsv(csvContent: string): StudentsImportCsvValidationResult {
  const trimmed = csvContent.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: "Collez le contenu CSV avant de lancer l'import." };
  }

  const rows = parseCsvRows(trimmed);
  if (rows.length < 2) {
    return { valid: false, message: "Le CSV doit contenir une ligne d'en-tete et au moins un eleve." };
  }

  const header = rows[0];
  if (header === undefined) {
    return { valid: false, message: "Le CSV doit commencer par l'en-tete nom,prenom." };
  }

  const normalizedHeader = header.map((cell) => normalizeCsvHeader(cell));
  const nameIndex = normalizedHeader.indexOf("nom");
  const firstNameIndex = normalizedHeader.indexOf("prenom");
  if (nameIndex === -1 || firstNameIndex === -1) {
    return { valid: false, message: "L'en-tete attendu est nom,prenom." };
  }

  const normalizedRows: string[][] = [["nom", "prenom"]];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const name = (row[nameIndex] ?? "").trim();
    const firstName = (row[firstNameIndex] ?? "").trim();

    if (name.length === 0 || firstName.length === 0) {
      return {
        valid: false,
        message: `La ligne ${index + 1} doit contenir un nom et un prenom.`
      };
    }

    normalizedRows.push([name, firstName]);
  }

  return {
    valid: true,
    normalizedCsv: normalizedRows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")).join("\n")
  };
}

function parseCsvRows(csvContent: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvContent.length; index += 1) {
    const char = csvContent[index];
    const next = csvContent[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== undefined) {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((cells) => cells.some((value) => value.trim().length > 0));
}

function normalizeCsvHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeCsvCell(value: string): string {
  if (!/[",\r\n]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll("\"", "\"\"")}"`;
}
