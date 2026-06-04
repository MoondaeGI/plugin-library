// 리스트를 단일 세트에 대조해 fetched/ambiguous/gap으로 분류한다(G2.5).
// items: [{ name, candidates: string[] }]  (candidates = 라벨/메타포로 만든 후보 아이콘명)
export async function classifyIcons({ setId, items, iconExists }) {
  const fetched = [], ambiguous = [], gap = []

  for (const item of items) {
    const matches = []
    for (const cand of item.candidates) {
      if (await iconExists(setId, cand)) matches.push(`${setId}:${cand}`)
    }
    if (matches.length === 1) fetched.push({ name: item.name, icon: matches[0] })
    else if (matches.length > 1) ambiguous.push({ name: item.name, matches })
    else gap.push({ name: item.name })
  }

  return {
    fetched, ambiguous, gap,
    report: { total: items.length, fetched: fetched.length, ambiguous: ambiguous.length, gap: gap.length },
  }
}
