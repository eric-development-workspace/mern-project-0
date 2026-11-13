// Slides 9-10: pure function, independent of React or MongoDB.
export function validateTodoTitle(title) {
  if (typeof title !== "string") {
    return false;
  }

  const value = title.trim();
  return value.length > 0 && value.length <= 100;
}