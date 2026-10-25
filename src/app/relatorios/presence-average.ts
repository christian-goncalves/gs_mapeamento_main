export function roundPresenceAverage(total: number, count: number) {
  if (count <= 0) return 0;
  const average = total / count;
  return average <= 5 ? Math.floor(average) : Math.ceil(average);
}
