import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { isSubmitFromAnotherForm } from "./group-editor-submit";

function submitEvent(
  currentTarget: HTMLFormElement,
  submitter: { form?: HTMLFormElement },
  target = currentTarget,
) {
  return {
    currentTarget,
    target,
    nativeEvent: { submitter },
  } as unknown as FormEvent<HTMLFormElement>;
}

describe("submit do editor de grupo", () => {
  it("identifica submit de um formulário independente renderizado por portal", () => {
    const parentForm = {} as HTMLFormElement;
    const modalForm = {} as HTMLFormElement;

    expect(isSubmitFromAnotherForm(submitEvent(parentForm, { form: modalForm }))).toBe(
      true,
    );
  });

  it("identifica submit que chega ao pai com outro alvo React", () => {
    const parentForm = {} as HTMLFormElement;
    const modalForm = {} as HTMLFormElement;

    expect(isSubmitFromAnotherForm(submitEvent(parentForm, {}, modalForm))).toBe(true);
  });

  it("não bloqueia submit pertencente ao próprio formulário", () => {
    const form = {} as HTMLFormElement;

    expect(isSubmitFromAnotherForm(submitEvent(form, { form }))).toBe(false);
  });
});
