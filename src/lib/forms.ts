import { startTransition, type FormEvent } from "react";

/**
 * Submit a form to a `useActionState` action without React's automatic form
 * reset, so a validation error doesn't wipe what the user typed. Native
 * validation (required, minLength, ...) still runs before this fires.
 */
export function submitWithoutReset(dispatch: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
}
