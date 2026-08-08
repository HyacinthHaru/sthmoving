import { describe, expect, it } from 'vitest'

import {
  createEmptyLabelBitmap,
  T50_PRO_DOTS_PER_MILLIMETRE,
} from '../miniprogram/services/printer/label-bitmap'
import { assertValidPrintJob } from '../miniprogram/services/printer/print-job'
import { assertValidRemoteImagePrintJob } from '../miniprogram/services/printer/remote-image-job'

describe('方形标签打印任务', () => {
  it('按 8 dots/mm 建立 240×240 的单色位图', () => {
    const bitmap = createEmptyLabelBitmap()
    expect(T50_PRO_DOTS_PER_MILLIMETRE).toBe(8)
    expect(bitmap.widthDots).toBe(240)
    expect(bitmap.heightDots).toBe(240)
    expect(bitmap.bytesPerRow).toBe(30)
    expect(bitmap.data).toHaveLength(7200)
  })

  it('为 20×20 mm 标签建立 160×160 的单色位图', () => {
    const bitmap = createEmptyLabelBitmap(20)
    expect(bitmap.widthDots).toBe(160)
    expect(bitmap.heightDots).toBe(160)
    expect(bitmap.bytesPerRow).toBe(20)
    expect(bitmap.data).toHaveLength(3200)
  })

  it('拒绝尺寸与数据不匹配的打印任务', () => {
    expect(() =>
      assertValidPrintJob({
        id: 'label-1',
        copies: 1,
        bitmap: {
          widthDots: 240,
          heightDots: 240,
          bytesPerRow: 30,
          data: new Uint8Array(10),
        },
      }),
    ).toThrow('位图数据长度')
  })

  it('接受合法打印任务', () => {
    expect(() =>
      assertValidPrintJob({
        id: 'label-1',
        copies: 1,
        bitmap: createEmptyLabelBitmap(),
      }),
    ).not.toThrow()
  })

  it('校验硕方远程图片打印参数', () => {
    expect(() =>
      assertValidRemoteImagePrintJob({
        id: 'label-image-1',
        copies: 1,
        imageUrl: 'https://example.com/item-code.png',
        widthMillimetres: 30,
        heightMillimetres: 30,
        imageWidthMillimetres: 30,
        imageHeightMillimetres: 30,
        density: 4,
        horizontalOffsetMillimetres: 0,
        verticalOffsetMillimetres: 0,
        paperType: 1,
        gapMillimetres: 3,
        speedMillimetresPerSecond: 30,
      }),
    ).not.toThrow()

    expect(() =>
      assertValidRemoteImagePrintJob({
        id: 'label-image-20mm',
        copies: 1,
        imageUrl: 'https://example.com/item-code.png',
        widthMillimetres: 20,
        heightMillimetres: 20,
        imageWidthMillimetres: 20,
        imageHeightMillimetres: 20,
        density: 4,
        horizontalOffsetMillimetres: 0,
        verticalOffsetMillimetres: 0,
        paperType: 1,
        gapMillimetres: 3,
        speedMillimetresPerSecond: 30,
      }),
    ).not.toThrow()

    expect(() =>
      assertValidRemoteImagePrintJob({
        id: 'label-image-2',
        copies: 1,
        imageUrl: 'cloud://environment/item-code.png',
        widthMillimetres: 30,
        heightMillimetres: 30,
        imageWidthMillimetres: 30,
        imageHeightMillimetres: 30,
        density: 4,
        horizontalOffsetMillimetres: 0,
        verticalOffsetMillimetres: 0,
        paperType: 1,
        gapMillimetres: 3,
        speedMillimetresPerSecond: 30,
      }),
    ).toThrow('HTTPS')
  })
})
