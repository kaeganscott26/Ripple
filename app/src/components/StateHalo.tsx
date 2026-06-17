import type { HaloState } from "../engine/types";

export function StateHalo({ state }: { state: HaloState }) {
  return <span aria-hidden="true" className={`state-halo ${state}`} />;
}
