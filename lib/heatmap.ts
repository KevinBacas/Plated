export function heatLevel(count: number) {
  return count <= 0 ? 0 : count === 1 ? 1 : count < 5 ? 2 : 3;
}
