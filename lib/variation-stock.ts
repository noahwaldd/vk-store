export type VariationWithStock = {
  label: string;
  values: string[];
  stockByValue?: Record<string, number>;
};

type ProductWithVariationStock = {
  stock: number;
  variations?: unknown;
};

type VariationStockScope = {
  key: string;
  stock: number;
};

function normalizeVariationKey(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function toStockNumber(value: unknown) {
  const stock = Number(value);

  if (!Number.isFinite(stock)) {
    return null;
  }

  return Math.max(0, Math.floor(stock));
}

export function normalizeVariationStockByValue(
  stockByValue: unknown,
  values: string[],
) {
  if (!stockByValue || typeof stockByValue !== "object") {
    return undefined;
  }

  const entries = Object.entries(stockByValue as Record<string, unknown>);
  const stockByNormalizedKey = new Map(
    entries.map(([key, value]) => [normalizeVariationKey(key), value] as const),
  );
  const normalizedStock: Record<string, number> = {};

  for (const value of values) {
    const rawStock =
      (stockByValue as Record<string, unknown>)[value] ??
      stockByNormalizedKey.get(normalizeVariationKey(value));
    const stock = toStockNumber(rawStock);

    if (stock !== null) {
      normalizedStock[value] = stock;
    }
  }

  return Object.keys(normalizedStock).length ? normalizedStock : undefined;
}

function readVariationGroups(variations: unknown): VariationWithStock[] {
  if (!Array.isArray(variations)) {
    return [];
  }

  return variations.flatMap((item): VariationWithStock[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const variation = item as {
      label?: unknown;
      values?: unknown;
      stockByValue?: unknown;
    };

    if (!Array.isArray(variation.values)) {
      return [];
    }

    const values = variation.values.map((value) => String(value).trim()).filter(Boolean);

    if (!values.length) {
      return [];
    }

    return [
      {
        label: String(variation.label ?? "Variação"),
        values,
        stockByValue: normalizeVariationStockByValue(variation.stockByValue, values),
      },
    ];
  });
}

export function getSelectedVariationValues(variation?: string | null) {
  if (!variation?.trim()) {
    return new Set<string>();
  }

  return new Set(
    variation
      .split(/\s*\/\s*/)
      .map((part) => {
        const separatorIndex = part.indexOf(":");
        return separatorIndex >= 0 ? part.slice(separatorIndex + 1) : part;
      })
      .map((value) => normalizeVariationKey(value))
      .filter(Boolean),
  );
}

export function getVariationValueStock(
  variation: { stockByValue?: Record<string, number> },
  value: string,
) {
  const stockByValue = variation.stockByValue;

  if (!stockByValue) {
    return null;
  }

  const exactStock = toStockNumber(stockByValue[value]);

  if (exactStock !== null) {
    return exactStock;
  }

  const normalizedValue = normalizeVariationKey(value);
  const matchingEntry = Object.entries(stockByValue).find(
    ([key]) => normalizeVariationKey(key) === normalizedValue,
  );

  return matchingEntry ? toStockNumber(matchingEntry[1]) : null;
}

export function isCartVariationAllowed(
  product: ProductWithVariationStock,
  variation?: string,
) {
  const groups = readVariationGroups(product.variations);

  if (!groups.length) {
    return true;
  }

  const selectedValues = getSelectedVariationValues(variation);

  if (!selectedValues.size) {
    return false;
  }

  return groups.every((group) =>
    group.values.some((value) => selectedValues.has(normalizeVariationKey(value))),
  );
}

export function getVariationStockScopes(
  product: ProductWithVariationStock,
  variation?: string,
): VariationStockScope[] {
  const groups = readVariationGroups(product.variations);
  const selectedValues = getSelectedVariationValues(variation);

  if (!selectedValues.size) {
    return [];
  }

  return groups.flatMap((group): VariationStockScope[] => {
    if (!group.stockByValue) {
      return [];
    }

    const selectedValue = group.values.find((value) =>
      selectedValues.has(normalizeVariationKey(value)),
    );

    if (!selectedValue) {
      return [];
    }

    const stock = getVariationValueStock(group, selectedValue);

    return stock === null
      ? []
      : [
          {
            key: `${group.label}:${selectedValue}`,
            stock,
          },
        ];
  });
}

export function getStockForVariationSelection(
  product: ProductWithVariationStock,
  selectedValues: Iterable<string>,
) {
  const selectedSet = new Set([...selectedValues].map(normalizeVariationKey));
  const variationLabel = readVariationGroups(product.variations)
    .flatMap((group) => {
      const value = group.values.find((item) => selectedSet.has(normalizeVariationKey(item)));
      return value ? [`${group.label}: ${value}`] : [];
    })
    .join(" / ");

  return getStockForCartVariation(product, variationLabel || undefined);
}

export function getStockForCartVariation(
  product: ProductWithVariationStock,
  variation?: string,
) {
  const scopes = getVariationStockScopes(product, variation);

  if (!scopes.length) {
    return Math.max(0, Math.floor(Number(product.stock) || 0));
  }

  return Math.min(...scopes.map((scope) => scope.stock));
}

export function getTotalConfiguredVariationStock(product: ProductWithVariationStock) {
  const stockedGroup = readVariationGroups(product.variations).find(
    (group) => group.stockByValue && Object.keys(group.stockByValue).length,
  );

  if (!stockedGroup?.stockByValue) {
    return null;
  }

  return stockedGroup.values.reduce(
    (total, value) => total + (getVariationValueStock(stockedGroup, value) ?? 0),
    0,
  );
}
