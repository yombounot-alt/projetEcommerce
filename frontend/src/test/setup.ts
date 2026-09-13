import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Le mode "globals" n'étant pas activé (vitest.config test.globals absent), l'auto-cleanup
// de @testing-library/react (qui détecte un `afterEach` global) ne se déclenche pas seul :
// on le fait explicitement pour éviter que le DOM d'un test ne pollue le suivant.
afterEach(() => {
  cleanup();
});
