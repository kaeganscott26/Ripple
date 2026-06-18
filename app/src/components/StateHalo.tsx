import type { HaloState } from "../engine/types";

export function StateHalo({ state, title }: { state: HaloState; title?: string }) {
  return <span aria-hidden="true" className={`state-halo ${state}`} title={title} />;
}
