// The only active session store is this module. No local/session storage or cookies.
const emptyPerson = () => ({ name: "", photo: null });
export const session = {
  mode: null,
  people: [emptyPerson(), emptyPerson()],
  answers: {},
  index: 0,
  editing: false,
};
export function setNames(names) {
  const clean = names.map((name) => name.trim());
  if (clean.some((name) => !name || [...name].length > 24))
    throw new Error("Enter two nicknames, each between 1 and 24 characters.");
  session.people.forEach((person, index) => {
    person.name = clean[index];
  });
}
export function removePhoto(index) {
  const person = session.people[index];
  if (person.photo) URL.revokeObjectURL(person.photo);
  if (person.pendingUrl) URL.revokeObjectURL(person.pendingUrl);
  person.pendingUrl = null;
  person.photo = null;
  person.pending = null;
}
export async function replacePhoto(index, file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  if (!file.size || file.size > 5 * 1024 * 1024)
    throw new Error("Choose an image smaller than or equal to 5 MB.");
  const person = session.people[index];
  const request = Symbol("photo-request");
  person.pending = request;
  const url = URL.createObjectURL(file);
  if (person.pendingUrl) URL.revokeObjectURL(person.pendingUrl);
  person.pendingUrl = url;
  try {
    // Decode before replacing the old preview. Extension/MIME alone is insufficient.
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        image.naturalWidth && image.naturalHeight
          ? resolve()
          : reject(new Error("That image has no readable dimensions."));
      image.onerror = () =>
        reject(
          new Error(
            "That image could not be read. Try another JPEG, PNG or WebP.",
          ),
        );
      image.src = url;
    });
    if (session.people[index] !== person || person.pending !== request) {
      URL.revokeObjectURL(url);
      return;
    }
    person.pendingUrl = null;
    removePhoto(index);
    person.photo = url;
  } catch (error) {
    URL.revokeObjectURL(url);
    if (person.pending === request) {
      person.pendingUrl = null;
      person.pending = null;
    }
    throw error;
  }
}
export function resetSession() {
  session.people.forEach((_, index) => removePhoto(index));
  session.mode = null;
  session.people = [emptyPerson(), emptyPerson()];
  session.answers = {};
  session.index = 0;
  session.editing = false;
}
export function clearAnswers() {
  session.answers = {};
  session.index = 0;
  session.editing = false;
}
export function hasSession() {
  return Boolean(
    session.mode ||
      session.people.some((p) => p.name || p.photo) ||
      Object.keys(session.answers).length,
  );
}
