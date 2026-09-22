/**
 * Where the two mutable bits of state live — the application pipeline and the
 * LR retrain history.
 *
 * On Cloud Run the container filesystem is an in-memory overlay: writable, but
 * per-instance and gone when the instance is recycled. That is exactly the
 * right durability for a prototype whose data is a demo, and exactly the wrong
 * one for production — so this is the single place to swap in Firestore or
 * Cloud SQL when it stops being a prototype.
 *
 * `/tmp` is the only path guaranteed writable on Cloud Run (the rest of the
 * image is read-only when the second-generation execution environment is on),
 * so managed runtimes get /tmp and a local `npm run dev` gets ./.data.
 */

import path from "path";

/**
 * Cloud Run always sets K_SERVICE. The rest cover the runtimes this app has
 * been deployed to before, so a stray deploy elsewhere still picks /tmp.
 */
const IS_MANAGED_RUNTIME = Boolean(
  process.env.K_SERVICE ||          // Cloud Run · Cloud Functions gen2
  process.env.GAE_ENV ||            // App Engine
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

export const RUNTIME_DATA_DIR =
  process.env.UDYAMAI_DATA_DIR ??
  (IS_MANAGED_RUNTIME ? "/tmp/udyamai" : path.join(process.cwd(), ".data"));

export function runtimeFile(name: string): string {
  return path.join(RUNTIME_DATA_DIR, name);
}
