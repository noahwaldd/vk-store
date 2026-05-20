const marqueeItems = [
  "Melhores marcas",
  "VK Store",
  "Frete sob consulta",
  "Perfumaria de nicho",
  "Peças de GRIFE",
];

export function BrandMarquee() {
  const loopItems = [...marqueeItems, ...marqueeItems];

  return (
    <section
      className="overflow-hidden border-y-2 border-foreground bg-street-lime text-foreground"
      aria-label="Destaques VK Store"
    >
      <div className="marquee-track flex w-max items-center">
        {loopItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex min-h-16 items-center gap-5 px-5 py-3 sm:min-h-20 sm:px-8"
            aria-hidden={index >= marqueeItems.length}
          >
            <span className="font-graffiti text-4xl leading-none sm:text-6xl">
              {item}
            </span>
            <span className="font-display text-3xl leading-none text-foreground/50 sm:text-5xl">
              /
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
