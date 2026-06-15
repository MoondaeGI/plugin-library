// 벤더 브랜드 마크를 Iconify(logos/simple-icons)에서 색 보존 SVG로 조달한다.
// 흔한 로그인 제공자는 별칭 후보로, 그 외는 set:name 오버라이드로 해소하고,
// Iconify에 없으면 escalate를 반환한다(트레이드마크는 생성하지 않는다).
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  fetchIconSvg as realFetch,
  iconExists as realExists,
} from '../../../scripts/lib/design/iconify-client.mjs'

// 우선순위: 다색 logos 먼저, 단색 simple-icons 폴백.
export const VENDOR_CANDIDATES = {
  google: ['logos:google-icon', 'simple-icons:google'],
  github: ['logos:github-icon', 'simple-icons:github'],
  apple: ['logos:apple', 'simple-icons:apple'],
  kakao: ['logos:kakaotalk', 'simple-icons:kakaotalk'],
  naver: ['logos:naver', 'simple-icons:naver'],
  facebook: ['logos:facebook', 'simple-icons:facebook'],
  x: ['logos:x', 'simple-icons:x'],
  microsoft: ['logos:microsoft-icon', 'simple-icons:microsoft'],
}

const parseRef = (ref) => {
  const [setId, name] = ref.split(':')
  return { setId, name }
}

export async function resolveVendorLogo({ vendor, override, deps = {} }) {
  const iconExists = deps.iconExists || realExists
  const fetchIconSvg = deps.fetchIconSvg || realFetch
  const key = (vendor || '').toLowerCase()
  const candidates = override ? [override] : VENDOR_CANDIDATES[key] || []
  if (candidates.length === 0) {
    return { status: 'escalate', vendor: key, reason: 'unknown-vendor', tried: [] }
  }
  for (const ref of candidates) {
    const { setId, name } = parseRef(ref)
    if (await iconExists(setId, name, deps)) {
      const svg = await fetchIconSvg(setId, name, deps)
      return { status: 'resolved', vendor: key, source: ref, svg }
    }
  }
  return { status: 'escalate', vendor: key, reason: 'not-on-iconify', tried: candidates }
}

export async function writeVendorLogo({ vendor, override, outPath, deps = {} }) {
  const result = await resolveVendorLogo({ vendor, override, deps })
  if (result.status === 'resolved') {
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, result.svg, 'utf8')
    result.path = outPath
  }
  return result
}

// CLI: node fetch-vendor-logo.mjs --vendor google --out <abs path> [--ref set:name]
// 결과를 JSON 한 줄로 stdout에 출력(스킬이 manifest로 수집). escalate면 exit 3.
function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i]?.replace(/^--/, '')
    if (k) out[k] = argv[i + 1]
  }
  return out
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isCli) {
  const a = parseArgs(process.argv.slice(2))
  const result = await writeVendorLogo({ vendor: a.vendor, override: a.ref, outPath: a.out })
  const { svg, ...meta } = result
  process.stdout.write(JSON.stringify(meta) + '\n')
  if (result.status !== 'resolved') process.exit(3)
}
