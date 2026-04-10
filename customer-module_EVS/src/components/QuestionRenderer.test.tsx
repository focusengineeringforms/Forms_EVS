import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import QuestionRenderer from "./QuestionRenderer";
import type { FollowUpQuestion } from "../types";

const baseQuestion: FollowUpQuestion = {
  id: "question-id",
  text: "Sample question",
  type: "text",
  required: false,
  options: [],
};

describe("QuestionRenderer content", () => {
  it("renders text for questions", () => {
    render(
      <QuestionRenderer
        question={baseQuestion}
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText("Sample question")).toBeInTheDocument();
  });

  it("renders question image when provided", () => {
    render(
      <QuestionRenderer
        question={{ ...baseQuestion, imageUrl: "data:image/png;base64,image-data" }}
        value=""
        onChange={() => {}}
      />
    );

    expect(document.querySelector("img")).not.toBeNull();
  });

  it("supports image-only questions without text", () => {
    render(
      <QuestionRenderer
        question={{ ...baseQuestion, text: "", imageUrl: "data:image/png;base64,image-data" }}
        value=""
        onChange={() => {}}
      />
    );

    expect(document.querySelector("img")).not.toBeNull();
  });
});
