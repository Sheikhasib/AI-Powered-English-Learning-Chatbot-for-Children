/** Links between child screens keep the chosen friend in `?p=`, so Back always returns to the same buddy. */
export function childHref(path: "/buddy" | "/map" | "/stickers", profileId: string | undefined): string {
  return profileId ? `${path}?p=${encodeURIComponent(profileId)}` : "/";
}

/** Where Back goes: the buddy screen of this friend, or the welcome screen when we do not know who. */
export function backHref(profileId: string | undefined): string {
  return childHref("/buddy", profileId);
}

/** Reads the `p` search param, which Next hands over as a string, a list or nothing. */
export function profileIdFrom(param: string | string[] | undefined): string | undefined {
  return typeof param === "string" && param.length > 0 ? param : undefined;
}
