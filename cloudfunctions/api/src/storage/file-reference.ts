export const maxFileReferenceLength = 500

export function isManagedFileReference(fileId: string): boolean {
  return (
    fileId.startsWith('cloud://') &&
    fileId.length <= maxFileReferenceLength
  )
}

export function isAvatarOwnedBy(fileId: string, userId: string): boolean {
  return fileId.includes(`/avatars/${userId}/`)
}
