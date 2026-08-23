import type { FormEvent } from "react";

/**
 * React bubbles submit events through portals. A modal rendered in document.body
 * can therefore reach the parent editor even though it belongs to another form.
 */
export function isSubmitFromAnotherForm(
  event: FormEvent<HTMLFormElement>,
): boolean {
  const submitter = (event.nativeEvent as SubmitEvent).submitter as
    | (HTMLElement & { form?: HTMLFormElement })
    | null;

  return Boolean(submitter?.form && submitter.form !== event.currentTarget);
}
