import Sqids from '../sqids'

describe('bigint', () => {
  it('simple bigint encoding', () => {
    const sqids = new Sqids()

    const numbers = [1n, 2n, 3n]
    const id = '86Rf07'

    expect(sqids.encode(numbers)).toBe(id)
    expect(sqids.decodeBigInt(id)).toEqual(numbers)
  })

  it('bigints produce same IDs as equivalent numbers', () => {
    const sqids = new Sqids()

    expect(sqids.encode([1n, 2n, 3n])).toBe(sqids.encode([1, 2, 3]))
    expect(sqids.encode([0n])).toBe(sqids.encode([0]))
    expect(sqids.encode([100n, 200n])).toBe(sqids.encode([100, 200]))
  })

  it('above MAX_SAFE_INTEGER', () => {
    const sqids = new Sqids()

    const n = BigInt(Number.MAX_SAFE_INTEGER) + 2n // 9007199254740993n
    const id = 'nQnWViGxG6'

    expect(sqids.encode([n])).toBe(id)
    expect(sqids.decodeBigInt(id)).toEqual([n])
  })

  it('max uint64', () => {
    const sqids = new Sqids()

    const n = 2n ** 64n - 1n // 18446744073709551615n
    const id = 'eIkvoXH40Lmd'

    expect(sqids.encode([n])).toBe(id)
    expect(sqids.decodeBigInt(id)).toEqual([n])
  })

  it('uuid', () => {
    const sqids = new Sqids()

    const uuid = '8a42ca70-bbf4-472a-ae24-c3c06674e16a'
    const n = BigInt(`0x${uuid.replaceAll('-', '')}`)
    const id = 'KeUVFVS3J9xBd2ENsSc6oTu'

    expect(sqids.encode([n])).toBe(id)

    const [decoded] = sqids.decodeBigInt(id)
    const hex = decoded!.toString(16).padStart(32, '0')
    const restored = [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-')
    expect(restored).toBe(uuid)
  })

  it('mixed numbers and bigints', () => {
    const sqids = new Sqids()

    const numbers: (number | bigint)[] = [1, 2n, 3]
    const id = '86Rf07'

    expect(sqids.encode(numbers)).toBe(id)
    expect(sqids.decodeBigInt(id)).toEqual([1n, 2n, 3n])
  })

  it('decode always returns number[]', () => {
    const sqids = new Sqids()

    const id = sqids.encode([1, 2, 3])
    const result = sqids.decode(id)

    expect(result).toEqual([1, 2, 3])
    expect(result.every((n) => typeof n === 'number')).toBe(true)
  })

  it('encode out-of-range bigint', () => {
    const sqids = new Sqids()

    expect(() => sqids.encode([-1n])).toThrow(
      'Encoding supports non-negative BigInt values',
    )
  })

  it('encode out-of-range number still throws', () => {
    const sqids = new Sqids()
    const encodingError = `Encoding supports numbers between 0 and ${Number.MAX_SAFE_INTEGER}`

    expect(() => sqids.encode([Number.MAX_SAFE_INTEGER + 1])).toThrow(
      encodingError,
    )
    expect(() => sqids.encode([-1])).toThrow(encodingError)
  })

  it('decode() loses precision above MAX_SAFE_INTEGER — use decodeBigInt()', () => {
    const sqids = new Sqids()

    // MAX_SAFE_INTEGER + 2 = 2^53 + 1, which is not exactly representable as a
    // float64 — number arithmetic silently rounds it to 2^53 (MAX_SAFE_INTEGER + 1)
    const n = BigInt(Number.MAX_SAFE_INTEGER) + 2n
    const id = sqids.encode([n])

    // decodeBigInt() recovers the exact value
    expect(sqids.decodeBigInt(id)).toEqual([n])

    // decode() returns an imprecise number; converting back to BigInt exposes the loss
    const [lossyResult] = sqids.decode(id)
    expect(BigInt(lossyResult!)).not.toBe(n)
  })
})
