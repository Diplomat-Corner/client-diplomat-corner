import type { FilterOption } from "@/components/filter-section";

export function getCarFilterOptions(
  advertisementType?: string
): FilterOption[] {
  const adTypeFilters: FilterOption[] = advertisementType
    ? []
    : [
        {
          value: "For Rent",
          label: "For Rent",
          category: "advertisementType",
        },
        {
          value: "For Sale",
          label: "For Sale",
          category: "advertisementType",
        },
      ];

  return [
    ...adTypeFilters,
    { value: "Sedan", label: "Sedan", category: "bodyType" },
    { value: "SUV", label: "SUV", category: "bodyType" },
    { value: "Truck", label: "Truck", category: "bodyType" },
    { value: "Hatchback", label: "Hatchback", category: "bodyType" },
    { value: "Minivan", label: "Minivan", category: "bodyType" },
    { value: "Gasoline", label: "Gasoline", category: "fuel" },
    { value: "Diesel", label: "Diesel", category: "fuel" },
    { value: "Electric", label: "Electric", category: "fuel" },
    { value: "Hybrid", label: "Hybrid", category: "fuel" },
    { value: "Automatic", label: "Automatic", category: "transmission" },
    { value: "Manual", label: "Manual", category: "transmission" },
  ];
}
