export type VoiceCommand = "lighter" | "harder" | "pause" | "resume";
/** Whole final utterances only; the wake word prevents ambient single-word commands. */
export function parseVoiceCommand(text: string): VoiceCommand | undefined {
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.!?,;:]/g, "").replace(/\s+/g, " ").trim();
  const commands: Record<string, VoiceCommand> = { "velo allege": "lighter", "velo renforce": "harder", "velo pause": "pause", "velo reprends": "resume", "velo reprend": "resume" };
  return commands[normalized];
}
