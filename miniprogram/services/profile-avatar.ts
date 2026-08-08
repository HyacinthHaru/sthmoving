const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export async function chooseProfileAvatar(): Promise<string> {
  const result = await wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    sizeType: ['compressed'],
  })
  const file = result.tempFiles[0]
  if (!file) {
    throw new Error('未选择头像')
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error('头像不能超过 5 MB')
  }
  return file.tempFilePath
}

export async function uploadProfileAvatar(
  userId: string,
  filePath: string,
): Promise<string> {
  const extension = getImageExtension(filePath)
  const randomPart = Math.random().toString(36).slice(2, 10)
  const result = await wx.cloud.uploadFile({
    cloudPath: `avatars/${userId}/${Date.now()}-${randomPart}.${extension}`,
    filePath,
  })
  return result.fileID
}

export async function resolveProfileAvatar(fileId: string | undefined): Promise<string> {
  if (!fileId) {
    return ''
  }
  if (!fileId.startsWith('cloud://')) {
    return fileId
  }
  const result = await wx.cloud.getTempFileURL({ fileList: [fileId] })
  return result.fileList[0]?.tempFileURL ?? ''
}

export async function deleteProfileAvatar(fileId: string | undefined): Promise<void> {
  if (!fileId?.startsWith('cloud://')) {
    return
  }
  try {
    await wx.cloud.deleteFile({ fileList: [fileId] })
  } catch (error) {
    console.error('清理旧头像失败', error)
  }
}

function getImageExtension(filePath: string): string {
  const extension = /\.([a-zA-Z0-9]+)(?:\?|$)/u.exec(filePath)?.[1]?.toLowerCase()
  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'webp') {
    return extension
  }
  return 'jpg'
}
