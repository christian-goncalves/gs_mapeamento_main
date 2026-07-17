"use client";

export default function GruposError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="shell">
      <section className="card route-error" role="alert">
        <p className="eyebrow">Administração</p>
        <h1>Não foi possível carregar os grupos</h1>
        <p className="muted">
          Tente novamente. Se o problema continuar, revise a conexão com a base
          de dados antes de alterar cadastros.
        </p>
        <button type="button" onClick={reset}>
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
