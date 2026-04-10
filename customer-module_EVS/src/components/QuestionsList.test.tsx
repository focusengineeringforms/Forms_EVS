import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionsList from "./QuestionsList";
import type { FollowUpQuestion } from "../types";

const nativeFileReader = globalThis.FileReader;

const overrideFileReaderResult = (dataUrl: string) => {
  class MockFileReader {
    result: string | ArrayBuffer | null = null;
    onloadend:
      | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
      | null = null;

    readAsDataURL(_: Blob) {
      this.result = dataUrl;
      if (this.onloadend) {
        this.onloadend.call(this as unknown as FileReader, {} as any);
      }
    }
  }

  globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
};

const renderQuestionsList = () => {
  const initialQuestion: FollowUpQuestion = {
    id: "question-1",
    text: "Question 1",
    type: "text",
    required: false,
    options: [],
    imageUrl: "",
  };

  const Wrapper = () => {
    const [questions, setQuestions] = React.useState([initialQuestion]);

    return (
      <QuestionsList questions={questions} onQuestionsChange={setQuestions} />
    );
  };

  render(<Wrapper />);
};

afterEach(() => {
  globalThis.FileReader = nativeFileReader;
});

describe("QuestionsList question content", () => {
  it("supports text-only questions", () => {
    renderQuestionsList();

    const textInput = screen.getByPlaceholderText("Question text") as HTMLInputElement;
    expect(textInput.value).toBe("Question 1");
    expect(screen.queryByAltText("Question")).toBeNull();
  });

  it("supports image-only questions", async () => {
    overrideFileReaderResult("data:image/png;base64,test-image");
    renderQuestionsList();

    const user = userEvent.setup();
    const textInput = screen.getByPlaceholderText("Question text") as HTMLInputElement;
    const fileInput = document.querySelector(
      "input[type='file']"
    ) as HTMLInputElement;

    await user.clear(textInput);
    await user.upload(
      fileInput,
      new File(["image"], "question.png", { type: "image/png" })
    );

    expect(textInput.value).toBe("");
    expect(screen.getByAltText("Question")).toBeInTheDocument();
  });

  it("supports questions with both text and image", async () => {
    overrideFileReaderResult("data:image/png;base64,test-image");
    renderQuestionsList();

    const user = userEvent.setup();
    const textInput = screen.getByPlaceholderText("Question text") as HTMLInputElement;
    const fileInput = document.querySelector(
      "input[type='file']"
    ) as HTMLInputElement;

    await user.upload(
      fileInput,
      new File(["image"], "question.png", { type: "image/png" })
    );

    expect(textInput.value).toBe("Question 1");
    expect(screen.getByAltText("Question")).toBeInTheDocument();
  });
});
