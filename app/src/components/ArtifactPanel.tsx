import type { ArtifactData, RunState } from "../engine/types";

export function ArtifactPanel({ artifact, state }: { artifact: ArtifactData; state: RunState }) {
  return (
    <section className="panel">
      <p className="eyebrow">Artifact</p>
      <h2>{state.boulderName ?? artifact.name}</h2>
      <p>{artifact.description}</p>
      <dl>
        <dt>Role</dt>
        <dd>{artifact.role}</dd>
        <dt>State</dt>
        <dd>{state.boulderPosition === "shifted" ? "Shifted from the center path." : artifact.state}</dd>
      </dl>
    </section>
  );
}
