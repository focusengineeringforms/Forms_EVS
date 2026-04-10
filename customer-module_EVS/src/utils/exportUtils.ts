import { utils, writeFile, read } from "xlsx";
import type { Question, Response } from "../types";
import type { FollowUpQuestion, Section } from "../types/forms";
import { formatResponseTimestamp } from "./dateUtils";

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 11)}`;
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "yes", "1", "y"].includes(normalized);
  }
  return false;
}

function parseNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function collectQuestions(section: Section) {
  const rows: Array<Record<string, any>> = [];
  const visit = (question: FollowUpQuestion) => {
    const followUpConfig = question.followUpConfig
      ? JSON.stringify(question.followUpConfig)
      : "";
    rows.push({
      SectionId: section.id,
      QuestionId: question.id,
      QuestionText: question.text,
      QuestionType: question.type,
      Required: question.required ? "Yes" : "No",
      Options: (question.options || []).join("|"),
      Description: question.description || "",
      ParentQuestionId: question.showWhen?.questionId || "",
      TriggerValue: question.showWhen?.value ?? "",
      GridRows: question.gridOptions?.rows?.join("|") || "",
      GridColumns: question.gridOptions?.columns?.join("|") || "",
      Min: question.min ?? "",
      Max: question.max ?? "",
      Step: question.step ?? "",
      ImageUrl: question.imageUrl || "",
      FollowUpConfig: followUpConfig,
      GoToSection: question.followUpConfig
        ? Object.values(question.followUpConfig)
            .map((config) => config.goToSection || "")
            .filter(Boolean)
            .join("|")
        : "",
      LinkedSectionIds: question.followUpConfig
        ? Object.values(question.followUpConfig)
            .map((config) => config.linkedSectionId || "")
            .filter(Boolean)
            .join("|")
        : "",
      LinkedFormIds: question.followUpConfig
        ? Object.values(question.followUpConfig)
            .map((config) => config.linkedFormId || "")
            .filter(Boolean)
            .join("|")
        : "",
    });
    if (question.followUpQuestions && question.followUpQuestions.length > 0) {
      question.followUpQuestions.forEach((child) => visit(child));
    }
  };
  section.questions.forEach((question) => visit(question));
  return rows;
}

export function exportResponsesToExcel(
  responses: Response[],
  question: Question
) {
  const data = responses.map((response) => {
    const rawTimestamp = response.timestamp || response.fallbackTimestamp;
    const row: Record<string, string> = {
      Timestamp: formatResponseTimestamp(rawTimestamp),
    };

    const allQuestions =
      question.sections.length > 0
        ? question.sections.flatMap((section) => section.questions)
        : question.followUpQuestions;

    allQuestions.forEach((questionItem) => {
      const answer = response.answers[questionItem.id];
      const formattedAnswer = Array.isArray(answer)
        ? answer.join(", ")
        : answer ?? "";
      row[questionItem.text] = String(formattedAnswer);
    });

    return row;
  });

  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Responses");
  writeFile(workbook, `responses-${question.id}.xlsx`);
}

export function exportFormStructureToExcel(form: Question) {
  const formSheet = utils.json_to_sheet([
    {
      FormId: (form as any).id || (form as any)._id || "",
      Title: form.title,
      Description: form.description,
      IsVisible:
        typeof (form as any).isVisible === "boolean"
          ? (form as any).isVisible
          : true,
      TenantId: (form as any).tenantId || "",
      LogoUrl: form.logoUrl || "",
      ImageUrl: form.imageUrl || "",
      ParentFormId: form.parentFormId || "",
      ParentFormTitle: form.parentFormTitle || "",
      LocationEnabled: form.locationEnabled ? "Yes" : "No",
    },
  ]);

  const sections = form.sections || [];
  const sectionSheet = utils.json_to_sheet(
    sections.map((section, index) => ({
      SectionOrder: index + 1,
      SectionId: section.id,
      SectionTitle: section.title,
      SectionDescription: section.description || "",
      IsSubsection: section.isSubsection ? "Yes" : "No",
    }))
  );

  const questionRows = sections.flatMap((section) => collectQuestions(section));
  const questionsSheet = utils.json_to_sheet(questionRows, {
    header: [
      "SectionId",
      "QuestionId",
      "QuestionText",
      "QuestionType",
      "Required",
      "Options",
      "Description",
      "ParentQuestionId",
      "TriggerValue",
      "GridRows",
      "GridColumns",
      "Min",
      "Max",
      "Step",
      "ImageUrl",
      "FollowUpConfig",
      "GoToSection",
      "LinkedSectionIds",
      "LinkedFormIds",
    ],
  });

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, formSheet, "Form");
  utils.book_append_sheet(workbook, sectionSheet, "Sections");
  utils.book_append_sheet(workbook, questionsSheet, "Questions");
  writeFile(
    workbook,
    `${(form.title || "form").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-structure.xlsx`
  );
}

export function downloadFormImportTemplate() {
  const formSheet = utils.json_to_sheet([
    {
      FormId: "",
      Title: "Sample Form",
      Description: "Example description",
      IsVisible: true,
      TenantId: "",
      LogoUrl: "",
      ImageUrl: "",
      ParentFormId: "",
      ParentFormTitle: "",
      LocationEnabled: "No",
    },
  ]);

  const sectionSheet = utils.json_to_sheet([
    {
      SectionOrder: 1,
      SectionId: "section-1",
      SectionTitle: "Main Section",
      SectionDescription: "",
      IsSubsection: "No",
    },
  ]);

  const questionsSheet = utils.json_to_sheet(
    [
      {
        SectionId: "section-1",
        QuestionId: "question-1",
        QuestionText: "Primary question",
        QuestionType: "short-text",
        Required: "Yes",
        Options: "",
        Description: "",
        ParentQuestionId: "",
        TriggerValue: "",
        GridRows: "",
        GridColumns: "",
        Min: "",
        Max: "",
        Step: "",
        ImageUrl: "",
        FollowUpConfig: "",
        GoToSection: "",
        LinkedSectionIds: "",
        LinkedFormIds: "",
      },
      {
        SectionId: "section-1",
        QuestionId: "question-2",
        QuestionText: "Follow-up question",
        QuestionType: "short-text",
        Required: "No",
        Options: "",
        Description: "",
        ParentQuestionId: "question-1",
        TriggerValue: "Yes",
        GridRows: "",
        GridColumns: "",
        Min: "",
        Max: "",
        Step: "",
        ImageUrl: "",
        FollowUpConfig: "",
        GoToSection: "",
        LinkedSectionIds: "",
        LinkedFormIds: "",
      },
    ],
    {
      header: [
        "SectionId",
        "QuestionId",
        "QuestionText",
        "QuestionType",
        "Required",
        "Options",
        "Description",
        "ParentQuestionId",
        "TriggerValue",
        "GridRows",
        "GridColumns",
        "Min",
        "Max",
        "Step",
        "ImageUrl",
        "FollowUpConfig",
        "GoToSection",
        "LinkedSectionIds",
        "LinkedFormIds",
      ],
    }
  );

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, formSheet, "Form");
  utils.book_append_sheet(workbook, sectionSheet, "Sections");
  utils.book_append_sheet(workbook, questionsSheet, "Questions");
  writeFile(workbook, "form-import-template.xlsx");
}

function normalizeQuestionType(type: string): string {
  if (!type) return "text";

  const normalizedType = String(type)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // normalize multiple spaces to single space
    .replace(/\s*\/\s*/g, ""); // remove slashes and surrounding spaces

  const typeMap: Record<string, string> = {
    shorttext: "text",
    multiplechoice: "radio",
    longtext: "paragraph",
    dropdown: "search-select", // Defaulting dropdown to search-select if appropriate, or keep as select
    checkboxes: "checkbox",
    "searchable select": "search-select",
    "search-select": "search-select",
    searchableselect: "search-select",
    "product nps buckets": "productNPSTGWBuckets",
    productnpstgwbuckets: "productNPSTGWBuckets",
    hierarchy: "productNPSTGWBuckets",
    yesno: "yesNoNA",
    "yes/no": "yesNoNA",
  };

  if (typeMap[normalizedType]) {
    return typeMap[normalizedType];
  }

  const noSpaces = normalizedType.replace(/\s/g, "");
  if (typeMap[noSpaces]) {
    return typeMap[noSpaces];
  }

  return normalizedType;
}

export async function parseFormWorkbook(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const formSheet = workbook.Sheets.Form;
  const sectionsSheet = workbook.Sheets.Sections;
  const questionsSheet = workbook.Sheets.Questions;

  if (!formSheet || !sectionsSheet || !questionsSheet) {
    throw new Error("Template must include Form, Sections, and Questions sheets");
  }

  const formRows = utils.sheet_to_json<Record<string, any>>(formSheet, {
    defval: "",
  });
  if (formRows.length === 0) {
    throw new Error("Form sheet is empty");
  }
  const formRow = formRows[0];

  const sectionRows = utils.sheet_to_json<Record<string, any>>(sectionsSheet, {
    defval: "",
  });
  if (sectionRows.length === 0) {
    throw new Error("Sections sheet is empty");
  }

  const sectionsMap = new Map<string, Section>();
  sectionRows.forEach((row, index) => {
    const sectionId = row.SectionId?.toString().trim() || generateId();
    sectionsMap.set(sectionId, {
      id: sectionId,
      title: row.SectionTitle?.toString().trim() || `Section ${index + 1}`,
      description: row.SectionDescription?.toString().trim() || "",
      questions: [],
      isSubsection: parseBoolean(row.IsSubsection),
      followUpConfig: undefined,
    });
  });

  const questionRows = utils.sheet_to_json<Record<string, any>>(questionsSheet, {
    defval: "",
  });
  questionRows.forEach((row) => {
    const sectionId = row.SectionId?.toString().trim();
    const resolvedSectionId = sectionId && sectionsMap.has(sectionId)
      ? sectionId
      : sectionRows[0].SectionId?.toString().trim() || Array.from(sectionsMap.keys())[0];
    const section = sectionsMap.get(resolvedSectionId);
    if (!section) {
      return;
    }

    const questionId = row.QuestionId?.toString().trim() || generateId();
    const options = parseList(row.Options);
    const gridRows = parseList(row.GridRows);
    const gridCols = parseList(row.GridColumns);
    const followUpConfigString = row.FollowUpConfig?.toString().trim();
    let followUpConfig: FollowUpQuestion["followUpConfig"] | undefined;

    if (followUpConfigString) {
      try {
        const parsed = JSON.parse(followUpConfigString);
        if (parsed && typeof parsed === "object") {
          followUpConfig = parsed;
        }
      } catch (error) {
        throw new Error(`Invalid follow-up config for question ${questionId}`);
      }
    }

    const question: FollowUpQuestion = {
      id: questionId,
      text: row.QuestionText?.toString().trim() || "",
      type: normalizeQuestionType(row.QuestionType?.toString().trim() || "") as QuestionType,
      required: parseBoolean(row.Required),
      options: options.length > 0 ? options : undefined,
      description: row.Description?.toString().trim() || undefined,
      followUpQuestions: [],
      showWhen: row.ParentQuestionId
        ? {
            questionId: row.ParentQuestionId.toString().trim(),
            value: row.TriggerValue?.toString() ?? "",
          }
        : undefined,
      gridOptions:
        gridRows.length > 0 || gridCols.length > 0
          ? {
              rows: gridRows,
              columns: gridCols,
            }
          : undefined,
      min: parseNumber(row.Min),
      max: parseNumber(row.Max),
      step: parseNumber(row.Step),
      imageUrl: row.ImageUrl?.toString().trim() || undefined,
      followUpConfig,
    };

    section.questions.push(question);
  });

  const sections = Array.from(sectionsMap.values()).map((section) => ({
    ...section,
    questions: section.questions,
  }));

  const formPayload: Partial<Question> & { sections: Section[] } = {
    title: formRow.Title?.toString().trim() || "",
    description: formRow.Description?.toString().trim() || "",
    isVisible: parseBoolean(formRow.IsVisible),
    tenantId: formRow.TenantId?.toString().trim() || undefined,
    logoUrl: formRow.LogoUrl?.toString().trim() || undefined,
    imageUrl: formRow.ImageUrl?.toString().trim() || undefined,
    parentFormId: formRow.ParentFormId?.toString().trim() || undefined,
    parentFormTitle: formRow.ParentFormTitle?.toString().trim() || undefined,
    locationEnabled: parseBoolean(formRow.LocationEnabled),
    sections,
  };

  return formPayload;
}
