import {readSaved,serializeSaved,type SavedState} from "./boundaries";
export const WORKSPACE_STORE_NAME="bkk-place-fit-v2";
export const LEGACY_WORKSPACE_STORE_NAME="bkk-place-fit-v1";
const LOCK="bangkok-place-workspace-v2";
export type WorkspaceStorage=Pick<Storage,"getItem"|"setItem"|"removeItem">;
export type WorkspaceRevision={current:string|null};
export interface WorkspaceLocks{request<T>(name:string,callback:()=>T|Promise<T>):Promise<T>}
export class WorkspaceConflict extends Error{
 constructor(){super("Another tab has newer saved entries. Your changes remain in this session. Save a report, then reload the saved workspace.");this.name="WorkspaceConflict";}
}
export function loadWorkspace(storage:WorkspaceStorage){
 const current=storage.getItem(WORKSPACE_STORE_NAME);
 return {...readSaved(current??storage.getItem(LEGACY_WORKSPACE_STORE_NAME)),revision:current};
}
export async function storeWorkspace(storage:WorkspaceStorage,state:SavedState,revision:WorkspaceRevision,locks?:WorkspaceLocks){
 if(!locks)throw Error("Safe workspace saving is unavailable in this browser.");
 const raw=serializeSaved(state);
 return locks.request(LOCK,()=>{
  if(storage.getItem(WORKSPACE_STORE_NAME)!==revision.current)throw new WorkspaceConflict();
  storage.setItem(WORKSPACE_STORE_NAME,raw);revision.current=raw;return raw;
 });
}
export async function clearWorkspace(storage:WorkspaceStorage,revision:WorkspaceRevision,locks?:WorkspaceLocks){
 const clear=()=>{
  let failed=false;
  for(const key of [WORKSPACE_STORE_NAME,LEGACY_WORKSPACE_STORE_NAME])try{storage.removeItem(key)}catch{failed=true}
  try{revision.current=storage.getItem(WORKSPACE_STORE_NAME)}catch{failed=true}
  if(failed)throw Error("Some saved browser data could not be removed.");
 };
 if(locks)return locks.request(LOCK,clear);
 return clear();
}
