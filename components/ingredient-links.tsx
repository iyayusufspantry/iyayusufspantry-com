import { Search } from "lucide-react";

// Link selected ingredient names without rewriting the client's label text.
// Staple ingredients and the separate allergen statement remain plain text.
const ingredientNames = [
  "African / Calabash Nutmeg",
  "Negro Pepper / Grains of Selim",
  "Alligator Pepper",
  "Grains of Paradise",
  "False Cubeb / Bush Pepper",
  "Scotch bonnet peppers",
  "Uziza Seeds",
  "Cameroon pepper",
  "Aidan fruit",
  "tiger nuts?",
  "groundnuts",
  "cornmeal",
  "hibiscus",
  "cinnamon",
  "nutmeg",
  "cloves",
  "ginger",
  "coconut",
  "Ehuru",
  "Uda",
];
const ingredientPattern = new RegExp(
  `\\b(${ingredientNames.join("|")})\\b`,
  "gi",
);

export function IngredientLinks({ text }: { text: string }) {
  return text.split(ingredientPattern).map((part, index) =>
    index % 2 ? (
      <a
        key={index}
        href={`https://www.google.com/search?q=${encodeURIComponent(`${part} ingredient`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ingredient-link"
        aria-label={`Search Google for ${part} (opens in a new tab)`}
      >
        {part}
        <Search size={12} aria-hidden="true" />
      </a>
    ) : (
      part
    ),
  );
}
