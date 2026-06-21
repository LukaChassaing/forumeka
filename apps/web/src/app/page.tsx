export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Forumeka</h1>
      <p className="mt-2 text-ink-500">
        Tape un symptôme, on te remonte les pistes de diagnostic classées par taux de succès.
      </p>
      <form action="/recherche" method="get" className="mt-8 flex gap-2">
        <input
          name="q"
          type="text"
          placeholder="ex: Clio 3 1.5 dCi cale à chaud"
          className="flex-1 rounded border border-ink-100 bg-white px-4 py-3 text-ink-900 outline-none focus:border-ink-300"
          autoFocus
        />
        <button
          type="submit"
          className="rounded bg-ink-900 px-5 py-3 text-beige-50 hover:bg-ink-700"
        >
          Chercher
        </button>
      </form>
    </div>
  );
}
