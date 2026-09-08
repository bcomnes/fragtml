import test from 'node:test'
import assert from 'node:assert/strict'
import { stripIndent } from './lib/strip-indent.js'

test('literal-only formatting retains smart trimming and common indentation rules', () => {
  for (const [input, expected] of [
    ['', ''],
    ['   ', '   '],
    ['\n', ''],
    ['\n\n', ''],
    ['\n\n\n', '\n'],
    ['\n  first\n    second\n  \n  third\n', 'first\n  second\n\nthird'],
    ['\r\n\tfirst\r\n\t\tsecond\r\n', 'first\n\tsecond'],
    ['first\r\nsecond', 'first\r\nsecond'],
    ['\n \n', ' ']
  ]) {
    assert.ok(input !== undefined)
    assert.equal(stripIndent([input]), expected)
  }
})

test('content does not set the common indentation or get trimmed with blank lines', () => {
  const content = '\nno indent\n\n  keep this\n'
  assert.equal(stripIndent(['\n    <div>\n      ', { content }, '\n    </div>\n']),
    `<div>\n  ${content}\n</div>`)
  assert.equal(stripIndent([{ content: ' \t\n ' }]), ' \t\n ')
})
