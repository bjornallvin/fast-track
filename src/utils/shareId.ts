// Opaque, unguessable id for a configurable share (spec 003). The id is the
// only credential in a share URL, so it must not be enumerable like the
// human-readable session ids.
export function generateShareId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}
