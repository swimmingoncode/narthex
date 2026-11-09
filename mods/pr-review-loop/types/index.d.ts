export type Attachment = {
  /** `owner/name`. */
  repo: string;
  pr: number;
  role: "reviewer" | "implementer";
  /** Absolute path of the chat file, or null while none is resolved. */
  chatPath: string | null;
  /** Why `chatPath` is null (none found, several found), else null. */
  chatNote: string | null;
  startedAt: number;
};

declare module "claude-code" {
  interface PluginState {
    "pr-review-loop": { attachment: Attachment | null };
  }
}
