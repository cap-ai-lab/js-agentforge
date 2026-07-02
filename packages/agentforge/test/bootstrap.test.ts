import { expect, test } from 'vitest'
import { loadConfig } from '../src/bootstrap.js'

test('loadConfig applies defaults', () => {
  const c = loadConfig({ OPENAI_API_KEY: 'k', MODEL: 'm' })
  expect(c).toEqual({
    apiKey: 'k', model: 'm',
    baseUrl: 'https://api.openai.com/v1', port: 3000, platformSecret: undefined,
  })
})

test('loadConfig throws on missing required var', () => {
  expect(() => loadConfig({ MODEL: 'm' })).toThrow(/OPENAI_API_KEY/)
})
