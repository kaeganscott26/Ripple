import type { RoomData } from "../engine/types";

export function RoomPanel({ room }: { room: RoomData }) {
  return (
    <section className="panel">
      <p className="eyebrow">Room</p>
      <h2>{room.name}</h2>
      <dl>
        <dt>Function</dt>
        <dd>{room.function}</dd>
        <dt>Pressure</dt>
        <dd>{room.pressure}</dd>
      </dl>
    </section>
  );
}
