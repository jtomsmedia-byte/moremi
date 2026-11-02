async function list() {
  const c = await caches.open("moremi-personal"),
    keys = await c.keys(),
    ul = document.querySelector("#files");
  ul.replaceChildren();
  for (const key of keys) {
    const res = await c.match(key),
      li = document.createElement("li"),
      a = document.createElement("a");
    a.href = key.url;
    a.textContent = decodeURIComponent(res.headers.get("X-Moremi-Title"));
    li.append(a);
    ul.append(li);
  }
  document.querySelector("#status").textContent = keys.length
    ? ""
    : "No worksheets saved.";
}
document.querySelector("#clear").onclick = async () => {
  await caches.delete("moremi-personal");
  await list();
};
list().catch(
  () =>
    (document.querySelector("#status").textContent =
      "Offline storage unavailable."),
);
