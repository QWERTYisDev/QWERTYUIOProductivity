import assert from 'node:assert'
import { def, toggle, derive, migrate } from './src/store.ts'
const t = { id: 'a', title: 'x', kind: 'daily' as const, days: [], xp: 100, ess: 5 }
let s = toggle(def(), t)
assert.equal(derive(s).xp, 100); assert.equal(derive(s).level, 2); assert.equal(derive(s).cur, 1)
assert.equal(derive(toggle(s, t)).xp, 0) // second tap undoes, never doubles
assert.equal(migrate('junk').tasks.length, 0)
console.log('ok')
