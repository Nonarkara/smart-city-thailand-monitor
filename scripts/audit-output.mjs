import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// AUDIT_DIR is a filesystem directory, relative to the invoking script.
// Convert paths rather than interpolating URLs so spaces, # and % stay literal.
export function auditDirectory(fallback, base, override=process.env.AUDIT_DIR) {
  const path=resolve(dirname(fileURLToPath(base)),override??fallback);
  return pathToFileURL(path.endsWith(sep)?path:path+sep);
}
export function auditPath(fallback, base, override=process.env.AUDIT_DIR) {
  return fileURLToPath(auditDirectory(fallback,base,override));
}
