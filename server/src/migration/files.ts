import { createHash } from 'node:crypto'

import {
  parseSelfHostedPath,
  toSelfHostedReference,
} from '../../../cloudfunctions/api/src/storage/file-reference'
import type { FilePurpose } from '../storage/storage'
import type { MigrationDataset } from './dataset'

export interface PlannedFile {
  readonly cloudFileId: string
  readonly path: string
  readonly purpose: FilePurpose
  readonly ownerId: string | null
}

export interface FileMigrationPlan {
  readonly files: readonly PlannedFile[]
  readonly rewrites: ReadonlyMap<string, string>
  readonly skipped: readonly string[]
}

const extensions = new Set(['jpg', 'jpeg', 'png', 'webp'])

export function digestOf(cloudFileId: string): string {
  return createHash('sha256').update(cloudFileId).digest('hex').slice(0, 32)
}

export function extensionOf(cloudFileId: string): string {
  const extension = /\.([a-zA-Z0-9]+)$/u.exec(cloudFileId)?.[1]?.toLowerCase()
  return extension && extensions.has(extension) ? extension : 'jpg'
}

export function planFileMigration(
  dataset: MigrationDataset,
): FileMigrationPlan {
  const files = new Map<string, PlannedFile>()
  const skipped: string[] = []

  const plan = (
    cloudFileId: string,
    path: string,
    purpose: FilePurpose,
    ownerId: string | null,
  ) => {
    if (files.has(cloudFileId)) {
      return
    }
    if (parseSelfHostedPath(toSelfHostedReference(path)) === null) {
      skipped.push(cloudFileId)
      return
    }
    files.set(cloudFileId, { cloudFileId, path, purpose, ownerId })
  }

  for (const user of dataset.users) {
    const avatar = user.avatar_url
    if (avatar?.startsWith('cloud://')) {
      plan(
        avatar,
        `avatars/${user._id}/${digestOf(avatar)}.${extensionOf(avatar)}`,
        'AVATAR',
        user._id,
      )
    }
  }

  for (const item of dataset.items) {
    for (const image of item.images) {
      if (image.startsWith('cloud://')) {
        plan(
          image,
          `items/${item.registered_by}/${digestOf(image)}.${extensionOf(image)}`,
          'ITEM_IMAGE',
          item.registered_by,
        )
      }
    }
  }

  for (const label of dataset.item_labels) {
    const fileId = label.file_id
    if (fileId?.startsWith('cloud://')) {
      plan(
        fileId,
        `labels/${label.item_id}/${label.public_code}.png`,
        'LABEL',
        null,
      )
    }
  }

  return {
    files: [...files.values()],
    rewrites: new Map(
      [...files.values()].map((file) => [
        file.cloudFileId,
        toSelfHostedReference(file.path),
      ]),
    ),
    skipped,
  }
}

export function applyFileRewrites(
  dataset: MigrationDataset,
  rewrites: ReadonlyMap<string, string>,
): MigrationDataset {
  const rewrite = (fileId: string) => rewrites.get(fileId) ?? fileId
  return {
    ...dataset,
    users: dataset.users.map((user) =>
      user.avatar_url
        ? { ...user, avatar_url: rewrite(user.avatar_url) }
        : user,
    ),
    items: dataset.items.map((item) => ({
      ...item,
      images: item.images.map(rewrite),
    })),
    item_labels: dataset.item_labels.map((label) =>
      label.file_id ? { ...label, file_id: rewrite(label.file_id) } : label,
    ),
  }
}
