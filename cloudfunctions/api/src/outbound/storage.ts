import cloud from 'wx-server-sdk'

export interface OutboundImageStorage {
  delete(fileIds: readonly string[]): Promise<void>
}

const deleteBatchSize = 50

export class CloudOutboundImageStorage implements OutboundImageStorage {
  async delete(fileIds: readonly string[]): Promise<void> {
    const uniqueFileIds = [...new Set(fileIds.filter(Boolean))]
    for (
      let offset = 0;
      offset < uniqueFileIds.length;
      offset += deleteBatchSize
    ) {
      await cloud.deleteFile({
        fileList: uniqueFileIds.slice(offset, offset + deleteBatchSize),
      })
    }
  }
}
