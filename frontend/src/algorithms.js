/**
 * Linear Search — filter tasks by category.
 * O(n): walks every task and collects matches.
 */
export function linearFilterByCategory(tasks, category) {
  if (!category || category === 'All') return tasks
  const result = []
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].category === category) result.push(tasks[i])
  }
  return result
}

/**
 * Merge Sort — sort tasks by a given key ('due_date' | 'title').
 * O(n log n): stable, good for UI lists.
 */
export function mergeSort(tasks, key = 'due_date') {
  if (tasks.length <= 1) return tasks
  const mid = Math.floor(tasks.length / 2)
  const left = mergeSort(tasks.slice(0, mid), key)
  const right = mergeSort(tasks.slice(mid), key)
  return merge(left, right, key)
}

function merge(left, right, key) {
  const result = []
  let i = 0, j = 0
  while (i < left.length && j < right.length) {
    const a = left[i][key] ?? ''
    const b = right[j][key] ?? ''
    if (a <= b) { result.push(left[i++]) }
    else        { result.push(right[j++]) }
  }
  return result.concat(left.slice(i)).concat(right.slice(j))
}

/**
 * Binary Search — find a task by exact title match on a sorted array.
 * O(log n): requires array sorted by title ascending.
 * Returns the task or null.
 */
export function binarySearchByTitle(sortedTasks, query) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  // Binary search for first match
  let lo = 0, hi = sortedTasks.length - 1, found = -1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const title = sortedTasks[mid].title.toLowerCase()
    if (title === q) { found = mid; break }
    else if (title < q) lo = mid + 1
    else hi = mid - 1
  }
  if (found === -1) return []
  // Collect all tasks with the same title (duplicates)
  let start = found, end = found
  while (start > 0 && sortedTasks[start - 1].title.toLowerCase() === q) start--
  while (end < sortedTasks.length - 1 && sortedTasks[end + 1].title.toLowerCase() === q) end++
  return sortedTasks.slice(start, end + 1)
}

/**
 * Fuzzy search helper — used alongside binary search for partial matches.
 * Linear scan on already-filtered set, so still fast in practice.
 */
export function fuzzySearch(tasks, query) {
  if (!query.trim()) return tasks
  const q = query.toLowerCase()
  return tasks.filter(t => t.title.toLowerCase().includes(q))
}
